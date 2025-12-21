/**
 * Audit Middleware
 * Automatically logs API requests and responses
 */

import type { Context, Next } from "hono";
import { auditLogger, extractAuditContext } from "@/lib/audit/index.ts";

/**
 * Audit middleware for logging API requests
 * Logs all requests to protected endpoints
 */
export async function auditMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  const path = c.req.path;

  // Skip audit logging for certain paths
  const skipPaths = [
    "/api/health",
    "/api/audit/query", // Avoid recursive logging
    "/api/cache/stats", // Stats endpoints
    "/uploads/",
  ];

  const shouldSkip = skipPaths.some((skipPath) => path.startsWith(skipPath));

  if (shouldSkip || method === "GET") {
    // Don't log GET requests to reduce noise
    await next();
    return;
  }

  const startTime = Date.now();
  const context = extractAuditContext(c);

  try {
    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    // Only log if there's a user (authenticated requests)
    if (context.userId) {
      // Determine action and entity from path
      const pathParts = path.split("/").filter(Boolean);
      const entity = pathParts[1] || "system"; // api/users -> users
      const action = mapMethodToAction(method);

      // Extract entity ID from path if present
      const entityId = pathParts[2] && !isNaN(Number(pathParts[2]))
        ? pathParts[2]
        : undefined;

      // Only log successful mutations (2xx status codes)
      if (status >= 200 && status < 300) {
        await auditLogger.debug(
          action,
          entity,
          {
            ...context,
            entityId,
            description: `${method} ${path} (${status}) - ${duration}ms`,
            metadata: {
              method,
              path,
              status,
              duration,
            },
          },
        );
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log errors
    if (context.userId) {
      const pathParts = path.split("/").filter(Boolean);
      const entity = pathParts[1] || "system";
      const action = mapMethodToAction(method);

      await auditLogger.error(
        action,
        entity,
        {
          ...context,
          description: `${method} ${path} - Error after ${duration}ms`,
          error: error as Error,
          metadata: {
            method,
            path,
            duration,
          },
        },
      );
    }

    throw error;
  }
}

/**
 * Map HTTP method to audit action
 */
function mapMethodToAction(method: string): string {
  const actionMap: Record<string, string> = {
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
    GET: "read",
  };

  return actionMap[method] || method.toLowerCase();
}
