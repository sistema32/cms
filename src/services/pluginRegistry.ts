// @ts-nocheck
/**
 * Minimal DB-first plugin registry (no workers yet).
 * Uses the plugins/plugin_migrations/plugin_health tables as source of truth.
 */
import { db } from "../config/db.ts";
import {
  plugins,
  pluginMigrations,
  pluginHealth,
  pluginPermissionGrants,
} from "../db/schema.ts";
import { eq } from "drizzle-orm";
import {
  computeMissingPermissions,
  extractRequestedPermissions,
} from "./pluginPermissions.ts";

export type PluginStatus = "inactive" | "active" | "error" | "degraded";

export interface PluginRecord {
  id: number;
  name: string;
  displayName?: string | null;
  version?: string | null;
  description?: string | null;
  author?: string | null;
  homepage?: string | null;
  sourceUrl?: string | null;
  manifestHash?: string | null;
  status: PluginStatus;
  isSystem: boolean;
  settings?: Record<string, unknown> | null;
  permissions?: Record<string, unknown> | null;
  lastHealthStatus?: PluginStatus;
  lastHealthError?: string | null;
  lastHealthCheckedAt?: Date;
  lastHealthLatencyMs?: number | null;
  grants?: PermissionGrant[];
  missingPermissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionGrant {
  permission: string;
  granted: boolean;
  grantedAt: Date;
  grantedBy?: number | null;
}

function mapPlugin(row: typeof plugins.$inferSelect): PluginRecord {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    version: row.version,
    description: row.description,
    author: row.author,
    homepage: row.homepage,
    sourceUrl: row.sourceUrl,
    manifestHash: row.manifestHash,
    status: (row.status as PluginStatus) ?? "inactive",
    isSystem: !!row.isSystem,
    settings: row.settings ? JSON.parse(row.settings) : null,
    permissions: row.permissions ? JSON.parse(row.permissions) : null,
    createdAt: new Date(row.createdAt as unknown as number),
    updatedAt: new Date(row.updatedAt as unknown as number),
  };
}

export function extractRequestedPermissions(permissions: unknown): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions.map((p) => String(p)).filter(Boolean);
  if (typeof permissions === "object" && permissions !== null) {
    const permObj = permissions as Record<string, unknown>;
    if (Array.isArray(permObj.required)) {
      return permObj.required.map((p) => String(p)).filter(Boolean);
    }
  }
  return [];
}

export async function listPlugins(): Promise<PluginRecord[]> {
  const rows = await db.select().from(plugins);
  const base = rows.map(mapPlugin);

  // Attach last health status if exists
  const healthRows = await db.select().from(pluginHealth).orderBy(pluginHealth.pluginId, pluginHealth.lastCheckedAt);
  const latestHealth = new Map<number, { status: PluginStatus; lastError?: string | null; ts?: number | null; latency?: number | null }>();
  for (const h of healthRows) {
    latestHealth.set(h.pluginId, {
      status: (h.status as PluginStatus) ?? "ok",
      lastError: h.lastError ?? null,
      ts: h.lastCheckedAt as unknown as number,
      latency: (h as any).latencyMs ?? null,
    });
  }

  // Attach permission grants
  const grantsRows = await db.select().from(pluginPermissionGrants);
  const grantsByPlugin = new Map<number, PermissionGrant[]>();
  for (const g of grantsRows) {
    const list = grantsByPlugin.get(g.pluginId) ?? [];
    list.push({
      permission: g.permission,
      granted: !!g.granted,
      grantedAt: g.grantedAt ? new Date(g.grantedAt as unknown as number) : new Date(),
      grantedBy: g.grantedBy ?? null,
    });
    grantsByPlugin.set(g.pluginId, list);
  }

  return base.map(p => {
    const h = latestHealth.get(p.id);
    const grants = grantsByPlugin.get(p.id);
    const latency = h?.latency ?? null;
    const lastError = h?.lastError ?? null;
    let enriched: PluginRecord = h ? {
      ...p,
      lastHealthStatus: h.status,
      lastHealthError: lastError,
      lastHealthCheckedAt: h.ts ? new Date(h.ts as number) : undefined,
      lastHealthLatencyMs: latency,
    } : p;
    const requested = extractRequestedPermissions(p.permissions);
    const missing = computeMissingPermissions(requested, grants);
    if (requested.length > 0) {
      enriched = { ...enriched, requestedPermissions: requested } as PluginRecord;
    }
    if (grants) enriched = { ...enriched, grants };
    if (missing.length > 0) enriched = { ...enriched, missingPermissions: missing };
    return enriched;
  });
}

