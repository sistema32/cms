// @ts-nocheck
/**
 * Rate Limit Controller
 * Manages rate limiting rules
 */

import type { Context } from "hono";
import { rateLimitConfigService } from "../../services/security/rateLimitConfigService.ts";
import { z } from "zod";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("rateLimitController");

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
            log.error("Error getting rate limit rules", error instanceof Error ? error : undefined);
            throw new AppError("rate_limit_rules_fetch_failed", getErrorMessage(error), 500);
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
                createdBy: user?.userId ?? user?.id,
            });

            return c.json({
                success: true,
                data: rule,
                message: "Rate limit rule created successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error creating rate limit rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("rate_limit_rule_create_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * PUT /api/admin/security/rate-limit/rules/:id
     */
    async updateRule(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla de rate limit");
            const body = await c.req.json();
            const validated = rateLimitRuleSchema.partial().parse(body);

            const rule = await rateLimitConfigService.updateRule(id, validated);
            if (!rule) {
                throw AppError.fromCatalog("rate_limit_rule_not_found");
            }

            return c.json({ success: true, data: rule, message: "Rule updated successfully" });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error updating rate limit rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("rate_limit_rule_update_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * DELETE /api/admin/security/rate-limit/rules/:id
     */
    async deleteRule(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla de rate limit");
            await rateLimitConfigService.deleteRule(id);
            return c.json({ success: true, message: "Rule deleted successfully" });
        } catch (error) {
            log.error("Error deleting rate limit rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("rate_limit_rule_delete_failed", getErrorMessage(error), 500);
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
            log.error("Error getting rate limit stats", error instanceof Error ? error : undefined);
            throw new AppError("rate_limit_stats_failed", getErrorMessage(error), 500);
        }
    }
}

export const rateLimitController = new RateLimitController();
