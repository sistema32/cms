import { Hono } from "hono";
import { count, desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { media } from "../../db/schema.ts";
import { env } from "../../config/env.ts";
import MediaLibraryNexusPage from "../../admin/pages/MediaLibraryNexus.tsx";
import { notificationService } from "../../lib/email/index.ts";

export const mediaRouter = new Hono();

/**
 * GET /media - Media Library Page
 */
mediaRouter.get("/media", async (c) => {
    try {
        const user = c.get("user");
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        const offset = parseInt(c.req.query("offset") || "0") || (page - 1) * limit;
        const type = c.req.query("type");
        const search = c.req.query("search");

        // Build conditions
        const conditions = [];
        if (type) conditions.push(eq(media.type, type));

        // Note: Search implementation depends on DB capabilities (SQLite/Postgres)
        // For now we'll stick to type filtering as search requires more complex query construction

        // Execute queries
        const [mediaItems, totalResult] = await Promise.all([
            db.query.media.findMany({
                where: conditions.length > 0 ? conditions[0] : undefined, // Simplify for single condition for now
                limit,
                offset,
                orderBy: [desc(media.createdAt)],
                with: {
                    uploadedBy: {
                        columns: {
                            password: false,
                        },
                    },
                },
            }),
            db.select({ count: count() }).from(media).where(
                conditions.length > 0 ? conditions[0] : undefined
            ),
        ]);

        const total = totalResult[0]?.count || 0;

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
            MediaLibraryNexusPage({
                user: {
                    id: user.userId,
                    name: user.name as string | null,
                    email: user.email,
                },
                media: mediaItems.map((item) => ({
                    ...item,
                    uploadedBy: item.uploadedBy ? {
                        id: item.uploadedBy.id,
                        name: item.uploadedBy.name || undefined,
                        email: item.uploadedBy.email
                    } : undefined
                })),
                limit,
                offset,
                total,
                notifications,
                unreadNotificationCount,
            })
        );
    } catch (error: any) {
        console.error("Error rendering media library:", error);
        return c.text("Error al cargar la biblioteca de medios", 500);
    }
});

/**
 * GET /media/data - JSON Media List (for Pickers)
 */
mediaRouter.get("/media/data", async (c) => {
    try {
        const limit = parseInt(c.req.query("limit") || "20");
        const offset = parseInt(c.req.query("offset") || "0");
        const type = c.req.query("type");

        const conditions = [];
        if (type) conditions.push(eq(media.type, type));

        const mediaItems = await db.query.media.findMany({
            where: conditions.length > 0 ? conditions[0] : undefined,
            limit,
            offset,
            orderBy: [desc(media.createdAt)],
        });

        return c.json(mediaItems);
    } catch (error: any) {
        console.error("Error fetching media data:", error);
        return c.json({ error: "Error al cargar medios" }, 500);
    }
});

/**
 * API Routes for Media Operations
 * Note: Actual processing logic is in mediaService.ts, likely exposed via a main API router.
 * If dedicated admin API endpoints are needed, they can be added here or in api/media.
 * Based on media-picker.js, it uses /api/media for upload/list/delete.
 * 
 * If the MediaLibraryNexusPage uses specific actions, verify if they point to /api/media 
 * or admin specific endpoints.
 * 
 * MediaLibraryNexus.tsx uses:
 * - ${adminPath}/api/media/upload (POST)
 * - ${adminPath}/api/media/:id (DELETE)
 */

import { uploadMedia, deleteMedia } from "../../services/mediaService.ts";

mediaRouter.post("/api/media/upload", async (c) => {
    try {
        const user = c.get("user");
        if (!user) {
            console.error("[DEBUG] Upload Failed: User not authenticated (c.get('user') is null)");
            return c.json({ success: false, error: "Unauthorized" }, 401);
        }
        console.log("[DEBUG] Upload Start. User:", user.userId);

        const body = await c.req.parseBody();
        console.log("[DEBUG] Upload Body Parsed Keys:", Object.keys(body));

        const files = body['files']; // Matches frontend FormData field 'files'

        if (!files) {
            console.error("[DEBUG] No files found in body['files']");
            return c.json({ success: false, error: "No files provided" }, 400);
        }

        const uploadedFiles = [];
        const fileList = Array.isArray(files) ? files : [files];

        for (const file of fileList) {
            if (file instanceof File) {
                console.log("[DEBUG] Processing file:", file.name, file.type, file.size);
                try {
                    const buffer = await file.arrayBuffer();
                    const uploaded = await uploadMedia({
                        data: new Uint8Array(buffer),
                        filename: file.name,
                        mimeType: file.type,
                        uploadedBy: user.userId
                    });
                    uploadedFiles.push(uploaded);
                } catch (innerError: any) {
                    console.error("[DEBUG] Error processing specific file:", file.name, innerError);
                    // Continue with other files? Or fail? Let's fail for now to be explicit.
                    throw new Error(`Failed to process ${file.name}: ${innerError.message}`);
                }
            } else {
                console.warn("[DEBUG] Item is not a File instance:", typeof file, file);
            }
        }

        console.log("[DEBUG] Upload Success. Files:", uploadedFiles.length);
        return c.json({ success: true, files: uploadedFiles });
    } catch (error: any) {
        console.error("Error uploading media:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

mediaRouter.delete("/api/media/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        await deleteMedia(id);
        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting media:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});
