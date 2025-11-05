import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes/index.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { env, isDevelopment } from "./config/env.ts";
import {
  blockUnsafeMethods,
  rateLimit,
  securityHeaders,
  validateJSON,
} from "./middleware/security.ts";

export const app = new Hono();

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(
    Boolean,
  )
  : [];

const allowAllOrigins = allowedOrigins.includes("*") ||
  (isDevelopment && allowedOrigins.length === 0);

app.use("*", blockUnsafeMethods);
app.use("*", securityHeaders);
app.use("*", validateJSON);

app.use("/api/auth/*", rateLimit(10, 60000));

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
