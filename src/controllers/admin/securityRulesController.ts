/**
 * Security Rules Controller
 * Manages custom security rules
 */

import type { Context } from "hono";
import { securityRuleService } from "../../services/security/securityRuleService.ts";
import { z } from "zod";

const securityRuleSchema = z.object({
    name: z.string().min(1),
    type: z.enum(["sql_injection", "xss", "path_traversal", "custom"]),
    pattern: z.string().min(1),
    action: z.enum(["block", "log", "alert"]),
    severity: z.enum(["critical", "high", "medium", "low"]),
    enabled: z.boolean().optional(),
    description: z.string().optional(),
});

const testRuleSchema = z.object({
    pattern: z.string().min(1),
    testInput: z.string(),
});

export class SecurityRulesController {
    /**
     * GET /api/admin/security/rules
     */
    async getRules(c: Context) {
        try {
            const type = c.req.query("type");
            const rules = type
                ? await securityRuleService.getRulesByType(type)
                : await securityRuleService.getAllRules();

            return c.json({ success: true, data: rules });
        } catch (error) {
            console.error("Error getting security rules:", error);
            return c.json({ success: false, error: "Failed to get rules" }, 500);
        }
    }

    /**
     * POST /api/admin/security/rules
     */
    async createRule(c: Context) {
        try {
            const body = await c.req.json();
            const validated = securityRuleSchema.parse(body);
            const user = c.get("user");

            const rule = await securityRuleService.createRule({
                ...validated,
                createdBy: user?.id,
            });

            return c.json({
                success: true,
                data: rule,
                message: "Security rule created successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ success: false, error: "Validation error", details: error.errors }, 400);
            }
            console.error("Error creating security rule:", error);
            return c.json({ success: false, error: "Failed to create rule" }, 500);
        }
    }

    /**
     * PUT /api/admin/security/rules/:id
     */
    async updateRule(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const validated = securityRuleSchema.partial().parse(body);

            const rule = await securityRuleService.updateRule(id, validated);
            if (!rule) {
                return c.json({ success: false, error: "Rule not found" }, 404);
            }

            return c.json({ success: true, data: rule, message: "Rule updated successfully" });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ success: false, error: "Validation error", details: error.errors }, 400);
            }
            console.error("Error updating security rule:", error);
            return c.json({ success: false, error: "Failed to update rule" }, 500);
        }
    }

    /**
     * DELETE /api/admin/security/rules/:id
     */
    async deleteRule(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            await securityRuleService.deleteRule(id);
            return c.json({ success: true, message: "Rule deleted successfully" });
        } catch (error) {
            console.error("Error deleting security rule:", error);
            return c.json({ success: false, error: "Failed to delete rule" }, 500);
        }
    }

    /**
     * POST /api/admin/security/rules/test
     * Test a regex pattern
     */
    async testRule(c: Context) {
        try {
            const body = await c.req.json();
            const validated = testRuleSchema.parse(body);

            const matched = securityRuleService.testPattern(validated.pattern, validated.testInput);

            return c.json({
                success: true,
                data: {
                    matched,
                    pattern: validated.pattern,
                    input: validated.testInput,
                },
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ success: false, error: "Validation error", details: error.errors }, 400);
            }
            console.error("Error testing rule:", error);
            return c.json({ success: false, error: "Failed to test rule" }, 500);
        }
    }

    /**
     * GET /api/admin/security/rules/stats
     */
    async getStats(c: Context) {
        try {
            const stats = await securityRuleService.getStats();
            return c.json({ success: true, data: stats });
        } catch (error) {
            console.error("Error getting security rule stats:", error);
            return c.json({ success: false, error: "Failed to get statistics" }, 500);
        }
    }
}

export const securityRulesController = new SecurityRulesController();
