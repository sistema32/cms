/**
 * Plugin Controller
 * HTTP handlers for plugin management endpoints
 */

import { Context } from 'hono';
import { pluginService } from '../services/pluginService.ts';
import { z } from 'zod';

// Validation schemas
const installPluginSchema = z.object({
  activate: z.boolean().optional().default(false),
});

const updateSettingsSchema = z.object({
  settings: z.record(z.any()),
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
      console.error('Error listing plugins:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to list plugins',
          message: (error as Error).message,
        },
        500
      );
    }
  }

  /**
   * GET /api/plugins/available
   * List available plugins (not installed)
   */
  async listAvailablePlugins(c: Context) {
    try {
      const available = await pluginService.getAvailablePlugins();

      // Get manifests for available plugins
      const pluginsWithInfo = await Promise.all(
        available.map(async (name) => {
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
            };
          } catch (error) {
            return {
              name,
              error: 'Failed to load manifest',
            };
          }
        })
      );

      return c.json({
        success: true,
        data: pluginsWithInfo,
      });
    } catch (error) {
      console.error('Error listing available plugins:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to list available plugins',
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
      console.error('Error getting plugin stats:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to get plugin stats',
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
            error: 'Plugin not found',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: plugin,
      });
    } catch (error) {
      console.error('Error getting plugin details:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to get plugin details',
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
      const body = await c.req.json();
      const { activate } = installPluginSchema.parse(body);

      const plugin = await pluginService.installPlugin(name, activate);

      return c.json({
        success: true,
        message: `Plugin "${name}" installed successfully`,
        data: plugin,
      });
    } catch (error) {
      console.error('Error installing plugin:', error);

      if ((error as Error).message.includes('not found')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not found',
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes('already installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin already installed',
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to install plugin',
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
      console.error('Error uninstalling plugin:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to uninstall plugin',
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

      await pluginService.activatePlugin(name);

      return c.json({
        success: true,
        message: `Plugin "${name}" activated successfully`,
      });
    } catch (error) {
      console.error('Error activating plugin:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes('already active')) {
        return c.json(
          {
            success: false,
            error: 'Plugin already active',
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to activate plugin',
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
      console.error('Error deactivating plugin:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      if ((error as Error).message.includes('already inactive')) {
        return c.json(
          {
            success: false,
            error: 'Plugin already inactive',
            message: (error as Error).message,
          },
          409
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to deactivate plugin',
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
      console.error('Error getting plugin settings:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to get plugin settings',
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

      await pluginService.updatePluginSettings(name, settings);

      return c.json({
        success: true,
        message: `Settings for plugin "${name}" updated successfully`,
      });
    } catch (error) {
      console.error('Error updating plugin settings:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: 'Validation error',
            details: error.errors,
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to update plugin settings',
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
      console.error('Error reloading plugin:', error);

      if ((error as Error).message.includes('not installed')) {
        return c.json(
          {
            success: false,
            error: 'Plugin not installed',
            message: (error as Error).message,
          },
          404
        );
      }

      return c.json(
        {
          success: false,
          error: 'Failed to reload plugin',
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
      console.error('Error validating plugin:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to validate plugin',
          message: (error as Error).message,
        },
        500
      );
    }
  }
}

export const pluginController = new PluginController();
