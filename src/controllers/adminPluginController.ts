import { Context } from "hono";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

export async function servePluginStaticFile(c: Context) {
    const pluginName = c.req.param("pluginName");
    // path will be /plugin/:pluginName/index.html (relative to admin router)
    // or /admincp/plugin/:pluginName/index.html (full path)

    // We need to extract the part after /plugin/:pluginName
    // The route is defined as /plugin/:pluginName/*

    // Hono's c.req.path is the full path.
    // We can rely on the wildcard capture if we used it, but here we just parse path.

    // Construct the prefix we expect in the URL
    // Note: This controller is mounted under adminRouter, which is mounted at env.ADMIN_PATH
    // But we don't need to know env.ADMIN_PATH if we just look for /plugin/{name}/

    // Check for missing trailing slash - DO NOT REDIRECT (causes loop with trailingSlashMiddleware)
    // Instead, handle it by assuming root
    let relativePath = "";
    if (c.req.path.endsWith(`/plugin/${pluginName}`)) {
        relativePath = "";
    } else {
        const pathParts = c.req.path.split(`/plugin/${pluginName}/`);
        if (pathParts.length < 2) return c.notFound();
        relativePath = pathParts[1];
    }

    // Ensure path starts with / for join, or just join relative
    // join("plugins", name, "public", "foo.html")

    // Prevent directory traversal
    if (relativePath.includes("..")) return c.notFound();

    // If relativePath is empty, we are at root, serve index.html
    if (relativePath === "") {
        relativePath = "index.html";
    }

    const filePath = join(Deno.cwd(), "plugins", pluginName, "public", relativePath);

    try {
        const content = await Deno.readFile(filePath);
        // Determine mime type
        let mime = "application/octet-stream";
        if (relativePath.endsWith(".html")) mime = "text/html";
        else if (relativePath.endsWith(".js")) mime = "application/javascript";
        else if (relativePath.endsWith(".css")) mime = "text/css";
        else if (relativePath.endsWith(".json")) mime = "application/json";
        else if (relativePath.endsWith(".png")) mime = "image/png";
        else if (relativePath.endsWith(".jpg")) mime = "image/jpeg";
        else if (relativePath.endsWith(".svg")) mime = "image/svg+xml";

        c.header("Content-Type", mime);
        return c.body(content);
    } catch {
        // SPA Fallback: If file not found and it's an HTML request (or no extension), serve index.html
        if (!relativePath.includes(".") || c.req.header("Accept")?.includes("text/html")) {
            try {
                const indexPath = join(Deno.cwd(), "plugins", pluginName, "public", "index.html");
                let indexContent = await Deno.readTextFile(indexPath);

                // Inject base tag for SPA routing
                // Ensure base path always ends with /
                let basePath = c.req.path.split(`/plugin/${pluginName}`)[0] + `/plugin/${pluginName}/`;
                const baseTag = `<base href="${basePath}" />`;

                // Insert base tag right after <head>
                indexContent = indexContent.replace(/<head>/i, `<head>\n    ${baseTag}`);

                c.header("Content-Type", "text/html");
                return c.html(indexContent);
            } catch {
                return c.notFound();
            }
        }
        return c.notFound();
    }
}
