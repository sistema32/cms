/**
 * Hot Reload Middleware
 * Injects hot reload script in development mode
 */

import type { Context, Next } from "hono";
import { getHotReloadScript, isHotReloadEnabled } from "../dev/hotReload.ts";

/**
 * Middleware to inject hot reload script in HTML responses
 */
export async function hotReloadMiddleware(c: Context, next: Next) {
  // Only run in development mode
  if (!isHotReloadEnabled()) {
    await next();
    return;
  }

  // Continue processing
  await next();

  // Only inject into HTML responses
  const contentType = c.res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return;
  }

  try {
    // Get response body
    const originalBody = await c.res.text();

    // Check if body contains </body> tag
    if (!originalBody.includes("</body>")) {
      // Return original response if no </body> tag
      const status = c.res.status && c.res.status >= 100 ? c.res.status : 200;
      c.res = new Response(originalBody, { status, headers: c.res.headers });
      return;
    }

    // Inject hot reload script before </body>
    const hotReloadScript = getHotReloadScript();
    const modifiedBody = originalBody.replace(
      "</body>",
      `${hotReloadScript}\n</body>`,
    );

    // Create new response with modified body
    const status = c.res.status && c.res.status >= 100 ? c.res.status : 200;
    c.res = new Response(modifiedBody, {
      status,
      headers: c.res.headers,
    });
  } catch (error) {
    console.error("Error injecting hot reload script:", error);
    // Don't break the response if injection fails
  }
}

/**
 * Helper to check if request should have hot reload
 */
export function shouldInjectHotReload(c: Context): boolean {
  if (!isHotReloadEnabled()) {
    return false;
  }

  // Don't inject in API routes
  const path = c.req.path;
  if (path.startsWith("/api/")) {
    return false;
  }

  // Don't inject in static assets
  const staticPaths = ["/assets/", "/themes/", "/uploads/"];
  if (staticPaths.some((p) => path.startsWith(p))) {
    return false;
  }

  return true;
}
