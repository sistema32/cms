// deno-lint-ignore-file no-explicit-any
/**
 * Adds the manifest_signature column (if missing) and backfills it from plugin manifests on disk.
 * Run with: deno run --allow-all scripts/migrate-plugin-signatures.ts
 */
import { db, executeQuery } from "../src/db/index.ts";
import { plugins } from "@/db/schema.ts";
import { getDbType } from "@/db/config/database-type.ts";
import { tryLoadManifest } from "@/services/plugins/pluginManifestLoader.ts";

const dbType = getDbType();

async function columnExists(): Promise<boolean> {
  if (dbType === "sqlite") {
    const rows = await executeQuery("PRAGMA table_info(plugins);");
    return Array.isArray(rows) && rows.some((r: any) => r.name === "manifest_signature");
  }
  if (dbType === "postgresql") {
    const rows = await executeQuery(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'plugins' AND column_name = 'manifest_signature';`,
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  if (dbType === "mysql") {
    const rows = await executeQuery(`SHOW COLUMNS FROM plugins LIKE 'manifest_signature';`);
    return Array.isArray(rows) && rows.length > 0;
  }
  return false;
}

async function addColumnIfMissing() {
  const exists = await columnExists();
  if (exists) return;
  if (dbType === "sqlite") {
    await executeQuery(`ALTER TABLE plugins ADD COLUMN manifest_signature TEXT;`);
    return;
  }
  if (dbType === "postgresql") {
    await executeQuery(
      `ALTER TABLE IF EXISTS plugins ADD COLUMN IF NOT EXISTS manifest_signature text;`,
    );
    return;
  }
  if (dbType === "mysql") {
    await executeQuery(`ALTER TABLE plugins ADD COLUMN manifest_signature text;`);
  }
}

async function backfill() {
  const rows = await db.select({ id: plugins.id, name: plugins.name }).from(plugins);
  for (const row of rows) {
    try {
      const manifest = await tryLoadManifest(Deno.cwd(), row.name);
      const signature = manifest?.signature;
      if (!signature) continue;
      await executeQuery(
        `UPDATE plugins SET manifest_signature = ? WHERE id = ?`,
        [signature, row.id],
      );
      console.log(`[migrate] Set signature for ${row.name}`);
    } catch (err) {
      console.warn(`[migrate] Skipping ${row.name}:`, err);
    }
  }
}

if (import.meta.main) {
  await addColumnIfMissing();
  await backfill();
  console.log("[migrate] Done");
}
