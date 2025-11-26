import { Context } from "hono";
import { adminPanelRegistry } from "../lib/plugin-system/AdminPanelRegistry.ts";
import { pluginManager } from "../lib/plugin-system/PluginManager.ts";

/**
 * Admin Menu API
 * Returns all registered admin menu items from plugins
 */
export async function getAdminMenu(c: Context) {
    try {
        const menus = adminPanelRegistry.getAllMenus();

        return c.json({
            success: true,
            data: menus || []
        });
    } catch (error) {
        console.error('[Admin] Error fetching menu:', error);
        return c.json({
            success: false,
            error: 'Failed to fetch admin menu',
            message: (error as Error).message
        }, 500);
    }
}

/**
 * Render Plugin Admin Page
 * Handles requests to plugin admin pages and executes their render callbacks
 */
export async function renderPluginAdminPage(c: Context) {
    try {
        const path = c.req.path;

        // Get page registration from registry
        const page = adminPanelRegistry.getPage(path);

        if (!page) {
            return c.html('<h1>404 - Page Not Found</h1><p>This admin page is not registered.</p>', 404);
        }

        // Get the active worker for this plugin
        const worker = pluginManager.getWorker(page.pluginName);

        if (!worker) {
            return c.html(`<h1>Error</h1><p>Plugin "${page.pluginName}" is not active.</p>`, 500);
        }

        // Extract params from path if any (e.g., /admincp/lexslider/edit/:id)
        const params = c.req.param();

        // Call the render callback via RPC
        const result = await worker.callRPC('renderAdminPage', page.renderId, params);

        // Return the rendered content
        // The result could be HTML string or a component
        if (typeof result === 'string') {
            return c.html(result);
        } else if (result) {
            // If it's a component or object, serialize it
            return c.json(result);
        } else {
            return c.html('<h1>Error</h1><p>Render function returned empty result.</p>', 500);
        }
    } catch (error) {
        console.error('[Admin] Error rendering plugin page:', error);
        return c.html(`<h1>Error</h1><p>Failed to render page: ${(error as Error).message}</p>`, 500);
    }
}
