import { Hono } from "hono";
import { count, desc } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { content, users, comments } from "../../db/schema.ts";
import { notificationService } from "../../lib/email/index.ts";
import DashboardNexusPage from "../../admin/pages/DashboardNexus.tsx";
import NotificationsNexusPage from "../../admin/pages/NotificationsNexus.tsx";

export const dashboardRouter = new Hono();

/**
 * GET / - Dashboard home
 */
dashboardRouter.get("/", async (c) => {
    try {
        const user = c.get("user");

        // Get statistics
        const [
            totalPostsResult,
            totalUsersResult,
            totalCommentsResult,
        ] = await Promise.all([
            db.select({ count: count() }).from(content),
            db.select({ count: count() }).from(users),
            db.select({ count: count() }).from(comments),
        ]);

        const stats = {
            totalPosts: totalPostsResult[0]?.count || 0,
            totalUsers: totalUsersResult[0]?.count || 0,
            totalComments: totalCommentsResult[0]?.count || 0,
            totalViews: 0, // TODO: Implement view tracking
        };

        // Get recent posts
        const recentPostsData = await db.query.content.findMany({
            limit: 10,
            orderBy: [desc(content.createdAt)],
            with: {
                author: true,
            },
        });

        const recentPosts = recentPostsData.map((post) => ({
            id: post.id,
            title: post.title,
            author: post.author.name || post.author.email,
            status: post.status,
            createdAt: post.createdAt,
        }));

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

        return c.html(
            DashboardNexusPage({
                user: {
                    name: user.name as string | null || user.email,
                    email: user.email,
                },
                stats,
                recentPosts,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error rendering admin dashboard:", error);
        return c.text("Error al cargar el dashboard", 500);
    }
});

/**
 * GET /notifications - Notifications page
 */
dashboardRouter.get("/notifications", async (c) => {
    try {
        const user = c.get("user");

        // Get all notifications for the user
        let notifications = [];
        let unreadNotificationCount = 0;
        try {
            notifications = await notificationService.getForUser({
                userId: user.userId,
                limit: 100,
                offset: 0,
            });
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(
            NotificationsNexusPage({
                user: {
                    id: user.userId,
                    name: user.name as string | null || user.email,
                    email: user.email,
                },
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error rendering notifications page:", error);
        return c.text("Error al cargar las notificaciones", 500);
    }
});
