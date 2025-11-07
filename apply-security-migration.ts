#!/usr/bin/env -S deno run --allow-read --allow-write

import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";

console.log("🔄 Aplicando migración de seguridad...\n");

try {
  // Get the directory of this script
  const scriptDir = dirname(new URL(import.meta.url).pathname);

  // Create database client
  const client = createClient({
    url: "file:./lexcms.db"
  });

  // Read migration file
  const migrationPath = join(scriptDir, "src/db/migrations/0017_add_security.sql");
  const migration = await readFile(migrationPath, "utf-8");

  // Split by statement-breakpoint and execute each statement
  const statements = migration
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`📝 Ejecutando ${statements.length} sentencias SQL...\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const statement of statements) {
    // Remove comment lines
    const sqlOnly = statement
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim();

    if (sqlOnly) {
      try {
        await client.execute(sqlOnly);
        successCount++;
        console.log(`✅ Sentencia ${successCount} ejecutada`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("already exists")) {
          skipCount++;
          console.log(`⚠️  Ya existe, omitiendo...`);
        } else {
          console.error(`❌ Error: ${errorMsg}`);
          throw error;
        }
      }
    }
  }

  console.log(`\n✅ Migración completada exitosamente!`);
  console.log(`   - ${successCount} sentencias ejecutadas`);
  if (skipCount > 0) {
    console.log(`   - ${skipCount} ya existían`);
  }

  client.close();
} catch (error) {
  console.error("\n❌ Error aplicando migración:", error);
  Deno.exit(1);
}
