/**
 * Adds css_id column to menu_items if missing (SQLite/MySQL/PostgreSQL).
 * Run via: deno run -A scripts/migrate-menu-css-id.ts
 */
import { executeQuery } from "@/db/index.ts";
import { getDbType } from "@/db/config/database-type.ts";

const dbType = getDbType();

async function columnExists(): Promise<boolean> {
  if (dbType === "sqlite") {
    const rows = await executeQuery("PRAGMA table_info(menu_items);");
    return Array.isArray(rows) && rows.some((r: any) => r.name === "css_id");
  }
  if (dbType === "postgresql") {
    const rows = await executeQuery(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'css_id';`,
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  if (dbType === "mysql") {
    const rows = await executeQuery(`SHOW COLUMNS FROM menu_items LIKE 'css_id';`);
    return Array.isArray(rows) && rows.length > 0;
  }
  return false;
}

async function addColumnIfMissing() {
  if (await columnExists()) return;
  if (dbType === "sqlite") {
    await executeQuery(`ALTER TABLE menu_items ADD COLUMN css_id TEXT;`);
    return;
  }
  if (dbType === "postgresql") {
    await executeQuery(`ALTER TABLE IF EXISTS menu_items ADD COLUMN IF NOT EXISTS css_id text;`);
    return;
  }
  if (dbType === "mysql") {
    await executeQuery(`ALTER TABLE menu_items ADD COLUMN css_id text;`);
  }
}

if (import.meta.main) {
  await addColumnIfMissing();
  console.log("[migrate] menu_items.css_id ensured");
}
