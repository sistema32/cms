/**
 * Plugin Panel Rendering
 * Handles rendering of plugin admin panels
 */

import { Context } from 'hono';
import { pluginManager } from '../../lib/plugins/core/PluginManager.ts';
import { pluginAdminRegistry } from '../../lib/plugins/core/PluginAdminRegistry.ts';

/**
 * Render a plugin admin panel
 */
export async function renderPluginPanel(c: Context) {
    const pluginName = c.req.param('pluginName');
    const panelId = c.req.param('panelId') || pluginName; // Default to plugin name

    try {
        // Get panel config
        const panel = pluginAdminRegistry.getPanel(pluginName, panelId);

        if (!panel) {
            return c.html(`
                <div style="padding: 2rem;">
                    <h1>Panel Not Found</h1>
                    <p>The panel "${panelId}" for plugin "${pluginName}" was not found.</p>
                    <a href="/admincp">← Back to Admin</a>
                </div>
            `, 404);
        }

        // Get plugin sandbox
        const sandbox = pluginManager.getPlugin(pluginName);

        if (!sandbox) {
            return c.html(`
                <div style="padding: 2rem;">
                    <h1>Plugin Not Active</h1>
                    <p>The plugin "${pluginName}" is not active.</p>
                    <a href="/admincp/plugins">Activate Plugin →</a>
                </div>
            `, 404);
        }

        // Execute panel component via RPC
        const html = await sandbox.executeRoute(panel.componentId, {
            method: 'GET',
            path: c.req.path,
            query: c.req.query(),
            headers: Object.fromEntries(c.req.raw.headers.entries())
        });

        return c.html(html);
    } catch (error: any) {
        console.error(`Error rendering plugin panel ${pluginName}/${panelId}:`, error);
        return c.html(`
            <div style="padding: 2rem;">
                <h1>Error</h1>
                <p>Failed to render plugin panel: ${error.message}</p>
                <a href="/admincp">← Back to Admin</a>
            </div>
        `, 500);
    }
}

/**
 * Get plugin menu items for admin sidebar
 */
export function getPluginMenuItems() {
    const panels = pluginAdminRegistry.getMenuPanels();

    return panels.map(panel => ({
        id: `plugin-${panel.pluginName}-${panel.id}`,
        label: panel.title,
        icon: panel.icon || 'puzzle',
        path: `/admincp/plugins/${panel.pluginName}/${panel.path}`,
        order: panel.order,
        badge: null
    }));
}
