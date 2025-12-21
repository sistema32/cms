// @ts-nocheck
/**
 * Security Rules Controller
 * Manages custom security rules
 */

import type { Context } from "hono";
import { securityRuleService } from "../../services/security/securityRuleService.ts";
import { z } from "zod";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("securityRulesController");

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
            if (type) {
                const parsed = securityRuleSchema.shape.type.safeParse(type);
                if (!parsed.success) {
                    throw new AppError("invalid_rule_type", "Tipo de regla inválido", 400, {
                        details: parsed.error.errors,
                    });
                }
            }
            const rules = type
                ? await securityRuleService.getRulesByType(type)
                : await securityRuleService.getAllRules();

            return c.json({ success: true, data: rules });
        } catch (error) {
            log.error("Error getting security rules", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_rules_fetch_failed", getErrorMessage(error), 500);
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
                createdBy: user?.userId ?? user?.id,
            });

            return c.json({
                success: true,
                data: rule,
                message: "Security rule created successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error creating security rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_rule_create_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * PUT /api/admin/security/rules/:id
     */
    async updateRule(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla");
            const body = await c.req.json();
            const validated = securityRuleSchema.partial().parse(body);

            const rule = await securityRuleService.updateRule(id, validated);
            if (!rule) {
                throw AppError.fromCatalog("rule_not_found");
            }

            return c.json({ success: true, data: rule, message: "Rule updated successfully" });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error updating security rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_rule_update_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * DELETE /api/admin/security/rules/:id
     */
    async deleteRule(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla");
            await securityRuleService.deleteRule(id);
            return c.json({ success: true, message: "Rule deleted successfully" });
        } catch (error) {
            log.error("Error deleting security rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_rule_delete_failed", getErrorMessage(error), 500);
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
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Error testing security rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_rule_test_failed", getErrorMessage(error), 500);
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
            log.error("Error getting security rule stats", error instanceof Error ? error : undefined);
            throw new AppError("security_rule_stats_failed", getErrorMessage(error), 500);
        }
    }
}

export const securityRulesController = new SecurityRulesController();
