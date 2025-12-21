// @ts-nocheck
/**
 * Notification Service
 * Manages in-app notifications and email notifications for users
 */

import { db } from "../../config/db.ts";
import { notifications, notificationPreferences, users } from "../../db/schema.ts";
import type { NewNotification, NewNotificationPreference } from "../../db/schema.ts";
import { eq, and, desc, lte, gte, sql } from "drizzle-orm";
import { emailManager } from "./EmailManager.ts";
import { EventEmitter } from "node:events";
import type {
  CreateNotificationInput,
  NotificationFilter,
  NotificationType,
} from "./types.ts";

export class NotificationService {
  private static instance: NotificationService;

  private constructor() { }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private eventEmitter = new EventEmitter();

  /**
   * Subscribe to notification events
   */
  on(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove subscription
   */
  off(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Create a notification for a user
   */
  async create(input: CreateNotificationInput): Promise<number> {
    try {
      // Get user preferences
      const prefs = await this.getPreferences(input.userId);

      // Create notification
      const [notification] = await db.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        icon: input.icon,
        link: input.link,
        actionLabel: input.actionLabel,
        actionUrl: input.actionUrl,
        data: input.data ? JSON.stringify(input.data) : undefined,
        priority: input.priority || "normal",
        expiresAt: input.expiresAt,
        isRead: false,
        emailSent: false,
      }).returning();

      // Emit event for real-time updates
      this.eventEmitter.emit(`notification:${input.userId}`, notification);

      // Send email notification if enabled and requested
      if (input.sendEmail !== false && prefs.emailNotifications && this.shouldSendEmail(input.type, prefs)) {
        await this.sendEmailNotification(notification.id, input.userId);
      }

      return notification.id;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Create multiple notifications (bulk)
   */
  async createBulk(inputs: CreateNotificationInput[]): Promise<number[]> {
    const ids: number[] = [];

    for (const input of inputs) {
      try {
        const id = await this.create(input);
        ids.push(id);
      } catch (error) {
        console.error(`Failed to create notification for user ${input.userId}:`, error);
      }
    }

    return ids;
  }

  /**
   * Get notifications for a user
   */
  async getForUser(filter: NotificationFilter) {
    const {
      userId,
      type,
      isRead,
      priority,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = filter;

    const conditions = [];

    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }

    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead));
    }

    if (priority) {
      conditions.push(eq(notifications.priority, priority));
    }

    if (startDate) {
      conditions.push(gte(notifications.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(notifications.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.notifications.findMany({
      where: whereClause,
      orderBy: [
        desc(notifications.priority),
        desc(notifications.createdAt),
      ],
      limit,
      offset,
    });

    return results.map((n) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : undefined,
    }));
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );

    return result[0]?.count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
  }

  /**
   * Delete notification
   */
  async delete(notificationId: number, userId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );
  }

  /**
   * Delete all notifications for user
   */
  async deleteAll(userId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpired(): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(lte(notifications.expiresAt, new Date()));

    return result.rowsAffected || 0;
  }

  /**
   * Get or create notification preferences for user
   */
  async getPreferences(userId: number) {
    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!prefs) {
      // Create default preferences
      [prefs] = await db.insert(notificationPreferences).values({
        userId,
        emailNotifications: true,
        emailDigest: "daily",
        notifyComments: true,
        notifyReplies: true,
        notifyMentions: true,
        notifyContentPublished: true,
        notifySystemAlerts: true,
      }).returning();
    }

    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: number,
    updates: Partial<NewNotificationPreference>,
  ) {
    const existing = await this.getPreferences(userId);

    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Send email notification for a notification
   */
  private async sendEmailNotification(notificationId: number, userId: number): Promise<void> {
    try {
      // Get notification details
      const notification = await db.query.notifications.findFirst({
        where: eq(notifications.id, notificationId),
        with: {
          user: {
            columns: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (!notification || !notification.user) {
        return;
      }

      // Queue email
      await emailManager.queue({
        to: {
          email: notification.user.email,
          name: notification.user.name || undefined,
        },
        subject: notification.title,
        text: notification.message,
        html: this.buildEmailHTML(notification),
      }, notification.priority as "high" | "normal" | "low");

      // Mark as email sent
      await db
        .update(notifications)
        .set({
          emailSent: true,
          emailSentAt: new Date(),
        })
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Build HTML for email notification
   */
  private buildEmailHTML(notification: any): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
    `;

    if (notification.actionUrl && notification.actionLabel) {
      html += `
        <p>
          <a href="${notification.actionUrl}"
             style="background: #007bff; color: white; padding: 10px 20px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${notification.actionLabel}
          </a>
        </p>
      `;
    }

    html += `
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from LexCMS.
        </p>
      </div>
    `;

    return html;
  }

  /**
   * Check if email should be sent based on notification type and user preferences
   */
  private shouldSendEmail(type: NotificationType, prefs: any): boolean {
    switch (type) {
      case "comment.new":
      case "comment.reply":
        return prefs.notifyComments || prefs.notifyReplies;

      case "mention":
        return prefs.notifyMentions;

      case "content.published":
      case "content.updated":
        return prefs.notifyContentPublished;

      case "system.backup_completed":
      case "system.error":
      case "system.warning":
        return prefs.notifySystemAlerts;

      default:
        return true; // Send by default for unknown types
    }
  }

  /**
   * Get notification statistics for user
   */
  async getStats(userId: number) {
    // Optimized query using aggregation
    const [totalResult, unreadResult, typeResult, priorityResult] = await Promise.all([
      // Total count
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),

      // Unread count
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),

      // Group by type
      db.select({ type: notifications.type, count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .groupBy(notifications.type),

      // Group by priority
      db.select({ priority: notifications.priority, count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .groupBy(notifications.priority),
    ]);

    const byType = typeResult.reduce((acc, curr) => {
      acc[curr.type] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = priorityResult.reduce((acc, curr) => {
      acc[curr.priority] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalResult[0]?.count || 0,
      unread: unreadResult[0]?.count || 0,
      read: (totalResult[0]?.count || 0) - (unreadResult[0]?.count || 0),
      byType,
      byPriority: {
        high: byPriority["high"] || 0,
        normal: byPriority["normal"] || 0,
        low: byPriority["low"] || 0,
      },
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
// @ts-nocheck
