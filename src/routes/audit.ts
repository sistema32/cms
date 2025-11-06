/**
 * Audit Log Routes
 * API endpoints for querying audit logs
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";
import { auditLogger } from "../lib/audit/index.ts";
import type { AuditLogFilter } from "../lib/audit/index.ts";

const audit = new Hono();

// Protect all audit routes - require users:read permission
audit.use("/*", authMiddleware);
audit.use("/*", requirePermission("users", "read")); // Only admins can view audit logs

/**
 * GET /api/audit/query
 * Query audit logs with filters
 */
audit.get("/query", async (c) => {
  try {
    // Parse query parameters
    const filter: AuditLogFilter = {
      userId: c.req.query("userId")
        ? Number(c.req.query("userId"))
        : undefined,
      userEmail: c.req.query("userEmail") || undefined,
      action: c.req.query("action") || undefined,
      entity: c.req.query("entity") || undefined,
      entityId: c.req.query("entityId") || undefined,
      level: c.req.query("level") as any,
      startDate: c.req.query("startDate")
        ? new Date(c.req.query("startDate")!)
        : undefined,
      endDate: c.req.query("endDate")
        ? new Date(c.req.query("endDate")!)
        : undefined,
      ipAddress: c.req.query("ipAddress") || undefined,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : 50,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : 0,
      sortBy: (c.req.query("sortBy") as any) || "created_at",
      sortOrder: (c.req.query("sortOrder") as any) || "desc",
    };

    const result = await auditLogger.query(filter);

    return c.json(result);
  } catch (error: any) {
    console.error("Error querying audit logs:", error);
    return c.json(
      {
        error: "Failed to query audit logs",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/audit/stats
 * Get audit log statistics
 */
audit.get("/stats", async (c) => {
  try {
    const stats = await auditLogger.getStats();
    return c.json(stats);
  } catch (error: any) {
    console.error("Error getting audit stats:", error);
    return c.json(
      {
        error: "Failed to get audit statistics",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/audit/user/:userId
 * Get audit logs for a specific user
 */
audit.get("/user/:userId", async (c) => {
  try {
    const userId = Number(c.req.param("userId"));
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
    const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;

    const result = await auditLogger.query({
      userId,
      limit,
      offset,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    return c.json(result);
  } catch (error: any) {
    console.error("Error getting user audit logs:", error);
    return c.json(
      {
        error: "Failed to get user audit logs",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/audit/entity/:entity/:entityId
 * Get audit logs for a specific entity
 */
audit.get("/entity/:entity/:entityId", async (c) => {
  try {
    const entity = c.req.param("entity");
    const entityId = c.req.param("entityId");
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
    const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;

    const result = await auditLogger.query({
      entity,
      entityId,
      limit,
      offset,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    return c.json(result);
  } catch (error: any) {
    console.error("Error getting entity audit logs:", error);
    return c.json(
      {
        error: "Failed to get entity audit logs",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/audit/recent-errors
 * Get recent error logs (last 24h)
 */
audit.get("/recent-errors", async (c) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await auditLogger.query({
      level: ["error", "critical"],
      startDate: oneDayAgo,
      limit: 100,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    return c.json(result);
  } catch (error: any) {
    console.error("Error getting recent errors:", error);
    return c.json(
      {
        error: "Failed to get recent errors",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/audit/clean
 * Clean old audit logs
 * Requires settings:update permission
 */
audit.post("/clean", requirePermission("settings", "update"), async (c) => {
  try {
    const body = await c.req.json();
    const daysToKeep = body.daysToKeep || 90;

    const deletedCount = await auditLogger.cleanOldLogs(daysToKeep);

    return c.json({
      success: true,
      message: `Cleaned ${deletedCount} old audit logs`,
      deletedCount,
      daysKept: daysToKeep,
    });
  } catch (error: any) {
    console.error("Error cleaning audit logs:", error);
    return c.json(
      {
        error: "Failed to clean audit logs",
        message: error.message,
      },
      500,
    );
  }
});

export default audit;
