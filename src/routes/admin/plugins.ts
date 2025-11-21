import { Hono } from "hono";
import { env } from "../../config/env.ts";
import { notificationService } from "../../lib/email/index.ts";
import { pluginService } from "../../services/pluginService.ts";
import PluginsInstalledNexusPage from "../../admin/pages/PluginsInstalledNexus.tsx";
import PluginsAvailableNexusPage from "../../admin/pages/PluginsAvailableNexus.tsx";
import PluginsMarketplaceNexusPage from "../../admin/pages/PluginsMarketplaceNexus.tsx";

export const pluginsRouter = new Hono();

/**
 * GET /plugins - Redirect to installed plugins
 */
pluginsRouter.get("/plugins", async (c) => {
    return c.redirect("/admincp/plugins/installed");
});

/**
 * GET /plugins/installed - Installed plugins page
 */
pluginsRouter.get("/plugins/installed", async (c) => {
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

        const [installedPlugins, stats] = await Promise.all([
            pluginService.getAllPlugins(),
            pluginService.getPluginStats(),
        ]);

        // Map installed plugins to the format expected by the page
        const formattedInstalledPlugins = installedPlugins.map((plugin) => ({
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            displayName: plugin.name,
            description: undefined,
            author: undefined,
            category: undefined,
            status: plugin.isActive ? "active" : "inactive",
            isInstalled: true,
        }));

        // Load plugin details for installed plugins
        const detailedPlugins = await Promise.all(
            formattedInstalledPlugins.map(async (plugin) => {
                try {
                    const details = await pluginService.getPluginDetails(plugin.name);
                    if (details && details.manifest) {
                        return {
                            ...plugin,
                            displayName: details.manifest.displayName || plugin.name,
                            description: details.manifest.description,
                            author: details.manifest.author,
                            category: details.manifest.category,
                        };
                    }
                } catch (error) {
                    console.error(`Error loading details for ${plugin.name}:`, error);
                }
                return plugin;
            }),
        );

        return c.html(
            PluginsInstalledNexusPage({
                user: {
                    id: user.userId,
                    name: user.name || user.email,
                    email: user.email,
                },
                plugins: detailedPlugins as any[],
                stats,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading installed plugins page:", error);
        return c.text("Error al cargar plugins instalados", 500);
    }
});

/**
 * GET /plugins/available - Available plugins page
 */
pluginsRouter.get("/plugins/available", async (c) => {
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

        const [availablePlugins, stats] = await Promise.all([
            pluginService.getAvailablePlugins(),
            pluginService.getPluginStats(),
        ]);

        // Load manifests for available plugins
        const pluginsWithManifest = await Promise.all(
            availablePlugins.map(async (pluginName) => {
                try {
                    const manifest = await pluginService.getPluginManifest(pluginName);
                    return {
                        name: pluginName,
                        displayName: manifest.displayName,
                        description: manifest.description,
                        version: manifest.version,
                        author: manifest.author,
                        category: manifest.category,
                        tags: manifest.tags,
                    };
                } catch (error) {
                    console.error(`Error loading manifest for ${pluginName}:`, error);
                    return {
                        name: pluginName,
                        displayName: pluginName,
                        description: "Error loading plugin information",
                        version: "unknown",
                        author: "unknown",
                        category: undefined,
                        tags: [],
                    };
                }
            }),
        );

        return c.html(
            PluginsAvailableNexusPage({
                user: {
                    id: user.userId,
                    name: user.name || user.email,
                    email: user.email,
                },
                plugins: pluginsWithManifest as any[],
                stats,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading available plugins page:", error);
        return c.text("Error al cargar plugins disponibles", 500);
    }
});

/**
 * GET /plugins/marketplace - Marketplace plugins page
 */
pluginsRouter.get("/plugins/marketplace", async (c) => {
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

        // Load marketplace plugins from JSON file
        const marketplaceData = await Deno.readTextFile(
            "./src/data/marketplace-plugins.json",
        );
        const marketplacePlugins = JSON.parse(marketplaceData);

        // Get installed plugin names
        const installedPlugins = await pluginService.getAllPlugins();
        const installedPluginNames = installedPlugins.map((p) => p.name);

        // Get stats
        const stats = await pluginService.getPluginStats();

        // Extract unique categories
        const categories = [
            ...new Set(marketplacePlugins.map((p: any) => p.category)),
        ].sort();

        return c.html(
            PluginsMarketplaceNexusPage({
                user: {
                    id: user.userId,
                    name: user.name || user.email,
                    email: user.email,
                },
                plugins: marketplacePlugins,
                stats,
                categories,
                installedPluginNames,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading marketplace page:", error);
        return c.text("Error al cargar marketplace", 500);
    }
});

/**
 * GET /plugins/:pluginName/:panelPath* - Dynamic plugin admin panel routes
 */
pluginsRouter.get("/plugins/:pluginName/*", async (c) => {
    try {
        const user = c.get("user");
        const pluginName = c.req.param("pluginName");
        const fullPath = c.req.path;

        // Import AdminPanelRegistry
        const { AdminPanelRegistry } = await import(
            "../../lib/plugin-system/index.ts"
        );
        const { pluginLoader } = await import(
            "../../lib/plugin-system/PluginLoader.ts"
        );

        // Find the panel by matching the full path
        const panel = AdminPanelRegistry.getPanelByPath(fullPath);

        if (!panel) {
            return c.text(`Panel no encontrado: ${fullPath}`, 404);
        }

        // Check if plugin is active
        const plugin = pluginLoader.getPlugin(pluginName);
        if (!plugin || plugin.status !== "active") {
            return c.text(`El plugin "${pluginName}" no está activo`, 403);
        }

        // Check user permissions if required
        if (panel.requiredPermissions && panel.requiredPermissions.length > 0) {
            // TODO: Implement permission checking
            // For now, we'll allow all authenticated users
        }

        // Prepare context for the panel component
        const context = {
            user: {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                role: user.role || "admin",
            },
            query: c.req.query(),
            pluginAPI: plugin.instance,
            settings: plugin.settings || {},
            request: c.req,
            pluginPanels: AdminPanelRegistry.getAllPanels(),
        };

        // Render the panel component
        const content = await panel.component(context);

        return c.html(content);
    } catch (error: any) {
        console.error("Error rendering plugin panel:", error);
        return c.text(`Error al cargar el panel: ${error.message}`, 500);
    }
});
