/**
 * Dashboard Routes
 * API endpoints for dashboard statistics and analytics
 */

import { Hono } from "hono";
import * as dashboardService from "../services/dashboardService.ts";
import { authMiddleware } from "../middleware/auth.ts";

const dashboard = new Hono();

// All routes require authentication
dashboard.use("/*", authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 */
dashboard.get("/stats", async (c) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    }, 500);
  }
});

/**
 * GET /api/dashboard/trends
 * Get content trends (views, posts, comments)
 */
dashboard.get("/trends", async (c) => {
  try {
    const days = c.req.query("days") ? parseInt(c.req.query("days")!) : 30;

    const trends = await dashboardService.getContentTrends(days);

    return c.json({
      success: true,
      trends,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Failed to get trends:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get trends",
    }, 500);
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity
 */
dashboard.get("/activity", async (c) => {
  try {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 20;

    const activity = await dashboardService.getRecentActivity(limit);

    return c.json({
      success: true,
      activity,
      count: activity.length,
    });
  } catch (error) {
    console.error("Failed to get activity:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get activity",
    }, 500);
  }
});

/**
 * GET /api/dashboard/popular-content
 * Get popular content by views
 */
dashboard.get("/popular-content", async (c) => {
  try {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;

    const content = await dashboardService.getPopularContent(limit);

    return c.json({
      success: true,
      content,
      count: content.length,
    });
  } catch (error) {
    console.error("Failed to get popular content:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get popular content",
    }, 500);
  }
});

/**
 * GET /api/dashboard/top-contributors
 * Get top contributors by post count
 */
dashboard.get("/top-contributors", async (c) => {
  try {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;

    const contributors = await dashboardService.getTopContributors(limit);

    return c.json({
      success: true,
      contributors,
      count: contributors.length,
    });
  } catch (error) {
    console.error("Failed to get top contributors:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get contributors",
    }, 500);
  }
});

/**
 * GET /api/dashboard/content-distribution
 * Get content distribution by type
 */
dashboard.get("/content-distribution", async (c) => {
  try {
    const distribution = await dashboardService.getContentDistribution();

    return c.json({
      success: true,
      distribution,
    });
  } catch (error) {
    console.error("Failed to get content distribution:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get distribution",
    }, 500);
  }
});

/**
 * GET /api/dashboard/comment-activity
 * Get comment activity by content
 */
dashboard.get("/comment-activity", async (c) => {
  try {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;

    const activity = await dashboardService.getCommentActivity(limit);

    return c.json({
      success: true,
      activity,
      count: activity.length,
    });
  } catch (error) {
    console.error("Failed to get comment activity:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get activity",
    }, 500);
  }
});

/**
 * GET /api/dashboard/overview
 * Get comprehensive dashboard overview (all data at once)
 */
dashboard.get("/overview", async (c) => {
  try {
    const [
      stats,
      trends,
      recentActivity,
      popularContent,
      topContributors,
      contentDistribution,
      commentActivity,
    ] = await Promise.all([
      dashboardService.getDashboardStats(),
      dashboardService.getContentTrends(30),
      dashboardService.getRecentActivity(10),
      dashboardService.getPopularContent(5),
      dashboardService.getTopContributors(5),
      dashboardService.getContentDistribution(),
      dashboardService.getCommentActivity(5),
    ]);

    return c.json({
      success: true,
      overview: {
        stats,
        trends,
        recentActivity,
        popularContent,
        topContributors,
        contentDistribution,
        commentActivity,
      },
    });
  } catch (error) {
    console.error("Failed to get dashboard overview:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get overview",
    }, 500);
  }
});

export default dashboard;
