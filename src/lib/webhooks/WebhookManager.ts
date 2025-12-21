/**
 * Webhook Manager
 * Manages webhook dispatching, retries, and delivery tracking
 */

import { db } from "../../config/db.ts";
import { webhookDeliveries, webhooks, type NewWebhookDelivery } from "../../db/schema.ts";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type {
  WebhookConfig,
  WebhookDeliveryFilter,
  WebhookDeliveryResult,
  WebhookDeliveryStatus,
  WebhookEvent,
  WebhookFilter,
  WebhookPayload,
  WebhookStats,
} from "./types.ts";

export class WebhookManager {
  private static instance: WebhookManager;
  private retryInterval?: number;
  private isProcessing = false;

  private constructor() {
    // Start retry processor (every minute)
    this.startRetryProcessor();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(config: WebhookConfig) {
    const webhook = await db.insert(webhooks).values({
      name: config.name,
      url: config.url,
      secret: config.secret,
      events: JSON.stringify(config.events),
      isActive: config.isActive !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 60,
      description: config.description,
      metadata: config.metadata ? JSON.stringify(config.metadata) : undefined,
    }).returning();

    console.log(`✅ Webhook created: ${config.name} (${config.url})`);
    return webhook[0];
  }

  /**
   * Update a webhook
   */
  async updateWebhook(id: number, config: Partial<WebhookConfig>) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (config.name) updateData.name = config.name;
    if (config.url) updateData.url = config.url;
    if (config.secret !== undefined) updateData.secret = config.secret;
    if (config.events) updateData.events = JSON.stringify(config.events);
    if (config.isActive !== undefined) updateData.isActive = config.isActive;
    if (config.maxRetries !== undefined) updateData.maxRetries = config.maxRetries;
    if (config.retryDelay !== undefined) updateData.retryDelay = config.retryDelay;
    if (config.description !== undefined) updateData.description = config.description;
    if (config.metadata) updateData.metadata = JSON.stringify(config.metadata);

    const updated = await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, id))
      .returning();

    return updated[0];
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: number) {
    await db.delete(webhooks).where(eq(webhooks.id, id));
    console.log(`🗑️  Webhook deleted: ${id}`);
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(filter: WebhookFilter = {}) {
    let query = db.select().from(webhooks);

    if (filter.isActive !== undefined) {
      query = query.where(eq(webhooks.isActive, filter.isActive)) as any;
    }

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    if (filter.offset) {
      query = query.offset(filter.offset) as any;
    }

    return await query;
  }

  /**
   * Get a single webhook
   */
  async getWebhook(id: number) {
    return await db.query.webhooks.findFirst({
      where: eq(webhooks.id, id),
    });
  }

  /**
   * Dispatch a webhook event
   */
  async dispatch<T = any>(
    event: WebhookEvent | string,
    data: T,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // Find all active webhooks listening to this event
      const activeWebhooks = await db.query.webhooks.findMany({
        where: eq(webhooks.isActive, true),
      });

      const matchingWebhooks = activeWebhooks.filter((webhook) => {
        const events = JSON.parse(webhook.events);
        return events.includes(event) || events.includes("*");
      });

      if (matchingWebhooks.length === 0) {
        console.log(`📭 No webhooks listening to: ${event}`);
        return;
      }

      const payload: WebhookPayload<T> = {
        event,
        timestamp: new Date().toISOString(),
        data,
        metadata,
      };

      // Create delivery records for each matching webhook
      for (const webhook of matchingWebhooks) {
        await this.createDelivery(webhook.id, event, payload);
      }

      console.log(`📨 Dispatched ${event} to ${matchingWebhooks.length} webhook(s)`);

      // Process deliveries immediately (async)
      this.processDeliveries().catch(console.error);
    } catch (error) {
      console.error("Error dispatching webhook:", error);
    }
  }

  /**
   * Create a delivery record
   */
  private async createDelivery(
    webhookId: number,
    event: string,
    payload: WebhookPayload,
  ) {
    await db.insert(webhookDeliveries).values({
      webhookId,
      event,
      payload: JSON.stringify(payload),
      status: "pending",
      attempt: 1,
      scheduledAt: new Date(),
    });

    // Update webhook stats
    await db
      .update(webhooks)
      .set({
        totalDeliveries: sql`${webhooks.totalDeliveries} + 1`,
        lastDeliveryAt: new Date(),
      })
      .where(eq(webhooks.id, webhookId));
  }

  /**
   * Process pending deliveries
   */
  async processDeliveries(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;

    try {
      // Get pending deliveries
      const pendingDeliveries = await db.query.webhookDeliveries.findMany({
        where: eq(webhookDeliveries.status, "pending"),
        limit: 10, // Process in batches
      });

      for (const delivery of pendingDeliveries) {
        await this.deliverWebhook(delivery.id);
      }
    } catch (error) {
      console.error("Error processing deliveries:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver a single webhook
   */
  private async deliverWebhook(deliveryId: number): Promise<void> {
    const delivery = await db.query.webhookDeliveries.findFirst({
      where: eq(webhookDeliveries.id, deliveryId),
    });

    if (!delivery) {
      return;
    }

    const webhook = await this.getWebhook(delivery.webhookId);
    if (!webhook || !webhook.isActive) {
      // Mark as cancelled if webhook is inactive or deleted
      await db
        .update(webhookDeliveries)
        .set({ status: "cancelled" })
        .where(eq(webhookDeliveries.id, deliveryId));
      return;
    }

    const startTime = Date.now();
    let result: WebhookDeliveryResult;

    try {
      const payload = JSON.parse(delivery.payload);
      result = await this.sendWebhook(
        webhook.url,
        payload,
        webhook.secret ?? undefined,
      );

      if (result.success) {
        // Success
        await db
          .update(webhookDeliveries)
          .set({
            status: "success",
            responseStatus: result.responseStatus,
            responseBody: result.responseBody?.substring(0, 1000), // Limit size
            responseTime: result.responseTime,
            deliveredAt: new Date(),
          })
          .where(eq(webhookDeliveries.id, deliveryId));

        // Update webhook stats
        await db
          .update(webhooks)
          .set({
            successfulDeliveries: sql`${webhooks.successfulDeliveries} + 1`,
            lastSuccessAt: new Date(),
          })
          .where(eq(webhooks.id, delivery.webhookId));

        console.log(`✅ Webhook delivered: ${webhook.name} (${delivery.event})`);
      } else {
        // Failed - schedule retry if attempts remaining
        await this.handleFailedDelivery(delivery, webhook, result);
      }
    } catch (error) {
      // Error - schedule retry
      await this.handleFailedDelivery(delivery, webhook, {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle failed delivery
   */
  private async handleFailedDelivery(
    delivery: any,
    webhook: any,
    result: WebhookDeliveryResult,
  ): Promise<void> {
    const attempt = delivery.attempt + 1;

    if (attempt <= webhook.maxRetries) {
      // Schedule retry
      const nextRetryAt = new Date(
        Date.now() + webhook.retryDelay * 1000 * attempt, // Exponential backoff
      );

      await db
        .update(webhookDeliveries)
        .set({
          attempt,
          status: "pending",
          errorMessage: result.errorMessage,
          responseStatus: result.responseStatus,
          responseBody: result.responseBody?.substring(0, 1000),
          nextRetryAt,
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      console.log(
        `⏳ Webhook delivery scheduled for retry (${attempt}/${webhook.maxRetries}): ${webhook.name}`,
      );
    } else {
      // Max retries reached - mark as failed
      await db
        .update(webhookDeliveries)
        .set({
          status: "failed",
          errorMessage: result.errorMessage,
          responseStatus: result.responseStatus,
          responseBody: result.responseBody?.substring(0, 1000),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      // Update webhook stats
      await db
        .update(webhooks)
        .set({
          failedDeliveries: sql`${webhooks.failedDeliveries} + 1`,
          lastFailureAt: new Date(),
        })
        .where(eq(webhooks.id, delivery.webhookId));

      console.error(`❌ Webhook delivery failed permanently: ${webhook.name}`);
    }
  }

  /**
   * Send HTTP request to webhook URL
   */
  private async sendWebhook(
    url: string,
    payload: WebhookPayload,
    secret?: string,
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "LexCMS-Webhook/1.0",
      };

      // Add signature if secret is provided
      if (secret) {
        // Simple signature (in production, use proper HMAC)
        headers["X-Webhook-Signature"] = btoa(secret + body);
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      return {
        success: response.ok,
        responseStatus: response.status,
        responseBody,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      };
    }
  }

  /**
   * Start retry processor
   */
  private startRetryProcessor(): void {
    // Process retries every minute
    this.retryInterval = setInterval(async () => {
      try {
        // Get deliveries ready for retry
        const now = new Date();
        const retriesReady = await db.query.webhookDeliveries.findMany({
          where: and(
            eq(webhookDeliveries.status, "pending"),
            lte(webhookDeliveries.nextRetryAt, now),
          ),
          limit: 10,
        });

        for (const delivery of retriesReady) {
          await this.deliverWebhook(delivery.id);
        }
      } catch (error) {
        console.error("Error in retry processor:", error);
      }
    }, 60000); // Every minute
  }

  /**
   * Query webhook deliveries
   */
  async queryDeliveries(filter: WebhookDeliveryFilter = {}) {
    const conditions = [];

    if (filter.webhookId) {
      conditions.push(eq(webhookDeliveries.webhookId, filter.webhookId));
    }

    if (filter.event) {
      conditions.push(eq(webhookDeliveries.event, filter.event));
    }

    if (filter.status) {
      conditions.push(eq(webhookDeliveries.status, filter.status));
    }

    if (filter.startDate) {
      conditions.push(gte(webhookDeliveries.createdAt, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(webhookDeliveries.createdAt, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookDeliveries)
      .where(whereClause);

    // Get paginated results
    let query = db
      .select()
      .from(webhookDeliveries)
      .where(whereClause)
      .orderBy(desc(webhookDeliveries.createdAt));

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    if (filter.offset) {
      query = query.offset(filter.offset) as any;
    }

    const deliveries = await query;

    return {
      deliveries,
      total: count,
      limit: filter.limit || count,
      offset: filter.offset || 0,
    };
  }

  /**
   * Get webhook statistics
   */
  async getStats(): Promise<WebhookStats> {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(webhooks);

    const [{ active }] = await db
      .select({ active: sql<number>`count(*)` })
      .from(webhooks)
      .where(eq(webhooks.isActive, true));

    const [{ totalDeliveries }] = await db
      .select({ totalDeliveries: sql<number>`count(*)` })
      .from(webhookDeliveries);

    const [{ successful }] = await db
      .select({ successful: sql<number>`count(*)` })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.status, "success"));

    const [{ failed }] = await db
      .select({ failed: sql<number>`count(*)` })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.status, "failed"));

    const [{ pending }] = await db
      .select({ pending: sql<number>`count(*)` })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.status, "pending"));

    const [{ avgResponseTime }] = await db
      .select({
        avgResponseTime: sql<number>`avg(${webhookDeliveries.responseTime})`,
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.status, "success"));

    const successRate = totalDeliveries > 0
      ? (successful / totalDeliveries) * 100
      : 0;

    return {
      totalWebhooks: total,
      activeWebhooks: active,
      totalDeliveries,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      pendingDeliveries: pending,
      averageResponseTime: Math.round(avgResponseTime || 0),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Stop retry processor
   */
  stop(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = undefined;
    }
  }
}

// Export singleton instance
export const webhookManager = WebhookManager.getInstance();
// @ts-nocheck
