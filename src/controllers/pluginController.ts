/**
 * Plugin Controller
 * HTTP handlers for plugin management endpoints
 */

import { Context } from "hono";
import { pluginService } from "../services/pluginService.ts";
import { z } from "zod";
import {
  validatePluginName,
  validatePluginSettings,
  checkRateLimit,
} from "../utils/pluginValidation.ts";
import { logger } from "../lib/logger/index.ts";
import { marketplaceService } from "../services/marketplaceService.ts";

// Validation schemas
const installPluginSchema = z.object({
  activate: z.boolean().optional().default(false),
});

const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});

export class PluginController {
  /**
   * GET /api/plugins
   * List all installed plugins
   */
  async listPlugins(c: Context) {
    try {
      const plugins = await pluginService.getAllPlugins();

      return c.json({
        success: true,
        data: plugins,
      });
    } catch (error) {
      logger.error("Error listing plugins", error as Error);
      return c.json(
        {
          success: false,
          error: "Failed to list plugins",
          message: (error as Error).message,
        },
        500
      );
    }
  }



  // ...

  /**
   * GET /api/plugins/available
   * List available plugins (not installed)
   */
  async listAvailablePlugins(c: Context) {
    try {
      // Get local available plugins
      const localAvailable = await pluginService.getAvailablePlugins();

      // Get marketplace plugins
      const marketplacePlugins = await marketplaceService.getPlugins();

      // Get installed plugins to exclude them from marketplace list
      const installedPlugins = await pluginService.getAllPlugins();
      const installedNames = new Set(installedPlugins.map(p => p.name));

      // Map local plugins
      const localPluginsWithInfo = await Promise.all(
        localAvailable.map(async (name) => {
          try {
            const manifest = await pluginService.getPluginManifest(name);
            return {
              name,
              displayName: manifest.displayName,
              description: manifest.description,
              version: manifest.version,
              author: manifest.author,
              category: manifest.category,
              tags: manifest.tags,
              source: 'local',
              isInstalled: false,
            };
          } catch (error) {
            return {
              name,
              error: "Failed to load manifest",
              source: 'local',
            };
          }
        })
      );

      // Filter out marketplace plugins that are already local or installed
      const localNames = new Set(localAvailable);

      const remotePlugins = marketplacePlugins
        .filter(p => !localNames.has(p.name) && !installedNames.has(p.name))
        .map(p => ({
          ...p,
          source: 'marketplace',
          isInstalled: false,
        }));

      return c.json({
        success: true,
        data: [...localPluginsWithInfo, ...remotePlugins],
      });
    } catch (error) {
      logger.error("Error listing available plugins", error as Error);
      return c.json(
        {
          success: false,
          error: "Failed to list available plugins",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * GET /api/plugins/stats
   * Get plugin statistics
   */
  async getStats(c: Context) {
    try {
      const stats = await pluginService.getPluginStats();

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting plugin stats", error as Error);
      return c.json(
        {
          success: false,
          error: "Failed to get plugin stats",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * GET /api/plugins/:name
   * Get plugin details
   */
  async getPlugin(c: Context) {
    try {
      const name = c.req.param('name');
      const plugin = await pluginService.getPluginDetails(name);

      if (!plugin) {
        return c.json(
          {
            success: false,
            error: "Plugin not found",
          },
          404
        );
      }

      return c.json({
        success: true,
        data: plugin,
      });
    } catch (error) {
      logger.error("Error getting plugin details", error as Error);
      return c.json(
        {
          success: false,
          error: "Failed to get plugin details",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * POST /api/plugins/:name/install
   * Install a plugin
   */
  async installPlugin(c: Context) {
    try {
      const name = c.req.param('name');

      // Validate plugin name
      const nameValidation = validatePluginName(name);
      if (!nameValidation.valid) {
        return c.json(
          {
            success: false,
            error: "Invalid plugin name",
            message: nameValidation.error,
          },
          400
        );
      }

      // Check rate limit
      const rateLimit = checkRateLimit(`install-plugin`, 5, 60000); // 5 installs per minute
      if (!rateLimit.allowed) {
        return c.json(
          {
            success: false,
            error: "Rate limit exceeded",
            message: `Too many plugin installations. Try again in ${rateLimit.retryAfter} seconds.`,
          },
          429
        );
      }

      const body = await c.req.json();
      const { activate } = installPluginSchema.parse(body);

      const plugin = await pluginService.installPlugin(name, activate);

      return c.json({
        success: true,
        message: `Plugin "${name}" installed successfully`,
        data: plugin,
      });
    } catch (error) {
      logger.error("Error installing plugin", error as Error);

      if ((error as Error).message.includes("not found")) {
        return c.json(
          {
            success: false,
            error: "Plugin not found",
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes("already installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin already installed",
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to install plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * DELETE /api/plugins/:name
   * Uninstall a plugin
   */
  async uninstallPlugin(c: Context) {
    try {
      const name = c.req.param('name');

      await pluginService.uninstallPlugin(name);

      return c.json({
        success: true,
        message: `Plugin "${name}" uninstalled successfully`,
      });
    } catch (error) {
      logger.error("Error uninstalling plugin", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to uninstall plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * POST /api/plugins/:name/activate
   * Activate a plugin
   */
  async activatePlugin(c: Context) {
    try {
      const name = c.req.param('name');

      // Validate plugin name
      const nameValidation = validatePluginName(name);
      if (!nameValidation.valid) {
        return c.json(
          {
            success: false,
            error: "Invalid plugin name",
            message: nameValidation.error,
          },
          400
        );
      }

      // Check rate limit
      const rateLimit = checkRateLimit(`activate-plugin-${name}`, 3, 10000); // 3 activations per 10 seconds
      if (!rateLimit.allowed) {
        return c.json(
          {
            success: false,
            error: "Rate limit exceeded",
            message: `Too many activation attempts. Try again in ${rateLimit.retryAfter} seconds.`,
          },
          429
        );
      }

      await pluginService.activatePlugin(name);

      return c.json({
        success: true,
        message: `Plugin "${name}" activated successfully`,
      });
    } catch (error) {
      logger.error("Error activating plugin", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes("already active")) {
        return c.json(
          {
            success: false,
            error: "Plugin already active",
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to activate plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * POST /api/plugins/:name/deactivate
   * Deactivate a plugin
   */
  async deactivatePlugin(c: Context) {
    try {
      const name = c.req.param('name');

      await pluginService.deactivatePlugin(name);

      return c.json({
        success: true,
        message: `Plugin "${name}" deactivated successfully`,
      });
    } catch (error) {
      logger.error("Error deactivating plugin", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes("already inactive")) {
        return c.json(
          {
            success: false,
            error: "Plugin already inactive",
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to deactivate plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * GET /api/plugins/:name/settings
   * Get plugin settings
   */
  async getSettings(c: Context) {
    try {
      const name = c.req.param('name');

      const settings = await pluginService.getPluginSettings(name);

      return c.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error("Error getting plugin settings", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to get plugin settings",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * PATCH /api/plugins/:name/settings
   * Update plugin settings
   */
  async updateSettings(c: Context) {
    try {
      const name = c.req.param('name');
      const body = await c.req.json();
      const { settings } = updateSettingsSchema.parse(body);

      // Validate plugin name
      const nameValidation = validatePluginName(name);
      if (!nameValidation.valid) {
        return c.json(
          {
            success: false,
            error: "Invalid plugin name",
            message: nameValidation.error,
          },
          400
        );
      }

      // Validate settings object
      const settingsValidation = validatePluginSettings(settings);
      if (!settingsValidation.valid) {
        return c.json(
          {
            success: false,
            error: "Invalid settings",
            message: settingsValidation.error,
          },
          400
        );
      }

      await pluginService.updatePluginSettings(name, settings);

      return c.json({
        success: true,
        message: `Settings for plugin "${name}" updated successfully`,
      });
    } catch (error) {
      logger.error("Error updating plugin settings", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to update plugin settings",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * POST /api/plugins/:name/reload
   * Reload a plugin (deactivate and activate)
   */
  async reloadPlugin(c: Context) {
    try {
      const name = c.req.param('name');

      await pluginService.reloadPlugin(name);

      return c.json({
        success: true,
        message: `Plugin "${name}" reloaded successfully`,
      });
    } catch (error) {
      logger.error("Error reloading plugin", error as Error);

      if ((error as Error).message.includes("not installed")) {
        return c.json(
          {
            success: false,
            error: "Plugin not installed",
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to reload plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * GET /api/plugins/:name/validate
   * Validate plugin manifest
   */
  async validatePlugin(c: Context) {
    try {
      const name = c.req.param('name');

      const validation = await pluginService.validatePlugin(name);

      return c.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error("Error validating plugin", error as Error);
      return c.json(
        {
          success: false,
          error: "Failed to validate plugin",
          message: (error as Error).message,
        },
        500
      );
    }
  }
  /**
   * GET /api/plugins/:name/assets/*
   * Serve plugin assets
   */
  async serveAsset(c: Context) {
    try {
      const name = c.req.param('name');
      // Extract asset path from the wildcard param
      // Hono stores wildcard capture in route param if named, or we can parse URL
      // Assuming route is /:name/assets/*
      const url = new URL(c.req.url);
      const match = url.pathname.match(new RegExp(`/api/plugins/${name}/assets/(.+)`));

      if (!match) {
        return c.notFound();
      }

      const assetPath = match[1];
      const fullPath = pluginService.getPluginAssetPath(name, assetPath);

      if (!fullPath) {
        return c.notFound();
      }

      try {
        const content = await Deno.readFile(fullPath);

        // Simple mime type detection
        const ext = fullPath.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        const mimeTypes: Record<string, string> = {
          'js': 'application/javascript',
          'css': 'text/css',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'svg': 'image/svg+xml',
          'json': 'application/json',
          'html': 'text/html',
          'txt': 'text/plain',
          'woff': 'font/woff',
          'woff2': 'font/woff2',
          'ttf': 'font/ttf',
        };

        if (ext && mimeTypes[ext]) {
          mimeType = mimeTypes[ext];
        }

        c.header('Content-Type', mimeType);
        // Cache control
        c.header('Cache-Control', 'public, max-age=3600');

        return c.body(content);
      } catch (error) {
        return c.notFound();
      }
    } catch (error) {
      logger.error("Error serving plugin asset", error as Error);
      return c.notFound();
    }
  }


  /**
   * Handle dynamic plugin API requests
   * GET/POST/PUT/DELETE /api/plugins/:name/*
   */
  async handlePluginRequest(c: Context) {
    try {
      const name = c.req.param('name');
      const url = new URL(c.req.url);
      const path = url.pathname.replace(`/api/plugins/${name}`, '');
      const method = c.req.method;

      console.log(`[PluginController] Handling ${method} ${path} for plugin ${name}`);

      // Import registry
      const { pluginRouteRegistry } = await import("../lib/plugin-system/PluginRouteRegistry.ts");

      // Find matching route
      const route = pluginRouteRegistry.matchRoute(name, method, path);

      if (!route) {
        console.log(`[PluginController] No route found for ${method} ${path}`);
        return c.json({
          success: false,
          error: "Ruta no encontrada",
          path: `/api/plugins/${name}${path}`
        }, 404);
      }

      console.log(`[PluginController] Found route: ${route.handlerId}`);

      // Get plugin worker
      const worker = pluginService.getPluginWorker(name);
      if (!worker) {
        console.log(`[PluginController] Plugin ${name} not active`);
        return c.json({ error: "Plugin not active" }, 503);
      }

      // Extract path parameters
      const pattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);
      const params: Record<string, string> = {};

      if (match) {
        const paramNames = (route.path.match(/:([^/]+)/g) || []).map(p => p.substring(1));
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
      }

      console.log(`[PluginController] Path params:`, params);

      // Prepare request object
      const requestData = {
        method,
        path,
        query: c.req.query(),
        params,
        body: method !== 'GET' ? await c.req.json().catch(() => ({})) : {},
        headers: c.req.header(),
      };

      console.log(`[PluginController] Executing route ${route.handlerId}`);

      // Execute route in worker
      const response = await worker.executeRoute(route.handlerId, requestData);

      console.log(`[PluginController] Response:`, response);

      // Handle serialized Response objects from worker
      if (response && typeof response === 'object' && response._isResponse) {
        const contentType = response.headers['content-type'];
        if (contentType?.includes('application/json')) {
          return c.json(JSON.parse(response.body), response.status);
        }
        return c.text(response.body, response.status);
      }

      // Handle Response objects
      if (response instanceof Response) {
        const body = await response.text();
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          return c.json(JSON.parse(body), response.status);
        }
        return c.text(body, response.status);
      }

      // Handle plain objects
      if (response && typeof response === 'object' && 'body' in response) {
        return c.json(response.body, response.status || 200, response.headers);
      }

      return c.json(response);

    } catch (error) {
      logger.error("Error handling plugin request", error as Error);
      console.error(`[PluginController] Error:`, error);
      return c.json({ error: (error as Error).message }, 500);
    }
  }
}

export const pluginController = new PluginController();
