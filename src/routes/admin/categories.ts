import { Hono } from "hono";
import { db } from "../../config/db.ts";
import { categories } from "../../db/schema.ts";
import { env } from "../../config/env.ts";
import CategoriesNexusPage from "../../admin/pages/CategoriesNexus.tsx";
import { notificationService } from "../../lib/email/index.ts";
import { eq, desc } from "drizzle-orm";

export const categoriesRouter = new Hono();

/**
 * GET /categories - Categories Management Page
 */
categoriesRouter.get("/categories", async (c) => {
    try {
        const user = c.get("user");

        // Fetch all categories
        const allCategories = await db.query.categories.findMany({
            orderBy: [desc(categories.createdAt)],
        });

        // Get notifications
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

        return c.html(
            CategoriesNexusPage({
                user: {
                    id: user.userId,
                    name: user.name as string | null,
                    email: user.email,
                },
                categories: allCategories,
                notifications,
                unreadNotificationCount,
            })
        );
    } catch (error: any) {
        console.error("Error rendering categories page:", error);
        return c.text("Error al cargar categorías", 500);
    }
});
