/**
 * Security Middleware
 * Provides IP blocking, rate limiting, and security headers
 */

import type { Context, Next } from "hono";
import { securityManager } from "@/lib/security/SecurityManager.ts";
import { globalRateLimiter } from "@/lib/security/RateLimiter.ts";
import type { SecurityHeaders } from "@/lib/security/types.ts";
import { env } from "@/config/env.ts";
import { AppError, isAppError } from "@/platform/errors.ts";
import { checkRouteRateLimit } from "@/lib/security/routeRateLimiter.ts";

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

const ADMIN_BASE_PATH = env.ADMIN_PATH;
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BASE_HOST = (() => {
  try {
    return new URL(env.BASE_URL).host;
  } catch (_err) {
    return null;
  }
})();

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

function injectNonce(html: string, nonce: string): string {
  const withScripts = html.replace(
    /<script(?![^>]*\bnonce=)([^>]*)>/gi,
    (_match, attrs) => `<script nonce="${nonce}"${attrs ?? ""}>`,
  );
  return withScripts.replace(
    /<style(?![^>]*\bnonce=)([^>]*)>/gi,
    (_match, attrs) => `<style nonce="${nonce}"${attrs ?? ""}>`,
  );
}

function isHtmlResponse(res?: Response) {
  const contentType = res?.headers.get("Content-Type") || "";
  return contentType.includes("text/html");
}

