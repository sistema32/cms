/**
 * Dashboard Service
 * Provides statistics and analytics for the CMS dashboard
 */

import { db } from "../config/db.ts";
import {
  users,
  content,
  media,
  comments,
  categories,
  tags,
  contentTypes,
  auditLogs,
  notifications,
  backups,
} from "../db/schema.ts";
import { eq, gte, lte, desc, sql, and } from "drizzle-orm";

export interface DashboardStats {
  content: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    totalViews: number;
    totalComments: number;
    averageViewsPerPost: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    newToday: number;
  };
  media: {
    total: number;
    totalSize: number; // bytes
    images: number;
    videos: number;
    documents: number;
    audio: number;
  };
  comments: {
    total: number;
    approved: number;
    spam: number;
    pending: number;
  };
  categories: {
    total: number;
  };
  tags: {
    total: number;
  };
  contentTypes: {
    total: number;
  };
  system: {
    lastBackup?: Date;
    totalBackups: number;
    unreadNotifications: number;
    recentErrors: number;
  };
}

export interface TrendData {
  date: string; // ISO date
  value: number;
}

export interface ContentTrends {
  views: TrendData[];
  posts: TrendData[];
  comments: TrendData[];
}

export interface RecentActivity {
  id: number;
  type: "content" | "user" | "comment" | "media" | "system";
  action: string;
  description: string;
  user?: {
    id: number;
    name: string | null;
    email: string;
  };
  timestamp: Date;
  icon?: string;
}

export interface PopularContent {
  id: number;
  title: string;
  slug: string;
  viewCount: number;
  commentCount: number;
  publishedAt: Date | null;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
}

export interface TopContributor {
  id: number;
  name: string | null;
  email: string;
  postsCount: number;
  totalViews: number;
  totalComments: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Content stats
  const allContent = await db.select().from(content);
  const totalViews = allContent.reduce((sum, c) => sum + (c.viewCount || 0), 0);
  const totalCommentsCount = allContent.reduce((sum, c) => sum + (c.commentCount || 0), 0);

  // Users stats
  const allUsers = await db.select().from(users);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const newThisMonth = allUsers.filter((u) => u.createdAt >= firstOfMonth).length;
  const newToday = allUsers.filter((u) => u.createdAt >= startOfToday).length;

  // Media stats
  const allMedia = await db.select().from(media);
  const totalSize = allMedia.reduce((sum, m) => sum + m.size, 0);

  // Comments stats
  const allComments = await db.select().from(comments);

  // Categories and tags
  const allCategories = await db.select().from(categories);
  const allTags = await db.select().from(tags);
  const allContentTypes = await db.select().from(contentTypes);

  // System stats
  const lastBackup = await db.query.backups.findFirst({
    where: eq(backups.status, "completed"),
    orderBy: [desc(backups.createdAt)],
  });

  const allBackups = await db.select().from(backups);

  // Recent errors from audit logs
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentErrors = await db.query.auditLogs.findMany({
    where: and(
      gte(auditLogs.createdAt, oneDayAgo),
      eq(auditLogs.level, "error"),
    ),
  });

  // Unread notifications (for all users - simplified)
  const unreadNotifications = await db.query.notifications.findMany({
    where: eq(notifications.isRead, false),
  });

  return {
    content: {
      total: allContent.length,
      published: allContent.filter((c) => c.status === "published").length,
      draft: allContent.filter((c) => c.status === "draft").length,
      scheduled: allContent.filter((c) => c.status === "scheduled").length,
      totalViews,
      totalComments: totalCommentsCount,
      averageViewsPerPost: allContent.length > 0 ? totalViews / allContent.length : 0,
    },
    users: {
      total: allUsers.length,
      active: allUsers.filter((u) => u.status === "active").length,
      inactive: allUsers.filter((u) => u.status === "inactive").length,
      newThisMonth,
      newToday,
    },
    media: {
      total: allMedia.length,
      totalSize,
      images: allMedia.filter((m) => m.type === "image").length,
      videos: allMedia.filter((m) => m.type === "video").length,
      documents: allMedia.filter((m) => m.type === "document").length,
      audio: allMedia.filter((m) => m.type === "audio").length,
    },
    comments: {
      total: allComments.length,
      approved: allComments.filter((c) => c.status === "approved").length,
      spam: allComments.filter((c) => c.status === "spam").length,
      pending: allComments.filter((c) => c.status === "pending").length,
    },
    categories: {
      total: allCategories.length,
    },
    tags: {
      total: allTags.length,
    },
    contentTypes: {
      total: allContentTypes.length,
    },
    system: {
      lastBackup: lastBackup?.createdAt,
      totalBackups: allBackups.length,
      unreadNotifications: unreadNotifications.length,
      recentErrors: recentErrors.length,
    },
  };
}

/**
 * Get content trends for the last N days
 */
