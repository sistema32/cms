import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { content, contentTypes } from "../../db/schema.ts";
import { env } from "../../config/env.ts";
import { notificationService } from "../../lib/email/index.ts";
import { updateSetting as updateSettingService } from "../../services/settingsService.ts";
import {
    resolveFieldDefault,
    SETTINGS_DEFINITIONS,
    SETTINGS_FIELD_MAP,
} from "../../config/settingsDefinitions.ts";
import SettingsNexusPage from "../../admin/pages/SettingsNexus.tsx";
import { parseSettingValueForAdmin } from "./helpers.ts";

export const settingsRouter = new Hono();

/**
 * GET /settings - Settings page
 */
settingsRouter.get("/settings", async (c) => {
    try {
        const user = c.get("user");
        const requestedCategory = (c.req.query("category") || "general")
            .toLowerCase();
        const settingsData = await db.query.settings.findMany();

        const storedValues: Record<string, unknown> = {};
        for (const setting of settingsData) {
            storedValues[setting.key] = parseSettingValueForAdmin(setting.value);
        }

        // Fetch all pages for dynamic dropdown options
        const pageType = await db.query.contentTypes.findFirst({
            where: eq(contentTypes.slug, "page"),
        });

        let pageOptions: { value: string; label: string }[] = [];
        if (pageType) {
            const pages = await db.query.content.findMany({
                where: eq(content.contentTypeId, pageType.id),
                orderBy: [asc(content.title)],
                columns: {
                    id: true,
                    title: true,
                },
            });

            pageOptions = pages.map((page) => ({
                value: String(page.id),
                label: page.title,
            }));
        }

        const resolvedSettings: Record<string, unknown> = {};
        const categories = SETTINGS_DEFINITIONS.map((category) => {
            const fields = category.fields.map((field) => {
                const defaultValue = resolveFieldDefault(field);
                const storedValue = storedValues[field.key];
                const value = storedValue !== undefined ? storedValue : defaultValue;

                if (value !== undefined) {
                    resolvedSettings[field.key] = value;
                } else if (!(field.key in resolvedSettings)) {
                    resolvedSettings[field.key] = null;
                }

                // Inject dynamic page options for front_page_id and posts_page_id
                let fieldOptions = field.options;
                if (
                    (field.key === "front_page_id" || field.key === "posts_page_id") &&
                    pageOptions.length > 0
                ) {
                    fieldOptions = pageOptions;
                }

                return {
                    ...field,
                    defaultValue,
                    options: fieldOptions,
                };
            });

            const hasValue = fields.some((field) => {
                const value = resolvedSettings[field.key];
                if (value === undefined || value === null) {
                    return false;
                }
                if (typeof value === "string") {
                    return value.trim().length > 0;
                }
                return true;
            });

            return {
                id: category.id,
                label: category.label,
                fields,
                available: hasValue || fields.length > 0,
            };
        });

        for (const [key, value] of Object.entries(storedValues)) {
            if (!(key in resolvedSettings)) {
                resolvedSettings[key] = value;
            }
        }

        const validCategoryIds = new Set(categories.map((category) => category.id));
        const fallbackCategory = categories.find((category) =>
            category.available
        )?.id ??
            categories[0]?.id ??
            "general";
        const selectedCategory = validCategoryIds.has(requestedCategory)
            ? requestedCategory
            : fallbackCategory;

        // Get notifications for the user
        let notifications = [];
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

        return c.html(SettingsNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            settings: resolvedSettings,
            categories,
            selectedCategory,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        return c.text("Error al cargar configuración", 500);
    }
});

settingsRouter.post("/settings/save", async (c) => {
    try {
        const body = await c.req.parseBody();

        for (const [key, value] of Object.entries(body)) {
            if (key === "settings_category") {
                continue;
            }

            const fieldDefinition = SETTINGS_FIELD_MAP.get(key);
            if (!fieldDefinition) {
                continue;
            }

            const rawValue = Array.isArray(value) ? value[value.length - 1] : value;

            if (rawValue instanceof File) {
                continue;
            }

            let normalizedValue: unknown = rawValue;
            const fieldType = fieldDefinition.type ?? "text";

            switch (fieldType) {
                case "boolean": {
                    const stringValue = typeof rawValue === "string"
                        ? rawValue
                        : `${rawValue ?? ""}`;
                    normalizedValue = stringValue === "true" || stringValue === "1" ||
                        stringValue === "on";
                    break;
                }
                case "number": {
                    const stringValue = typeof rawValue === "string"
                        ? rawValue.trim()
                        : `${rawValue ?? ""}`.trim();
                    if (stringValue === "") {
                        normalizedValue = null;
                    } else {
                        const parsedValue = Number(stringValue);
                        normalizedValue = Number.isNaN(parsedValue) ? null : parsedValue;
                    }
                    break;
                }
                case "textarea": {
                    const stringValue = typeof rawValue === "string"
                        ? rawValue
                        : `${rawValue ?? ""}`;
                    normalizedValue = stringValue.trim().length > 0 ? stringValue : null;
                    break;
                }
                case "password": {
                    const stringValue = typeof rawValue === "string"
                        ? rawValue.trim()
                        : "";
                    if (stringValue.length === 0) {
                        continue;
                    }
                    normalizedValue = stringValue;
                    break;
                }
                case "select":
                case "email":
                case "url":
                case "text": {
                    const stringValue = typeof rawValue === "string"
                        ? rawValue.trim()
                        : `${rawValue ?? ""}`.trim();
                    normalizedValue = stringValue.length > 0 ? stringValue : null;
                    break;
                }
                default: {
                    if (typeof rawValue === "string") {
                        const trimmed = rawValue.trim();
                        normalizedValue = trimmed.length > 0 ? trimmed : null;
                    } else {
                        normalizedValue = rawValue ?? null;
                    }
                }
            }

            await updateSettingService(key, normalizedValue);
        }

        let redirectCategory: string | undefined;
        const rawCategory = (body as Record<string, any>).settings_category;
        if (typeof rawCategory === "string") {
            redirectCategory = rawCategory;
        } else if (Array.isArray(rawCategory)) {
            redirectCategory = rawCategory[0];
        }

        const redirectUrl = redirectCategory
            ? `${env.ADMIN_PATH}/settings?category=${redirectCategory}`
            : `${env.ADMIN_PATH}/settings`;

        return c.redirect(redirectUrl);
    } catch (error: any) {
        return c.text("Error al guardar configuración", 500);
    }
});

/**
 * POST /settings/clear-cache - Clear application cache
 */
settingsRouter.post("/settings/clear-cache", async (c) => {
    try {
        const { cacheManager } = await import("../../lib/cache/index.ts");
        await cacheManager.clear();

        return c.json({ success: true, message: "Cache limpiado exitosamente" });
    } catch (error: any) {
        console.error("Error clearing cache:", error);
        return c.json({ success: false, message: "Error al limpiar cache" }, 500);
    }
});

/**
 * GET /settings/export - Export settings as JSON
 */
settingsRouter.get("/settings/export", async (c) => {
    try {
        const settingsData = await db.query.settings.findMany();

        // Convert to simple key-value object
        const settingsExport: Record<string, any> = {};
        settingsData.forEach((s) => {
            settingsExport[s.key] = {
                value: s.value,
                category: s.category,
                autoload: s.autoload,
            };
        });

        // Set headers for file download
        c.header("Content-Type", "application/json");
        c.header(
            "Content-Disposition",
            `attachment; filename="lexcms-settings-${Date.now()}.json"`,
        );

        return c.json(settingsExport, 200);
    } catch (error: any) {
        console.error("Error exporting settings:", error);
        return c.text("Error al exportar configuración", 500);
    }
});
