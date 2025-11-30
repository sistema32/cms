import { Hono } from "hono";
import { runtimeRoutes, isBreakerOpen, openBreaker, registeredSlots } from "./pluginRuntime.ts";
import { httpFetch } from "./pluginHttpSandbox.ts";
import { createReadOnlyDbClient } from "./pluginDbSandbox.ts";
import { FsSandbox } from "./pluginFsSandbox.ts";
import { db } from "../config/db.ts";
import { updateHealth } from "./pluginRegistry.ts";
import { recordRouteMetric } from "./pluginMetrics.ts";

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

export function buildPluginRouter() {
  const router = new Hono();
  const MAX_DB_QUERIES = 5;
  const MAX_RESPONSE_BYTES = 1_000_000; // 1MB
  const MAX_HTTP_CALLS = 5;
  const MAX_DB_TIME_MS = 2_000;
  const MAX_STREAM_BYTES = 1_000_000; // 1MB
  const pluginRate: Map<string, { count: number; resetAt: number }> = new Map();
  const MAX_REQS_PER_MIN = 100;
  const routeErrorCounts: Map<string, number> = new Map();
  const ROUTE_BREAKER_THRESHOLD = 3;

  // Middleware to protect plugin routes
  router.use("*", async (c, next) => {
    const { adminAuth } = await import("../routes/admin/auth.ts");
    const path = c.req.path;
    // Public allowlist
    if (
      path.startsWith("/plugins-runtime/assets") ||
      path.startsWith("/plugins-runtime/widgets") ||
      path.includes("/render/") || // Allow render endpoints (e.g. /smart-slider-3/render/1)
      path.includes("/public/") // Convention: /public/ in path means public? No, stick to specific patterns.
    ) {
      await next();
      return;
    }

    // Static files: Allow CSS/JS/Images, protect HTML?
    // User wants dashboard protected. Dashboard is usually index.html.
    // Assets like styles.css should be public.
    if (path.startsWith("/plugins-runtime/plugins-static/")) {
      if (path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".svg")) {
        await next();
        return;
      }
      // HTML files are protected (Dashboards)
    }

    // Apply admin auth
    const res = await adminAuth(c, next);
    if (res instanceof Response) return res;
  });
  router.get("/slots", (c) => {
    return c.json(registeredSlots);
  });

  // API to get registered assets (global CSS/JS)
  router.get("/assets", async (c) => {
    const { registeredAssets } = await import("./pluginRuntime.ts");
    return c.json(registeredAssets);
  });

  // API to get registered widgets
  router.get("/widgets", async (c) => {
    const { registeredWidgets } = await import("./pluginRuntime.ts");
    return c.json(registeredWidgets);
  });

  // Static files for plugins
  router.get("/plugins-static/:pluginName/*", async (c) => {
    const pluginName = c.req.param("pluginName");
    const prefix = `/plugins-runtime/plugins-static/${pluginName}`;
    let path = c.req.path;
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length);
    }
    // Ensure path starts with /
    if (!path.startsWith("/")) path = "/" + path;

    // Prevent directory traversal
    if (path.includes("..")) return c.notFound();

    const filePath = join(Deno.cwd(), "plugins", pluginName, "public", path);
    try {
      const content = await Deno.readFile(filePath);
      // Determine mime type (basic)
      let mime = "application/octet-stream";
      if (path.endsWith(".html")) mime = "text/html";
      else if (path.endsWith(".js")) mime = "application/javascript";
      else if (path.endsWith(".css")) mime = "text/css";
      else if (path.endsWith(".json")) mime = "application/json";
      else if (path.endsWith(".png")) mime = "image/png";
      else if (path.endsWith(".jpg")) mime = "image/jpeg";

      c.header("Content-Type", mime);
      return c.body(content);
    } catch {
      return c.notFound();
    }
  });

  router.all("/:pluginName/*", async (c, next) => {
    const pluginName = c.req.param("pluginName");
    // Extract path suffix: /plugins-runtime/core-system/ping -> /ping
    // c.req.path is full path.
    // We assume router is mounted at /plugins-runtime.
    // So prefix is /plugins-runtime/:pluginName
    const prefix = `/plugins-runtime/${pluginName}`;
    let path = c.req.path;
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length);
    }
    // Ensure path starts with /
    if (!path.startsWith("/")) path = "/" + path;

    const method = c.req.method.toUpperCase();
    const key = `${method}:${pluginName}:${path}`;
    let route = runtimeRoutes.get(key);

    // If exact match fails, try parameterized match
    if (!route) {
      for (const [rKey, rRoute] of runtimeRoutes.entries()) {
        // Split only on first two colons to avoid breaking on :param syntax
        const firstColon = rKey.indexOf(":");
        const secondColon = rKey.indexOf(":", firstColon + 1);

        const rMethod = rKey.substring(0, firstColon);
        const rPlugin = rKey.substring(firstColon + 1, secondColon);
        const rPath = rKey.substring(secondColon + 1);

        if (rMethod !== method || rPlugin !== pluginName) continue;

        const routeParts = rPath.split('/');
        const reqParts = path.split('/');

        if (routeParts.length !== reqParts.length) continue;

        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
          if (!routeParts[i].startsWith(':') && routeParts[i] !== reqParts[i]) {
            match = false;
            break;
          }
        }

        if (match) {
          route = rRoute;
          break;
        }
      }
    }

    if (!route) return c.notFound();
    if (isBreakerOpen(route.plugin)) {
      return c.json({ error: "Plugin en breaker" }, 503);
    }

    // Simple per-plugin rate limit (reset cada minuto)
    const now = Date.now();
    const rate = pluginRate.get(route.plugin) ?? { count: 0, resetAt: now + 60_000 };
    if (now > rate.resetAt) {
      rate.count = 0;
      rate.resetAt = now + 60_000;
    }
    rate.count += 1;
    pluginRate.set(route.plugin, rate);
    if (rate.count > MAX_REQS_PER_MIN) {
      return c.json({ error: "Rate limit exceeded for plugin" }, 429);
    }
    try {
      // Provide sandboxed helpers
      let dbCount = 0;
      const dbClient = createReadOnlyDbClient(async (sql: string, params?: unknown[]) => {
        if (!route.capabilities.dbRead) throw new Error("DB access not allowed for this plugin");
        dbCount += 1;
        if (dbCount > MAX_DB_QUERIES) {
          throw new Error("DB sandbox: query limit exceeded");
        }
        const start = performance.now();
        // crude adapter: use db.execute if available
        // @ts-ignore drizzle execute may exist depending on driver
        if (typeof db.execute === "function") {
          const result = await db.execute(sql, params);
          if (performance.now() - start > MAX_DB_TIME_MS) {
            throw new Error("DB sandbox: query too slow");
          }
          return result;
        }
        return { rows: [] };
      });
      let httpCount = 0;
      const safeFetch = async (url: string, opts?: RequestInit) => {
        if (!route.capabilities.httpAllowlist?.length) throw new Error("HTTP not allowed for this plugin");
        httpCount += 1;
        if (httpCount > MAX_HTTP_CALLS) {
          throw new Error("HTTP sandbox: call limit exceeded");
        }
        const res = await httpFetch(url, opts, { allowlist: route.httpAllowlist ?? [], timeoutMs: 3000 });
        const lenHeader = res.headers.get("content-length");
        if (lenHeader && parseInt(lenHeader, 10) > MAX_RESPONSE_BYTES) {
          throw new Error("HTTP sandbox: response too large");
        }
        if (!lenHeader) {
          // stream and enforce max bytes
          const reader = res.body?.getReader();
          if (reader) {
            let read = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              read += value?.length ?? 0;
              if (read > MAX_STREAM_BYTES) {
                reader.cancel().catch(() => { });
                throw new Error("HTTP sandbox: streamed response too large");
              }
            }
          }
        }
        return res;
      };
      const fs = new FsSandbox(`./plugins/${route.plugin}`);
      if (!route.capabilities.fsRead) {
        // override read methods to throw
        fs.readFile = async () => {
          throw new Error("FS access not allowed for this plugin");
        };
        fs.readText = async () => {
          throw new Error("FS access not allowed for this plugin");
        };
      }
      const start = performance.now();
      const reqProxy = new Proxy(c.req, {
        get(target, prop) {
          if (prop === "path") return path;
          const value = Reflect.get(target, prop);
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        },
      });
      const result = await route.handler({ req: reqProxy, db: dbClient, fetch: safeFetch, fs });
      const duration = performance.now() - start;
      recordRouteMetric(route.plugin, duration, true);
      routeErrorCounts.set(route.plugin, 0);
      if (result instanceof Response) {
        try { await updateHealth(route.plugin, "active", undefined, duration); } catch (e) { console.error("Health update failed", e); }
        return result;
      }
      try { await updateHealth(route.plugin, "active", undefined, duration); } catch (e) { console.error("Health update failed", e); }
      return c.json(result ?? {});
    } catch (err) {
      console.error("[plugin route error]", err);
      recordRouteMetric(route.plugin, 0, false);
      const errors = (routeErrorCounts.get(route.plugin) ?? 0) + 1;
      routeErrorCounts.set(route.plugin, errors);
      if (errors >= ROUTE_BREAKER_THRESHOLD) {
        await openBreaker(route.plugin, "route_breaker");
        await updateHealth(route.plugin, "degraded", "Breaker por errores de ruta", undefined, true);
        return c.json({ error: "Plugin en breaker por errores" }, 503);
      }
      await updateHealth(route.plugin, "error", err instanceof Error ? err.message : String(err));
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  });

  return router;
}
