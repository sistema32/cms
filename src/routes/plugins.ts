/**
 * Plugin Routes
 * API endpoints for plugin management
 */

import { Hono } from "hono";
import { pluginController } from "../controllers/pluginController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const plugins = new Hono();

// All plugin routes require authentication and admin permissions
plugins.use('/*', authMiddleware);
plugins.use('/*', requirePermission('settings', 'update')); // Require settings:update permission

// List all installed plugins
plugins.get('/', (c) => pluginController.listPlugins(c));

// List available plugins (not installed)
plugins.get('/available', (c) => pluginController.listAvailablePlugins(c));

// Get plugin statistics
plugins.get('/stats', (c) => pluginController.getStats(c));

// Get plugin details
plugins.get('/:name', (c) => pluginController.getPlugin(c));

// Install a plugin
plugins.post('/:name/install', (c) => pluginController.installPlugin(c));

// Uninstall a plugin
plugins.delete('/:name', (c) => pluginController.uninstallPlugin(c));

// Activate a plugin
plugins.post('/:name/activate', (c) => pluginController.activatePlugin(c));

// Deactivate a plugin
plugins.post('/:name/deactivate', (c) => pluginController.deactivatePlugin(c));

// Get plugin settings
plugins.get('/:name/settings', (c) => pluginController.getSettings(c));

// Update plugin settings
plugins.patch('/:name/settings', (c) => pluginController.updateSettings(c));

// Reload a plugin
plugins.post('/:name/reload', (c) => pluginController.reloadPlugin(c));

// Serve plugin assets
plugins.get('/:name/assets/*', (c) => pluginController.serveAsset(c));

// Validate plugin manifest
plugins.get('/:name/validate', (c) => pluginController.validatePlugin(c));

export default plugins;
