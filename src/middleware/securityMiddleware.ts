/**
 * Security Middleware
 * Provides IP blocking, rate limiting, and security headers
 */

import type { Context, Next } from "hono";
import { securityManager } from "../lib/security/SecurityManager.ts";
import { globalRateLimiter } from "../lib/security/RateLimiter.ts";
import type { SecurityHeaders } from "../lib/security/types.ts";
import { env } from "../config/env.ts";

/**
 * Get client IP from request
 */
function getClientIP(c: Context): string {
  // Check X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Check X-Real-IP header
  const realIP = c.req.header("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to unknown
  return "unknown";
}

/**
 * IP Blocking Middleware
 * Blocks requests from blacklisted IPs
 */
export async function ipBlockingMiddleware(c: Context, next: Next) {
  const ip = getClientIP(c);

  // Check if IP is whitelisted (skip all checks)
  if (await securityManager.isIPWhitelisted(ip)) {
    return await next();
  }

  // Check if IP is blocked
  if (await securityManager.isIPBlocked(ip)) {
    await securityManager.logEvent(
      "ip_blocked",
      ip,
      "medium",
      {
        path: c.req.path,
        method: c.req.method,
        userAgent: c.req.header("user-agent"),
      },
    );

    return c.json({
      success: false,
      error: "Access denied",
    }, 403);
  }

  await next();
}

/**
 * Rate Limiting Middleware
 * Limits requests per IP
 */
export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip = getClientIP(c);

  // Skip rate limiting for whitelisted IPs
  if (await securityManager.isIPWhitelisted(ip)) {
    return await next();
  }

  // Check rate limit
  const result = await globalRateLimiter.check(ip);

  // Set rate limit headers
  c.header("X-RateLimit-Limit", String(100));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(Math.floor(result.resetTime / 1000)));

  if (!result.allowed) {
    // Log rate limit exceeded
    await securityManager.logEvent(
      "rate_limit_exceeded",
      ip,
      "low",
      {
        path: c.req.path,
        method: c.req.method,
        userAgent: c.req.header("user-agent"),
      },
    );

    // Auto-block after too many violations
    const recentEvents = await securityManager.getRecentEventsByIP(ip, 60 * 1000);
    const rateLimitViolations = recentEvents.filter((e) => e.type === "rate_limit_exceeded").length;

    if (rateLimitViolations >= 10) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await securityManager.blockIP(ip, "Auto-blocked: Too many rate limit violations", expiresAt);
    }

    return c.json({
      success: false,
      error: "Too many requests",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    }, 429);
  }

  await next();
}

/**
 * Security Headers Middleware
 * Adds security-related HTTP headers
 */
export function securityHeadersMiddleware(c: Context, next: Next) {
  const isDevelopment = env.DENO_ENV === "development";

  const headers: SecurityHeaders = {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "SAMEORIGIN",

    // XSS Protection (legacy, but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Strict Transport Security (HTTPS only)
    "Strict-Transport-Security": isDevelopment
      ? "max-age=0" // Disable in development
      : "max-age=31536000; includeSubDomains; preload",

    // Content Security Policy
    "Content-Security-Policy": isDevelopment
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://ui-avatars.com https:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' blob:;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://ui-avatars.com https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (formerly Feature Policy)
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };

  // Apply headers
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value);
  }

  return next();
}

/**
 * Request Inspection Middleware
 * Detects suspicious patterns in requests
 */
export async function requestInspectionMiddleware(c: Context, next: Next) {
  const ip = getClientIP(c);
  const path = c.req.path;
  const query = c.req.query();
  const userAgent = c.req.header("user-agent") || "";

  // Check for SQL injection in query parameters
  for (const [key, value] of Object.entries(query)) {
    if (securityManager.detectSQLInjection(value)) {
      await securityManager.logEvent(
        "sql_injection_attempt",
        ip,
        "critical",
        {
          path,
          method: c.req.method,
          userAgent,
          details: { parameter: key, value },
        },
      );

      return c.json({
        success: false,
        error: "Invalid request",
      }, 400);
    }

    // Check for XSS
    if (securityManager.detectXSS(value)) {
      await securityManager.logEvent(
        "xss_attempt",
        ip,
        "high",
        {
          path,
          method: c.req.method,
          userAgent,
          details: { parameter: key, value },
        },
      );

      return c.json({
        success: false,
        error: "Invalid request",
      }, 400);
    }
  }

  // Check for path traversal in URL
  if (securityManager.detectPathTraversal(path)) {
    await securityManager.logEvent(
      "suspicious_activity",
      ip,
      "high",
      {
        path,
        method: c.req.method,
        userAgent,
        details: { reason: "path_traversal_attempt" },
      },
    );

    return c.json({
      success: false,
      error: "Invalid request",
    }, 400);
  }

  // Check for suspicious user agents (basic bot detection)
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
  ];

  if (suspiciousUserAgents.some((pattern) => pattern.test(userAgent))) {
    await securityManager.logEvent(
      "suspicious_activity",
      ip,
      "medium",
      {
        path,
        method: c.req.method,
        userAgent,
        details: { reason: "suspicious_user_agent" },
      },
    );

    return c.json({
      success: false,
      error: "Access denied",
    }, 403);
  }

  await next();
}

/**
 * Combined security middleware
 * Applies all security measures
 */
export async function securityMiddleware(c: Context, next: Next) {
  // Apply security headers
  await securityHeadersMiddleware(c, async () => {
    // Check IP blocking
    await ipBlockingMiddleware(c, async () => {
      // Apply rate limiting
      await rateLimitMiddleware(c, async () => {
        // Inspect request
        await requestInspectionMiddleware(c, next);
      });
    });
  });
}
