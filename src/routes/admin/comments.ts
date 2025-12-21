import { Hono } from "hono";
import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { comments, content } from "../../db/schema.ts";
import { notificationService } from "../../lib/email/index.ts";
import CommentsNexusPage from "../../admin/pages/content/CommentsNexus.tsx";

export const commentsRouter = new Hono();

/**
 * GET /comments - Comments management page
 * Allows filtering and moderating comments
 */
commentsRouter.get("/comments", async (c) => {
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

        const filter = c.req.query("filter") || "all";
        const page = parseInt(c.req.query("page") || "1");
        const limit = 50;
        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions: any[] = [];

        if (filter === "pending") {
            conditions.push(eq(comments.status, "pending"));
        } else if (filter === "approved") {
            conditions.push(eq(comments.status, "approved"));
        } else if (filter === "spam") {
            conditions.push(eq(comments.status, "spam"));
        } else if (filter === "deleted") {
            conditions.push(isNotNull(comments.deletedAt));
        }

        // Fetch comments with content information
        const commentsData = await db
            .select({
                id: comments.id,
                contentId: comments.contentId,
                contentTitle: content.title,
                contentSlug: content.slug,
                parentId: comments.parentId,
                authorId: comments.authorId,
                authorName: comments.authorName,
                authorEmail: comments.authorEmail,
                authorWebsite: comments.authorWebsite,
                body: comments.body,
                bodyCensored: comments.bodyCensored,
                status: comments.status,
                ipAddress: comments.ipAddress,
                userAgent: comments.userAgent,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
            })
            .from(comments)
            .leftJoin(content, eq(comments.contentId, content.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(comments.createdAt))
            .limit(limit)
            .offset(offset);

        // Get stats
        const [statsData] = await db
            .select({
                total: count(),
            })
            .from(comments);

        const [approvedCount] = await db
            .select({ count: count() })
            .from(comments)
            .where(eq(comments.status, "approved"));

        const [pendingCount] = await db
            .select({ count: count() })
            .from(comments)
            .where(eq(comments.status, "pending"));

        const [spamCount] = await db
            .select({ count: count() })
            .from(comments)
            .where(eq(comments.status, "spam"));

        const [deletedCount] = await db
            .select({ count: count() })
            .from(comments)
            .where(isNotNull(comments.deletedAt));

        const stats = {
            total: statsData.total,
            approved: approvedCount.count,
            pending: pendingCount.count,
            spam: spamCount.count,
            deleted: deletedCount.count,
        };

        const totalPages = Math.ceil(stats.total / limit);

        // Format comments
        const formattedComments = commentsData.map((comment) => ({
            id: comment.id,
            contentId: comment.contentId,
            contentTitle: comment.contentTitle ?? "",
            contentSlug: comment.contentSlug ?? "",
            parentId: comment.parentId ?? undefined,
            author: {
                id: comment.authorId ?? undefined,
                name: comment.authorName || comment.authorEmail || "Anónimo",
                email: comment.authorEmail || "",
                website: comment.authorWebsite ?? undefined,
            },
            body: comment.body,
            bodyCensored: comment.bodyCensored,
            status: comment.status as "approved" | "spam" | "deleted" | "pending",
            ipAddress: comment.ipAddress ?? undefined,
            userAgent: comment.userAgent ?? undefined,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        }));

        return c.html(
            CommentsNexusPage({
                user: {
                    id: user.userId,
                    name: (user.name as string | undefined) || user.email,
                    email: user.email,
                },
                comments: formattedComments,
                stats,
                filter,
                page,
                totalPages,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading comments page:", error);
        return c.text("Error al cargar página de comentarios", 500);
    }
});
