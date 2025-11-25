/**
 * Plugin Asset Middleware
 * Serves static files from plugin directories
 */

import { Context, Next } from 'hono';
import { join } from '@std/path';
import { exists } from '@std/fs';

const MIME_TYPES: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

export async function pluginAssetMiddleware(c: Context, next: Next) {
    // Match pattern: /api/plugins/:pluginName/assets/*
    const match = c.req.path.match(/^\/api\/plugins\/([^\/]+)\/assets\/(.+)$/);

    if (!match) {
        return next();
    }

    const pluginName = match[1];
    const assetPath = match[2];

    // Security: Prevent directory traversal
    if (assetPath.includes('..') || assetPath.includes('~')) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    try {
        // Construct file path
        const pluginsDir = join(Deno.cwd(), 'plugins');
        const filePath = join(pluginsDir, pluginName, 'assets', assetPath);

        // Check if file exists
        if (!await exists(filePath)) {
            return c.json({ error: 'Asset not found' }, 404);
        }

        // Get file extension
        const ext = assetPath.substring(assetPath.lastIndexOf('.'));
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        // Read file
        const content = await Deno.readFile(filePath);

        // Set cache headers (1 hour for development, 1 year for production)
        const maxAge = Deno.env.get('NODE_ENV') === 'production' ? 31536000 : 3600;

        c.header('Content-Type', mimeType);
        c.header('Cache-Control', `public, max-age=${maxAge}`);

        // Return file content
        return c.body(content);
    } catch (error: any) {
        console.error(`[PluginAssets] Error serving ${assetPath} for ${pluginName}:`, error);
        return c.json({ error: 'Failed to serve asset' }, 500);
    }
}
