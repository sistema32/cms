/**
 * Notification Routes
 * API endpoints for user notifications
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { notificationService } from "../lib/email/index.ts";
import { authMiddleware } from "../middleware/auth.ts";

const notifications = new Hono();

// All routes require authentication
notifications.use("/*", authMiddleware);

/**
 * GET /api/notifications
 * Get notifications for current user
 */
notifications.get("/", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId;

    const isRead = c.req.query("isRead");
    const type = c.req.query("type");
    const priority = c.req.query("priority");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 20;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;

    const results = await notificationService.getForUser({
      userId,
      isRead: isRead !== undefined ? isRead === "true" : undefined,
      type: type as any,
      priority: priority as any,
      limit,
      offset,
    });

    return c.json({
      success: true,
      notifications: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get notifications",
    }, 500);
  }
});

/**
 * GET /api/notifications/stream
 * Server-Sent Events stream for real-time notifications
 */
notifications.get("/stream", async (c) => {
  const user = c.get("user");
  const userId = user.userId;

  return streamSSE(c, async (stream) => {
    // Send initial connection message
    await stream.writeSSE({
      data: JSON.stringify({ type: "connected" }),
    });

    // Create listener for this user's notifications
    const listener = async (notification: any) => {
      try {
        await stream.writeSSE({
          data: JSON.stringify({
            type: "notification",
            notification: {
              ...notification,
              data: notification.data ? JSON.parse(notification.data) : undefined,
            },
          }),
        });
      } catch (error) {
        console.error("Error sending notification via SSE:", error);
      }
    };

    // Subscribe to notifications for this user
    notificationService.on(`notification:${userId}`, listener);

    // Send keepalive every 30 seconds
    const keepaliveInterval = setInterval(async () => {
      try {
        await stream.writeSSE({
          data: "keepalive",
        });
      } catch (error) {
        clearInterval(keepaliveInterval);
      }
    }, 30000);

    // Cleanup on disconnect
    stream.onAbort(() => {
      notificationService.off(`notification:${userId}`, listener);
      clearInterval(keepaliveInterval);
    });
  });
});


/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 */
notifications.get("/unread-count", async (c) => {
  try {
    const user = c.get("user");
    const count = await notificationService.getUnreadCount(user.userId);

    return c.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unread count",
    }, 500);
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for current user
 */
notifications.get("/stats", async (c) => {
  try {
    const user = c.get("user");
    const stats = await notificationService.getStats(user.userId);

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Failed to get notification stats:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    }, 500);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
notifications.patch("/:id/read", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    await notificationService.markAsRead(id, user.userId);

    return c.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read",
    }, 500);
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
notifications.post("/read-all", async (c) => {
  try {
    const user = c.get("user");

    await notificationService.markAllAsRead(user.userId);

    return c.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all as read",
    }, 500);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
notifications.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    await notificationService.delete(id, user.userId);

    return c.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete notification",
    }, 500);
  }
});

/**
 * DELETE /api/notifications
 * Delete all notifications for current user
 */
notifications.delete("/", async (c) => {
  try {
    const user = c.get("user");

    await notificationService.deleteAll(user.userId);

    return c.json({
      success: true,
      message: "All notifications deleted",
    });
  } catch (error) {
    console.error("Failed to delete all notifications:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete all notifications",
    }, 500);
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for current user
 */
notifications.get("/preferences", async (c) => {
  try {
    const user = c.get("user");
    const prefs = await notificationService.getPreferences(user.userId);

    return c.json({
      success: true,
      preferences: prefs,
    });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get preferences",
    }, 500);
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for current user
 */
notifications.patch("/preferences", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const updated = await notificationService.updatePreferences(user.userId, body);

    return c.json({
      success: true,
      message: "Preferences updated",
      preferences: updated,
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update preferences",
    }, 500);
  }
});

export default notifications;
