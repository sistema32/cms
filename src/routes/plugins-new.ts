import { Hono } from "hono";
import * as registry from "@/services/plugins/pluginRegistry.ts";
import * as reconciler from "@/services/plugins/pluginReconciler.ts";
import { AuditLogger } from "../lib/audit/AuditLogger.ts";
import { extractRequestedPermissions } from "@/services/plugins/pluginPermissions.ts";
import { requestedPermissionsFromManifest, parseManifest } from "@/services/plugins/pluginManifest.ts";
import * as migrations from "@/services/plugins/pluginMigrations.ts";

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
  // On-demand discovery (WordPress style)
  await reconciler.reconcilePlugins();
  const list = await registry.listPlugins();
  const { getMetrics } = await import("@/services/plugins/pluginMetrics.ts");
  const metrics = getMetrics();
  const withMetrics = list.map((p) => {
    const m = (metrics as any)[p.name];
    return m ? { ...p, metrics: m } : p;
  });
  return c.json({ success: true, data: withMetrics });
});

pluginsNewRouter.get("/metrics", async (c) => {
  const { getMetrics } = await import("@/services/plugins/pluginMetrics.ts");
  return c.json({ success: true, data: getMetrics() });
});

pluginsNewRouter.get("/:name", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  const { getMetrics } = await import("@/services/plugins/pluginMetrics.ts");
  const metrics = getMetrics();
  const requested = requestedPermissionsFromManifest({
    name: plugin.name,
    manifestVersion: "v2",
    id: plugin.name,
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
        error: `Cannot activate plugin "${name}" - missing permissions`,
        details: {
          missing,
          message: `This plugin requires additional permissions. Add them to the manifest or grant manually.`,
          helpUrl: `/admincp/plugins/${name}/permissions`
        }
      }, 403);
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

// Fast restart helper (stop + start) with audit trail
pluginsNewRouter.post("/:name/restart", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  if (plugin.isSystem) return c.json({ success: false, error: "System plugin cannot be restarted" }, 400);

  try {
    await reconciler.deactivate(name);
    await reconciler.activate(name);
    await audit.info("plugin_restarted", "plugin", {
      ...getAuditContext(c),
      entityId: name,
      description: `Plugin ${name} restarted`,
    });
    return c.json({ success: true, message: `Plugin ${name} restarted` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await audit.error("plugin_restart_failed", "plugin", {
      ...getAuditContext(c),
      entityId: name,
      description: `Restart failed for ${name}: ${msg}`,
    });
    return c.json({ success: false, error: `Restart failed: ${msg}` }, 500);
  }
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
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 404);
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
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 400);
  }
});

// ========== PENDING PLUGINS APPROVAL ENDPOINTS ==========

/**
 * Get all pending plugins awaiting approval
 */
pluginsNewRouter.get("/pending/list", async (c) => {
  const { getPendingPlugins } = await import("@/services/plugins/pluginPendingApproval.ts");
  const pending = getPendingPlugins();
  return c.json({ success: true, data: pending });
});

/**
 * Approve a pending plugin
 */
pluginsNewRouter.post("/pending/:name/approve", async (c) => {
  const name = c.req.param("name");
  const { getPendingPlugin, removePendingPlugin } = await import("@/services/plugins/pluginPendingApproval.ts");
  const { loadManifestFromDisk } = await import("@/services/plugins/pluginManifestLoader.ts");

  const pending = getPendingPlugin(name);
  if (!pending) {
    return c.json({ success: false, error: "Plugin not found in pending list" }, 404);
  }

  try {
    // Load manifest from disk to validate checksum/signature integrity
    const manifest = await loadManifestFromDisk(Deno.cwd(), pending.name);
    if (pending.manifestChecksum && manifest.checksum && pending.manifestChecksum !== manifest.checksum) {
      return c.json({ success: false, error: "Manifest checksum mismatch; approval blocked" }, 400);
    }

    // Register the plugin
    const { registerDiscoveredPlugin } = await import("@/services/plugins/pluginRegistry.ts");
    await registerDiscoveredPlugin(manifest);

    // Remove from pending
    removePendingPlugin(name);

    await audit.log({
      action: "plugin.approved",
      entity: "plugin", // Added required field
      description: `Approved plugin: ${pending.displayName}`,
      ...getAuditContext(c),
    });

    return c.json({
      success: true,
      message: "Plugin approved and registered successfully",
      plugin: { name, displayName: pending.displayName }
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `Failed to approve plugin: ${errorMsg}` }, 500);
  }
});

/**
 * Reject a pending plugin
 */
pluginsNewRouter.post("/pending/:name/reject", async (c) => {
  const name = c.req.param("name");
  const { getPendingPlugin, removePendingPlugin } = await import("@/services/plugins/pluginPendingApproval.ts");

  const pending = getPendingPlugin(name);
  if (!pending) {
    return c.json({ success: false, error: "Plugin not found in pending list" }, 404);
  }

  // Remove from pending
  removePendingPlugin(name);

  await audit.log({
    action: "plugin.rejected",
    entity: "plugin", // Added required field
    description: `Rejected plugin: ${pending.displayName}`,
    ...getAuditContext(c),
  });

  return c.json({
    success: true,
    message: "Plugin rejected and removed from pending list",
    plugin: { name, displayName: pending.displayName }
  });
});

/**
 * Scan for new plugins (discovery)
 */
pluginsNewRouter.post("/discover", async (c) => {
  try {
    await reconciler.reconcilePlugins();
    const { getPendingPlugins } = await import("@/services/plugins/pluginPendingApproval.ts");
    const pending = getPendingPlugins();

    await audit.log({
      action: "plugin.discovery",
      entity: "system", // Added required field
      description: `Discovered ${pending.length} new plugins awaiting approval`,
      ...getAuditContext(c),
    });

    return c.json({
      success: true,
      message: `Discovery complete. ${pending.length} plugins found.`,
      pending: pending.length
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `Discovery failed: ${errorMsg}` }, 500);
  }
});

pluginsNewRouter.get("/:name/migrations/status", async (c) => {
  const name = c.req.param("name");
  try {
    const s = await migrations.status(name);
    return c.json({ success: true, data: s });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 400);
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
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 400);
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
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 400);
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
      sortBy: "created_at",
      sortOrder: "desc",
    });
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 400);
  }
});

export default pluginsNewRouter;
