/**
 * IP Management Service
 * Handles IP blacklist/whitelist operations
 */

import { db } from "../../db/index.ts";
import { ipBlockRules } from "../../db/schema.ts";
import { eq, and, or, gte, isNull } from "drizzle-orm";
import type { NewIPBlockRule, IPBlockRule } from "../../db/schema.ts";

export class IPManagementService {
    /**
     * Get all IP block rules (blacklist and whitelist)
     */
    async getAllRules(type?: "block" | "whitelist"): Promise<IPBlockRule[]> {
        if (type) {
            return await db.select()
                .from(ipBlockRules)
                .where(eq(ipBlockRules.type, type))
                .orderBy(ipBlockRules.createdAt);
        }

        return await db.select()
            .from(ipBlockRules)
            .orderBy(ipBlockRules.createdAt);
    }

    /**
     * Get active blocked IPs (not expired)
     */
    async getActiveBlockedIPs(): Promise<IPBlockRule[]> {
        const now = new Date();

        return await db.select()
            .from(ipBlockRules)
            .where(
                and(
                    eq(ipBlockRules.type, "block"),
                    or(
                        isNull(ipBlockRules.expiresAt),
                        gte(ipBlockRules.expiresAt, now)
                    )
                )
            )
            .orderBy(ipBlockRules.createdAt);
    }

    /**
     * Get whitelisted IPs
     */
    async getWhitelistedIPs(): Promise<IPBlockRule[]> {
        return await db.select()
            .from(ipBlockRules)
            .where(eq(ipBlockRules.type, "whitelist"))
            .orderBy(ipBlockRules.createdAt);
    }

    /**
     * Add IP to blacklist
     */
    async blockIP(
        ip: string,
        reason: string,
        expiresAt: Date | null = null,
        createdBy: number | null = null
    ): Promise<IPBlockRule> {
        const [rule] = await db.insert(ipBlockRules).values({
            ip,
            type: "block",
            reason,
            expiresAt,
            createdBy,
        }).returning();

        return rule;
    }

    /**
     * Add IP to whitelist
     */
    async whitelistIP(
        ip: string,
        reason: string,
        createdBy: number | null = null
    ): Promise<IPBlockRule> {
        const [rule] = await db.insert(ipBlockRules).values({
            ip,
            type: "whitelist",
            reason,
            createdBy,
        }).returning();

        return rule;
    }

    /**
     * Remove IP rule
     */
    async removeIPRule(id: number): Promise<void> {
        await db.delete(ipBlockRules).where(eq(ipBlockRules.id, id));
    }

    /**
     * Update IP rule
     */
    async updateIPRule(
        id: number,
        updates: Partial<Pick<IPBlockRule, "reason" | "expiresAt">>
    ): Promise<IPBlockRule | null> {
        const [updated] = await db.update(ipBlockRules)
            .set(updates)
            .where(eq(ipBlockRules.id, id))
            .returning();

        return updated || null;
    }

    /**
     * Check if IP is blocked
     */
    async isIPBlocked(ip: string): Promise<boolean> {
        const now = new Date();

        const blocked = await db.select()
            .from(ipBlockRules)
            .where(
                and(
                    eq(ipBlockRules.ip, ip),
                    eq(ipBlockRules.type, "block"),
                    or(
                        isNull(ipBlockRules.expiresAt),
                        gte(ipBlockRules.expiresAt, now)
                    )
                )
            )
            .limit(1);

        return blocked.length > 0;
    }

    /**
     * Check if IP is whitelisted
     */
    async isIPWhitelisted(ip: string): Promise<boolean> {
        const whitelisted = await db.select()
            .from(ipBlockRules)
            .where(
                and(
                    eq(ipBlockRules.ip, ip),
                    eq(ipBlockRules.type, "whitelist")
                )
            )
            .limit(1);

        return whitelisted.length > 0;
    }

    /**
     * Clean up expired IP blocks
     */
    async cleanupExpiredBlocks(): Promise<number> {
        const now = new Date();

        const result = await db.delete(ipBlockRules)
            .where(
                and(
                    eq(ipBlockRules.type, "block"),
                    gte(now, ipBlockRules.expiresAt)
                )
            );

        return result.changes || 0;
    }

    /**
     * Get statistics
     */
    async getStats(): Promise<{
        totalBlocked: number;
        activeBlocked: number;
        totalWhitelisted: number;
    }> {
        const all = await this.getAllRules();
        const active = await this.getActiveBlockedIPs();
        const whitelisted = await this.getWhitelistedIPs();

        return {
            totalBlocked: all.filter(r => r.type === "block").length,
            activeBlocked: active.length,
            totalWhitelisted: whitelisted.length,
        };
    }
}

export const ipManagementService = new IPManagementService();
