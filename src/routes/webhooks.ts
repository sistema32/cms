/**
 * Webhook Routes
 * API endpoints for webhook management
 */

import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.ts";
import { requirePermission } from "../middlewares/permissions.ts";
import { webhookManager } from "../lib/webhooks/index.ts";
import type { WebhookConfig, WebhookDeliveryFilter, WebhookFilter } from "../lib/webhooks/index.ts";

const webhooks = new Hono();

// Protect all webhook routes - require settings:update permission
webhooks.use("/*", authMiddleware);
webhooks.use("/*", requirePermission("settings", "update"));

/**
 * GET /api/webhooks
 * List all webhooks
 */
webhooks.get("/", async (c) => {
  try {
    const filter: WebhookFilter = {
      isActive: c.req.query("isActive") === "true" ? true :
        c.req.query("isActive") === "false" ? false : undefined,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : undefined,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : undefined,
    };

    const webhooks = await webhookManager.getWebhooks(filter);

    // Parse JSON fields
    const parsedWebhooks = webhooks.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events),
      metadata: webhook.metadata ? JSON.parse(webhook.metadata) : undefined,
    }));

    return c.json({ webhooks: parsedWebhooks });
  } catch (error: any) {
    console.error("Error getting webhooks:", error);
    return c.json(
      {
        error: "Failed to get webhooks",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/webhooks/stats
 * Get webhook statistics
 */
webhooks.get("/stats", async (c) => {
  try {
    const stats = await webhookManager.getStats();
    return c.json(stats);
  } catch (error: any) {
    console.error("Error getting webhook stats:", error);
    return c.json(
      {
        error: "Failed to get webhook statistics",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/webhooks/:id
 * Get a single webhook
 */
webhooks.get("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const webhook = await webhookManager.getWebhook(id);

    if (!webhook) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    return c.json({
      ...webhook,
      events: JSON.parse(webhook.events),
      metadata: webhook.metadata ? JSON.parse(webhook.metadata) : undefined,
    });
  } catch (error: any) {
    console.error("Error getting webhook:", error);
    return c.json(
      {
        error: "Failed to get webhook",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
webhooks.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const config: WebhookConfig = {
      name: body.name,
      url: body.url,
      secret: body.secret,
      events: body.events || [],
      isActive: body.isActive !== false,
      maxRetries: body.maxRetries || 3,
      retryDelay: body.retryDelay || 60,
      description: body.description,
      metadata: body.metadata,
    };

    // Validate
    if (!config.name || !config.url || !config.events.length) {
      return c.json(
        {
          error: "Missing required fields: name, url, events",
        },
        400,
      );
    }

    const webhook = await webhookManager.createWebhook(config);

    return c.json(
      {
        message: "Webhook created successfully",
        webhook: {
          ...webhook,
          events: JSON.parse(webhook.events),
          metadata: webhook.metadata ? JSON.parse(webhook.metadata) : undefined,
        },
      },
      201,
    );
  } catch (error: any) {
    console.error("Error creating webhook:", error);
    return c.json(
      {
        error: "Failed to create webhook",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * PATCH /api/webhooks/:id
 * Update a webhook
 */
webhooks.patch("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    const config: Partial<WebhookConfig> = {};

    if (body.name !== undefined) config.name = body.name;
    if (body.url !== undefined) config.url = body.url;
    if (body.secret !== undefined) config.secret = body.secret;
    if (body.events !== undefined) config.events = body.events;
    if (body.isActive !== undefined) config.isActive = body.isActive;
    if (body.maxRetries !== undefined) config.maxRetries = body.maxRetries;
    if (body.retryDelay !== undefined) config.retryDelay = body.retryDelay;
    if (body.description !== undefined) config.description = body.description;
    if (body.metadata !== undefined) config.metadata = body.metadata;

    const webhook = await webhookManager.updateWebhook(id, config);

    if (!webhook) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    return c.json({
      message: "Webhook updated successfully",
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
        metadata: webhook.metadata ? JSON.parse(webhook.metadata) : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error updating webhook:", error);
    return c.json(
      {
        error: "Failed to update webhook",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
webhooks.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await webhookManager.deleteWebhook(id);

    return c.json({
      message: "Webhook deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting webhook:", error);
    return c.json(
      {
        error: "Failed to delete webhook",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test a webhook with a sample payload
 */
webhooks.post("/:id/test", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const webhook = await webhookManager.getWebhook(id);

    if (!webhook) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    // Dispatch test event
    await webhookManager.dispatch("system.test", {
      message: "This is a test webhook",
      webhookId: id,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      message: "Test webhook dispatched successfully",
    });
  } catch (error: any) {
    console.error("Error testing webhook:", error);
    return c.json(
      {
        error: "Failed to test webhook",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get deliveries for a webhook
 */
webhooks.get("/:id/deliveries", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const filter: WebhookDeliveryFilter = {
      webhookId: id,
      status: c.req.query("status") as any,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : 50,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : 0,
    };

    const result = await webhookManager.queryDeliveries(filter);

    // Parse payloads
    const deliveries = result.deliveries.map((d) => ({
      ...d,
      payload: JSON.parse(d.payload),
    }));

    return c.json({
      ...result,
      deliveries,
    });
  } catch (error: any) {
    console.error("Error getting webhook deliveries:", error);
    return c.json(
      {
        error: "Failed to get webhook deliveries",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/webhooks/deliveries
 * Get all deliveries (across all webhooks)
 */
webhooks.get("/deliveries/all", async (c) => {
  try {
    const filter: WebhookDeliveryFilter = {
      event: c.req.query("event") || undefined,
      status: c.req.query("status") as any,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : 50,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : 0,
    };

    const result = await webhookManager.queryDeliveries(filter);

    // Parse payloads
    const deliveries = result.deliveries.map((d) => ({
      ...d,
      payload: JSON.parse(d.payload),
    }));

    return c.json({
      ...result,
      deliveries,
    });
  } catch (error: any) {
    console.error("Error getting deliveries:", error);
    return c.json(
      {
        error: "Failed to get deliveries",
        message: error.message,
      },
      500,
    );
  }
});

export default webhooks;
