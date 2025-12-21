// @ts-nocheck
/**
 * Rate Limit Configuration Service
 * Manages custom rate limiting rules per endpoint
 */

import { db } from "../../db/index.ts";
import { rateLimitRules } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import type { NewRateLimitRule, RateLimitRule } from "../../db/schema.ts";

export class RateLimitConfigService {
    /**
     * Get all rate limit rules
     */
    async getAllRules(): Promise<RateLimitRule[]> {
        return await db.select()
            .from(rateLimitRules)
            .orderBy(rateLimitRules.createdAt);
    }

    /**
     * Get active rate limit rules
     */
    async getActiveRules(): Promise<RateLimitRule[]> {
        return await db.select()
            .from(rateLimitRules)
            .where(eq(rateLimitRules.enabled, true))
            .orderBy(rateLimitRules.createdAt);
    }

    /**
     * Get rule by ID
     */
    async getRuleById(id: number): Promise<RateLimitRule | null> {
        const [rule] = await db.select()
            .from(rateLimitRules)
            .where(eq(rateLimitRules.id, id))
            .limit(1);

        return rule || null;
    }

    /**
     * Get rule for specific path and method
     */
    async getRuleForEndpoint(
        path: string,
        method?: string
    ): Promise<RateLimitRule | null> {
        const conditions = [eq(rateLimitRules.path, path)];

        if (method) {
            conditions.push(eq(rateLimitRules.method, method));
        }

        const [rule] = await db.select()
            .from(rateLimitRules)
            .where(and(...conditions, eq(rateLimitRules.enabled, true)))
            .limit(1);

        return rule || null;
    }

    /**
     * Create rate limit rule
     */
    async createRule(rule: NewRateLimitRule): Promise<RateLimitRule> {
        const [created] = await db.insert(rateLimitRules)
            .values(rule)
            .returning();

        return created;
    }

    /**
     * Update rate limit rule
     */
    async updateRule(
        id: number,
        updates: Partial<Omit<RateLimitRule, "id" | "createdAt" | "createdBy">>
    ): Promise<RateLimitRule | null> {
        const [updated] = await db.update(rateLimitRules)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(rateLimitRules.id, id))
            .returning();

        return updated || null;
    }

    /**
     * Delete rate limit rule
     */
    async deleteRule(id: number): Promise<void> {
        await db.delete(rateLimitRules).where(eq(rateLimitRules.id, id));
    }

    /**
     * Enable/disable rule
     */
    async toggleRule(id: number, enabled: boolean): Promise<RateLimitRule | null> {
        return await this.updateRule(id, { enabled });
    }

    /**
     * Get statistics
     */
    async getStats(): Promise<{
        total: number;
        active: number;
        byPath: Record<string, number>;
    }> {
        const all = await this.getAllRules();
        const active = all.filter(r => r.enabled);

        const byPath: Record<string, number> = {};
        all.forEach(r => {
            byPath[r.path] = (byPath[r.path] || 0) + 1;
        });

        return {
            total: all.length,
            active: active.length,
            byPath,
        };
    }
}

export const rateLimitConfigService = new RateLimitConfigService();
// @ts-nocheck
