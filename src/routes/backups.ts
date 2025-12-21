/**
 * Backup Routes
 * API endpoints for backup management
 */

import { Hono } from "hono";
import { backupManager } from "../lib/backup/index.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";

const backupRoutes = new Hono();

// All routes require authentication and system:manage permission
backupRoutes.use("/*", authMiddleware, requirePermission("system", "manage"));

/**
 * GET /api/backups
 * List all backups with filtering
 */
backupRoutes.get("/", async (c) => {
  try {
    const type = c.req.query("type");
    const status = c.req.query("status");
    const storageProvider = c.req.query("storageProvider");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;

    const backups = await backupManager.getBackups({
      type: type as any,
      status: status as any,
      storageProvider: storageProvider as any,
      limit,
      offset,
    });

    return c.json({
      success: true,
      backups,
      count: backups.length,
    });
  } catch (error) {
    console.error("Failed to get backups:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get backups",
    }, 500);
  }
});

/**
 * GET /api/backups/stats
 * Get backup statistics
 */
backupRoutes.get("/stats", async (c) => {
  try {
    const stats = await backupManager.getStats();

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Failed to get backup stats:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    }, 500);
  }
});

/**
 * POST /api/backups
 * Create a new backup
 */
backupRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const backupId = await backupManager.createBackup({
      type: body.type || "full",
      includeDatabase: body.includeDatabase ?? true,
      includeMedia: body.includeMedia ?? true,
      includeConfig: body.includeConfig ?? true,
      compression: body.compression ?? true,
      notifyUser: body.notifyUser ?? true,
    }, Number(user?.userId ?? user?.id));

    return c.json({
      success: true,
      message: "Backup created successfully",
      backupId,
    }, 201);
  } catch (error) {
    console.error("Failed to create backup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create backup",
    }, 500);
  }
});

/**
 * GET /api/backups/:id
 * Get backup by ID
 */
backupRoutes.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const backup = await backupManager.getBackupById(id);

    if (!backup) {
      return c.json({
        success: false,
        error: "Backup not found",
      }, 404);
    }

    return c.json({
      success: true,
      backup,
    });
  } catch (error) {
    console.error("Failed to get backup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get backup",
    }, 500);
  }
});

/**
 * GET /api/backups/:id/verify
 * Verify backup integrity
 */
backupRoutes.get("/:id/verify", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const result = await backupManager.verifyBackup(id);

    return c.json({
      success: true,
      verification: result,
    });
  } catch (error) {
    console.error("Failed to verify backup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify backup",
    }, 500);
  }
});

/**
 * DELETE /api/backups/:id
 * Delete backup
 */
backupRoutes.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await backupManager.deleteBackup(id);

    return c.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete backup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete backup",
    }, 500);
  }
});

/**
 * POST /api/backups/:id/download
 * Get download URL for backup (or stream it)
 */
backupRoutes.get("/:id/download", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const backup = await backupManager.getBackupById(id);

    if (!backup) {
      return c.json({
        success: false,
        error: "Backup not found",
      }, 404);
    }

    // Read file and stream it
    const file = await Deno.readFile(backup.storagePath);

    return new Response(file, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${backup.filename}"`,
        "Content-Length": backup.size.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to download backup:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to download backup",
    }, 500);
  }
});

export default backupRoutes;
