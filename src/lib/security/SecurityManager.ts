/**
 * Security Manager
 * Manages IP blocking, security events, and threat detection
 */

import { db } from "../../config/db.ts";
import { ipBlockRules, securityEvents, users } from "../../db/schema.ts";
import type { NewIPBlockRule, NewSecurityEvent } from "../../db/schema.ts";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import type { IPBlockRule, SecurityEvent, SecurityStats } from "./types.ts";
import { notificationService } from "../email/index.ts";

export class SecurityManager {
  private static instance: SecurityManager;
  private ipBlockCache = new Map<string, IPBlockRule>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  private constructor() {
    this.loadIPBlockCache();
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Load IP block rules into cache
   */
  private async loadIPBlockCache(): Promise<void> {
    let rules: IPBlockRule[] = [];
    try {
      rules = await db.select().from(ipBlockRules) as IPBlockRule[];
    } catch (error) {
      console.warn("SecurityManager: skipping IP block cache load (db unavailable)", error);
      this.ipBlockCache.clear();
      this.lastCacheUpdate = Date.now();
      return;
    }

    this.ipBlockCache.clear();
    for (const rule of rules) {
      // Check if rule has expired
      if (rule.expiresAt && rule.expiresAt < new Date()) {
        if (rule.id !== undefined && rule.id !== null) {
          await this.deleteIPRule(rule.id);
        }
        continue;
      }

      this.ipBlockCache.set(rule.ip, rule as IPBlockRule);
    }

    this.lastCacheUpdate = Date.now();
  }

  /**
   * Refresh cache if needed
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
      await this.loadIPBlockCache();
    }
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    await this.refreshCacheIfNeeded();

    const rule = this.ipBlockCache.get(ip);
    if (!rule) return false;

    // Check if it's a block rule (supporting legacy "blacklist" label)
    const ruleType = rule.type as string;
    if (ruleType !== "block" && ruleType !== "blacklist") return false;

    // Check if expired
    if (rule.expiresAt && rule.expiresAt < new Date()) {
      await this.deleteIPRule(rule.id!);
      this.ipBlockCache.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Check if IP is whitelisted
   */
  async isIPWhitelisted(ip: string): Promise<boolean> {
    await this.refreshCacheIfNeeded();

    const rule = this.ipBlockCache.get(ip);
    if (!rule) return false;

    return rule.type === "whitelist";
  }

  /**
   * Add IP block rule
   */
  async blockIP(
    ip: string,
    reason?: string,
    expiresAt?: Date,
    userId?: number,
  ): Promise<void> {
    // Check if rule already exists
    const existing = await db.query.ipBlockRules.findFirst({
      where: eq(ipBlockRules.ip, ip),
    });

    if (existing) {
      // Update existing rule
      await db.update(ipBlockRules)
        .set({
          type: "block",
          reason,
          expiresAt,
        })
        .where(eq(ipBlockRules.id, existing.id));
    } else {
      // Create new rule
      await db.insert(ipBlockRules).values({
        ip,
        type: "block",
        reason,
        expiresAt,
        createdBy: userId,
      });
    }

    // Refresh cache
    await this.loadIPBlockCache();

    console.log(`🚫 IP blocked: ${ip} ${reason ? `(${reason})` : ""}`);
  }

  /**
   * Add IP whitelist rule
   */
  async whitelistIP(ip: string, userId?: number): Promise<void> {
    // Check if rule already exists
    const existing = await db.query.ipBlockRules.findFirst({
      where: eq(ipBlockRules.ip, ip),
    });

    if (existing) {
      // Update existing rule
      await db.update(ipBlockRules)
        .set({
          type: "whitelist",
        })
        .where(eq(ipBlockRules.id, existing.id));
    } else {
      // Create new rule
      await db.insert(ipBlockRules).values({
        ip,
        type: "whitelist",
        createdBy: userId,
      });
    }

    // Refresh cache
    await this.loadIPBlockCache();

    console.log(`✅ IP whitelisted: ${ip}`);
  }

  /**
   * Remove IP rule
   */
  async deleteIPRule(id: number): Promise<void> {
    await db.delete(ipBlockRules).where(eq(ipBlockRules.id, id));
    await this.loadIPBlockCache();
  }

  async removeIPRule(id: number): Promise<void> {
    await this.deleteIPRule(id);
  }

  /**
   * Unblock IP
   */
  async unblockIP(ip: string): Promise<void> {
    await db.delete(ipBlockRules).where(eq(ipBlockRules.ip, ip));
    this.ipBlockCache.delete(ip);
  }

  /**
   * Get all IP rules
   */
  async getIPRules(type?: "block" | "whitelist"): Promise<IPBlockRule[]> {
    let query = db.select().from(ipBlockRules);

    if (type) {
      const rules = await db.query.ipBlockRules.findMany({
        where: eq(ipBlockRules.type, type),
        orderBy: [desc(ipBlockRules.createdAt)],
      });
      return rules as IPBlockRule[];
    }

    const rules = await db.query.ipBlockRules.findMany({
      orderBy: [desc(ipBlockRules.createdAt)],
    });

    return rules as IPBlockRule[];
  }

  async getAllIPRules(type?: "block" | "whitelist"): Promise<IPBlockRule[]> {
    return this.getIPRules(type);
  }

  /**
   * Log security event
   */
  async logEvent(
    type: SecurityEvent["type"],
    ip: string,
    severity: "low" | "medium" | "high" | "critical",
    options: {
      userAgent?: string;
      path?: string;
      method?: string;
      userId?: number;
      details?: Record<string, any>;
    } = {},
  ): Promise<void> {
    await db.insert(securityEvents).values({
      type,
      ip,
      userAgent: options.userAgent,
      path: options.path,
      method: options.method,
      userId: options.userId,
      details: options.details ? JSON.stringify(options.details) : undefined,
      severity,
    });

    // Auto-block on critical events
    if (severity === "critical") {
      const recentEvents = await this.getRecentEventsByIP(ip, 5 * 60 * 1000); // Last 5 minutes

      // Block if more than 5 critical events in 5 minutes
      if (recentEvents.filter((e) => e.severity === "critical").length >= 5) {
        await this.blockIP(ip, `Auto-blocked: ${recentEvents.length} critical events`, undefined, undefined);
      }

      // Notify admins about critical security event
      try {
        const admins = await db.query.users.findMany({
          where: eq(users.roleId, 1),
        });

        for (const admin of admins) {
          await notificationService.create({
            userId: admin.id,
            type: "system.error",
            title: "⚠️ Alerta de Seguridad Crítica",
            message: `Evento de seguridad crítico detectado: ${type} desde IP ${ip}`,
            actionLabel: "Ver detalles",
            actionUrl: "/admincp/security",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Error sending security notification:", notifError);
      }
    }
  }

  /**
   * Get recent events by IP
   */
  async getRecentEventsByIP(ip: string, windowMs: number): Promise<SecurityEvent[]> {
    const since = new Date(Date.now() - windowMs);

    const events = await db.query.securityEvents.findMany({
      where: and(
        eq(securityEvents.ip, ip),
        gte(securityEvents.createdAt, since),
      ),
      orderBy: [desc(securityEvents.createdAt)],
    });

    return events.map((e) => ({
      ...e,
      details: e.details ? JSON.parse(e.details) : undefined,
    })) as SecurityEvent[];
  }

  async getSecurityEvents(filters: {
    type?: string;
    severity?: string;
    ip?: string;
    limit?: number;
    offset?: number;
  }): Promise<SecurityEvent[]> {
    const { type, severity, ip, limit = 100, offset = 0 } = filters;
    const conditions = [];

    if (type) conditions.push(eq(securityEvents.type, type));
    if (severity) conditions.push(eq(securityEvents.severity, severity));
    if (ip) conditions.push(eq(securityEvents.ip, ip));

    const events = await db.query.securityEvents.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(securityEvents.createdAt)],
      limit,
      offset,
    });

    return events.map((e) => ({
      ...e,
      details: e.details ? JSON.parse(e.details) : undefined,
    })) as SecurityEvent[];
  }

  /**
   * Get security statistics
   */
  async getStats(): Promise<SecurityStats> {
    const allRules = await db.select().from(ipBlockRules);
    const allEvents = await db.select().from(securityEvents);

    // Count by severity
    const bySeverity: Record<string, number> = {};
    for (const event of allEvents) {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    }

    // Count by type
    const byType: Record<string, number> = {};
    for (const event of allEvents) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    // Top blocked IPs
    const ipCounts = new Map<string, number>();
    for (const event of allEvents) {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    }

    const topBlockedIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalEvents: allEvents.length,
      blockedIPs: allRules.filter((r) => r.type === "block").length,
      whitelistedIPs: allRules.filter((r) => r.type === "whitelist").length,
      rateLimitHits: allEvents.filter((e) => e.type === "rate_limit_exceeded").length,
      suspiciousActivity: allEvents.filter((e) => e.type === "suspicious_activity").length,
      bySeverity,
      byType,
      topBlockedIPs,
    };
  }

