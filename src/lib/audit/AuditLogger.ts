// @ts-nocheck
/**
 * Audit Logger
 * Main audit logging service
 */

import { db } from "../../config/db.ts";
import { auditLogs, type NewAuditLog } from "../../db/schema.ts";
import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import type {
  AuditAction,
  AuditContext,
  AuditEntity,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogLevel,
  AuditLogStats,
} from "./types.ts";
import { ACTION_DESCRIPTIONS, ENTITY_NAMES } from "./types.ts";

export class AuditLogger {
  private static instance: AuditLogger;
  private enabled = true;

  private constructor() { }

  /**
   * Get singleton instance
   */
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`📝 Audit logging ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const logEntry: NewAuditLog = {
        userId: entry.userId,
        userEmail: entry.userEmail,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId?.toString(),
        description: entry.description || this.buildDescription(entry),
        changes: entry.changes ? JSON.stringify(entry.changes) : undefined,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        level: entry.level || "info",
      };

      await db.insert(auditLogs).values(logEntry);

      // Log to console in development
      if (Deno.env.get("DENO_ENV") === "development") {
        const level = entry.level || "info";
        const emoji = this.getLevelEmoji(level);
        console.log(
          `${emoji} [AUDIT] ${logEntry.description} (${entry.entity}:${entry.entityId || "N/A"})`,
        );
      }
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // Don't throw - audit logging should never break the application
    }
  }

  /**
   * Log with debug level
   */
  async debug(
    action: AuditAction | string,
    entity: AuditEntity | string,
    context: AuditContext & {
      entityId?: string | number;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      entity,
      level: "debug",
    });
  }

  /**
   * Log with info level
   */
  async info(
    action: AuditAction | string,
    entity: AuditEntity | string,
    context: AuditContext & {
      entityId?: string | number;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      entity,
      level: "info",
    });
  }

  /**
   * Log with warning level
   */
  async warning(
    action: AuditAction | string,
    entity: AuditEntity | string,
    context: AuditContext & {
      entityId?: string | number;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      entity,
      level: "warning",
    });
  }

  /**
   * Log with error level
   */
  async error(
    action: AuditAction | string,
    entity: AuditEntity | string,
    context: AuditContext & {
      entityId?: string | number;
      description?: string;
      error?: Error;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const metadata = context.metadata || {};
    if (context.error) {
      metadata.error = {
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    await this.log({
      ...context,
      action,
      entity,
      level: "error",
      metadata,
    });
  }

  /**
   * Log with critical level
   */
  async critical(
    action: AuditAction | string,
    entity: AuditEntity | string,
    context: AuditContext & {
      entityId?: string | number;
      description?: string;
      error?: Error;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const metadata = context.metadata || {};
    if (context.error) {
      metadata.error = {
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    await this.log({
      ...context,
      action,
      entity,
      level: "critical",
      metadata,
    });
  }

  /**
   * Log an authentication event
   */
  async logAuth(
    action: "login" | "logout" | "register" | "password_change" | "password_reset",
    userId: number,
    context: AuditContext & {
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await this.info(action, "user", {
      ...context,
      userId,
      entityId: userId,
    });
  }

  /**
   * Log a content change with before/after values
   */
  async logChange(
    action: AuditAction | string,
    entity: AuditEntity | string,
    entityId: string | number,
    changes: Record<string, { before: any; after: any }>,
    context: AuditContext,
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      entity,
      entityId,
      changes,
      level: "info",
    });
  }

  /**
   * Query audit logs with filters
   */
  async query(filter: AuditLogFilter = {}) {
    const conditions = [];

    if (filter.userId) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }

    if (filter.userEmail) {
      conditions.push(eq(auditLogs.userEmail, filter.userEmail));
    }

    if (filter.action) {
      if (Array.isArray(filter.action)) {
        conditions.push(inArray(auditLogs.action, filter.action));
      } else {
        conditions.push(eq(auditLogs.action, filter.action));
      }
    }

    if (filter.entity) {
      if (Array.isArray(filter.entity)) {
        conditions.push(inArray(auditLogs.entity, filter.entity));
      } else {
        conditions.push(eq(auditLogs.entity, filter.entity));
      }
    }

    if (filter.entityId) {
      conditions.push(eq(auditLogs.entityId, filter.entityId));
    }

    if (filter.level) {
      if (Array.isArray(filter.level)) {
        conditions.push(inArray(auditLogs.level, filter.level));
      } else {
        conditions.push(eq(auditLogs.level, filter.level));
      }
    }

    if (filter.startDate) {
      conditions.push(gte(auditLogs.createdAt, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(auditLogs.createdAt, filter.endDate));
    }

    if (filter.ipAddress) {
      conditions.push(eq(auditLogs.ipAddress, filter.ipAddress));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    // Get paginated results
    // Normalize snake_case to camelCase (e.g., created_at -> createdAt)
    const rawSortBy = filter.sortBy || "createdAt";
    const sortColumn = rawSortBy.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const sortOrder = filter.sortOrder || "desc";

    // Validate column exists, fallback to createdAt
    const sortableColumn = auditLogs[sortColumn as keyof typeof auditLogs] || auditLogs.createdAt;

    let query = db
      .select()
      .from(auditLogs)
      .where(whereClause);

    // Apply sorting
    if (sortOrder === "desc") {
      query = query.orderBy(desc(sortableColumn));
    } else {
      query = query.orderBy(sortableColumn);
    }

    // Apply pagination
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const logs = await query;

    return {
      logs,
      total: count,
      limit: filter.limit || count,
      offset: filter.offset || 0,
    };
  }

  /**
   * Get audit log statistics
   */
  async getStats(): Promise<AuditLogStats> {
    // Total logs
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(auditLogs);

    // By level
    const levelStats = await db
      .select({
        level: auditLogs.level,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.level);

    const byLevel = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    for (const stat of levelStats) {
      byLevel[stat.level as AuditLogLevel] = stat.count;
    }

    // By entity
    const entityStats = await db
      .select({
        entity: auditLogs.entity,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.entity);

    const byEntity: Record<string, number> = {};
    for (const stat of entityStats) {
      byEntity[stat.entity] = stat.count;
    }

    // By action
    const actionStats = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action);

    const byAction: Record<string, number> = {};
    for (const stat of actionStats) {
      byAction[stat.action] = stat.count;
    }

    // Top users
    const userStats = await db
      .select({
        userId: auditLogs.userId,
        userEmail: auditLogs.userEmail,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(sql`${auditLogs.userId} IS NOT NULL`)
      .groupBy(auditLogs.userId, auditLogs.userEmail)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const byUser = userStats.map((stat) => ({
      userId: stat.userId!,
      userEmail: stat.userEmail!,
      count: stat.count,
    }));

    // Recent errors (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ recentErrors }] = await db
      .select({ recentErrors: sql<number>`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.level, "error"),
          gte(auditLogs.createdAt, oneDayAgo),
        ),
      );

    const [{ recentCritical }] = await db
      .select({ recentCritical: sql<number>`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.level, "critical"),
          gte(auditLogs.createdAt, oneDayAgo),
        ),
      );

    return {
      totalLogs: total,
      byLevel,
      byEntity,
      byAction,
      byUser,
      recentErrors,
      recentCritical,
    };
  }

  /**
   * Clean old logs (optional cleanup)
   */
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(auditLogs)
      .where(lte(auditLogs.createdAt, cutoffDate));

    console.log(`🗑️  Cleaned ${deleted} audit logs older than ${daysToKeep} days`);

    return deleted.length;
  }

  /**
   * Build human-readable description
   */
  private buildDescription(entry: AuditLogEntry): string {
    const actionDesc = ACTION_DESCRIPTIONS[entry.action] || entry.action;
    const entityName = ENTITY_NAMES[entry.entity] || entry.entity;
    const userPart = entry.userEmail ? `${entry.userEmail}` : "System";

    return `${userPart} ${actionDesc.toLowerCase()} ${entityName.toLowerCase()}${entry.entityId ? ` #${entry.entityId}` : ""}`;
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: AuditLogLevel): string {
    const emojis = {
      debug: "🐛",
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      critical: "🚨",
    };
    return emojis[level];
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
