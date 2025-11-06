/**
 * Security Management Routes
 * Manage IP blocking, whitelisting, and security events
 */

import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { securityManager } from "../lib/security/SecurityManager.ts";
import { z } from "zod";

const security = new Hono();

// All routes require admin authentication
security.use("*", authMiddleware);

/**
 * Get IP block rules with filtering
 * GET /api/security/rules
 */
security.get("/rules", async (c) => {
  try {
    const type = c.req.query("type") as "block" | "whitelist" | undefined;
    const active = c.req.query("active");

    const rules = await securityManager.getAllIPRules(type);

    // Filter by active status if requested
    let filteredRules = rules;
    if (active === "true") {
      const now = new Date();
      filteredRules = rules.filter(
        (rule) => !rule.expiresAt || new Date(rule.expiresAt) > now,
      );
    } else if (active === "false") {
      const now = new Date();
      filteredRules = rules.filter(
        (rule) => rule.expiresAt && new Date(rule.expiresAt) <= now,
      );
    }

    return c.json({
      success: true,
      data: {
        rules: filteredRules,
        total: filteredRules.length,
      },
    });
  } catch (error) {
    console.error("Failed to get IP rules:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get IP rules",
      },
      500,
    );
  }
});

/**
 * Block an IP address
 * POST /api/security/block
 */
const blockIPSchema = z.object({
  ip: z.string().min(1, "IP address is required"),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

security.post("/block", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = blockIPSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400,
      );
    }

    const { ip, reason, expiresAt } = parsed.data;
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;

    await securityManager.blockIP(ip, reason, expiresAtDate, user.id);

    return c.json({
      success: true,
      message: `IP ${ip} has been blocked`,
    });
  } catch (error) {
    console.error("Failed to block IP:", error);
    return c.json(
      {
        success: false,
        error: "Failed to block IP",
      },
      500,
    );
  }
});

/**
 * Whitelist an IP address
 * POST /api/security/whitelist
 */
const whitelistIPSchema = z.object({
  ip: z.string().min(1, "IP address is required"),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

security.post("/whitelist", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = whitelistIPSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400,
      );
    }

    const { ip, reason, expiresAt } = parsed.data;
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;

    await securityManager.whitelistIP(ip, reason, expiresAtDate, user.id);

    return c.json({
      success: true,
      message: `IP ${ip} has been whitelisted`,
    });
  } catch (error) {
    console.error("Failed to whitelist IP:", error);
    return c.json(
      {
        success: false,
        error: "Failed to whitelist IP",
      },
      500,
    );
  }
});

/**
 * Remove IP rule (unblock or remove from whitelist)
 * DELETE /api/security/rules/:id
 */
security.delete("/rules/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid rule ID",
        },
        400,
      );
    }

    await securityManager.removeIPRule(id);

    return c.json({
      success: true,
      message: "IP rule removed successfully",
    });
  } catch (error) {
    console.error("Failed to remove IP rule:", error);
    return c.json(
      {
        success: false,
        error: "Failed to remove IP rule",
      },
      500,
    );
  }
});

/**
 * Get security events with filtering
 * GET /api/security/events
 */
security.get("/events", async (c) => {
  try {
    const type = c.req.query("type");
    const severity = c.req.query("severity");
    const ip = c.req.query("ip");
    const limit = parseInt(c.req.query("limit") || "100");
    const offset = parseInt(c.req.query("offset") || "0");

    const events = await securityManager.getSecurityEvents({
      type: type as any,
      severity: severity as any,
      ip,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: {
        events,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Failed to get security events:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get security events",
      },
      500,
    );
  }
});

/**
 * Get security statistics
 * GET /api/security/stats
 */
security.get("/stats", async (c) => {
  try {
    const stats = await securityManager.getSecurityStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to get security stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get security stats",
      },
      500,
    );
  }
});

/**
 * Get recent events by IP
 * GET /api/security/events/by-ip/:ip
 */
security.get("/events/by-ip/:ip", async (c) => {
  try {
    const ip = c.req.param("ip");
    const windowMs = parseInt(c.req.query("window") || "3600000"); // Default 1 hour

    const events = await securityManager.getRecentEventsByIP(ip, windowMs);

    return c.json({
      success: true,
      data: {
        ip,
        events,
        total: events.length,
        windowMs,
      },
    });
  } catch (error) {
    console.error("Failed to get events by IP:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get events by IP",
      },
      500,
    );
  }
});

/**
 * Clean old security events
 * POST /api/security/events/clean
 */
security.post("/events/clean", async (c) => {
  try {
    const retentionDays = parseInt(c.req.query("days") || "30");

    await securityManager.cleanOldEvents(retentionDays);

    return c.json({
      success: true,
      message: `Cleaned security events older than ${retentionDays} days`,
    });
  } catch (error) {
    console.error("Failed to clean events:", error);
    return c.json(
      {
        success: false,
        error: "Failed to clean events",
      },
      500,
    );
  }
});

export default security;
