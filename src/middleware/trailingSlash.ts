import { Context, Next } from "hono";

/**
 * Trailing Slash Middleware
 * Normalizes URLs by removing trailing slashes (except for root "/")
 * Redirects /path/ to /path with 301 (permanent redirect)
 */
export const trailingSlashMiddleware = async (c: Context, next: Next) => {
  const url = new URL(c.req.url);
  const path = url.pathname;

  // If path has trailing slash and is not root "/"
  if (path.length > 1 && path.endsWith("/")) {
    // Remove trailing slash
    const newPath = path.slice(0, -1);

    // Build new URL with query params
    const newUrl = newPath + url.search;

    // Redirect with 301 (permanent)
    return c.redirect(newUrl, 301);
  }

  await next();
};
