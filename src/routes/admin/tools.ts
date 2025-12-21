import { Hono } from "hono";
import { notificationService } from "../../lib/email/index.ts";
import { backupManager } from "../../lib/backup/index.ts";
import { systemUpdatesService } from "../../lib/system-updates/service.ts";
import {
    getUpdateConfig,
    SYSTEM_VERSION,
} from "../../lib/system-updates/config.ts";
import { env } from "../../config/env.ts";
import BackupsNexusPage from "../../admin/pages/system/BackupsNexus.tsx";
import SystemUpdatesNexusPage from "../../admin/pages/system/SystemUpdatesNexus.tsx";
import AutoModerationNexusPage from "../../admin/pages/moderation/AutoModerationNexus.tsx";
import { normalizeNotifications, type NormalizedNotification } from "./helpers.ts";

export const toolsRouter = new Hono();

const normalizeUser = (user: any) => ({
    id: user.userId ?? user.id,
    name: (user.name as string | null) || user.email,
    email: user.email,
});

/**
 * Auto-Moderation Management
 */
toolsRouter.get("/auto-moderation", async (c) => {
    try {
        const user = c.get("user");

        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        const { getAutoModeration } = await import(
            "../../plugins/auto-moderation/index.ts"
        );
        const plugin = getAutoModeration();

        if (!plugin) {
            return c.text("Auto-moderation plugin not initialized", 500);
        }

        const config = plugin.getConfig();
        const stats = plugin.getStats();

        // Verify Akismet if configured
        let akismetVerified: boolean | undefined = undefined;
        if (config.services.akismet) {
            try {
                akismetVerified = await plugin.verifyAkismetKey();
            } catch (error) {
                console.error("Error verifying Akismet:", error);
                akismetVerified = false;
            }
        }

        return c.html(
            AutoModerationNexusPage({
                user: normalizeUser(user),
                config: {
                    enabled: config.enabled,
                    strategy: config.strategy,
                    hasAkismet: !!config.services.akismet,
                    akismetVerified,
                    threshold: config.localDetector.threshold,
                    autoApprove: config.actions.autoApprove,
                    autoApproveThreshold: config.actions.autoApproveThreshold,
                    autoMarkSpam: config.actions.autoMarkSpam,
                    autoMarkSpamThreshold: config.actions.autoMarkSpamThreshold,
                    learningEnabled: config.learning.enabled,
                    sendFeedback: config.learning.sendFeedback,
                },
                stats,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading auto-moderation page:", error);
        return c.text("Error al cargar página de auto-moderación", 500);
    }
});

toolsRouter.post("/auto-moderation/update", async (c) => {
    try {
        const formData = await c.req.formData();
        const { getAutoModeration } = await import(
            "../../plugins/auto-moderation/index.ts"
        );
        const plugin = getAutoModeration();

        if (!plugin) {
            return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
        }

        // Parse form data
        const newConfig: any = {
            enabled: formData.get("enabled") === "on",
            strategy: formData.get("strategy") as any,
        };

        const threshold = formData.get("threshold");
        if (threshold) {
            newConfig.localDetector = {
                threshold: parseInt(threshold as string),
            };
        }

        newConfig.actions = {
            autoApprove: formData.get("autoApprove") === "on",
            autoApproveThreshold: parseInt(
                (formData.get("autoApproveThreshold") as string) || "20",
            ),
            autoMarkSpam: formData.get("autoMarkSpam") === "on",
            autoMarkSpamThreshold: parseInt(
                (formData.get("autoMarkSpamThreshold") as string) || "80",
            ),
            sendToModeration: true,
        };

        newConfig.learning = {
            enabled: formData.get("learningEnabled") === "on",
            sendFeedback: formData.get("sendFeedback") === "on",
            updateBlacklist: true,
            updateWhitelist: true,
        };

        // Update configuration
        plugin.updateConfig(newConfig);

        return c.redirect(`${env.ADMIN_PATH}/auto-moderation`);
    } catch (error: any) {
        console.error("Error updating auto-moderation config:", error);
        return c.json({ error: error.message }, 500);
    }
});

toolsRouter.post("/auto-moderation/verify-akismet", async (c) => {
    try {
        const { getAutoModeration } = await import(
            "../../plugins/auto-moderation/index.ts"
        );
        const plugin = getAutoModeration();

        if (!plugin) {
            return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
        }

        const verified = await plugin.verifyAkismetKey();
        return c.json({ verified });
    } catch (error: any) {
        console.error("Error verifying Akismet:", error);
        return c.json({ error: error.message, verified: false }, 500);
    }
});

toolsRouter.post("/auto-moderation/reset-stats", async (c) => {
    try {
        const { getAutoModeration } = await import(
            "../../plugins/auto-moderation/index.ts"
        );
        const plugin = getAutoModeration();

        if (!plugin) {
            return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
        }

        plugin.resetStats();
        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error resetting stats:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Backups Management
 */
toolsRouter.get("/backups", async (c) => {
    try {
        const user = c.get("user");

        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        const [backups, stats] = await Promise.all([
            backupManager.getBackups({ limit: 100 }),
            backupManager.getStats(),
        ]);

        return c.html(
            BackupsNexusPage({
                user: normalizeUser(user),
                backups: backups as any[],
                stats: stats as any,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading backups page:", error);
        return c.text("Error al cargar página de backups", 500);
    }
});

toolsRouter.post("/api/backups", async (c) => {
    try {
        const user = c.get("user");
        const body = await c.req.json();

        const backupId = await backupManager.createBackup(
            {
                type: body.type || "full",
                includeMedia: body.includeMedia ?? true,
                includeDatabase: body.includeDatabase ?? true,
                includeConfig: body.includeConfig ?? true,
                compression: body.compression ?? true,
                notifyUser: true,
            },
            user.userId,
        );

        return c.json({ success: true, backupId });
    } catch (error: any) {
        console.error("Error creating backup:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

toolsRouter.delete("/api/backups/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));

        if (isNaN(id)) {
            return c.json({ success: false, error: "Invalid backup ID" }, 400);
        }

        await backupManager.deleteBackup(id);

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting backup:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

toolsRouter.get("/api/backups/:id/download", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));

        if (isNaN(id)) {
            return c.text("Invalid backup ID", 400);
        }

        const backup = await backupManager.getBackupById(id);

        if (!backup) {
            return c.text("Backup not found", 404);
        }

        if (backup.status !== "completed") {
            return c.text("Backup is not completed yet", 400);
        }

        // Read file and send it
        const file = await Deno.readFile(backup.storagePath);

        c.header("Content-Type", "application/gzip");
        c.header(
            "Content-Disposition",
            `attachment; filename="${backup.filename}"`,
        );
        c.header("Content-Length", file.length.toString());

        return c.body(file);
    } catch (error: any) {
        console.error("Error downloading backup:", error);
        return c.text("Error downloading backup: " + error.message, 500);
    }
});

/**
 * System Updates Management
 */
toolsRouter.get("/system-updates", async (c) => {
    try {
        const user = c.get("user");

        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        // Check for updates
        const checkResult = await systemUpdatesService.checkForUpdates();
        const updates = checkResult.updates?.map((u) => ({
            ...u,
            releaseDate: new Date(u.releaseDate ?? Date.now()),
        }));
        const news = checkResult.news?.map((item) => ({
            ...item,
            publishDate: new Date(item.publishDate ?? Date.now()),
        }));

        // Get configuration
        const config = getUpdateConfig();

        return c.html(
            SystemUpdatesNexusPage({
                user: normalizeUser(user),
                currentVersion: SYSTEM_VERSION,
                latestVersion: checkResult.latestVersion,
                updates,
                news,
                config,
                lastChecked: checkResult.lastChecked,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading system updates page:", error);
        return c.text("Error al cargar página de actualizaciones", 500);
    }
});
