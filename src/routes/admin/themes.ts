import { Hono } from "hono";
import { join } from "@std/path";
import { env } from "../../config/env.ts";
import { notificationService } from "../../lib/email/index.ts";
import * as themeService from "../../services/themeService.ts";
import { themePreviewService } from "../../services/themePreviewService.ts";
import * as themeCustomizerService from "../../services/themeCustomizerService.ts";
import ThemeBrowserNexusPage from "../../admin/pages/ThemeBrowserNexus.tsx";
import ThemeSettingsNexusPage from "../../admin/pages/ThemeSettingsNexus.tsx";
import ThemePreviewNexusPage from "../../admin/pages/ThemePreviewNexus.tsx";
import ThemeCustomizerNexusPage from "../../admin/pages/ThemeCustomizerNexus.tsx";
import ThemeEditorNexusPage from "../../admin/pages/ThemeEditorNexus.tsx";
import {
    parseBooleanField,
    parseNullableField,
    parseStringField,
} from "./helpers.ts";

export const themesRouter = new Hono();

/**
 * GET /appearance/themes - Redirect to browser
 */
themesRouter.get("/appearance/themes", async (c) => {
    return c.redirect(`${env.ADMIN_PATH}/appearance/themes/browser`);
});

/**
 * GET /appearance/themes/browser - Themes browser/selector
 */
themesRouter.get("/appearance/themes/browser", async (c) => {
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

        const activeTheme = await themeService.getActiveTheme();
        const themeNames = await themeService.listAvailableThemes();

        const themes = await Promise.all(
            themeNames.map(async (name) => {
                const config = await themeService.loadThemeConfig(name);
                return {
                    name,
                    displayName: config?.displayName || config?.name || name,
                    version: config?.version,
                    description: config?.description,
                    author: config?.author
                        ? { name: config.author.name, url: config.author.url }
                        : undefined,
                    screenshots: config?.screenshots,
                    isActive: name === activeTheme,
                    parent: config?.parent,
                };
            }),
        );

        return c.html(ThemeBrowserNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            themes,
            activeTheme,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error rendering themes browser:", error);
        return c.text("Error al cargar los themes", 500);
    }
});

/**
 * GET /appearance/themes/settings - Active theme settings
 */
themesRouter.get("/appearance/themes/settings", async (c) => {
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

        const settingsSaved = c.req.query("saved") === "1";
        const activeTheme = await themeService.getActiveTheme();
        const activeConfig = await themeService.loadThemeConfig(activeTheme);

        if (!activeConfig) {
            return c.redirect(`${env.ADMIN_PATH}/appearance/themes/browser`);
        }

        // Preparar custom settings
        let customSettings: Array<{
            key: string;
            label: string;
            type: string;
            description?: string;
            options?: string[];
            group?: string;
            defaultValue?: unknown;
            value?: unknown;
        }> = [];

        if (activeConfig?.config?.custom) {
            const savedSettings = await themeService.getThemeCustomSettings(
                activeTheme,
            );
            customSettings = Object.entries(activeConfig.config.custom).map(
                ([key, definition]: [string, any]) => {
                    const type = definition.type || "text";
                    let value = savedSettings[key];
                    if (value === undefined) {
                        value = definition.default ?? null;
                    }
                    return {
                        key,
                        label: definition.label || key,
                        type,
                        description: definition.description,
                        options: Array.isArray(definition.options)
                            ? definition.options
                            : undefined,
                        group: definition.group,
                        defaultValue: definition.default,
                        value,
                    };
                },
            );
        }

        const theme = {
            name: activeTheme,
            displayName: activeConfig.displayName || activeConfig.name || activeTheme,
            version: activeConfig.version,
            description: activeConfig.description,
            author: activeConfig.author,
            screenshots: activeConfig.screenshots,
        };

        return c.html(ThemeSettingsNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            theme,
            customSettings,
            settingsSaved,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error rendering theme settings:", error);
        return c.text("Error al cargar la configuración", 500);
    }
});

/**
 * POST /appearance/themes/activate - Activate theme
 */
themesRouter.post("/appearance/themes/activate", async (c) => {
    try {
        const body = await c.req.parseBody();
        const theme = parseStringField(body.theme);
        if (!theme) {
            return c.text("Theme inválido", 400);
        }

        await themeService.activateTheme(theme);
        return c.redirect(`${env.ADMIN_PATH}/appearance/themes/browser`);
    } catch (error: any) {
        console.error("Error activating theme:", error);
        return c.text("Error al activar el theme", 500);
    }
});

