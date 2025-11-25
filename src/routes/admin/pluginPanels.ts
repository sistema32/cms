/**
 * Plugin Panel Rendering
 * Handles rendering of plugin admin panels
 */

import { Context } from 'hono';
import { pluginManager } from '../../lib/plugin-system/PluginManager.ts';
import { adminPanelRegistry } from '../../lib/plugin-system/AdminPanelRegistry.ts';

/**
 * Render a plugin admin panel
 */
export async function renderPluginPanel(c: Context) {
    const pluginName = c.req.param('pluginName');
    const panelId = c.req.param('panelId') || pluginName; // Default to plugin name

    try {
        // Get panel config
        const panel = adminPanelRegistry.get(panelId); // Note: Registry uses ID, not (pluginName, panelId)

        if (!panel) {
            return c.html(`
                <div style="padding: 2rem;">
                    <h1>Panel Not Found</h1>
                    <p>The panel "${panelId}" for plugin "${pluginName}" was not found.</p>
                    <a href="/admincp">← Back to Admin</a>
                </div>
            `, 404);
        }

        // Get plugin worker
        const worker = pluginManager.getWorker(pluginName);

        if (!worker) {
            return c.html(`
                <div style="padding: 2rem;">
                    <h1>Plugin Not Active</h1>
                    <p>The plugin "${pluginName}" is not active.</p>
                    <a href="/admincp/plugins">Activate Plugin →</a>
                </div>
            `, 404);
        }

        // Execute panel component via RPC
        // The component property in AdminPanelConfig is likely a string ID or similar in the new system?
        // Let's check AdminPanelConfig in types.ts.
        // Assuming component is a string handler ID for now as per previous logic.
        // Wait, previous logic was: sandbox.executeRoute(panel.componentId, ...)
        // AdminPanelConfig in types.ts says: component: (context: any) => Promise<string | any>;
        // But that's the Host side type. The registry stores what?
        // The registry stores AdminPanelConfig.
        // If the plugin registered it via RPC, the 'component' field might be a handler ID string?
        // Let's check HostAPI.ts registerAdminPanel.

        const html = await worker.executeRoute(panel.component as unknown as string, {
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
    const panels = adminPanelRegistry.getAll();

    return panels.map(panel => ({
        id: `plugin-${panel.id}`, // ID is unique enough?
        label: panel.title,
        icon: panel.icon || 'puzzle',
        path: `/admincp/plugins/${panel.id.split(':')[0]}/${panel.path}`, // Assuming ID is plugin:panel
        order: panel.order,
        badge: null
    }));
}
