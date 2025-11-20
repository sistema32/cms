/**
 * Security Dashboard Controller
 * Provides overview metrics and statistics
 */

import type { Context } from "hono";
import { securityLogService } from "../../services/security/securityLogService.ts";
import { ipManagementService } from "../../services/security/ipManagementService.ts";
import { rateLimitConfigService } from "../../services/security/rateLimitConfigService.ts";
import { securityRuleService } from "../../services/security/securityRuleService.ts";

export class SecurityDashboardController {
    /**
     * GET /api/admin/security/dashboard
     * Get dashboard overview with metrics
     */
    async getDashboard(c: Context) {
        try {
            // Get all stats in parallel
            const [logStats, ipStats, rateLimitStats, ruleStats, recentAlerts, topThreatIPs, timeline] =
                await Promise.all([
                    securityLogService.getStats(),
                    ipManagementService.getStats(),
                    rateLimitConfigService.getStats(),
                    securityRuleService.getStats(),
                    securityLogService.getRecentEvents(10),
                    securityLogService.getTopThreatIPs(10),
                    securityLogService.getEventTimeline(7),
                ]);

            return c.json({
                success: true,
                data: {
                    metrics: {
                        totalEvents24h: logStats.last24h,
                        totalEventsWeek: logStats.lastWeek,
                        blockedIPs: ipStats.activeBlocked,
                        rateLimitViolations: logStats.byType["rate_limit_exceeded"] || 0,
                        activeRules: ruleStats.active,
                    },
                    recentAlerts: recentAlerts.filter(e =>
                        e.severity === "critical" || e.severity === "high"
                    ).slice(0, 5),
                    topThreatIPs,
                    eventTimeline: timeline,
                    stats: {
                        logs: logStats,
                        ips: ipStats,
                        rateLimits: rateLimitStats,
                        rules: ruleStats,
                    },
                },
            });
        } catch (error) {
            console.error("Error getting security dashboard:", error);
            return c.json({
                success: false,
                error: "Failed to load security dashboard",
            }, 500);
        }
    }
}

export const securityDashboardController = new SecurityDashboardController();
