/**
 * Security Logs Controller
 * Handles security event logs retrieval and export
 */

import type { Context } from "hono";
import { securityLogService } from "../../services/security/securityLogService.ts";
import type { SecurityLogFilters } from "../../services/security/securityLogService.ts";
import { AppError } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { getErrorMessage } from "@/utils/errors.ts";

const log = createLogger("securityLogsController");

export class SecurityLogsController {
    /**
     * GET /api/admin/security/logs
     * Get security logs with filters
     */
    async getLogs(c: Context) {
        try {
            const page = Number(c.req.query("page") || "1");
            const limit = Number(c.req.query("limit") || "50");

            if (Number.isNaN(page) || page < 1) {
                throw new AppError("invalid_page", "Página inválida", 400);
            }
            if (Number.isNaN(limit) || limit < 1) {
                throw new AppError("invalid_limit", "Límite inválido", 400);
            }

            const filters: SecurityLogFilters = {};
            if (c.req.query("type")) filters.type = c.req.query("type")!;
            if (c.req.query("severity")) filters.severity = c.req.query("severity")!;
            if (c.req.query("ip")) filters.ip = c.req.query("ip")!;
            if (c.req.query("startDate")) {
                const start = new Date(c.req.query("startDate")!);
                if (Number.isNaN(start.getTime())) {
                    throw new AppError("invalid_date", "Fecha de inicio inválida", 400);
                }
                filters.startDate = start;
            }
            if (c.req.query("endDate")) {
                const end = new Date(c.req.query("endDate")!);
                if (Number.isNaN(end.getTime())) {
                    throw new AppError("invalid_date", "Fecha de fin inválida", 400);
                }
                filters.endDate = end;
            }
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
            log.error("Error getting security logs", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_logs_fetch_failed", getErrorMessage(error), 500);
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
            log.error("Error getting log stats", error instanceof Error ? error : undefined);
            throw new AppError("security_logs_stats_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * GET /api/admin/security/logs/export
     * Export logs to CSV or JSON
     */
    async export(c: Context) {
        try {
            const format = c.req.query("format") || "json";
            if (format && format !== "csv" && format !== "json") {
                throw new AppError("invalid_format", "Formato inválido", 400);
            }

            const filters: SecurityLogFilters = {};
            if (c.req.query("type")) filters.type = c.req.query("type")!;
            if (c.req.query("severity")) filters.severity = c.req.query("severity")!;
            if (c.req.query("startDate")) {
                const start = new Date(c.req.query("startDate")!);
                if (Number.isNaN(start.getTime())) {
                    throw new AppError("invalid_date", "Fecha de inicio inválida", 400);
                }
                filters.startDate = start;
            }
            if (c.req.query("endDate")) {
                const end = new Date(c.req.query("endDate")!);
                if (Number.isNaN(end.getTime())) {
                    throw new AppError("invalid_date", "Fecha de fin inválida", 400);
                }
                filters.endDate = end;
            }

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
            log.error("Error exporting security logs", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("security_logs_export_failed", getErrorMessage(error), 500);
        }
    }
}

export const securityLogsController = new SecurityLogsController();