export async function getContentTrends(days = 30): Promise<ContentTrends> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allContent = await db.select().from(content);
  const allComments = await db.select().from(comments);

  // Generate date range
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Calculate views trend (we don't have historical view data, so this is cumulative)
  const viewsTrend: TrendData[] = dates.map((date) => ({
    date,
    value: 0, // TODO: Implement historical views tracking
  }));

  // Calculate posts trend
  const postsTrend: TrendData[] = dates.map((date) => {
    const dateObj = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const postsOnDate = allContent.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= dateObj && created < nextDay;
    }).length;

    return {
      date,
      value: postsOnDate,
    };
  });

  // Calculate comments trend
  const commentsTrend: TrendData[] = dates.map((date) => {
    const dateObj = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const commentsOnDate = allComments.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= dateObj && created < nextDay;
    }).length;

    return {
      date,
      value: commentsOnDate,
    };
  });

  return {
    views: viewsTrend,
    posts: postsTrend,
    comments: commentsTrend,
  };
}

/**
 * Get recent activity
 */
export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Get recent audit logs
  const recentLogs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });

  for (const log of recentLogs) {
    let icon = "📝";
    let type: RecentActivity["type"] = "system";

    switch (log.entity) {
      case "content":
        icon = "📄";
        type = "content";
        break;
      case "user":
        icon = "👤";
        type = "user";
        break;
      case "comment":
        icon = "💬";
        type = "comment";
        break;
      case "media":
        icon = "🖼️";
        type = "media";
        break;
      default:
        icon = "⚙️";
        type = "system";
    }

    activities.push({
      id: log.id,
      type,
      action: log.action,
      description: log.description || `${log.action} ${log.entity}`,
      user: log.userEmail
        ? {
            id: log.userId || 0,
            name: null,
            email: log.userEmail,
          }
        : undefined,
      timestamp: log.createdAt,
      icon,
    });
  }

  return activities;
}

/**
 * Get popular content
 */
export async function getPopularContent(limit = 10): Promise<PopularContent[]> {
  const popularContent = await db.query.content.findMany({
    where: eq(content.status, "published"),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          password: false,
        },
      },
    },
    orderBy: [desc(content.viewCount)],
    limit,
  });

  return popularContent.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    viewCount: c.viewCount || 0,
    commentCount: c.commentCount || 0,
    publishedAt: c.publishedAt,
    author: {
      id: c.author.id,
      name: c.author.name,
      email: c.author.email,
    },
  }));
}

/**
 * Get top contributors
 */
export async function getTopContributors(limit = 10): Promise<TopContributor[]> {
  const allContent = await db.query.content.findMany({
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          password: false,
        },
      },
    },
  });

  // Group by author
  const contributorsMap = new Map<number, TopContributor>();

  for (const item of allContent) {
    const authorId = item.authorId;

    if (!contributorsMap.has(authorId)) {
      contributorsMap.set(authorId, {
        id: item.author.id,
        name: item.author.name,
        email: item.author.email,
        postsCount: 0,
        totalViews: 0,
        totalComments: 0,
      });
    }

    const contributor = contributorsMap.get(authorId)!;
    contributor.postsCount++;
    contributor.totalViews += item.viewCount || 0;
    contributor.totalComments += item.commentCount || 0;
  }

  // Convert to array and sort
  const contributors = Array.from(contributorsMap.values()).sort(
    (a, b) => b.postsCount - a.postsCount,
  );

  return contributors.slice(0, limit);
}

/**
 * Get content distribution by type
 */
export async function getContentDistribution(): Promise<{
  type: string;
  count: number;
  percentage: number;
}[]> {
  const allContent = await db.query.content.findMany({
    with: {
      contentType: true,
    },
  });

  const total = allContent.length;
  const distributionMap = new Map<string, number>();

  for (const item of allContent) {
    const typeName = item.contentType.name;
    distributionMap.set(typeName, (distributionMap.get(typeName) || 0) + 1);
  }

  return Array.from(distributionMap.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

/**
 * Get comment activity by content
 */
export async function getCommentActivity(limit = 10): Promise<{
  contentId: number;
  contentTitle: string;
  contentSlug: string;
  commentCount: number;
  recentComments: number; // Last 7 days
}[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const allComments = await db.query.comments.findMany({
    with: {
      content: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  const activityMap = new Map<
    number,
    {
      contentId: number;
      contentTitle: string;
      contentSlug: string;
      commentCount: number;
      recentComments: number;
    }
  >();

  for (const comment of allComments) {
    const contentId = comment.contentId;

    if (!activityMap.has(contentId)) {
      activityMap.set(contentId, {
        contentId: comment.content.id,
        contentTitle: comment.content.title,
        contentSlug: comment.content.slug,
        commentCount: 0,
        recentComments: 0,
      });
    }

    const activity = activityMap.get(contentId)!;
    activity.commentCount++;

    if (comment.createdAt >= sevenDaysAgo) {
      activity.recentComments++;
    }
  }

  return Array.from(activityMap.values())
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, limit);
}