export async function getPluginByName(name: string): Promise<PluginRecord | null> {
  const row = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!row) return null;
  const plugin = mapPlugin(row);

  // attach latest health
  const health = await db.select()
    .from(pluginHealth)
    .where(eq(pluginHealth.pluginId, row.id))
    .orderBy(pluginHealth.lastCheckedAt)
    .all();
  if (health.length > 0) {
    const latest = health[health.length - 1];
    plugin.lastHealthStatus = (latest.status as PluginStatus) ?? "ok";
    plugin.lastHealthError = latest.lastError ?? null;
    plugin.lastHealthCheckedAt = latest.lastCheckedAt ? new Date(latest.lastCheckedAt as unknown as number) : undefined;
  }

  // attach grants
  const grants = await db.select().from(pluginPermissionGrants).where(eq(pluginPermissionGrants.pluginId, row.id));
  if (grants.length) {
    plugin.grants = grants.map((g) => ({
      permission: g.permission,
      granted: !!g.granted,
      grantedAt: g.grantedAt ? new Date(g.grantedAt as unknown as number) : new Date(),
      grantedBy: g.grantedBy ?? null,
    }));
  }
  const requested = extractRequestedPermissions(plugin.permissions);
  const missing = computeMissingPermissions(requested, plugin.grants);
  if (missing.length > 0) plugin.missingPermissions = missing;

  return plugin;
}

export async function setStatus(name: string, status: PluginStatus) {
  await db.update(plugins).set({ status }).where(eq(plugins.name, name));
}

export async function saveSettings(name: string, settings: Record<string, unknown>) {
  await db.update(plugins)
    .set({ settings: JSON.stringify(settings) })
    .where(eq(plugins.name, name));
}

export async function recordMigration(name: string, migration: string) {
  const plugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!plugin) throw new Error(`Plugin not found: ${name}`);
  await db.insert(pluginMigrations).values({
    pluginId: plugin.id,
    name: migration,
  }).onConflictDoNothing();
}

export async function updateHealth(
  name: string,
  status: PluginStatus,
  error?: string | null,
  latencyMs?: number,
  breakerOpen?: boolean,
) {
  const plugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!plugin) throw new Error(`Plugin not found: ${name}`);
  await db.insert(pluginHealth).values({
    pluginId: plugin.id,
    status,
    lastCheckedAt: new Date(),
    lastError: breakerOpen ? "breaker_open" : error ?? null,
    latencyMs: latencyMs !== undefined ? Math.round(latencyMs) : null,
  });
}

export async function setPermissionGrants(
  name: string,
  grants: { permission: string; granted?: boolean; grantedBy?: number | null; grantedAt?: Date }[],
) {
  const plugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!plugin) throw new Error(`Plugin not found: ${name}`);

  await db.delete(pluginPermissionGrants).where(eq(pluginPermissionGrants.pluginId, plugin.id));
  if (grants.length === 0) return;

  const rows = grants.map((g) => ({
    pluginId: plugin.id,
    permission: g.permission,
    granted: g.granted ?? true,
    grantedBy: g.grantedBy ?? null,
    grantedAt: g.grantedAt,
  }));
  await db.insert(pluginPermissionGrants).values(rows);
}

export async function listPermissionGrants(name: string): Promise<PermissionGrant[]> {
  const plugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!plugin) throw new Error(`Plugin not found: ${name}`);
  const grants = await db.select().from(pluginPermissionGrants).where(eq(pluginPermissionGrants.pluginId, plugin.id));
  return grants.map((g: typeof pluginPermissionGrants.$inferSelect) => ({
    permission: g.permission,
    granted: !!g.granted,
    grantedAt: g.grantedAt ? new Date(g.grantedAt as unknown as number) : new Date(),
    grantedBy: g.grantedBy ?? null,
    grantedBy: g.grantedBy ?? null,
  }));
}

import { requestedPermissionsFromManifest } from "./pluginManifest.ts";

export async function registerDiscoveredPlugin(manifest: any) {
  const existing = await db.select().from(plugins).where(eq(plugins.name, manifest.id)).get();
  if (existing) return;

  const allPermissions = requestedPermissionsFromManifest(manifest);

  await db.insert(plugins).values({
    name: manifest.id,
    displayName: manifest.name, // manifest.name is the display name
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    homepage: manifest.homepage,
    status: "inactive",
    isSystem: false,
    permissions: JSON.stringify(allPermissions),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`[registry] Auto-discovered plugin: ${manifest.id}`);
}
