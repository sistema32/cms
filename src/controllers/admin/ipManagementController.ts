/**
 * IP Management Controller
 * Handles IP blacklist/whitelist operations
 */

import type { Context } from "hono";
import { ipManagementService } from "../../services/security/ipManagementService.ts";
import { z } from "zod";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { getErrorMessage } from "@/utils/errors.ts";

const log = createLogger("ipManagementController");

// Validation schemas
const addIPSchema = z.object({
    ip: z.string().ip(),
    type: z.enum(["block", "whitelist"]),
    reason: z.string().min(1),
    expiresAt: z.string().datetime().optional(),
});

const updateIPSchema = z.object({
    reason: z.string().min(1).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
});

export class IPManagementController {
    /**
     * GET /api/admin/security/ips
     * Get all IP rules
     */
    async getAll(c: Context) {
        try {
            const type = c.req.query("type") as "block" | "whitelist" | undefined;
            const rules = await ipManagementService.getAllRules(type);

            return c.json({
                success: true,
                data: rules,
            });
        } catch (error) {
            log.error("Error getting IP rules", error instanceof Error ? error : undefined);
            throw new AppError("ip_rules_fetch_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * GET /api/admin/security/ips/blacklist
     * Get blocked IPs
     */
    async getBlacklist(c: Context) {
        try {
            const rules = await ipManagementService.getActiveBlockedIPs();

            return c.json({
                success: true,
                data: rules,
            });
        } catch (error) {
            log.error("Error getting blacklist", error instanceof Error ? error : undefined);
            throw new AppError("ip_blacklist_fetch_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * GET /api/admin/security/ips/whitelist
     * Get whitelisted IPs
     */
    async getWhitelist(c: Context) {
        try {
            const rules = await ipManagementService.getWhitelistedIPs();

            return c.json({
                success: true,
                data: rules,
            });
        } catch (error) {
            log.error("Error getting whitelist", error instanceof Error ? error : undefined);
            throw new AppError("ip_whitelist_fetch_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * POST /api/admin/security/ips
     * Add IP rule
     */
    async add(c: Context) {
        try {
            const body = await c.req.json();
            const validated = addIPSchema.parse(body);

            const user = c.get("user") as { id?: number; userId?: number } | undefined;
            const expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;

            const rule = validated.type === "block"
                ? await ipManagementService.blockIP(
                    validated.ip,
                    validated.reason,
                    expiresAt,
                    user?.id ?? user?.userId ?? null
                )
                : await ipManagementService.whitelistIP(
                    validated.ip,
                    validated.reason,
                    user?.id ?? user?.userId ?? null
                );

            return c.json({
                success: true,
                data: rule,
                message: `IP ${validated.type === "block" ? "blocked" : "whitelisted"} successfully`,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }

            log.error("Error adding IP rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("ip_rule_add_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * PUT /api/admin/security/ips/:id
     * Update IP rule
     */
    async update(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla IP");
            const body = await c.req.json();
            const validated = updateIPSchema.parse(body);

            const updates: any = {};
            if (validated.reason) updates.reason = validated.reason;
            if (validated.expiresAt !== undefined) {
                updates.expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
            }

            const rule = await ipManagementService.updateIPRule(id, updates);

            if (!rule) {
                throw AppError.fromCatalog("ip_rule_not_found");
            }

            return c.json({
                success: true,
                data: rule,
                message: "IP rule updated successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }

            log.error("Error updating IP rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("ip_rule_update_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * DELETE /api/admin/security/ips/:id
     * Remove IP rule
     */
    async remove(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de regla IP");
            await ipManagementService.removeIPRule(id);

            return c.json({
                success: true,
                message: "IP rule removed successfully",
            });
        } catch (error) {
            log.error("Error removing IP rule", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("ip_rule_remove_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * GET /api/admin/security/ips/stats
     * Get IP management statistics
     */
    async getStats(c: Context) {
        try {
            const stats = await ipManagementService.getStats();

            return c.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            log.error("Error getting IP stats", error instanceof Error ? error : undefined);
            throw new AppError("ip_rule_stats_failed", getErrorMessage(error), 500);
        }
    }
}

export const ipManagementController = new IPManagementController();
