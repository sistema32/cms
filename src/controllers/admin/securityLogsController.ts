/**
 * Security Logs Controller
 * Handles security event logs retrieval and export
 */

import type { Context } from "hono";
import { securityLogService } from "../../services/security/securityLogService.ts";
import type { SecurityLogFilters } from "../../services/security/securityLogService.ts";

export class SecurityLogsController {
    /**
     * GET /api/admin/security/logs
     * Get security logs with filters
     */
    async getLogs(c: Context) {
        try {
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "50");

            const filters: SecurityLogFilters = {};
            if (c.req.query("type")) filters.type = c.req.query("type")!;
            if (c.req.query("severity")) filters.severity = c.req.query("severity")!;
            if (c.req.query("ip")) filters.ip = c.req.query("ip")!;
            if (c.req.query("startDate")) filters.startDate = new Date(c.req.query("startDate")!);
            if (c.req.query("endDate")) filters.endDate = new Date(c.req.query("endDate")!);
            if (c.req.query("blocked")) filters.blocked = c.req.query("blocked") === "true";

            const { events, total } = await securityLogService.getEvents(filters, page, limit);

            return c.json({
                success: true,
                data: events,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error getting security logs:", error);
            return c.json({
                success: false,
                error: "Failed to get security logs",
            }, 500);
        }
    }

    /**
     * GET /api/admin/security/logs/stats
     * Get log statistics
     */
    async getStats(c: Context) {
        try {
            const stats = await securityLogService.getStats();

            return c.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error getting log stats:", error);
            return c.json({
                success: false,
                error: "Failed to get log statistics",
            }, 500);
        }
    }

    /**
     * GET /api/admin/security/logs/export
     * Export logs to CSV or JSON
     */
    async export(c: Context) {
        try {
            const format = c.req.query("format") || "json";

            const filters: SecurityLogFilters = {};
            if (c.req.query("type")) filters.type = c.req.query("type")!;
            if (c.req.query("severity")) filters.severity = c.req.query("severity")!;
            if (c.req.query("startDate")) filters.startDate = new Date(c.req.query("startDate")!);
            if (c.req.query("endDate")) filters.endDate = new Date(c.req.query("endDate")!);

            let content: string;
            let contentType: string;
            let filename: string;

            if (format === "csv") {
                content = await securityLogService.exportToCSV(filters);
                contentType = "text/csv";
                filename = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                content = await securityLogService.exportToJSON(filters);
                contentType = "application/json";
                filename = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
            }

            c.header("Content-Type", contentType);
            c.header("Content-Disposition", `attachment; filename="${filename}"`);
            return c.body(content);
        } catch (error) {
            console.error("Error exporting logs:", error);
            return c.json({
                success: false,
                error: "Failed to export logs",
            }, 500);
        }
    }
}

export const securityLogsController = new SecurityLogsController();
