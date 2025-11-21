import { Hono } from "hono";
import { env } from "../../config/env.ts";
import { notificationService } from "../../lib/email/index.ts";
import * as themeService from "../../services/themeService.ts";
import * as widgetService from "../../services/widgetService.ts";
import WidgetsNexusPage from "../../admin/pages/WidgetsNexus.tsx";
import { parseStringField } from "./helpers.ts";

export const widgetsRouter = new Hono();

/**
 * GET /appearance/widgets - Widgets management page
 */
widgetsRouter.get("/appearance/widgets", async (c) => {
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
        const widgetAreas = await widgetService.getWidgetAreasByTheme(activeTheme);
        const availableWidgets = widgetService.getAvailableWidgetTypes();

        // Transform available widgets to match the expected interface
        const transformedAvailableWidgets = availableWidgets.map(w => ({
            type: w.id,
            name: w.name,
            description: w.description,
            icon: w.icon
        }));

        // Transform widget areas to match the expected interface
        const transformedWidgetAreas = widgetAreas.map(area => ({
            id: area.slug, // The page expects 'id' to be the slug/identifier
            name: area.name,
            description: area.description || "",
            widgets: (area.widgets || []).map(w => ({
                id: w.id,
                type: w.type,
                title: w.title || w.type,
                settings: w.settings,
                order: w.order
            }))
        }));

        return c.html(WidgetsNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            widgetAreas: transformedWidgetAreas,
            availableWidgets: transformedAvailableWidgets,
            activeTheme,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error rendering widgets page:", error);
        return c.text("Error al cargar los widgets", 500);
    }
});

/**
 * POST /api/admin/widgets - Create a widget
 */
widgetsRouter.post("/api/admin/widgets", async (c) => {
    try {
        const body = await c.req.json();
        const { area_id, widget_type, title, settings } = body;

        if (!area_id || !widget_type) {
            return c.json({ error: "Area ID and Widget Type are required" }, 400);
        }

        // Find the area by slug (since frontend sends slug as area_id)
        const area = await widgetService.getWidgetAreaBySlug(area_id);
        if (!area) {
            return c.json({ error: "Widget area not found" }, 404);
        }

        const widgetId = await widgetService.createWidget({
            areaId: area.id,
            type: widget_type,
            title: title || widget_type,
            settings: settings || {},
            order: 999, // Append to end
            isActive: true
        });

        return c.json({ success: true, id: widgetId });
    } catch (error: any) {
        console.error("Error creating widget:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * PUT /api/admin/widgets/:id - Update a widget (move or update settings)
 */
widgetsRouter.put("/api/admin/widgets/:id", async (c) => {
    try {
        const widgetId = parseInt(c.req.param("id"));
        const body = await c.req.json();

        if (isNaN(widgetId)) {
            return c.json({ error: "Invalid widget ID" }, 400);
        }

        // Handle moving widget to another area
        if (body.area_id) {
            const area = await widgetService.getWidgetAreaBySlug(body.area_id);
            if (!area) {
                return c.json({ error: "Target widget area not found" }, 404);
            }

            await widgetService.updateWidget(widgetId, {
                areaId: area.id
            });
        }

        // Handle other updates
        const updates: any = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.settings !== undefined) updates.settings = body.settings;
        if (body.order !== undefined) updates.order = body.order;
        if (body.isActive !== undefined) updates.isActive = body.isActive;

        if (Object.keys(updates).length > 0) {
            await widgetService.updateWidget(widgetId, updates);
        }

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error updating widget:", error);
        return c.json({ error: error.message }, 500);
    }
});

/**
 * DELETE /api/admin/widgets/:id - Delete a widget
 */
widgetsRouter.delete("/api/admin/widgets/:id", async (c) => {
    try {
        const widgetId = parseInt(c.req.param("id"));

        if (isNaN(widgetId)) {
            return c.json({ error: "Invalid widget ID" }, 400);
        }

        await widgetService.deleteWidget(widgetId);

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting widget:", error);
        return c.json({ error: error.message }, 500);
    }
});
