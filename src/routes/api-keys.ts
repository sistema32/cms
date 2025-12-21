/**
 * API Key Management Routes
 * Admin routes for managing API keys
 */

import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.ts";
import { apiKeyManager, openAPIGenerator } from "../lib/api/index.ts";
import { API_PERMISSIONS } from "../lib/api/types.ts";
import { z } from "zod";

const apiKeys = new Hono();
const getUserId = (user: any) => Number(user?.userId ?? user?.id);

// All routes require admin authentication
apiKeys.use("*", authMiddleware);

/**
 * List all API keys for current user
 * GET /api/api-keys
 */
apiKeys.get("/", async (c) => {
  try {
    const user = c.get("user");
    const keys = await apiKeyManager.getUserAPIKeys(getUserId(user));

    // Don't return the actual key values for security
    const safeKeys = keys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 20)}...`,
    }));

    return c.json({
      success: true,
      data: safeKeys,
    });
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list API keys",
      },
      500
    );
  }
});

/**
 * Get all API keys (admin only)
 * GET /api/api-keys/all
 */
apiKeys.get("/all", async (c) => {
  try {
    const keys = await apiKeyManager.getAllAPIKeys();

    const safeKeys = keys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 20)}...`,
    }));

    return c.json({
      success: true,
      data: safeKeys,
    });
  } catch (error) {
    console.error("Failed to list all API keys:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list API keys",
      },
      500
    );
  }
});

/**
 * Create new API key
 * POST /api/api-keys
 */
const createAPIKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()),
  rateLimit: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
});

apiKeys.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = createAPIKeySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    const { name, permissions, rateLimit, expiresAt } = parsed.data;

    const apiKey = await apiKeyManager.createAPIKey({
      name,
      userId: getUserId(user),
      permissions: permissions as any[],
      rateLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return c.json({
      success: true,
      data: apiKey,
      message: "API key created successfully. Save the key value, it won't be shown again.",
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create API key",
      },
      500
    );
  }
});

/**
 * Get API key details
 * GET /api/api-keys/:id
 */
apiKeys.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid API key ID",
        },
        400
      );
    }

    const apiKey = await apiKeyManager.getById(id);

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error: "API key not found",
        },
        404
      );
    }

    // Check ownership
    if (apiKey.userId !== user.id) {
      return c.json(
        {
          success: false,
          error: "Access denied",
        },
        403
      );
    }

    // Don't return the actual key value
    const safeKey = {
      ...apiKey,
      key: `${apiKey.key.substring(0, 20)}...`,
    };

    return c.json({
      success: true,
      data: safeKey,
    });
  } catch (error) {
    console.error("Failed to get API key:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get API key",
      },
      500
    );
  }
});

/**
 * Update API key
 * PATCH /api/api-keys/:id
 */
const updateAPIKeySchema = z.object({
  name: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.number().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

apiKeys.patch("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid API key ID",
        },
        400
      );
    }

    // Check ownership
    const existing = await apiKeyManager.getById(id);
    if (!existing || existing.userId !== user.id) {
      return c.json(
        {
          success: false,
          error: "API key not found",
        },
        404
      );
    }

    const body = await c.req.json();
    const parsed = updateAPIKeySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    const updates: any = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.permissions !== undefined) {
      updates.permissions = parsed.data.permissions;
    }
    if (parsed.data.rateLimit !== undefined) updates.rateLimit = parsed.data.rateLimit;
    if (parsed.data.expiresAt !== undefined) {
      updates.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    }
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

    const updated = await apiKeyManager.updateAPIKey(id, updates);

    if (!updated) {
      return c.json(
        {
          success: false,
          error: "Failed to update API key",
        },
        500
      );
    }

    return c.json({
      success: true,
      data: {
        ...updated,
        key: `${updated.key.substring(0, 20)}...`,
      },
    });
  } catch (error) {
    console.error("Failed to update API key:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update API key",
      },
      500
    );
  }
});

/**
 * Delete API key
 * DELETE /api/api-keys/:id
 */
apiKeys.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid API key ID",
        },
        400
      );
    }

    // Check ownership
    const existing = await apiKeyManager.getById(id);
    if (!existing || existing.userId !== user.id) {
      return c.json(
        {
          success: false,
          error: "API key not found",
        },
        404
      );
    }

    const deleted = await apiKeyManager.deleteAPIKey(id);

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: "Failed to delete API key",
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete API key",
      },
      500
    );
  }
});

/**
 * Get API key usage stats
 * GET /api/api-keys/:id/usage
 */
apiKeys.get("/:id/usage", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid API key ID",
        },
        400
      );
    }

    // Check ownership
    const existing = await apiKeyManager.getById(id);
    if (!existing || existing.userId !== user.id) {
      return c.json(
        {
          success: false,
          error: "API key not found",
        },
        404
      );
    }

    const stats = await apiKeyManager.getUsageStats(id);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to get usage stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get usage stats",
      },
      500
    );
  }
});

/**
 * Get available permissions
 * GET /api/api-keys/permissions/list
 */
apiKeys.get("/permissions/list", (c) => {
  return c.json({
    success: true,
    data: Object.values(API_PERMISSIONS),
  });
});

export default apiKeys;
