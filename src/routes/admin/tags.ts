import { Hono } from "hono";
import { db } from "../../config/db.ts";
import { tags } from "../../db/schema.ts";
import { env } from "../../config/env.ts";
import TagsNexusPage from "../../admin/pages/TagsNexus.tsx";
import { notificationService } from "../../lib/email/index.ts";
import { eq, desc } from "drizzle-orm";

export const tagsRouter = new Hono();

/**
 * GET /tags - Tags Management Page
 */
tagsRouter.get("/tags", async (c) => {
    try {
        const user = c.get("user");

        // Fetch all tags
        const allTags = await db.query.tags.findMany({
            orderBy: [desc(tags.createdAt)],
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
            TagsNexusPage({
                user: {
                    id: user.userId,
                    name: user.name as string | null,
                    email: user.email,
                },
                tags: allTags,
                notifications,
                unreadNotificationCount,
            })
        );
    } catch (error: any) {
        console.error("Error rendering tags page:", error);
        return c.text("Error al cargar etiquetas", 500);
    }
});
