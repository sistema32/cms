import { db } from "../config/db.ts";
import { users } from "./schema.ts";
import { hash } from "bcrypt";
import { seedRBAC } from "./seeds/rbac.ts";

console.log("🌱 Seeding database...\n");

// Crear usuario administrador
console.log("📝 Creando usuario administrador...");
const hashedPassword = await hash("password123");

await db.insert(users).values({
  email: "admin@example.com",
  password: hashedPassword,
  name: "Admin User",
});

console.log("✅ Usuario administrador creado");
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