/**
 * POST /appearance/themes/settings/save - Update theme settings
 */
themesRouter.post("/appearance/themes/settings/save", async (c) => {
    try {
        const body = await c.req.parseBody();
        const theme = parseStringField(body.theme) ||
            await themeService.getActiveTheme();

        const updates: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(body)) {
            if (key.startsWith("custom_")) {
                const settingKey = key.replace("custom_", "");

                if (Array.isArray(value)) {
                    const lastValue = value[value.length - 1];
                    if (lastValue === "true" || lastValue === "false") {
                        updates[settingKey] = lastValue === "true";
                    } else {
                        updates[settingKey] = lastValue;
                    }
                } else if (value === "true" || value === "false") {
                    updates[settingKey] = value === "true";
                } else {
                    updates[settingKey] = value;
                }
            }
        }

        await themeService.updateThemeCustomSettings(theme, updates);
        return c.redirect(`${env.ADMIN_PATH}/appearance/themes/settings?saved=1`);
    } catch (error: any) {
        console.error("Error updating theme settings:", error);
        return c.text("Error al guardar la configuración del theme", 500);
    }
});

/**
 * POST /appearance/themes/custom-settings - Update theme custom settings (legacy route)
 */
themesRouter.post("/appearance/themes/custom-settings", async (c) => {
    try {
        const body = await c.req.parseBody();
        const theme = parseStringField(body.theme) ||
            await themeService.getActiveTheme();

        const config = await themeService.loadThemeConfig(theme);
        const customDefinitions = config?.config?.custom || {};

        const updates: Record<string, unknown> = {};

        for (const [key, definition] of Object.entries(customDefinitions)) {
            const fieldName = `custom_${key}`;
            const type = (definition as any).type || "text";
            const value = (body as Record<string, unknown>)[fieldName];

            switch (type) {
                case "boolean":
                    updates[key] = parseBooleanField(value);
                    break;
                case "number":
                case "range": {
                    const numValue = parseNullableField(value);
                    updates[key] = numValue ? Number(numValue) : null;
                    break;
                }
                case "select":
                case "text":
                case "textarea":
                case "url":
                case "image":
                case "image_upload":
                case "color":
                    updates[key] = parseNullableField(value) ?? null;
                    break;
                default:
                    updates[key] = parseNullableField(value) ?? null;
                    break;
            }
        }

        await themeService.updateThemeCustomSettings(theme, updates);
        return c.redirect(`${env.ADMIN_PATH}/appearance/themes?saved=1`);
    } catch (error: any) {
        console.error("Error updating theme custom settings:", error);
        return c.text("Error al guardar la configuración del theme", 500);
    }
});

/**
 * GET /appearance/themes/preview - Theme preview page
 */
themesRouter.get("/appearance/themes/preview", async (c) => {
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

        const themeName = c.req.query("theme");

        if (!themeName) {
            return c.text("Theme no especificado", 400);
        }

        const config = await themeService.loadThemeConfig(themeName);
        if (!config) {
            return c.text("Theme no encontrado", 404);
        }

        // Crear sesión de preview
        const session = await themePreviewService.createPreviewSession(
            themeName,
            user.id,
        );

        return c.html(ThemePreviewNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            themeName,
            themeDisplayName: config.displayName || config.name,
            previewUrl: "/",
            previewToken: session.token,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading theme preview:", error);
        return c.text("Error al cargar la vista previa", 500);
    }
});

/**
 * GET /appearance/themes/customize - Theme customizer page
 */
themesRouter.get("/appearance/themes/customize", async (c) => {
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

        const themeName = c.req.query("theme") ||
            await themeService.getActiveTheme();

        const config = await themeService.loadThemeConfig(themeName);
        if (!config) {
            return c.text("Theme no encontrado", 404);
        }

        // Crear sesión de customizer
        const session = await themeCustomizerService.createSession(
            user.id,
            themeName,
        );

        // Preparar custom settings
        const savedSettings = await themeService.getThemeCustomSettings(themeName);
        const customSettings = Object.entries(config.config?.custom || {}).map(
            ([key, definition]) => {
                const typed = definition as any;
                return {
                    key,
                    label: typed.label || key,
                    type: typed.type || "text",
                    description: typed.description,
                    options: typed.options,
                    group: typed.group || "general",
                    defaultValue: typed.default,
                    value: savedSettings[key] !== undefined
                        ? savedSettings[key]
                        : typed.default,
                    min: typed.min,
                    max: typed.max,
                    step: typed.step,
                };
            },
        );

        return c.html(ThemeCustomizerNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            themeName,
            themeDisplayName: config.displayName || config.name,
            customSettings,
            sessionId: session.id,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading theme customizer:", error);
        return c.text("Error al cargar el personalizador", 500);
    }
});