  /**
   * Clean old events (older than 30 days)
   */
  async cleanOldEvents(retentionDays = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await db.delete(securityEvents)
      .where(sql`${securityEvents.createdAt} < ${cutoff}`);

    return result.rowsAffected || 0;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(input: string): boolean {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /('.*OR.*'.*=.*)/gi,
    ];

    return patterns.some((pattern) => pattern.test(input));
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input: string): boolean {
    const patterns = [
      /<script[^>]*>.*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // onclick, onerror, etc.
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
    ];

    return patterns.some((pattern) => pattern.test(input));
  }

  /**
   * Detect path traversal attempts
   */
  detectPathTraversal(input: string): boolean {
    const patterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e/gi,
      /\.\./g,
    ];

    return patterns.some((pattern) => pattern.test(input));
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<{
    ipRules: { total: number; blocked: number; whitelisted: number };
    events: { total: number; last24h: number; lastWeek: number };
  }> {
    // Get IP rules stats
    const allRules = await db.select().from(ipBlockRules);
    const blockedCount = allRules.filter(r => r.type === 'block').length;
    const whitelistedCount = allRules.filter(r => r.type === 'whitelist').length;

    // Get events stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const allEvents = await db.select().from(securityEvents);
    const last24hCount = allEvents.filter((e) =>
      new Date(e.createdAt) >= oneDayAgo
    ).length;
    const lastWeekCount = allEvents.filter((e) =>
      new Date(e.createdAt) >= oneWeekAgo
    ).length;

    return {
      ipRules: {
        total: allRules.length,
        blocked: blockedCount,
        whitelisted: whitelistedCount,
      },
      events: {
        total: allEvents.length,
        last24h: last24hCount,
        lastWeek: lastWeekCount,
      },
    };
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();
