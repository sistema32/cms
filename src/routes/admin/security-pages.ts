import { Hono } from "hono";
import { notificationService } from "../../lib/email/index.ts";
import SecurityDashboard from "../../admin/pages/security/SecurityDashboard.tsx";
import SecurityLogs from "../../admin/pages/security/SecurityLogs.tsx";
import IPBlacklist from "../../admin/pages/security/IPBlacklist.tsx";
import IPWhitelist from "../../admin/pages/security/IPWhitelist.tsx";
import RateLimitConfig from "../../admin/pages/security/RateLimitConfig.tsx";
import SecurityRules from "../../admin/pages/security/SecurityRules.tsx";
import SecuritySettings from "../../admin/pages/security/SecuritySettings.tsx";
import SecurityReportsPage from "../../admin/pages/security/SecurityReports.tsx";

export const securityPagesRouter = new Hono();

// Security Dashboard
securityPagesRouter.get("/security/dashboard", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(SecurityDashboard({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading security dashboard:", error);
        return c.text("Error al cargar dashboard de seguridad", 500);
    }
});

// Security Logs
securityPagesRouter.get("/security/logs", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(SecurityLogs({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading security logs:", error);
        return c.text("Error al cargar logs de seguridad", 500);
    }
});

// IP Blacklist
securityPagesRouter.get("/security/ips/blacklist", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(IPBlacklist({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading IP blacklist:", error);
        return c.text("Error al cargar blacklist de IPs", 500);
    }
});

// IP Whitelist
securityPagesRouter.get("/security/ips/whitelist", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(IPWhitelist({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading IP whitelist:", error);
        return c.text("Error al cargar whitelist de IPs", 500);
    }
});

// Rate Limit Configuration
securityPagesRouter.get("/security/rate-limit", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(RateLimitConfig({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading rate limit config:", error);
        return c.text("Error al cargar configuración de rate limit", 500);
    }
});

// Security Rules
securityPagesRouter.get("/security/rules", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(SecurityRules({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading security rules:", error);
        return c.text("Error al cargar reglas de seguridad", 500);
    }
});

// Security Settings
securityPagesRouter.get("/security/settings", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(SecuritySettings({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading security settings:", error);
        return c.text("Error al cargar configuración de seguridad", 500);
    }
});

// Security Reports
securityPagesRouter.get("/security/reports", async (c) => {
    try {
        const user = c.get("user");

        let notifications: any[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(SecurityReportsPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading security reports:", error);
        return c.text("Error al cargar reportes de seguridad", 500);
    }
});