function buildCspHeader(path: string, _nonce: string, isDevelopment: boolean): string {
  const commonDirectives = [
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  const connectSrc = isDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'";
  const mediaSrc = "media-src 'self' blob:";
  const unsafeEval = isDevelopment ? " 'unsafe-eval'" : "";

  if (path.startsWith(ADMIN_BASE_PATH)) {
    // Admin panel: All assets now served locally (TipTap, Chart.js, Swagger UI, etc.)
    // Only external: Google Fonts
    return [
      "default-src 'self'",
      `script-src 'self'${unsafeEval} 'unsafe-inline'`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      "img-src 'self' data: blob: https://ui-avatars.com https:",
      "font-src 'self' https://fonts.gstatic.com",
      connectSrc,
      mediaSrc,
      ...commonDirectives,
    ].join("; ");
  }

  // Public site: stricter CSP but still allow inline for themes
  return [
    "default-src 'self'",
    `script-src 'self'${unsafeEval} 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    connectSrc,
    mediaSrc,
    ...commonDirectives,
  ].join("; ");
}

function shouldSkipCsrf(c: Context): boolean {
  if (!STATE_CHANGING_METHODS.has(c.req.method.toUpperCase())) {
    return true;
  }

  const path = c.req.path;
  const hasApiToken = Boolean(c.req.header("authorization")) ||
    Boolean(c.req.query("api_key"));

  // API keys and bearer tokens manage their own CSRF semantics
  if (path.startsWith("/api/") && hasApiToken) {
    return true;
  }

  // Enforce for admin and cookie-based API requests
  return !(path.startsWith("/api/") || path.startsWith(ADMIN_BASE_PATH));
}

function assertSameOrigin(c: Context, allowedHost: string) {
  const origin = c.req.header("origin");
  const referer = c.req.header("referer");

  const isAllowed = (value: string) => {
    try {
      return new URL(value).host === allowedHost;
    } catch (_err) {
      return false;
    }
  };

  if (origin && !isAllowed(origin)) {
    throw AppError.fromCatalog("csrf_failed", {
      message: "Origen no permitido",
      details: { origin },
    });
  }

  if (!origin && referer && !isAllowed(referer)) {
    throw AppError.fromCatalog("csrf_failed", {
      message: "Referer no permitido",
      details: { referer },
    });
  }
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
  c.header("X-RateLimit-Scope", "global");
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

    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    c.header("Retry-After", String(retryAfter));

    const error = AppError.fromCatalog("rate_limit_exceeded", {
      message: "Límite de peticiones excedido",
      details: {
        retryAfter,
        scope: "global",
      },
    });

    return c.json(error.toResponse(), error.status as any);
  }

  await next();
}

/**
 * Route-specific rate limiting using dynamic rules
 */
export async function routeRateLimitMiddleware(c: Context, next: Next) {
  const ip = getClientIP(c);

  if (await securityManager.isIPWhitelisted(ip)) {
    return await next();
  }

  const result = await checkRouteRateLimit(c.req.path, c.req.method, ip);

  if (!result.applied) {
    return await next();
  }

  c.header("X-Route-RateLimit-Limit", String(result.limit));
  c.header("X-Route-RateLimit-Remaining", String(result.remaining));
  c.header("X-Route-RateLimit-Reset", String(Math.floor(result.resetTime / 1000)));
  c.set("routeRateLimit", {
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime,
    ruleId: result.rule.id,
  });

  if (!result.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((result.resetTime - Date.now()) / 1000),
    );
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Scope", "route");

    await securityManager.logEvent(
      "rate_limit_exceeded",
      ip,
      "medium",
      {
        path: c.req.path,
        method: c.req.method,
        userAgent: c.req.header("user-agent"),
        details: {
          ruleId: result.rule.id,
          rulePath: result.rule.path,
          ruleMethod: result.rule.method ?? "ALL",
        },
      },
    );

    const error = AppError.fromCatalog("rate_limit_exceeded", {
      message: "Límite de peticiones excedido para esta ruta",
      details: {
        retryAfter,
        ruleId: result.rule.id,
        rulePath: result.rule.path,
        ruleMethod: result.rule.method ?? "ALL",
      },
    });

    return c.json(error.toResponse(), error.status as any);
  }

  await next();
}

/**
 * CSRF guard based on Origin/Referer for cookie-based requests
 */
export async function csrfProtectionMiddleware(c: Context, next: Next) {
  if (shouldSkipCsrf(c)) {
    return await next();
  }

  const allowedHost = BASE_HOST ?? new URL(c.req.url).host;
  try {
    assertSameOrigin(c, allowedHost);
  } catch (error) {
    if (isAppError(error)) {
      await securityManager.logEvent(
        "suspicious_activity",
        getClientIP(c),
        "medium",
        {
          path: c.req.path,
          method: c.req.method,
          userAgent: c.req.header("user-agent"),
          details: {
            reason: "csrf_failed",
            origin: c.req.header("origin"),
            referer: c.req.header("referer"),
          },
        },
      );
    }
    throw error;
  }
  return await next();
}

/**
 * Security Headers Middleware
 * Adds security-related HTTP headers
 */
export async function securityHeadersMiddleware(c: Context, next: Next) {
  const isDevelopment = env.DENO_ENV === "development";
  const nonce = generateNonce();
  c.set("cspNonce", nonce);

  await next();

  if (!c.res) return;

  let response = c.res;

  if (response.status === 0) {
    const body = await response.text().catch(() => "");
    response = new Response(body, {
      status: 500,
      headers: response.headers,
    });
  }

  const cspHeader = isHtmlResponse(response)
    ? buildCspHeader(c.req.path, nonce, isDevelopment)
    : "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

  const headers: SecurityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": isDevelopment
      ? "max-age=0"
      : "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": cspHeader,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  if (isHtmlResponse(response)) {
    const body = await response.text();
    const withNonce = injectNonce(body, nonce);
    const headersWithCsp = new Headers(response.headers);
    c.res = new Response(withNonce, {
      status: response.status,
      statusText: response.statusText,
      headers: headersWithCsp,
    });
    return;
  }

  c.res = response;
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
  // Skip security checks for SSE stream to avoid false positives with token in query
  if (c.req.path === '/api/notifications/stream') {
    return await next();
  }
  // Block obvious path traversal attempts on media serve endpoints early
  if (c.req.path.startsWith('/api/media/serve') && c.req.path.includes('..')) {
    return c.json({ success: false, error: "path_traversal_blocked" }, 403);
  }
  // Block/neutralize obvious SQLi probes on tag search with a safe JSON response
  if (c.req.path.startsWith('/api/tags/search')) {
    const q = c.req.query('q') || '';
    if (/(or\s+1=1|union\s+select|--)/i.test(q)) {
      return c.json({ success: false, tags: [] }, 200);
    }
  }

  // Apply security headers
  await securityHeadersMiddleware(c, async () => {
    // Check IP blocking
    await ipBlockingMiddleware(c, async () => {
      // CSRF validation for cookie-based flows
      await csrfProtectionMiddleware(c, async () => {
        // Apply route-specific rate limiting first
        await routeRateLimitMiddleware(c, async () => {
          // Apply global rate limiting
          await rateLimitMiddleware(c, async () => {
            // Inspect request
            await requestInspectionMiddleware(c, next);
          });
        });
      });
    });
  });
}
