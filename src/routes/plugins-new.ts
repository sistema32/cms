import { Hono } from "hono";
import * as registry from "../services/pluginRegistry.ts";
import * as reconciler from "../services/pluginReconciler.ts";
import { AuditLogger } from "../lib/audit/AuditLogger.ts";
import { extractRequestedPermissions } from "../services/pluginPermissions.ts";
import { requestedPermissionsFromManifest, parseManifest } from "../services/pluginManifest.ts";
import * as migrations from "../services/pluginMigrations.ts";

export const pluginsNewRouter = new Hono();

const getRequestedPermissions = extractRequestedPermissions;
const audit = AuditLogger.getInstance();

function getAuditContext(c: any) {
  const user = c.get?.("user") || {};
  return {
    userId: user.id,
    userEmail: user.email,
    ipAddress: c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  };
}

pluginsNewRouter.get("/", async (c) => {
  const list = await registry.listPlugins();
  const { getMetrics } = await import("../services/pluginMetrics.ts");
  const metrics = getMetrics();
  const withMetrics = list.map((p) => {
    const m = (metrics as any)[p.name];
    return m ? { ...p, metrics: m } : p;
  });
  return c.json({ success: true, data: withMetrics });
});

pluginsNewRouter.get("/metrics", async (c) => {
  const { getMetrics } = await import("../services/pluginMetrics.ts");
  return c.json({ success: true, data: getMetrics() });
});

pluginsNewRouter.get("/:name", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  const { getMetrics } = await import("../services/pluginMetrics.ts");
  const metrics = getMetrics();
  const requested = requestedPermissionsFromManifest({
    name: plugin.name,
    permissions: plugin.permissions as any,
    routes: [],
    hooks: [],
  });
  const m = (metrics as any)[name];
  return c.json({ success: true, data: { ...plugin, requestedPermissions: requested, missingPermissions: plugin.missingPermissions ?? [], metrics: m } });
});

pluginsNewRouter.post("/:name/activate", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);

  // Validar permisos solicitados vs concedidos
  const requested = getRequestedPermissions(plugin);
  if (requested.length > 0) {
    const grants = await registry.listPermissionGrants(name);
    const granted = new Set(grants.filter((g) => g.granted).map((g) => g.permission));
    const missing = requested.filter((p) => !granted.has(p));
    if (missing.length > 0) {
      await audit.info("plugin_activate_blocked", "plugin", {
        ...getAuditContext(c),
        entityId: name,
        description: `Activation blocked; missing permissions: ${missing.join(", ")}`,
        metadata: { missing },
      });
      return c.json({
        success: false,
        error: "Faltan permisos antes de activar",
        missing,
      }, 400);
    }
  }

  await reconciler.activate(name);
  await audit.info("plugin_activated", "plugin", {
    ...getAuditContext(c),
    entityId: name,
    description: `Plugin ${name} activated`,
  });
  return c.json({ success: true, message: `Plugin ${name} activated` });
});

pluginsNewRouter.post("/:name/deactivate", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  if (plugin.isSystem) return c.json({ success: false, error: "System plugin cannot be deactivated" }, 400);
  await reconciler.deactivate(name);
  await audit.info("plugin_deactivated", "plugin", {
    ...getAuditContext(c),
    entityId: name,
    description: `Plugin ${name} deactivated`,
  });
  return c.json({ success: true, message: `Plugin ${name} deactivated` });
});

pluginsNewRouter.patch("/:name/settings", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  await registry.saveSettings(name, body?.settings ?? {});
  await audit.info("plugin_settings_updated", "plugin", {
    ...getAuditContext(c),
    entityId: name,
    description: `Settings updated for plugin ${name}`,
    metadata: { keys: body?.settings ? Object.keys(body.settings) : [] },
  });
  return c.json({ success: true, message: "Settings updated" });
});

pluginsNewRouter.get("/:name/grants", async (c) => {
  const name = c.req.param("name");
  try {
    const grants = await registry.listPermissionGrants(name);
    return c.json({ success: true, data: grants });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 404);
  }
});

pluginsNewRouter.put("/:name/grants", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));
  const grants = Array.isArray(body?.grants) ? body.grants : [];
  try {
    await registry.setPermissionGrants(
      name,
      grants.map((g: any) => ({
        permission: String(g.permission || "").trim(),
        granted: g.granted !== false,
      })).filter((g: any) => g.permission.length > 0),
    );
    const updated = await registry.listPermissionGrants(name);
    await audit.info("plugin_grants_updated", "plugin", {
      ...getAuditContext(c),
      entityId: name,
      description: `Permission grants updated for ${name}`,
      metadata: { grants: updated },
    });
    return c.json({ success: true, data: updated });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

pluginsNewRouter.get("/:name/migrations/status", async (c) => {
  const name = c.req.param("name");
  try {
    const s = await migrations.status(name);
    return c.json({ success: true, data: s });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

pluginsNewRouter.post("/:name/migrations/up", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));
  const limit = typeof body?.steps === "number" ? body.steps : undefined;
  try {
    const applied = await migrations.applyPending(name, limit);
    await audit.info("plugin_migration_up", "plugin", {
      ...getAuditContext(c),
      entityId: name,
      description: `Applied migrations: ${applied.join(", ")}`,
    });
    return c.json({ success: true, data: applied });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

pluginsNewRouter.post("/:name/migrations/down", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));
  const steps = typeof body?.steps === "number" ? body.steps : 1;
  try {
    const rolled = await migrations.rollbackLast(name, steps);
    await audit.info("plugin_migration_down", "plugin", {
      ...getAuditContext(c),
      entityId: name,
      description: `Rolled back migrations: ${rolled.join(", ")}`,
    });
    return c.json({ success: true, data: rolled });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

pluginsNewRouter.get("/:name/logs", async (c) => {
  const name = c.req.param("name");
  const limit = Number(c.req.query("limit") || 50);
  const offset = Number(c.req.query("offset") || 0);
  try {
    const result = await audit.query({
      entity: "plugin",
      entityId: name,
      limit,
      offset,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return c.json({ success: true, data: result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

export default pluginsNewRouter;
