/**
 * Security Admin Routes
 * API routes for security management panel
 */

import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.ts";
import { requirePermission } from "../../middleware/permission.ts";
import { securityDashboardController } from "../../controllers/admin/securityDashboardController.ts";
import { ipManagementController } from "../../controllers/admin/ipManagementController.ts";
import { securityLogsController } from "../../controllers/admin/securityLogsController.ts";
import { rateLimitController } from "../../controllers/admin/rateLimitController.ts";
import { securityRulesController } from "../../controllers/admin/securityRulesController.ts";
import { securitySettingsController } from "../../controllers/admin/securitySettingsController.ts";

const securityRoutes = new Hono();

// Apply authentication and permission middleware to all routes
securityRoutes.use("*", authMiddleware);
securityRoutes.use("*", requirePermission("security", "view"));

// Dashboard
securityRoutes.get("/dashboard", (c) => securityDashboardController.getDashboard(c));

// IP Management
securityRoutes.get("/ips", (c) => ipManagementController.getAll(c));
securityRoutes.get("/ips/blacklist", (c) => ipManagementController.getBlacklist(c));
securityRoutes.get("/ips/whitelist", (c) => ipManagementController.getWhitelist(c));
securityRoutes.get("/ips/stats", (c) => ipManagementController.getStats(c));
securityRoutes.post("/ips", requirePermission("security", "manage_ips"), (c) =>
    ipManagementController.add(c)
);
securityRoutes.put("/ips/:id", requirePermission("security", "manage_ips"), (c) =>
    ipManagementController.update(c)
);
securityRoutes.delete("/ips/:id", requirePermission("security", "manage_ips"), (c) =>
    ipManagementController.remove(c)
);

// Security Logs
securityRoutes.get("/logs", (c) => securityLogsController.getLogs(c));
securityRoutes.get("/logs/stats", (c) => securityLogsController.getStats(c));
securityRoutes.get("/logs/export", (c) => securityLogsController.export(c));

// Rate Limiting
securityRoutes.get("/rate-limit/rules", (c) => rateLimitController.getRules(c));
securityRoutes.get("/rate-limit/stats", (c) => rateLimitController.getStats(c));
securityRoutes.post("/rate-limit/rules", requirePermission("security", "manage_rules"), (c) =>
    rateLimitController.createRule(c)
);
securityRoutes.put("/rate-limit/rules/:id", requirePermission("security", "manage_rules"), (c) =>
    rateLimitController.updateRule(c)
);
securityRoutes.delete("/rate-limit/rules/:id", requirePermission("security", "manage_rules"), (c) =>
    rateLimitController.deleteRule(c)
);

// Security Rules
securityRoutes.get("/rules", (c) => securityRulesController.getRules(c));
securityRoutes.get("/rules/stats", (c) => securityRulesController.getStats(c));
securityRoutes.post("/rules", requirePermission("security", "manage_rules"), (c) =>
    securityRulesController.createRule(c)
);
securityRoutes.put("/rules/:id", requirePermission("security", "manage_rules"), (c) =>
    securityRulesController.updateRule(c)
);
securityRoutes.delete("/rules/:id", requirePermission("security", "manage_rules"), (c) =>
    securityRulesController.deleteRule(c)
);
securityRoutes.post("/rules/test", requirePermission("security", "manage_rules"), (c) =>
    securityRulesController.testRule(c)
);

// Security Settings
securityRoutes.get("/settings", (c) => securitySettingsController.getSettings(c));
securityRoutes.post("/settings", requirePermission("security", "manage_settings"), (c) =>
    securitySettingsController.updateSetting(c)
);

export { securityRoutes };
