import { db } from "../config/db.ts";
import { sql } from "drizzle-orm";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

console.log("🔄 Aplicando migraciones...");

try {
  // Crear tabla para tracking de migraciones
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);

  // Leer archivos de migración
  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = await readdir(migrationsDir);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  for (const file of sqlFiles) {
    // Verificar si ya se aplicó
    const hash = file.replace(".sql", "");
    const existing = await db.all(
      sql`SELECT id FROM __drizzle_migrations WHERE hash = ${hash}`
    );

    if (existing.length === 0) {
      console.log(`  Aplicando ${file}...`);
      const filePath = join(migrationsDir, file);
      const migration = await readFile(filePath, "utf-8");

      // Dividir por statement-breakpoint y ejecutar cada statement
      const statements = migration
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let hasWarnings = false;
      let successCount = 0;
      let skipCount = 0;

      for (const statement of statements) {
        if (statement && !statement.startsWith("--")) {
          try {
            await db.run(sql.raw(statement));
            successCount++;
          } catch (error) {
            // Verificar si es un error de "tabla ya existe" o "índice ya existe"
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (
              errorMessage.includes("already exists") ||
              errorMessage.includes("SQLITE_ERROR: table") ||
              errorMessage.includes("SQLITE_ERROR: index")
            ) {
              // Tratar como advertencia y continuar
              hasWarnings = true;
              skipCount++;
            } else {
              // Re-lanzar otros tipos de errores
              throw error;
            }
          }
        }
      }

      // Marcar como aplicada
      await db.run(
        sql`INSERT INTO __drizzle_migrations (hash) VALUES (${hash})`
      );

      if (hasWarnings) {
        console.log(`  ⚠️  ${file} aplicada con advertencias (${successCount} exitosos, ${skipCount} ya existían)`);
      } else {
        console.log(`  ✅ ${file} aplicada`);
      }
    } else {
      console.log(`  ⏭️  ${file} ya aplicada`);
    }
  }

  console.log("\n✅ Migraciones aplicadas exitosamente!");
} catch (error) {
  console.error("❌ Error aplicando migraciones:", error);
  Deno.exit(1);
}

Deno.exit(0);
