/**
 * Plugin Routes
 * API endpoints for plugin management
 */

import { Hono } from "hono";
import { pluginController } from "../controllers/pluginController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const plugins = new Hono();

// ========== RUTAS PÚBLICAS (sin autenticación) ==========
// Los assets estáticos deben ser accesibles sin autenticación
// porque se cargan mediante <script>, <link>, etc. que no envían headers
plugins.get('/:name/assets/*', (c) => pluginController.serveAsset(c));

// El endpoint de render también debe ser público para mostrar sliders en el frontend
plugins.all('/:name/render/*', (c) => pluginController.handlePluginRequest(c));

// ========== RUTAS PROTEGIDAS (requieren autenticación) ==========
// Aplicar autenticación y permisos solo a rutas de API
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
plugins.delete('/:name/uninstall', (c) => pluginController.uninstallPlugin(c));

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

// Validate plugin manifest
plugins.get('/:name/validate', (c) => pluginController.validatePlugin(c));

// Dynamic Plugin API Routes
// This catches all other requests to /api/plugins/:name/*
plugins.all('/:name/*', (c) => pluginController.handlePluginRequest(c));

export default plugins;
