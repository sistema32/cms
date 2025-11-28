/**
 * Minimal DB-first plugin registry (no workers yet).
 * Uses the plugins/plugin_migrations/plugin_health tables as source of truth.
 */
import { db } from "../config/db.ts";
import { plugins, pluginMigrations, pluginHealth } from "../db/schema.ts";
import { eq } from "drizzle-orm";

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
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: new Date(row.createdAt as unknown as number * 1000),
    updatedAt: new Date(row.updatedAt as unknown as number * 1000),
  };
}

export async function listPlugins(): Promise<PluginRecord[]> {
  const rows = await db.select().from(plugins);
  return rows.map(mapPlugin);
}

export async function getPluginByName(name: string): Promise<PluginRecord | null> {
  const row = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  return row ? mapPlugin(row) : null;
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

export async function updateHealth(name: string, status: PluginStatus, error?: string) {
  const plugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!plugin) throw new Error(`Plugin not found: ${name}`);
  await db.insert(pluginHealth).values({
    pluginId: plugin.id,
    status,
    lastCheckedAt: Date.now() / 1000,
    lastError: error,
  });
}
