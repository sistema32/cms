/**
 * System Updates Routes
 * API endpoints for system updates management
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { systemUpdatesService } from "../lib/system-updates/index.ts";
import { logger } from "../lib/logger/index.ts";

const systemUpdatesRouter = new Hono();

// All routes require authentication
systemUpdatesRouter.use("/*", authMiddleware);

/**
 * GET /api/system-updates/check
 * Check for available updates
 */
systemUpdatesRouter.get("/check", async (c) => {
  try {
    logger.info("Checking for system updates via API");

    const result = await systemUpdatesService.checkForUpdates();

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Failed to check for updates", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to check for updates",
    }, 500);
  }
});

/**
 * GET /api/system-updates/news
 * Get news from central server
 */
systemUpdatesRouter.get("/news", async (c) => {
  try {
    const news = await systemUpdatesService.getNews();

    return c.json({
      success: true,
      news,
      count: news.length,
    });
  } catch (error) {
    logger.error("Failed to get news", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get news",
    }, 500);
  }
});

/**
 * POST /api/system-updates/download/:updateId
 * Download a specific update
 */
systemUpdatesRouter.post("/download/:updateId", async (c) => {
  try {
    const updateId = c.req.param("updateId");

    logger.info(`Downloading update: ${updateId}`);

    // First, get the update details
    const checkResult = await systemUpdatesService.checkForUpdates();
    const update = checkResult.updates.find((u) => u.id === updateId);

    if (!update) {
      return c.json({
        success: false,
        error: "Update not found",
      }, 404);
    }

    // Download the update
    const success = await systemUpdatesService.downloadUpdate(update);

    if (!success) {
      return c.json({
        success: false,
        error: "Failed to download update",
      }, 500);
    }

    return c.json({
      success: true,
      message: "Update downloaded successfully",
      updateId: update.id,
    });
  } catch (error) {
    logger.error("Failed to download update", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to download update",
    }, 500);
  }
});

/**
 * POST /api/system-updates/install/:updateId
 * Install a specific update
 */
systemUpdatesRouter.post("/install/:updateId", async (c) => {
  try {
    const updateId = c.req.param("updateId");

    logger.info(`Installing update: ${updateId}`);

    // First, get the update details
    const checkResult = await systemUpdatesService.checkForUpdates();
    const update = checkResult.updates.find((u) => u.id === updateId);

    if (!update) {
      return c.json({
        success: false,
        error: "Update not found",
      }, 404);
    }

    // Install the update
    const result = await systemUpdatesService.installUpdate(update);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error || "Failed to install update",
        logs: result.logs,
      }, 500);
    }

    return c.json({
      success: true,
      message: "Update installed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Failed to install update", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to install update",
    }, 500);
  }
});

/**
 * GET /api/system-updates/config
 * Get current update configuration
 */
systemUpdatesRouter.get("/config", async (c) => {
  try {
    const config = systemUpdatesService.getConfig();

    // Don't expose sensitive information like API keys
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? "***" : undefined,
      proxyAuth: config.proxyAuth
        ? { username: config.proxyAuth.username, password: "***" }
        : undefined,
    };

    return c.json({
      success: true,
      config: safeConfig,
    });
  } catch (error) {
    logger.error("Failed to get update config", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get config",
    }, 500);
  }
});

/**
 * PUT /api/system-updates/config
 * Update configuration
 */
systemUpdatesRouter.put("/config", async (c) => {
  try {
    const body = await c.req.json();

    logger.info("Updating system updates configuration");

    // Update the configuration
    systemUpdatesService.updateConfig(body);

    return c.json({
      success: true,
      message: "Configuration updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update config", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update config",
    }, 500);
  }
});

export default systemUpdatesRouter;
