import { db } from "../config/db.ts";
import { sql } from "drizzle-orm";

console.log("🔄 Aplicando migraciones RBAC...");

try {
  // 1. Crear tabla roles
  console.log("Creando tabla roles...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    )
  `);

  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS roles_name_unique ON roles (name)
  `);

  // 2. Crear tabla permissions
  console.log("Creando tabla permissions...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    )
  `);

  // 3. Crear tabla role_permissions
  console.log("Creando tabla role_permissions...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY(role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  // 4. Verificar si la columna role_id ya existe en users
  const tableInfo = await db.all(sql`PRAGMA table_info(users)`);
  const hasRoleId = tableInfo.some((col: any) => col.name === "role_id");

  if (!hasRoleId) {
    console.log("Agregando columna role_id a users...");
    await db.run(sql`ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id)`);
  } else {
    console.log("Columna role_id ya existe en users");
  }

  console.log("✅ Migraciones RBAC aplicadas exitosamente!");
} catch (error) {
  console.error("❌ Error aplicando migraciones:", error);
  Deno.exit(1);
}

Deno.exit(0);
