import { db } from "./src/config/db.ts";
import { users, roles } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";

console.log("🔐 Creando usuario superadmin...\n");

try {
  // Obtener el rol de superadmin
  const superadminRole = await db.query.roles.findFirst({
    where: eq(roles.name, "superadmin"),
  });

  if (!superadminRole) {
    console.error("❌ Error: Rol superadmin no encontrado. Ejecuta primero: deno task db:seed-rbac");
    Deno.exit(1);
  }

  // Hashear la contraseña
  const hashedPassword = await hash("Admin123!");

  // Crear usuario superadmin
  const [newUser] = await db
    .insert(users)
    .values({
      email: "superadmin@lexcms.com",
      password: hashedPassword,
      name: "Super Admin",
      roleId: superadminRole.id,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        password: hashedPassword,
        name: "Super Admin",
        roleId: superadminRole.id,
      },
    })
    .returning();

  console.log("✅ Usuario superadmin creado/actualizado exitosamente!");
  console.log("\n📧 Credenciales:");
  console.log("   Email:    superadmin@lexcms.com");
  console.log("   Password: Admin123!");
  console.log("   Rol:      superadmin");
  console.log(`   ID:       ${newUser.id}`);
} catch (error) {
  console.error("❌ Error creando superadmin:", error);
  Deno.exit(1);
}

Deno.exit(0);
