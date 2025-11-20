/**
 * Rate Limit Controller
 * Manages rate limiting rules
 */

import type { Context } from "hono";
import { rateLimitConfigService } from "../../services/security/rateLimitConfigService.ts";
import { z } from "zod";

const rateLimitRuleSchema = z.object({
    name: z.string().min(1),
    path: z.string().min(1),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]).optional(),
    maxRequests: z.number().int().positive(),
    windowSeconds: z.number().int().positive(),
    enabled: z.boolean().optional(),
});

export class RateLimitController {
    /**
     * GET /api/admin/security/rate-limit/rules
     */
    async getRules(c: Context) {
        try {
            const rules = await rateLimitConfigService.getAllRules();
            return c.json({ success: true, data: rules });
        } catch (error) {
            console.error("Error getting rate limit rules:", error);
            return c.json({ success: false, error: "Failed to get rules" }, 500);
        }
    }

    /**
     * POST /api/admin/security/rate-limit/rules
     */
    async createRule(c: Context) {
        try {
            const body = await c.req.json();
            const validated = rateLimitRuleSchema.parse(body);
            const user = c.get("user");

            const rule = await rateLimitConfigService.createRule({
                ...validated,
                createdBy: user?.id,
            });

            return c.json({
                success: true,
                data: rule,
                message: "Rate limit rule created successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ success: false, error: "Validation error", details: error.errors }, 400);
            }
            console.error("Error creating rate limit rule:", error);
            return c.json({ success: false, error: "Failed to create rule" }, 500);
        }
    }

    /**
     * PUT /api/admin/security/rate-limit/rules/:id
     */
    async updateRule(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const validated = rateLimitRuleSchema.partial().parse(body);

            const rule = await rateLimitConfigService.updateRule(id, validated);
            if (!rule) {
                return c.json({ success: false, error: "Rule not found" }, 404);
            }

            return c.json({ success: true, data: rule, message: "Rule updated successfully" });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ success: false, error: "Validation error", details: error.errors }, 400);
            }
            console.error("Error updating rate limit rule:", error);
            return c.json({ success: false, error: "Failed to update rule" }, 500);
        }
    }

    /**
     * DELETE /api/admin/security/rate-limit/rules/:id
     */
    async deleteRule(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            await rateLimitConfigService.deleteRule(id);
            return c.json({ success: true, message: "Rule deleted successfully" });
        } catch (error) {
            console.error("Error deleting rate limit rule:", error);
            return c.json({ success: false, error: "Failed to delete rule" }, 500);
        }
    }

    /**
     * GET /api/admin/security/rate-limit/stats
     */
    async getStats(c: Context) {
        try {
            const stats = await rateLimitConfigService.getStats();
            return c.json({ success: true, data: stats });
        } catch (error) {
            console.error("Error getting rate limit stats:", error);
            return c.json({ success: false, error: "Failed to get statistics" }, 500);
        }
    }
}

export const rateLimitController = new RateLimitController();
