import { Context } from "hono";
import { join } from "@std/path";
import { env } from "@/config/env.ts";
import * as themeService from "@/services/themes/themeService.ts";
import { themePreviewService } from "@/services/themes/themePreviewService.ts";
import { themeCustomizerService } from "@/services/themes/themeCustomizerService.ts";
import * as settingsService from "@/services/system/settingsService.ts";
import { notificationService } from "@/lib/email/index.ts";
import { normalizeNotifications, type NormalizedNotification } from "../../routes/admin/helpers.ts";
import { parseStringField, parseBooleanField, parseNullableField } from "../../routes/admin/helpers.ts";
import { successResponse, errorResponse } from "../../utils/index.ts";
import ThemeBrowserNexusPage from "@/admin/pages/themes/ThemeBrowserNexus.tsx";
import ThemeSettingsNexusPage from "@/admin/pages/themes/ThemeSettingsNexus.tsx";
import ThemePreviewNexusPage from "@/admin/pages/themes/ThemePreviewNexus.tsx";
import ThemeCustomizerNexusPage from "@/admin/pages/themes/ThemeCustomizerNexus.tsx";
import ThemeEditorNexusPage from "@/admin/pages/themes/ThemeEditorNexus.tsx";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("themeController");

// Helper for notifications (could be moved to a shared base controller)
const getCommonData = async (user: any) => {
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
        log.error("Error loading notifications", error instanceof Error ? error : undefined);
    }

    return { notifications, unreadNotificationCount };
};

const normalizeUser = (user: any) => ({
    id: user.userId,
    name: (user.name as string | null) || user.email,
    email: user.email,
});

const getUserId = (user: any): number => Number(user?.userId ?? user?.id ?? 0);

