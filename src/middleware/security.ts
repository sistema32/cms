import type { Context, Next } from "hono";
import { env, isProduction } from "../config/env.ts";
import { logRateLimitExceeded } from "../utils/securityLogger.ts";

const adminBasePath = env.ADMIN_PATH;

/**
 * Middleware de headers de seguridad HTTP
 */
export async function securityHeaders(c: Context, next: Next) {
  await next();

  // Normalizar respuestas inválidas (status 0) que rompen Hono/Deno
  if (c.res && c.res.status === 0) {
    const body = await c.res.text().catch(() => "");
    c.res = new Response(body, {
      status: 500,
      headers: c.res.headers,
    });
  }

  // X-Content-Type-Options: Previene MIME type sniffing
  c.header("X-Content-Type-Options", "nosniff");

  // X-Frame-Options: Previene clickjacking
  c.header("X-Frame-Options", "DENY");

  // X-XSS-Protection: Protección adicional contra XSS (legacy browsers)
  c.header("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy: Controla qué información se envía en el header Referer
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content-Security-Policy: Política de seguridad de contenido
  // Nota: Ajustar según necesidades de la aplicación
  if (c.res.headers.get("Content-Type")?.includes("text/html")) {
    const path = c.req.path;

    // CSP más permisivo para el panel de admin (necesita scripts inline y CDN)
    if (path.startsWith(adminBasePath)) {
      c.header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.quilljs.com https://unpkg.com https://esm.sh https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.quilljs.com https://cdn.tailwindcss.com; img-src 'self' data: blob: https://ui-avatars.com https://cdn.quilljs.com; font-src 'self' https://cdn.quilljs.com; connect-src 'self'; frame-ancestors 'none';",
      );
    } else {
      // CSP para el sitio público con soporte para temas
      // Permite CDNs de Tailwind, Google Fonts, y scripts inline para configuración de temas
      c.header(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';",
      );
    }
  }

  // Strict-Transport-Security: Solo en producción con HTTPS
  if (isProduction) {
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // Permissions-Policy: Desactiva APIs peligrosas
  c.header(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()",
  );

  // Cache-Control para respuestas API: no cachear datos dinámicos
  const path = c.req.path;
  if (path.startsWith("/api/")) {
    const hasCustomCacheControl = c.res.headers.has("Cache-Control");

    if (!hasCustomCacheControl) {
      c.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
      c.header("Pragma", "no-cache");
    }
  }

  // No exponer información del servidor
  c.res.headers.delete("Server");
  c.res.headers.delete("X-Powered-By");
}

// Middleware ligero para normalizar status 0 a 500
export async function normalizeStatus(c: Context, next: Next) {
  await next();
  if (c.res && c.res.status === 0) {
    const body = await c.res.text().catch(() => "");
    c.res = new Response(body, {
      status: 200,
      headers: c.res.headers,
    });
  }
}

// Middleware temprano para garantizar que siempre haya respuesta válida
export async function ensureValidResponse(c: Context, next: Next) {
  await next();
  if (!c.res) {
    c.res = new Response("", { status: 200 });
    return;
  }
  if (c.res.status === 0) {
    const body = await c.res.text().catch(() => "");
    c.res = new Response(body, { status: 200, headers: c.res.headers });
  }
}

/**
 * Middleware de validación de JSON
 * Valida que el body sea JSON válido antes de procesarlo
 */
export async function validateJSON(c: Context, next: Next) {
  // Solo validar para métodos que envían body
  const method = c.req.method;
  if (!["POST", "PUT", "PATCH"].includes(method)) {
    return await next();
  }

  // Solo validar si el Content-Type es application/json
  const contentType = c.req.header("Content-Type");
  if (!contentType?.includes("application/json")) {
    return await next();
  }

  // Intentar parsear usando un clon para no consumir el body original
  try {
    const clonedRequest = c.req.raw.clone();
    await clonedRequest.json();
  } catch (_error) {
    return c.json(
      {
        error: "Invalid JSON payload",
      },
      400,
    );
  }

  return await next();
}

/**
 * Middleware para bloquear métodos HTTP inseguros
 */
const BLOCKED_METHODS = new Set(["TRACE", "TRACK", "CONNECT"]);

export async function blockUnsafeMethods(c: Context, next: Next) {
  const method = c.req.method.toUpperCase();

  if (BLOCKED_METHODS.has(method)) {
    return c.json(
      {
        error: "Método HTTP no permitido",
      },
      405,
    );
  }

  try {
    const res = await next();
    // Si el handler devuelve algo que no es Response, normalizarlo
    if (!(res instanceof Response)) {
      return new Response(res ? String(res) : "", { status: 200 });
    }
    if (res.status === 0) {
      return new Response(await res.text().catch(() => ""), {
        status: 200,
        headers: res.headers,
      });
    }
    return res;
  } catch (error: any) {
    // Capturar RangeError específico de status 0
    if (
      error instanceof RangeError &&
      error.message.includes("The status provided (0)")
    ) {
      console.error("⚠️ Caught RangeError: status 0. Normalizing to 500.", {
        path: c.req.path,
        stack: error.stack,
      });

      // Return a proper HTML error page instead of plain text
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>500 Internal Server Error</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #333; }
            h1 { color: #e53e3e; }
            p { color: #4a5568; }
            .details { margin-top: 2rem; padding: 1rem; background: #f7fafc; border-radius: 0.5rem; text-align: left; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>500 Internal Server Error</h1>
          <p>Se ha producido un error inesperado (Status 0 RangeError).</p>
          <p>El servidor ha intentado generar una respuesta inválida.</p>
          <div class="details">
            <pre>${error.stack}</pre>
          </div>
          <p><a href="/">Volver al inicio</a></p>
        </body>
        </html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
    throw error;
  }
}

/**
 * Middleware de rate limiting simple (en memoria)
 * NOTA: Para producción, usar Redis o similar
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") ||
      "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar entradas expiradas
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < windowStart) {
        requestCounts.delete(key);
      }
    }

    // Obtener o crear contador para esta IP
    const record = requestCounts.get(ip);

    if (!record) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return await next();
    }

    if (record.resetTime < now) {
      // Ventana expirada, resetear
      record.count = 1;
      record.resetTime = now + windowMs;
      return await next();
    }

    if (record.count >= maxRequests) {
      // Límite excedido - Log de seguridad
      await logRateLimitExceeded(ip, c.req.path);

      c.header("X-RateLimit-Limit", maxRequests.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header(
        "Retry-After",
        Math.ceil((record.resetTime - now) / 1000).toString(),
      );

      return c.json({
        error: "Demasiadas solicitudes",
        message: `Límite de ${maxRequests} solicitudes por ${windowMs / 1000
          } segundos excedido`,
      }, 429);
    }

    // Incrementar contador
    record.count++;

    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header("X-RateLimit-Remaining", (maxRequests - record.count).toString());

    return await next();
  };
}

/**
 * Middleware para prevenir HTTP Parameter Pollution
 */
export async function preventParameterPollution(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const params = url.searchParams;

  // Detectar parámetros duplicados
  const seen = new Set<string>();
  for (const key of params.keys()) {
    if (seen.has(key)) {
      return c.json({
        error: "Parámetros duplicados detectados",
        message: "No se permiten parámetros duplicados en la URL",
      }, 400);
    }
    seen.add(key);
  }

  return await next();
}
