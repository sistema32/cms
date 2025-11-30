import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { db } from "../config/db.ts";
import { plugins, pluginMigrations } from "../db/schema.ts";
import { and, eq } from "drizzle-orm";

type MigrationFile = {
  name: string;
  version: number;
  upPath: string;
  downPath?: string;
};

async function getPlugin(name: string) {
  const row = await db.select().from(plugins).where(eq(plugins.name, name)).get();
  if (!row) throw new Error(`Plugin not found: ${name}`);
  return row;
}

export async function listApplied(name: string): Promise<string[]> {
  const plugin = await getPlugin(name);
  const rows = await db.select().from(pluginMigrations).where(eq(pluginMigrations.pluginId, plugin.id));
  return rows.map((r) => r.name);
}

function parseVersion(file: string): number {
  const match = /^(\d+)/.exec(file);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export async function listAvailable(name: string): Promise<MigrationFile[]> {
  const baseDir = join(Deno.cwd(), "plugins", name, "migrations");
  try {
    const entries = [];
    for await (const entry of Deno.readDir(baseDir)) {
      if (entry.isFile && entry.name.endsWith(".up.sql")) {
        const upPath = join(baseDir, entry.name);
        const base = entry.name.replace(".up.sql", "");
        const downPath = join(baseDir, `${base}.down.sql`);
        const hasDown = await fileExists(downPath);
        entries.push({
          name: base,
          version: parseVersion(entry.name),
          upPath,
          downPath: hasDown ? downPath : undefined,
        });
      }
    }
    return entries.sort((a, b) => a.version - b.version);
  } catch (_e) {
    return [];
  }
}

async function fileExists(path: string) {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
}

import { executeQuery } from "../db/index.ts";

async function executeSql(sql: string) {
  // Use the centralized executeQuery helper which handles all drivers correctly
  await executeQuery(sql);
}

export async function status(name: string) {
  const [applied, available] = await Promise.all([listApplied(name), listAvailable(name)]);
  const appliedSet = new Set(applied);
  const pending = available.filter((m) => !appliedSet.has(m.name));
  return { applied, pending };
}

export async function applyPending(name: string, limit?: number) {
  const { pending } = await status(name);
  const toApply = typeof limit === "number" ? pending.slice(0, limit) : pending;
  for (const m of toApply) {
    const sql = await Deno.readTextFile(m.upPath);
    await executeSql(sql);
    await recordApplied(name, m.name);
  }
  return toApply.map((m) => m.name);
}

export async function rollbackLast(name: string, steps = 1) {
  const applied = await listApplied(name);
  if (!applied.length) return [];
  const available = await listAvailable(name);
  const appliedSet = new Set(applied);
  const appliedFiles = available.filter((m) => appliedSet.has(m.name));
  appliedFiles.sort((a, b) => b.version - a.version); // newest first
  const selected = appliedFiles.slice(0, steps);
  const rolled: string[] = [];
  for (const m of selected) {
    if (!m.downPath) {
      throw new Error(`Migration ${m.name} has no .down.sql`);
    }
    const sql = await Deno.readTextFile(m.downPath);
    await executeSql(sql);
    await removeApplied(name, m.name);
    rolled.push(m.name);
  }
  return rolled;
}

async function recordApplied(name: string, migration: string) {
  const plugin = await getPlugin(name);
  await db.insert(pluginMigrations).values({
    pluginId: plugin.id,
    name: migration,
  }).onConflictDoNothing();
}

async function removeApplied(name: string, migration: string) {
  const plugin = await getPlugin(name);
  await db.delete(pluginMigrations)
    // @ts-ignore drizzle types differ per driver
    .where(and(eq(pluginMigrations.pluginId, plugin.id), eq(pluginMigrations.name, migration)) as any);
}
