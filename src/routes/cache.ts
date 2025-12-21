/**
 * Cache Management Routes
 * API endpoints for cache administration
 */

import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";
import { getCache, cacheManager } from "../lib/cache/index.ts";

const cache = new Hono();

// Protect all cache routes - require settings:update permission
cache.use("/*", authMiddleware);
cache.use("/*", requirePermission("settings", "update"));

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
cache.get("/stats", async (c) => {
  try {
    const cacheInstance = getCache();
    const stats = await cacheInstance.getStats();
    const cacheType = cacheManager.getCacheType();

    return c.json({
      type: cacheType,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting cache stats:", error);
    return c.json(
      {
        error: "Failed to get cache statistics",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/cache/keys
 * Get all cache keys (optionally filtered by pattern)
 */
cache.get("/keys", async (c) => {
  try {
    const pattern = c.req.query("pattern");
    const cacheInstance = getCache();

    const keys = await cacheInstance.keys(pattern);

    return c.json({
      keys,
      count: keys.length,
      pattern: pattern || "*",
    });
  } catch (error: any) {
    console.error("Error getting cache keys:", error);
    return c.json(
      {
        error: "Failed to get cache keys",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * GET /api/cache/health
 * Check cache health
 */
cache.get("/health", async (c) => {
  try {
    const cacheInstance = getCache();
    const isHealthy = await cacheInstance.isHealthy();
    const cacheType = cacheManager.getCacheType();

    return c.json({
      healthy: isHealthy,
      type: cacheType,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error checking cache health:", error);
    return c.json(
      {
        healthy: false,
        error: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/cache/clear
 * Clear all cache
 */
cache.post("/clear", async (c) => {
  try {
    const cacheInstance = getCache();
    await cacheInstance.clear();

    console.log("🗑️  Cache cleared by admin");

    return c.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    return c.json(
      {
        error: "Failed to clear cache",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/cache/clear-pattern
 * Clear cache by pattern
 */
cache.post("/clear-pattern", async (c) => {
  try {
    const body = await c.req.json();
    const { pattern } = body;

    if (!pattern) {
      return c.json({ error: "Pattern is required" }, 400);
    }

    const cacheInstance = getCache();
    await cacheInstance.deletePattern(pattern);

    console.log(`🗑️  Cache cleared for pattern: ${pattern}`);

    return c.json({
      success: true,
      message: `Cache cleared for pattern: ${pattern}`,
      pattern,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error clearing cache by pattern:", error);
    return c.json(
      {
        error: "Failed to clear cache by pattern",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * POST /api/cache/clear-tag
 * Clear cache by tag
 */
cache.post("/clear-tag", async (c) => {
  try {
    const body = await c.req.json();
    const { tag } = body;

    if (!tag) {
      return c.json({ error: "Tag is required" }, 400);
    }

    const cacheInstance = getCache();
    await cacheInstance.deleteByTag(tag);

    console.log(`🗑️  Cache cleared for tag: ${tag}`);

    return c.json({
      success: true,
      message: `Cache cleared for tag: ${tag}`,
      tag,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error clearing cache by tag:", error);
    return c.json(
      {
        error: "Failed to clear cache by tag",
        message: error.message,
      },
      500,
    );
  }
});

/**
 * DELETE /api/cache/:key
 * Delete a specific cache key
 */
cache.delete("/:key", async (c) => {
  try {
    const key = c.req.param("key");

    const cacheInstance = getCache();
    await cacheInstance.delete(key);

    console.log(`🗑️  Cache key deleted: ${key}`);

    return c.json({
      success: true,
      message: `Cache key deleted: ${key}`,
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting cache key:", error);
    return c.json(
      {
        error: "Failed to delete cache key",
        message: error.message,
      },
      500,
    );
  }
});

export default cache;