/**
 * GET /appearance/themes/editor - Theme code editor page
 */
themesRouter.get("/appearance/themes/editor", async (c) => {
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

        const themeName = c.req.query("theme") ||
            await themeService.getActiveTheme();
        const filePath = c.req.query("file");

        // Build file tree
        const themeDir = join(Deno.cwd(), "src", "themes", themeName);

        async function buildFileTree(
            dirPath: string,
            relativePath = "",
        ): Promise<any[]> {
            const files: any[] = [];

            try {
                for await (const entry of Deno.readDir(dirPath)) {
                    const entryPath = join(dirPath, entry.name);
                    const relPath = relativePath
                        ? `${relativePath}/${entry.name}`
                        : entry.name;

                    if (entry.isDirectory) {
                        const children = await buildFileTree(entryPath, relPath);
                        files.push({
                            name: entry.name,
                            path: relPath,
                            type: "directory",
                            children,
                        });
                    } else if (entry.isFile) {
                        const ext = entry.name.split(".").pop();
                        files.push({
                            name: entry.name.replace(`.${ext}`, ""),
                            path: relPath,
                            type: "file",
                            extension: ext,
                        });
                    }
                }
            } catch (error) {
                console.error(`Error reading directory ${dirPath}:`, error);
            }

            return files.sort((a, b) => {
                if (a.type === "directory" && b.type === "file") return -1;
                if (a.type === "file" && b.type === "directory") return 1;
                return a.name.localeCompare(b.name);
            });
        }

        const fileTree = await buildFileTree(themeDir);

        // Load file content if requested
        let currentContent;
        let error;

        if (filePath) {
            try {
                const fullPath = join(themeDir, filePath);
                // Security: ensure the path is within the theme directory
                if (!fullPath.startsWith(themeDir)) {
                    throw new Error("Invalid file path");
                }
                currentContent = await Deno.readTextFile(fullPath);
            } catch (err) {
                console.error("Error loading file:", err);
                error = `No se pudo cargar el archivo: ${err.message}`;
            }
        }

        return c.html(ThemeEditorNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            themeName,
            fileTree,
            currentFile: filePath,
            currentContent,
            error,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading theme editor:", error);
        return c.text("Error al cargar el editor", 500);
    }
});

/**
 * POST /api/admin/themes/editor/save - Save theme file
 */
themesRouter.post("/api/admin/themes/editor/save", async (c) => {
    try {
        const body = await c.req.parseBody();
        const themeName = parseStringField(body.theme);
        const filePath = parseStringField(body.file);
        const content = String(body.content || "");

        if (!themeName || !filePath) {
            return c.text("Parámetros inválidos", 400);
        }

        const themeDir = join(Deno.cwd(), "src", "themes", themeName);
        const fullPath = join(themeDir, filePath);

        // Security: ensure the path is within the theme directory
        if (!fullPath.startsWith(themeDir)) {
            return c.text("Ruta de archivo inválida", 400);
        }

        await Deno.writeTextFile(fullPath, content);

        // Invalidate theme cache
        themeService.invalidateThemeCache(themeName);

        return c.redirect(
            `${env.ADMIN_PATH}/appearance/themes/editor?theme=${themeName}&file=${encodeURIComponent(filePath)
            }&saved=1`,
        );
    } catch (error: any) {
        console.error("Error saving theme file:", error);
        return c.text("Error al guardar el archivo", 500);
    }
});

/**
 * POST /api/admin/themes/cache/warmup - Warmup theme cache
 */
themesRouter.post("/api/admin/themes/cache/warmup", async (c) => {
    try {
        const body = await c.req.json();
        const themeName = body?.theme;

        await themeService.warmupCache(themeName);
        return c.json({ success: true, message: "Cache warmed up successfully" });
    } catch (error: any) {
        console.error("Error warming up cache:", error);
        return c.json({ error: "Failed to warmup cache" }, 500);
    }
});

/**
 * GET /api/admin/themes/config/export - Export theme configuration
 */
