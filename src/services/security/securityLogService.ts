// @ts-nocheck
/**
 * Security Log Service
 * Handles security event logging and retrieval
 */

import { db } from "../../db/index.ts";
import { securityEvents } from "../../db/schema.ts";
import { eq, and, gte, lte, desc, like, or } from "drizzle-orm";
import type { NewSecurityEvent, SecurityEvent } from "../../db/schema.ts";

import { securityNotificationService } from "./securityNotificationService.ts";

export interface SecurityLogFilters {
    type?: string;
    severity?: string;
    ip?: string;
    startDate?: Date;
    endDate?: Date;
    blocked?: boolean;
    ruleId?: number;
}

export interface SecurityLogStats {
    total: number;
    last24h: number;
    lastWeek: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
}

export class SecurityLogService {
    /**
     * Log a security event
     */
    async logEvent(event: NewSecurityEvent): Promise<SecurityEvent> {
        const [logged] = await db.insert(securityEvents).values(event).returning();

        // Trigger notification asynchronously
        securityNotificationService.sendAlert({
            type: logged.type,
            severity: logged.severity as "low" | "medium" | "high" | "critical",
            message: logged.details ? JSON.stringify(logged.details) : `Security event: ${logged.type}`,
            ip: logged.ip,
            details: logged.details ? JSON.parse(logged.details as string) : undefined
        }).catch(err => console.error("Failed to send security alert:", err));

        return logged;
    }

    /**
     * Get security events with filters and pagination
     */
    async getEvents(
        filters: SecurityLogFilters = {},
        page: number = 1,
        limit: number = 50
    ): Promise<{ events: SecurityEvent[]; total: number }> {
        const conditions = [];

        if (filters.type) {
            conditions.push(eq(securityEvents.type, filters.type));
        }

        if (filters.severity) {
            conditions.push(eq(securityEvents.severity, filters.severity));
        }

        if (filters.ip) {
            conditions.push(like(securityEvents.ip, `%${filters.ip}%`));
        }

        if (filters.startDate) {
            conditions.push(gte(securityEvents.createdAt, filters.startDate));
        }

        if (filters.endDate) {
            conditions.push(lte(securityEvents.createdAt, filters.endDate));
        }

        if (filters.blocked !== undefined) {
            conditions.push(eq(securityEvents.blocked, filters.blocked));
        }

        if (filters.ruleId) {
            conditions.push(eq(securityEvents.ruleId, filters.ruleId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const allEvents = await db.select()
            .from(securityEvents)
            .where(whereClause);

        const total = allEvents.length;

        // Get paginated results
        const offset = (page - 1) * limit;
        const events = await db.select()
            .from(securityEvents)
            .where(whereClause)
            .orderBy(desc(securityEvents.createdAt))
            .limit(limit)
            .offset(offset);

        return { events, total };
    }

    /**
     * Get recent security events
     */
    async getRecentEvents(limit: number = 10): Promise<SecurityEvent[]> {
        return await db.select()
            .from(securityEvents)
            .orderBy(desc(securityEvents.createdAt))
            .limit(limit);
    }

    /**
     * Get events by IP
     */
    async getEventsByIP(ip: string, limit: number = 50): Promise<SecurityEvent[]> {
        return await db.select()
            .from(securityEvents)
            .where(eq(securityEvents.ip, ip))
            .orderBy(desc(securityEvents.createdAt))
            .limit(limit);
    }

    /**
     * Get events by date range
     */
    async getEventsByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<SecurityEvent[]> {
        return await db.select()
            .from(securityEvents)
            .where(
                and(
                    gte(securityEvents.createdAt, startDate),
                    lte(securityEvents.createdAt, endDate)
                )
            )
            .orderBy(desc(securityEvents.createdAt));
    }

    /**
     * Get statistics
     */
    async getStats(): Promise<SecurityLogStats> {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const allEvents = await db.select().from(securityEvents);
        const events24h = allEvents.filter(e => e.createdAt >= last24h);
        const eventsWeek = allEvents.filter(e => e.createdAt >= lastWeek);

        // Count by type
        const byType: Record<string, number> = {};
        allEvents.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
        });

        // Count by severity
        const bySeverity: Record<string, number> = {};
        allEvents.forEach(e => {
            bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
        });

        return {
            total: allEvents.length,
            last24h: events24h.length,
            lastWeek: eventsWeek.length,
            byType,
            bySeverity,
        };
    }

    /**
     * Get top threat IPs
     */
    async getTopThreatIPs(limit: number = 10): Promise<Array<{ ip: string; count: number }>> {
        const events = await db.select().from(securityEvents);

        const ipCounts: Record<string, number> = {};
        events.forEach(e => {
            ipCounts[e.ip] = (ipCounts[e.ip] || 0) + 1;
        });

        return Object.entries(ipCounts)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get event timeline (grouped by date)
     */
    async getEventTimeline(days: number = 7): Promise<Array<{ date: string; count: number }>> {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const events = await this.getEventsByDateRange(startDate, now);

        const timeline: Record<string, number> = {};
        events.forEach(e => {
            const date = e.createdAt.toISOString().split('T')[0];
            timeline[date] = (timeline[date] || 0) + 1;
        });

        return Object.entries(timeline)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Clean up old events
     */
    async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await db.delete(securityEvents)
            .where(lte(securityEvents.createdAt, cutoffDate));

        return (result as any).changes || 0;
    }

    /**
     * Export events to JSON
     */
    async exportToJSON(filters: SecurityLogFilters = {}): Promise<string> {
        const { events } = await this.getEvents(filters, 1, 10000);
        return JSON.stringify(events, null, 2);
    }

    /**
     * Export events to CSV
     */
    async exportToCSV(filters: SecurityLogFilters = {}): Promise<string> {
        const { events } = await this.getEvents(filters, 1, 10000);

        if (events.length === 0) {
            return "";
        }

        // CSV headers
        const headers = ["ID", "Type", "IP", "Severity", "Path", "Method", "Blocked", "Created At"];
        const rows = events.map(e => [
            e.id,
            e.type,
            e.ip,
            e.severity,
            e.path || "",
            e.method || "",
            e.blocked ? "Yes" : "No",
            e.createdAt.toISOString(),
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.join(",")),
        ].join("\n");

        return csv;
    }
}

export const securityLogService = new SecurityLogService();
// @ts-nocheck
