import { db } from "./index.ts";
import { getDbType } from "./config/database-type.ts";
import { migrate as migrateLibSQL } from "drizzle-orm/libsql/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { migrate as migrateMySQL } from "drizzle-orm/mysql2/migrator";
import { loadCustomMigrations } from "./migrations/custom/index.ts";
import { sql } from "drizzle-orm";

const dbType = getDbType();

console.log(`🚀 Starting migrations for ${dbType}...`);

async function main() {
  // 1. Run Drizzle Standard Migrations
  console.log("📦 Running Drizzle schema migrations...");
  const migrationsFolder = "./src/db/migrations";

  try {
    if (dbType === "postgresql") {
      await migratePostgres(db as any, { migrationsFolder });
    } else if (dbType === "mysql") {
      await migrateMySQL(db as any, { migrationsFolder });
    } else {
      await migrateLibSQL(db as any, { migrationsFolder });
    }
    console.log("✅ Drizzle schema migrations applied!");
  } catch (err) {
    console.error("❌ Drizzle migration failed:", err);
    Deno.exit(1);
  }

  // 2. Run Custom Migrations
  console.log("🔧 Checking for custom migrations...");

  // Create custom migrations table if not exists
  // Note: We use sql`` helper which is compatible across adapters for basic SQL
  try {
    if (dbType === "postgresql") {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS __custom_migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } else if (dbType === "mysql") {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS __custom_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS __custom_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at INTEGER DEFAULT (unixepoch())
        )
      `);
    }
  } catch (err) {
    console.error("❌ Failed to create custom migrations table:", err);
    Deno.exit(1);
  }

  const customMigrations = await loadCustomMigrations();

  for (const migration of customMigrations) {
    // Check if applied
    let alreadyApplied = false;

    if (dbType === "sqlite") {
      const result = await db.all(sql`SELECT id FROM __custom_migrations WHERE name = ${migration.id}`);
      alreadyApplied = result.length > 0;
    } else {
      // For PG/MySQL execute returns array of rows usually
      const result = await db.execute(sql`SELECT id FROM __custom_migrations WHERE name = ${migration.id}`);
      alreadyApplied = result.length > 0;
    }

    if (alreadyApplied) {
      console.log(`  ⏭️  Custom migration ${migration.id} already applied.`);
      continue;
    }

    console.log(`  Running custom migration: ${migration.name || migration.id}...`);

    try {
      // Run migration
      await migration.up(db, dbType);

      // Record success
      if (dbType === "sqlite") {
        await db.run(sql`INSERT INTO __custom_migrations (name) VALUES (${migration.id})`);
      } else {
        await db.execute(sql`INSERT INTO __custom_migrations (name) VALUES (${migration.id})`);
      }

      console.log(`  ✅ Custom migration ${migration.id} applied successfully.`);
    } catch (err) {
      console.error(`  ❌ Custom migration ${migration.id} failed:`, err);
      Deno.exit(1);
    }
  }

  console.log("✨ All migrations completed successfully!");
  Deno.exit(0);
}

main();
