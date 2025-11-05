import { db } from "../config/db.ts";
import { sql } from "drizzle-orm";

console.log("🔍 Verificando estructura de la base de datos...\n");

try {
  // Obtener lista de tablas
  const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);

  console.log("📋 Tablas encontradas:");
  tables.forEach((table: any) => {
    console.log(`  - ${table.name}`);
  });

  // Obtener estructura de la tabla users
  if (tables.some((t: any) => t.name === "users")) {
    console.log("\n📊 Estructura de la tabla 'users':");
    const columns = await db.all(sql`PRAGMA table_info(users)`);
    columns.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });

    // Obtener índices
    console.log("\n🔑 Índices de la tabla 'users':");
    const indexes = await db.all(sql`PRAGMA index_list(users)`);
    indexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}${idx.unique ? ' (UNIQUE)' : ''}`);
    });
  }

  console.log("\n✅ Verificación completada!");
} catch (error) {
  console.error("❌ Error verificando la base de datos:", error);
  Deno.exit(1);
}

Deno.exit(0);
