// @ts-nocheck
/**
 * Plugin Reconciler (phase 1)
 * Aligns DB state (plugins.status) with runtime workers (stubbed worker).
 */
import {
  listPlugins,
  setStatus,
  updateHealth,
  registerDiscoveredPlugin,
  removePlugin,
  listPermissionGrants,
} from "./pluginRegistry.ts";
import { extractRequestedPermissions, computeMissingPermissions } from "./pluginPermissions.ts";
import { startWorker, stopWorker, getWorker, setWorkerError } from "./pluginWorker.ts";
import { requestedPermissionsFromManifest } from "./pluginManifest.ts";
import { clearRuntime } from "./pluginRuntime.ts";
import { tryLoadManifest } from "./pluginManifestLoader.ts";
import { resolve, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { seedBreaker } from "./pluginRuntime.ts";
import { applyPending as applyPendingMigrations, status as migrationStatus } from "./pluginMigrations.ts";
import { discoverPlugins } from "./pluginDiscovery.ts";
import { extractCapabilitiesFromManifest } from "./pluginCapabilities.ts";

const DEFAULT_INTERVAL_MS = 15_000;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
const errorCounts = new Map<string, number>();
const BREAKER_THRESHOLD = 3;
let healthLoopHandle: ReturnType<typeof setInterval> | null = null;

export function startReconcilerLoop() {
  if (intervalHandle) return;
  // Run once on startup to boot active plugins
  reconcilePlugins().catch((err) => {
    console.error("[reconciler] startup reconcile failed", err);
  });
  startHealthCheckLoop();

  // Disable periodic loop for on-demand discovery
  /*
  intervalHandle = setInterval(() => {
    reconcilePlugins().catch((err) => {
      console.error("[reconciler] periodic reconcile failed", err);
    });
  }, DEFAULT_INTERVAL_MS);
  */
}

export function stopReconcilerLoop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export async function reconcilePlugins() {
  const discoveredIds = await discoverPlugins();
  const plugins = await listPlugins();

  // 1. Remove plugins that are in DB but not on disk
  for (const plugin of plugins) {
    if (!discoveredIds.includes(plugin.name)) {
      console.log(`[reconciler] Plugin ${plugin.name} not found on disk. Removing...`);
      stopWorker(plugin.name);
      await removePlugin(plugin.name);
      continue; // Skip further processing for this plugin
    }
  }

  // Refresh list after removal
  const activePlugins = plugins.filter(p => discoveredIds.includes(p.name));

  // Seed breaker counts from last health status
  for (const plugin of activePlugins) {
    if (
      plugin.lastHealthStatus === "error" ||
      plugin.lastHealthStatus === "degraded" ||
      plugin.lastHealthError === "breaker_open"
    ) {
      errorCounts.set(plugin.name, BREAKER_THRESHOLD);
      if (plugin.lastHealthError === "breaker_open") {
        seedBreaker(plugin.name);
      }
    }
  }
  for (const plugin of activePlugins) {
    const requested = extractRequestedPermissions(plugin.permissions);
    const missing = computeMissingPermissions(requested, plugin.grants);
    const lastHealth = plugin.lastHealthStatus;

    if (plugin.status === "active") {
      console.log(`[reconciler] Reconciling active plugin: ${plugin.name}`);
      // Apply pending migrations before starting workers
      const pendingMigrations = await migrationStatus(plugin.name).then((s) => s.pending).catch(() => []);
      if (pendingMigrations.length > 0) {
        console.log(`[reconciler] Applying migrations for ${plugin.name}`);
        try {
          await applyPendingMigrations(plugin.name);
        } catch (err) {
          console.error(`[reconciler] Migration failed for ${plugin.name}`, err);
          await updateHealth(plugin.name, "error", `Migration failed: ${err instanceof Error ? err.message : String(err)}`);
          setWorkerError(plugin.name, "migration_failed");
          errorCounts.set(plugin.name, BREAKER_THRESHOLD);
          continue;
        }
      }
      if (missing.length > 0) {
        console.warn(`[reconciler] Missing permissions for ${plugin.name}:`, missing);
        // No arrancar worker si faltan permisos; marcar health error
        stopWorker(plugin.name);
        await updateHealth(plugin.name, "error", `Faltan permisos: ${missing.join(", ")}`);
        errorCounts.set(plugin.name, (errorCounts.get(plugin.name) ?? 0) + 1);
        continue;
      }
      if (lastHealth === "error") {
        errorCounts.set(plugin.name, (errorCounts.get(plugin.name) ?? 0) + 1);
      } else {
        errorCounts.delete(plugin.name);
      }

      if ((errorCounts.get(plugin.name) ?? 0) >= BREAKER_THRESHOLD) {
        console.warn(`[reconciler] Breaker open for ${plugin.name}`);
        stopWorker(plugin.name);
        setWorkerError(plugin.name, "Breaker: demasiados errores consecutivos");
        await updateHealth(plugin.name, "degraded", "Breaker abierto por errores consecutivos", undefined, true);
        continue;
      }

      if (!getWorker(plugin.name)) {
        console.log(`[reconciler] Starting worker for ${plugin.name}`);
        try {
          const cwd = Deno.cwd();
          const manifest =
            (await tryLoadManifest(resolve(cwd), plugin.name)) ?? {
              name: plugin.name,
              permissions: plugin.permissions as any,
              routes: [],
              hooks: [],
              capabilities: { db: ["read"], fs: ["read"], http: [] },
            };
          const manifestPermissions = requestedPermissionsFromManifest(manifest);

          // Auto-sync permissions from manifest to database
          await syncManifestPermissions(plugin.name, manifestPermissions);

          const capabilities = extractCapabilitiesFromManifest(manifest);
          startWorker(plugin.name, manifestPermissions, manifest, capabilities);
          await updateHealth(plugin.name, "active");
        } catch (err) {
          console.error(`[reconciler] Failed to start worker for ${plugin.name}`, err);
          const msg = err instanceof Error ? err.message : String(err);
          setWorkerError(plugin.name, msg);
          await updateHealth(plugin.name, "error", msg);
        }

      } else {
        // console.log(`[reconciler] Worker already running for ${plugin.name}`);
        await updateHealth(plugin.name, "active");
      }
    } else {
      // console.log(`[reconciler] Plugin ${plugin.name} is inactive`);
      if (getWorker(plugin.name)) {
        stopWorker(plugin.name);
        clearRuntime(plugin.name);
      }
      await updateHealth(plugin.name, "inactive");
    }
  }
}

export async function activate(name: string) {
  await setStatus(name, "active");
  try {
    await applyPendingMigrations(name);
  } catch (err) {
    await setStatus(name, "error");
    const msg = err instanceof Error ? err.message : String(err);
    await updateHealth(name, "error", `Migration failed: ${msg}`);
    throw err;
  }

  // Stop existing worker if any (restart)
  stopWorker(name);

  // Load manifest for validation
  const cwd = Deno.cwd();
  const manifest = await tryLoadManifest(resolve(cwd), name);

  // If manifest load fails, we might want to fail activation or warn
  if (!manifest) {
    console.warn(`[reconciler] Activating ${name} without manifest (could not load)`);
  }

  // Auto-sync permissions from manifest to database
  let manifestPermissions: string[] = [];
  if (manifest) {
    manifestPermissions = requestedPermissionsFromManifest(manifest);

    // Sync permissions to database (auto-grant any missing from manifest)
    await syncManifestPermissions(name, manifestPermissions);
    console.log(`[reconciler] Synced ${manifestPermissions.length} permissions from manifest for ${name}`);
  }

  // Fetch grants to pass to worker (now includes synced permissions)
  const grants = await listPermissionGrants(name);
  const grantedPermissions = grants.filter(g => g.granted).map(g => g.permission);

  // Merge manifest permissions with granted permissions (manifest takes priority)
  const allPermissions = [...new Set([...manifestPermissions, ...grantedPermissions])];

  // Try to start the worker - if it fails, auto-deactivate to prevent corruption
  try {
    const capabilities = manifest ? extractCapabilitiesFromManifest(manifest) : { dbRead: false, fsRead: false, httpAllowlist: [] };
    startWorker(name, allPermissions, manifest || undefined, capabilities);
    await updateHealth(name, "active");
  } catch (err) {
    // Worker startup failed - auto-deactivate to prevent system corruption
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[reconciler] Worker startup failed for ${name}, auto-deactivating:`, msg);

    // Revert status to inactive
    await setStatus(name, "inactive");

    // Update health with error details
    await updateHealth(name, "error", `Worker startup failed: ${msg}`);

    // Stop any partially started worker
    stopWorker(name);

    // Re-throw to notify caller
    throw new Error(`Plugin activation failed: ${msg}`);
  }
}

/**
 * Sync permissions from manifest to database
 * Auto-grants any permissions in manifest that don't exist in DB
 */
async function syncManifestPermissions(pluginName: string, manifestPermissions: string[]) {
  const { getPluginByName } = await import("./pluginRegistry.ts");
  const { db } = await import("@/config/db.ts");
  const { plugins, pluginPermissionGrants } = await import("@/db/schema.ts");
  const { eq } = await import("drizzle-orm");

  const plugin = await getPluginByName(pluginName);
  if (!plugin) {
    console.warn(`[reconciler] Cannot sync permissions: plugin ${pluginName} not found`);
    return;
  }

  // Get existing grants
  const existingGrants = await db.select()
    .from(pluginPermissionGrants)
    .where(eq(pluginPermissionGrants.pluginId, plugin.id));

  const existingSet = new Set(existingGrants.map(g => g.permission));

  // Find missing permissions
  const missingPerms = manifestPermissions.filter(p => !existingSet.has(p));

  if (missingPerms.length > 0) {
    console.log(`[reconciler] Auto-granting ${missingPerms.length} missing permissions for ${pluginName}:`, missingPerms);

    for (const perm of missingPerms) {
      await db.insert(pluginPermissionGrants).values({
        pluginId: plugin.id,
        permission: perm,
        granted: true,
        grantedAt: new Date()
      }).onConflictDoNothing();
    }
  }

  // Also update the permissions column in plugins table
  await db.update(plugins)
    .set({
      permissions: JSON.stringify(manifestPermissions),
      updatedAt: new Date()
    })
    .where(eq(plugins.id, plugin.id));
}


export async function deactivate(name: string, rollback = false) {
  await setStatus(name, "inactive");
  stopWorker(name);
  await updateHealth(name, "inactive");

  if (rollback) {
    try {
      const { listApplied, rollbackLast } = await import("./pluginMigrations.ts");
      const applied = await listApplied(name);

      if (applied.length > 0) {
        console.log(`[reconciler] Rolling back ${applied.length} migrations for ${name}`);
        await rollbackLast(name, applied.length);
        console.log(`[reconciler] Rollback completed for ${name}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[reconciler] Rollback failed for ${name}:`, msg);
      await updateHealth(name, "error", `Rollback failed: ${msg}`);
      throw new Error(`Deactivation rollback failed: ${msg}`);
    }
  }
}

export function startHealthCheckLoop(intervalMs = 60_000) {
  if (healthLoopHandle) return;
  healthLoopHandle = setInterval(async () => {
    try {
      const plugins = await listPlugins();
      for (const p of plugins) {
        if (p.status !== "active") continue;
        const worker = getWorker(p.name);
        if (!worker) {
          await updateHealth(p.name, "error", "worker_missing");
          errorCounts.set(p.name, BREAKER_THRESHOLD);
        } else {
          await updateHealth(p.name, "active", null);
        }
      }
    } catch (err) {
      console.error("[health-check] error:", err);
    }
  }, intervalMs);
}
