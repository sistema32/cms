import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes/index.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { env, isDevelopment } from "./config/env.ts";
import {
  blockUnsafeMethods,
  validateJSON,
} from "./middleware/security.ts";
import { securityMiddleware } from "./middleware/securityMiddleware.ts";
import { hotReloadMiddleware } from "./middleware/hotReloadMiddleware.ts";
import { themePreviewMiddleware } from "./middleware/themePreviewMiddleware.ts";

export const app = new Hono();

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(
    Boolean,
  )
  : [];

const allowAllOrigins = allowedOrigins.includes("*") ||
  (isDevelopment && allowedOrigins.length === 0);

// Apply basic security checks
app.use("*", blockUnsafeMethods);
app.use("*", validateJSON);

// Apply comprehensive security middleware (headers, IP blocking, rate limiting, request inspection)
app.use("*", securityMiddleware);

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
