// @ts-nocheck
/**
 * Security Rule Service
 * Manages custom security rules and patterns
 */

import { db } from "../../db/index.ts";
import { securityRules } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import type { NewSecurityRule, SecurityRule } from "../../db/schema.ts";

export class SecurityRuleService {
    /**
     * Get all security rules
     */
    async getAllRules(): Promise<SecurityRule[]> {
        return await db.select()
            .from(securityRules)
            .orderBy(securityRules.createdAt);
    }

    /**
     * Get active security rules
     */
    async getActiveRules(): Promise<SecurityRule[]> {
        return await db.select()
            .from(securityRules)
            .where(eq(securityRules.enabled, true))
            .orderBy(securityRules.createdAt);
    }

    /**
     * Get rules by type
     */
    async getRulesByType(type: string): Promise<SecurityRule[]> {
        return await db.select()
            .from(securityRules)
            .where(
                and(
                    eq(securityRules.type, type),
                    eq(securityRules.enabled, true)
                )
            )
            .orderBy(securityRules.createdAt);
    }

    /**
     * Get rule by ID
     */
    async getRuleById(id: number): Promise<SecurityRule | null> {
        const [rule] = await db.select()
            .from(securityRules)
            .where(eq(securityRules.id, id))
            .limit(1);

        return rule || null;
    }

    /**
     * Create security rule
     */
    async createRule(rule: NewSecurityRule): Promise<SecurityRule> {
        const [created] = await db.insert(securityRules)
            .values(rule)
            .returning();

        return created;
    }

    /**
     * Update security rule
     */
    async updateRule(
        id: number,
        updates: Partial<Omit<SecurityRule, "id" | "createdAt" | "createdBy" | "triggerCount">>
    ): Promise<SecurityRule | null> {
        const [updated] = await db.update(securityRules)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(securityRules.id, id))
            .returning();

        return updated || null;
    }

    /**
     * Delete security rule
     */
    async deleteRule(id: number): Promise<void> {
        await db.delete(securityRules).where(eq(securityRules.id, id));
    }

    /**
     * Enable/disable rule
     */
    async toggleRule(id: number, enabled: boolean): Promise<SecurityRule | null> {
        return await this.updateRule(id, { enabled });
    }

    /**
     * Increment trigger count
     */
    async incrementTriggerCount(id: number): Promise<void> {
        const rule = await this.getRuleById(id);
        if (rule) {
            await db.update(securityRules)
                .set({ triggerCount: rule.triggerCount + 1 })
                .where(eq(securityRules.id, id));
        }
    }

    /**
     * Test a pattern against input
     */
    testPattern(pattern: string, input: string): boolean {
        try {
            const regex = new RegExp(pattern, "i");
            return regex.test(input);
        } catch (error) {
            console.error("Invalid regex pattern:", pattern, error);
            return false;
        }
    }

    /**
     * Check input against all active rules
     */
    async checkInput(input: string, type?: string): Promise<{
        matched: boolean;
        rule: SecurityRule | null;
    }> {
        const rules = type
            ? await this.getRulesByType(type)
            : await this.getActiveRules();

        for (const rule of rules) {
            if (this.testPattern(rule.pattern, input)) {
                await this.incrementTriggerCount(rule.id);
                return { matched: true, rule };
            }
        }

        return { matched: false, rule: null };
    }

    /**
     * Get statistics
     */
    async getStats(): Promise<{
        total: number;
        active: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        topTriggered: Array<{ id: number; name: string; count: number }>;
    }> {
        const all = await this.getAllRules();
        const active = all.filter(r => r.enabled);

        const byType: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};

        all.forEach(r => {
            byType[r.type] = (byType[r.type] || 0) + 1;
            bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
        });

        const topTriggered = all
            .sort((a, b) => b.triggerCount - a.triggerCount)
            .slice(0, 10)
            .map(r => ({ id: r.id, name: r.name, count: r.triggerCount }));

        return {
            total: all.length,
            active: active.length,
            byType,
            bySeverity,
            topTriggered,
        };
    }
}

export const securityRuleService = new SecurityRuleService();
// Backwards compatibility alias
export const securityRulesService = securityRuleService;
