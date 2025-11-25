/**
 * Plugin Route Middleware
 * Handles dynamic routes registered by plugins
 */

import { Context, Next } from 'hono';
import { pluginRouteRegistry } from '../lib/plugin-system/PluginRouteRegistry.ts';
import { pluginManager } from '../lib/plugin-system/PluginManager.ts';

export async function pluginRouteMiddleware(c: Context, next: Next) {
    // Match pattern: /api/plugins/:pluginName/*
    const match = c.req.path.match(/^\/api\/plugins\/([^\/]+)(\/.*)?$/);

    if (!match) {
        return next();
    }

    const pluginName = match[1];
    const pluginPath = match[2] || '/';
    const method = c.req.method.toUpperCase();

    // Check if route exists
    const route = pluginRouteRegistry.getRoute(pluginName, method, pluginPath);

    if (!route) {
        return next(); // Let other handlers try
    }

    try {
        // Get plugin worker
        const worker = pluginManager.getWorker(pluginName);

        if (!worker) {
            return c.json({ error: 'Plugin not found or not active' }, 404);
        }

        // Execute route handler via RPC
        const result = await worker.executeRoute(route.handlerId, {
            method: c.req.method,
            path: pluginPath,
            query: c.req.query(),
            body: await c.req.json().catch(() => ({})),
            headers: Object.fromEntries(c.req.raw.headers.entries()),
            params: c.req.param()
        });

        // Handle response
        if (result && typeof result === 'object') {
            const status = result.status || 200;

            // Set custom headers if provided
            if (result.headers) {
                for (const [key, value] of Object.entries(result.headers)) {
                    c.header(key, value as string);
                }
            }

            // Return body or full result
            if (result.body !== undefined) {
                if (typeof result.body === 'string') {
                    return c.text(result.body, status);
                }
                return c.json(result.body, status);
            }

            return c.json(result, status);
        }

        return c.json(result);
    } catch (error: any) {
        console.error(`[PluginRoute] Error executing ${method} ${pluginPath} for ${pluginName}:`, error);

        return c.json({
            error: 'Plugin route execution failed',
            message: error.message
        }, 500);
    }
}