themesRouter.get("/api/admin/themes/config/export", async (c) => {
    try {
        const themeName = c.req.query("theme");
        const includeMenus = c.req.query("includeMenus") === "true";

        const { exportThemeConfig, formatExport, generateExportFilename } =
            await import(
                "../../services/themeConfigService.ts"
            );

        const activeTheme = themeName || await themeService.getActiveTheme();
        const exportData = await exportThemeConfig(activeTheme, {
            includeMenus,
            metadata: { exportedBy: "LexCMS Admin" },
        });

        const jsonContent = formatExport(exportData, true);
        const filename = generateExportFilename(activeTheme);

        // Set headers for download
        c.header("Content-Type", "application/json");
        c.header("Content-Disposition", `attachment; filename="${filename}"`);

        return c.body(jsonContent);
    } catch (error: any) {
        console.error("Error exporting theme config:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/config/import - Import theme configuration
 */
themesRouter.post("/api/admin/themes/config/import", async (c) => {
    try {
        const body = await c.req.json();
        const { config, options } = body;

        if (!config) {
            return c.json({ error: "Configuration data is required" }, 400);
        }

        const { importThemeConfig, validateThemeConfigExport } = await import(
            "../../services/themeConfigService.ts"
        );

        // Validate first
        const validation = await validateThemeConfigExport(config);
        if (!validation.valid) {
            return c.json({
                error: "Invalid configuration",
                errors: validation.errors,
                warnings: validation.warnings,
            }, 400);
        }

        // Import
        const result = await importThemeConfig(config, options);

        return c.json(result);
    } catch (error: any) {
        console.error("Error importing theme config:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/config/validate - Validate theme configuration
 */
themesRouter.post("/api/admin/themes/config/validate", async (c) => {
    try {
        const body = await c.req.json();
        const { config } = body;

        if (!config) {
            return c.json({ error: "Configuration data is required" }, 400);
        }

        const { validateThemeConfigExport } = await import(
            "../../services/themeConfigService.ts"
        );

        const validation = await validateThemeConfigExport(config);

        return c.json(validation);
    } catch (error: any) {
        console.error("Error validating theme config:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Theme Preview API Endpoints
 */

/**
 * POST /api/admin/themes/preview/create - Create preview session
 */
themesRouter.post("/api/admin/themes/preview/create", async (c) => {
    try {
        const body = await c.req.json();
        const { theme } = body;

        if (!theme) {
            return c.json({ error: "Theme name is required" }, 400);
        }

        // Get current user from session
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const session = await themePreviewService.createPreviewSession(
            theme,
            user.id,
        );

        // Generate preview URL
        const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
        const previewUrl =
            `${baseUrl}/?theme_preview=1&preview_token=${session.token}`;

        return c.json({
            success: true,
            session: {
                token: session.token,
                theme: session.theme,
                expiresAt: session.expiresAt,
            },
            previewUrl,
        });
    } catch (error: any) {
        console.error("Error creating preview session:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/preview/activate - Activate previewed theme
 */
themesRouter.post("/api/admin/themes/preview/activate", async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;

        if (!token) {
            return c.json({ error: "Preview token is required" }, 400);
        }

        const session = await themePreviewService.verifyPreviewToken(token);

        if (!session) {
            return c.json({ error: "Invalid or expired preview token" }, 400);
        }

        // Activate the theme
        await themeService.activateTheme(session.theme);

        // End the preview session
        await themePreviewService.endPreviewSession(token);

        return c.json({
            success: true,
            theme: session.theme,
            message: "Theme activated successfully",
        });
    } catch (error: any) {
        console.error("Error activating preview theme:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * DELETE /api/admin/themes/preview/:token - End preview session
 */
themesRouter.delete("/api/admin/themes/preview/:token", async (c) => {
    try {
        const token = c.req.param("token");

        await themePreviewService.endPreviewSession(token);

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error ending preview session:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Theme Customizer API Endpoints
 */

/**
 * POST /api/admin/themes/customizer/session - Create customizer session
 */
themesRouter.post("/api/admin/themes/customizer/session", async (c) => {
    try {
        const body = await c.req.json();
        const { theme } = body;

        if (!theme) {
            return c.json({ error: "Theme name is required" }, 400);
        }

        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const session = await themeCustomizerService.createSession(user.id, theme);

        // Check for existing draft
        const draft = await themeCustomizerService.loadDraft(user.id, theme);

        return c.json({
            success: true,
            sessionId: session.id,
            hasDraft: draft !== null,
            draftChanges: draft?.length || 0,
        });
    } catch (error: any) {
        console.error("Error creating customizer session:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * GET /api/admin/themes/customizer/state/:sessionId - Get customizer state
 */
themesRouter.get(
    "/api/admin/themes/customizer/state/:sessionId",
    async (c) => {
        try {
            const sessionId = c.req.param("sessionId");

            const state = await themeCustomizerService.getState(sessionId);

            return c.json(state);
        } catch (error: any) {
            console.error("Error getting customizer state:", error);
            return c.json({ error: error.message }, 500);
        }
    },
);

/**
 * POST /api/admin/themes/customizer/change - Apply a change
 */
themesRouter.post("/api/admin/themes/customizer/change", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId, settingKey, value, description } = body;

        if (!sessionId || !settingKey) {
            return c.json({ error: "sessionId and settingKey are required" }, 400);
        }

        const state = await themeCustomizerService.applyChange(
            sessionId,
            settingKey,
            value,
            description,
        );

        return c.json({ success: true, state });
    } catch (error: any) {
        console.error("Error applying change:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/customizer/undo - Undo last change
 */
themesRouter.post("/api/admin/themes/customizer/undo", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return c.json({ error: "sessionId is required" }, 400);
        }

        const state = await themeCustomizerService.undo(sessionId);

        return c.json({ success: true, state });
    } catch (error: any) {
        console.error("Error undoing change:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/customizer/redo - Redo last undone change
 */
themesRouter.post("/api/admin/themes/customizer/redo", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return c.json({ error: "sessionId is required" }, 400);
        }

        const state = await themeCustomizerService.redo(sessionId);

        return c.json({ success: true, state });
    } catch (error: any) {
        console.error("Error redoing change:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/customizer/reset - Reset all changes
 */
themesRouter.post("/api/admin/themes/customizer/reset", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return c.json({ error: "sessionId is required" }, 400);
        }

        const state = await themeCustomizerService.reset(sessionId);

        return c.json({ success: true, state });
    } catch (error: any) {
        console.error("Error resetting changes:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/customizer/save-draft - Save as draft
 */
themesRouter.post("/api/admin/themes/customizer/save-draft", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return c.json({ error: "sessionId is required" }, 400);
        }

        await themeCustomizerService.saveDraft(sessionId);

        return c.json({ success: true, message: "Draft saved successfully" });
    } catch (error: any) {
        console.error("Error saving draft:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * POST /api/admin/themes/customizer/publish - Publish changes
 */
themesRouter.post("/api/admin/themes/customizer/publish", async (c) => {
    try {
        const body = await c.req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return c.json({ error: "sessionId is required" }, 400);
        }

        await themeCustomizerService.publish(sessionId);

        return c.json({ success: true, message: "Changes published successfully" });
    } catch (error: any) {
        console.error("Error publishing changes:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * GET /api/admin/themes/customizer/history/:sessionId - Get change history
 */
themesRouter.get(
    "/api/admin/themes/customizer/history/:sessionId",
    async (c) => {
        try {
            const sessionId = c.req.param("sessionId");

            const history = themeCustomizerService.getHistory(sessionId);

            return c.json({ history });
        } catch (error: any) {
            console.error("Error getting history:", error);
            return c.json({ error: error.message }, 500);
        }
    },
);

/**
 * DELETE /api/admin/themes/customizer/session/:sessionId - End session
 */
themesRouter.delete(
    "/api/admin/themes/customizer/session/:sessionId",
    async (c) => {
        try {
            const sessionId = c.req.param("sessionId");

            await themeCustomizerService.endSession(sessionId);

            return c.json({ success: true });
        } catch (error: any) {
            console.error("Error ending session:", error);
            return c.json({ error: error.message }, 500);
        }
    },
);

/**
 * GET /api/admin/themes/cache/stats - Get cache statistics
 */
themesRouter.get("/api/admin/themes/cache/stats", async (c) => {
    try {
        const stats = themeService.getCacheStats();
        return c.json(stats);
    } catch (error: any) {
        console.error("Error getting cache stats:", error);
        return c.json({ error: "Failed to get cache stats" }, 500);
    }
});

/**
 * POST /api/admin/themes/cache/clear - Clear theme cache
 */
themesRouter.post("/api/admin/themes/cache/clear", async (c) => {
    try {
        const body = await c.req.json();
        const themeName = body?.theme;

        if (themeName) {
            themeService.invalidateThemeCache(themeName);
            return c.json({
                success: true,
                message: `Cache cleared for theme: ${themeName}`,
            });
        } else {
            themeService.invalidateAllCache();
            return c.json({ success: true, message: "All cache cleared" });
        }
    } catch (error: any) {
        console.error("Error clearing cache:", error);
        return c.json({ error: "Failed to clear cache" }, 500);
    }
});
