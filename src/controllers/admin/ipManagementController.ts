/**
 * IP Management Controller
 * Handles IP blacklist/whitelist operations
 */

import type { Context } from "hono";
import { ipManagementService } from "../../services/security/ipManagementService.ts";
import { z } from "zod";

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
            console.error("Error getting IP rules:", error);
            return c.json({
                success: false,
                error: "Failed to get IP rules",
            }, 500);
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
            console.error("Error getting blacklist:", error);
            return c.json({
                success: false,
                error: "Failed to get blacklist",
            }, 500);
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
            console.error("Error getting whitelist:", error);
            return c.json({
                success: false,
                error: "Failed to get whitelist",
            }, 500);
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

            const user = c.get("user");
            const expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;

            const rule = validated.type === "block"
                ? await ipManagementService.blockIP(
                    validated.ip,
                    validated.reason,
                    expiresAt,
                    user?.id
                )
                : await ipManagementService.whitelistIP(
                    validated.ip,
                    validated.reason,
                    user?.id
                );

            return c.json({
                success: true,
                data: rule,
                message: `IP ${validated.type === "block" ? "blocked" : "whitelisted"} successfully`,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    success: false,
                    error: "Validation error",
                    details: error.errors,
                }, 400);
            }

            console.error("Error adding IP rule:", error);
            return c.json({
                success: false,
                error: "Failed to add IP rule",
            }, 500);
        }
    }

    /**
     * PUT /api/admin/security/ips/:id
     * Update IP rule
     */
    async update(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const validated = updateIPSchema.parse(body);

            const updates: any = {};
            if (validated.reason) updates.reason = validated.reason;
            if (validated.expiresAt !== undefined) {
                updates.expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
            }

            const rule = await ipManagementService.updateIPRule(id, updates);

            if (!rule) {
                return c.json({
                    success: false,
                    error: "IP rule not found",
                }, 404);
            }

            return c.json({
                success: true,
                data: rule,
                message: "IP rule updated successfully",
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    success: false,
                    error: "Validation error",
                    details: error.errors,
                }, 400);
            }

            console.error("Error updating IP rule:", error);
            return c.json({
                success: false,
                error: "Failed to update IP rule",
            }, 500);
        }
    }

    /**
     * DELETE /api/admin/security/ips/:id
     * Remove IP rule
     */
    async remove(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            await ipManagementService.removeIPRule(id);

            return c.json({
                success: true,
                message: "IP rule removed successfully",
            });
        } catch (error) {
            console.error("Error removing IP rule:", error);
            return c.json({
                success: false,
                error: "Failed to remove IP rule",
            }, 500);
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
            console.error("Error getting IP stats:", error);
            return c.json({
                success: false,
                error: "Failed to get IP statistics",
            }, 500);
        }
    }
}

export const ipManagementController = new IPManagementController();
