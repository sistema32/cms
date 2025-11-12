import { db } from "../config/db.ts";
import { users } from "./schema.ts";
import { hash } from "bcrypt";
import { seedRBAC } from "./seeds/rbac.ts";
import { eq } from "drizzle-orm";

console.log("🌱 Seeding database...\n");

// Crear usuario administrador
console.log("📝 Verificando usuario administrador...");

// Verificar si el usuario ya existe
let adminUser = await db.query.users.findFirst({
  where: eq(users.email, "admin@example.com"),
});

if (!adminUser) {
  const hashedPassword = await hash("password123");

  const [newUser] = await db.insert(users).values({
    email: "admin@example.com",
    password: hashedPassword,
    name: "Admin User",
  }).returning();

  adminUser = newUser;
  console.log("✅ Usuario administrador creado");
} else {
  console.log("ℹ️  Usuario administrador ya existe");
}

console.log("   Email: admin@example.com");
console.log("   Password: password123\n");

// Ejecutar seed de RBAC (roles y permisos)
await seedRBAC();

console.log("\n✅ Database seeded successfully!");
console.log("\n🎉 Sistema listo para usar:");
console.log("   - Usuario: admin@example.com");
console.log("   - Password: password123");
console.log("   - Rol: superadmin (asignado automáticamente)");

Deno.exit(0);
