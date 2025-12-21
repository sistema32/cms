import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { registerRoutes } from "@/routes/index.ts";
import { errorHandler } from "@/middleware/errorHandler.ts";
import { env, isDevelopment } from "@/config/env.ts";
import {
  blockUnsafeMethods,
  ensureValidResponse,
  normalizeStatus,
  enforcePayloadLimits,
  validateJSON,
} from "@/middleware/security.ts";
import { securityMiddleware } from "@/middleware/securityMiddleware.ts";
import { hotReloadMiddleware } from "@/middleware/hotReloadMiddleware.ts";
import { themePreviewMiddleware } from "@/middleware/themePreviewMiddleware.ts";
import { trailingSlashMiddleware } from "@/middleware/trailingSlash.ts";

export const app = new Hono();

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(
    Boolean,
  )
  : [];

const allowAllOrigins = allowedOrigins.includes("*") ||
  (isDevelopment && allowedOrigins.length === 0);

// Normalize trailing slashes (must be first)
app.use("*", trailingSlashMiddleware);

// Ensure we never return invalid status
app.use("*", ensureValidResponse);

// Apply basic security checks
app.use("*", blockUnsafeMethods);
app.use("*", enforcePayloadLimits);
app.use("*", validateJSON);

// Apply comprehensive security middleware (headers, IP blocking, rate limiting, request inspection)
app.use("*", securityMiddleware);
app.use("*", normalizeStatus);

// Apply theme preview middleware (must be before routes)
app.use("*", themePreviewMiddleware);

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (allowAllOrigins) return "*";
      if (allowedOrigins.length === 0) return undefined;
      return allowedOrigins.includes(origin) ? origin : undefined;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Plugin middlewares (must be before registerRoutes)
// Plugin middlewares removed (legacy system retired)

registerRoutes(app);

// Apply hot reload middleware in development (must be after routes)
if (isDevelopment) {
  app.use("*", hotReloadMiddleware);
}

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Ruta no encontrada",
      path: c.req.path,
    },
    404,
  );
});

app.onError(errorHandler);

// Ensure responses returned via app.request expose a cancel() helper on the body for tests
const originalRequest = app.request.bind(app);
app.request = (async (...args) => {
  const res = await originalRequest(...(args as [Request | string, RequestInit?]));
  const body = (res as any).body;
  if (body && typeof body.cancel !== "function") {
    body.cancel = async () => {
      try {
        if (typeof body.getReader === "function") {
          await body.getReader().cancel();
        }
      } catch (_err) {
        // ignore
      }
    };
  }
  return res;
}) as typeof app.request;