export class ThemeController {
    static async browser(c: Context) {
        try {
            const user = c.get("user");
            const { notifications, unreadNotificationCount } = await getCommonData(user);

            const activeTheme = await themeService.getActiveTheme();
            const themeNames = await themeService.listAvailableThemes();

            const themes = await Promise.all(
                themeNames.map(async (name: string) => {
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
                user: normalizeUser(user),
                themes,
                activeTheme,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error rendering themes browser", error instanceof Error ? error : undefined);
            return c.text("Error al cargar los themes", 500);
        }
    }

    static async settings(c: Context) {
        try {
            const user = c.get("user");
            const { notifications, unreadNotificationCount } = await getCommonData(user);

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
                const savedSettings = await settingsService.getThemeCustomSettings(
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
                user: normalizeUser(user),
                theme,
                customSettings,
                settingsSaved,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error rendering theme settings", error instanceof Error ? error : undefined);
            return c.text("Error al cargar la configuración", 500);
        }
    }

    static async activate(c: Context) {
        try {
            const body = await c.req.parseBody();
            const theme = parseStringField(body.theme);
            if (!theme) {
                return c.text("Theme inválido", 400);
            }

            await themeService.activateTheme(theme);
            return c.redirect(`${env.ADMIN_PATH}/appearance/themes/browser`);
        } catch (error: any) {
            log.error("Error activating theme", error instanceof Error ? error : undefined);
            return c.text("Error al activar el theme", 500);
        }
    }

    static async saveSettings(c: Context) {
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
            log.error("Error updating theme settings", error instanceof Error ? error : undefined);
            return c.text("Error al guardar la configuración del theme", 500);
        }
    }

    static async saveCustomSettings(c: Context) {
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
            log.error("Error updating theme custom settings", error instanceof Error ? error : undefined);
            return c.text("Error al guardar la configuración del theme", 500);
        }
    }

    static async preview(c: Context) {
        try {
            const user = c.get("user");
            const { notifications, unreadNotificationCount } = await getCommonData(user);

            const themeName = c.req.query("theme");

            if (!themeName) {
                return c.text("Theme no especificado", 400);
            }

            const config = await themeService.loadThemeConfig(themeName);
            if (!config) {
                return c.text("Theme no encontrado", 404);
            }

            // Crear sesión de preview
            const userId = getUserId(user);
            const session = await themePreviewService.createPreviewSession(
                themeName,
                userId,
            );

            return c.html(ThemePreviewNexusPage({
                user: normalizeUser(user),
                themeName,
                themeDisplayName: config.displayName || config.name,
                previewUrl: "/",
                previewToken: session.token,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error loading theme preview", error instanceof Error ? error : undefined);
            return c.text("Error al cargar la vista previa", 500);
        }
    }

    static async customizer(c: Context) {
        try {
            const user = c.get("user");
            const { notifications, unreadNotificationCount } = await getCommonData(user);

            const themeName = c.req.query("theme") ||
                await themeService.getActiveTheme();

            const config = await themeService.loadThemeConfig(themeName);
            if (!config) {
                return c.text("Theme no encontrado", 404);
            }

            // Crear sesión de customizer
            const userId = getUserId(user);
            const session = await themeCustomizerService.createSession(
                userId,
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
                user: normalizeUser(user),
                themeName,
                themeDisplayName: config.displayName || config.name,
                customSettings,
                sessionId: session.id,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error loading theme customizer", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el personalizador", 500);
        }
    }

    static async editor(c: Context) {
        try {
            const user = c.get("user");
            const { notifications, unreadNotificationCount } = await getCommonData(user);

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
                    log.error(`Error reading directory ${dirPath}`, error instanceof Error ? error : undefined);
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
                    log.error("Error loading file", err instanceof Error ? err : undefined);
                    const message = err instanceof Error ? err.message : String(err);
                    error = `No se pudo cargar el archivo: ${message}`;
                }
            }

            return c.html(ThemeEditorNexusPage({
                user: normalizeUser(user),
                themeName,
                fileTree,
                currentFile: filePath,
                currentContent,
                error,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error loading theme editor", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el editor", 500);
        }
    }

    static async saveEditorFile(c: Context) {
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
            log.error("Error saving theme file", error instanceof Error ? error : undefined);
            return c.text("Error al guardar el archivo", 500);
        }
    }

    // API Methods

    static async warmupCache(c: Context) {
        try {
            const body = await c.req.json();
            const themeName = body?.theme;

            await themeService.warmupCache(themeName);
            return successResponse(c, { message: "Cache warmed up successfully" });
        } catch (error: any) {
            log.error("Error warming up cache", error instanceof Error ? error : undefined);
            return errorResponse(c, "CACHE_WARMUP_FAILED", "Failed to warmup cache", 500);
        }
    }

    static async exportConfig(c: Context) {
        try {
            const themeName = c.req.query("theme");
            const includeMenus = c.req.query("includeMenus") === "true";

            const { exportThemeConfig, formatExport, generateExportFilename } =
                await import("@/services/themes/themeConfigService.ts");

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
            log.error("Error exporting theme config", error instanceof Error ? error : undefined);
            return errorResponse(c, "EXPORT_FAILED", error.message, 500);
        }
    }

    static async importConfig(c: Context) {
        try {
            const body = await c.req.json();
            const { config, options } = body;

            if (!config) {
                return errorResponse(c, "MISSING_CONFIG", "Configuration data is required", 400);
            }

            const { importThemeConfig, validateThemeConfigExport } = await import(
                "@/services/themes/themeConfigService.ts"
            );

            // Validate first
            const validation = await validateThemeConfigExport(config);
            if (!validation.valid) {
                return errorResponse(c, "INVALID_CONFIG", "Invalid configuration", 400, {
                    errors: validation.errors,
                    warnings: validation.warnings,
                });
            }

            // Import
            const result = await importThemeConfig(config, options);

            return successResponse(c, result);
        } catch (error: any) {
            log.error("Error importing theme config", error instanceof Error ? error : undefined);
            return errorResponse(c, "IMPORT_FAILED", error.message, 500);
        }
    }

    static async validateConfig(c: Context) {
        try {
            const body = await c.req.json();
            const { config } = body;

            if (!config) {
                return errorResponse(c, "MISSING_CONFIG", "Configuration data is required", 400);
            }

            const { validateThemeConfigExport } = await import(
                "@/services/themes/themeConfigService.ts"
            );

            const validation = await validateThemeConfigExport(config);

            return successResponse(c, validation);
        } catch (error: any) {
            log.error("Error validating theme config", error instanceof Error ? error : undefined);
            return errorResponse(c, "VALIDATION_FAILED", error.message, 500);
        }
    }

    static async createPreviewSession(c: Context) {
        try {
            const body = await c.req.json();
            const { theme } = body;

            if (!theme) {
                return errorResponse(c, "MISSING_THEME", "Theme name is required", 400);
            }

            // Get current user from session
            const user = c.get("user");
            if (!user) {
                return errorResponse(c, "UNAUTHORIZED", "Unauthorized", 401);
            }

            const userId = getUserId(user);
            const session = await themePreviewService.createPreviewSession(
                theme,
                userId,
            );

            // Generate preview URL
            const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
            const previewUrl =
                `${baseUrl}/?theme_preview=1&preview_token=${session.token}`;

            return successResponse(c, {
                session: {
                    token: session.token,
                    theme: session.theme,
                    expiresAt: session.expiresAt,
                },
                previewUrl,
            });
        } catch (error: any) {
            log.error("Error creating preview session", error instanceof Error ? error : undefined);
            return errorResponse(c, "PREVIEW_CREATION_FAILED", error.message, 500);
        }
    }

    static async activatePreviewTheme(c: Context) {
        try {
            const body = await c.req.json();
            const { token } = body;

            if (!token) {
                return errorResponse(c, "MISSING_TOKEN", "Preview token is required", 400);
            }

            const session = await themePreviewService.verifyPreviewToken(token);

            if (!session) {
                return errorResponse(c, "INVALID_TOKEN", "Invalid or expired preview token", 400);
            }

            // Activate the theme
            await themeService.activateTheme(session.theme);

            // End the preview session
            await themePreviewService.endPreviewSession(token);

            return successResponse(c, {
                theme: session.theme,
                message: "Theme activated successfully",
            });
        } catch (error: any) {
            log.error("Error activating preview theme", error instanceof Error ? error : undefined);
            return errorResponse(c, "ACTIVATION_FAILED", error.message, 500);
        }
    }

    static async endPreviewSession(c: Context) {
        try {
            const token = c.req.param("token");

            await themePreviewService.endPreviewSession(token);

            return successResponse(c, { success: true });
        } catch (error: any) {
            log.error("Error ending preview session", error instanceof Error ? error : undefined);
            return errorResponse(c, "SESSION_END_FAILED", error.message, 500);
        }
    }

    static async createCustomizerSession(c: Context) {
        try {
            const body = await c.req.json();
            const { theme } = body;

            if (!theme) {
                return errorResponse(c, "MISSING_THEME", "Theme name is required", 400);
            }

            const user = c.get("user");
            const userId = getUserId(user);

            const session = await themeCustomizerService.createSession(
                userId,
                theme,
            );

            return successResponse(c, {
                sessionId: session.id,
            });
        } catch (error: any) {
            log.error("Error creating customizer session", error instanceof Error ? error : undefined);
            return errorResponse(c, "CUSTOMIZER_INIT_FAILED", error.message, 500);
        }
    }
}
