/**
 * API Authentication Middleware
 * Validates API keys for public REST API access
 */

import type { Context, Next } from "hono";
import { apiKeyManager } from "@/lib/api/APIKeyManager.ts";
import type { APIPermission } from "@/lib/api/types.ts";

/**
 * API authentication middleware
 * Validates API key from Authorization header or query parameter
 */
export function apiAuthMiddleware(requiredPermission?: APIPermission) {
  return async (c: Context, next: Next) => {
    // Get API key from Authorization header or query parameter
    const authHeader = c.req.header("Authorization");
    const queryKey = c.req.query("api_key");

    let apiKey: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else if (queryKey) {
      apiKey = queryKey;
    }

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error: "API key required",
          message: "Provide API key via Authorization header (Bearer token) or api_key query parameter",
        },
        401
      );
    }

    // Validate API key
    const validation = await apiKeyManager.validateKey(apiKey, requiredPermission);

    if (!validation.valid) {
      return c.json(
        {
          success: false,
          error: "Invalid API key",
          message: validation.reason,
        },
        401
      );
    }

    // Check rate limit
    const rateLimitResult = await apiKeyManager.checkRateLimit(validation.apiKey!.id!);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", String(rateLimitResult.limit));
    c.header("X-RateLimit-Remaining", String(rateLimitResult.remaining));
    c.header("X-RateLimit-Reset", String(Math.floor(rateLimitResult.resetTime / 1000)));

    if (!rateLimitResult.allowed) {
      return c.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: `API key rate limit exceeded. Resets at ${new Date(rateLimitResult.resetTime).toISOString()}`,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        429
      );
    }

    // Store API key in context for later use
    c.set("apiKey", validation.apiKey);

    await next();
  };
}
