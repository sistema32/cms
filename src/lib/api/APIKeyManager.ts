// @ts-nocheck
/**
 * API Key Manager
 * Manages API keys for public REST API access
 */

import { db } from "../../config/db.ts";
import { apiKeys } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import type { APIKey, APIPermission, APIRateLimitResult } from "./types.ts";
import { RateLimiter } from "../security/RateLimiter.ts";

export class APIKeyManager {
  private static instance: APIKeyManager;
  private rateLimiters = new Map<number, RateLimiter>(); // Per API key rate limiters

  private constructor() {}

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Generate a new API key
   */
  generateKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 48;
    let key = "lexcms_";

    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return key;
  }

  /**
   * Create a new API key
   */
  async createAPIKey(options: {
    name: string;
    userId: number;
    permissions: APIPermission[];
    rateLimit?: number;
    expiresAt?: Date;
  }): Promise<APIKey> {
    const key = this.generateKey();

    const [created] = await db
      .insert(apiKeys)
      .values({
        name: options.name,
        key,
        userId: options.userId,
        permissions: JSON.stringify(options.permissions),
        rateLimit: options.rateLimit,
        expiresAt: options.expiresAt,
        isActive: true,
      })
      .returning();

    return this.parseAPIKey(created);
  }

  /**
   * Get API key by key string
   */
  async getByKey(key: string): Promise<APIKey | null> {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return this.parseAPIKey(result[0]);
  }

  /**
   * Get API key by ID
   */
  async getById(id: number): Promise<APIKey | null> {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return this.parseAPIKey(result[0]);
  }

  /**
   * Get all API keys for a user
   */
  async getUserAPIKeys(userId: number): Promise<APIKey[]> {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    return result.map((key) => this.parseAPIKey(key));
  }

  /**
   * Get all API keys (admin)
   */
  async getAllAPIKeys(): Promise<APIKey[]> {
    const result = await db.select().from(apiKeys);
    return result.map((key) => this.parseAPIKey(key));
  }

  /**
   * Validate API key and check permissions
   */
  async validateKey(
    key: string,
    requiredPermission?: APIPermission
  ): Promise<{ valid: boolean; apiKey?: APIKey; reason?: string }> {
    const apiKey = await this.getByKey(key);

    if (!apiKey) {
      return { valid: false, reason: "Invalid API key" };
    }

    if (!apiKey.isActive) {
      return { valid: false, reason: "API key is inactive" };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false, reason: "API key has expired" };
    }

    // Check permissions
    if (requiredPermission && !apiKey.permissions.includes(requiredPermission)) {
      return {
        valid: false,
        reason: `Missing required permission: ${requiredPermission}`,
      };
    }

    // Update last used timestamp
    await this.updateLastUsed(apiKey.id!);

    return { valid: true, apiKey };
  }

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(apiKeyId: number): Promise<APIRateLimitResult> {
    const apiKey = await this.getById(apiKeyId);

    if (!apiKey || !apiKey.rateLimit) {
      // No rate limit configured
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now() + 3600000,
        limit: Infinity,
      };
    }

    // Get or create rate limiter for this API key
    let rateLimiter = this.rateLimiters.get(apiKeyId);
    if (!rateLimiter) {
      rateLimiter = new RateLimiter({
        windowMs: 3600000, // 1 hour
        maxRequests: apiKey.rateLimit,
      });
      this.rateLimiters.set(apiKeyId, rateLimiter);
    }

    const result = await rateLimiter.check(`apikey:${apiKeyId}`);

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: apiKey.rateLimit,
    };
  }

  /**
   * Update API key
   */
  async updateAPIKey(
    id: number,
    updates: {
      name?: string;
      permissions?: APIPermission[];
      rateLimit?: number;
      expiresAt?: Date | null;
      isActive?: boolean;
    }
  ): Promise<APIKey | null> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.permissions !== undefined) {
      updateData.permissions = JSON.stringify(updates.permissions);
    }
    if (updates.rateLimit !== undefined) updateData.rateLimit = updates.rateLimit;
    if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const [updated] = await db
      .update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    return this.parseAPIKey(updated);
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return result.changes > 0;
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  /**
   * Parse API key from database
   */
  private parseAPIKey(raw: any): APIKey {
    return {
      ...raw,
      permissions: JSON.parse(raw.permissions),
      isActive: Boolean(raw.isActive),
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined,
      lastUsedAt: raw.lastUsedAt ? new Date(raw.lastUsedAt) : undefined,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
    };
  }

  /**
   * Get API key usage stats
   */
  async getUsageStats(apiKeyId: number): Promise<any> {
    // This would require a separate usage tracking table in production
    // For now, return basic info
    const apiKey = await this.getById(apiKeyId);

    if (!apiKey) {
      return null;
    }

    return {
      apiKeyId,
      lastUsed: apiKey.lastUsedAt,
      rateLimit: apiKey.rateLimit,
      // In production, you'd track actual request counts
      totalRequests: 0,
      requestsToday: 0,
      requestsThisHour: 0,
    };
  }
}

export const apiKeyManager = APIKeyManager.getInstance();
