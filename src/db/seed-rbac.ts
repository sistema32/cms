import { db } from "../config/db.ts";
import { roles, permissions, rolePermissions, users } from "./schema.ts";
import { eq } from "drizzle-orm";

console.log("🌱 Seeding RBAC data...\n");

try {
  // ============= 1. CREAR ROLES =============
  console.log("1️⃣ Creando roles...");

  const [superadminRole] = await db
    .insert(roles)
    .values({
      name: "superadmin",
      description: "Super administrador con todos los permisos",
      isSystem: true,
    })
    .onConflictDoNothing()
    .returning();

  const [adminRole] = await db
    .insert(roles)
    .values({
      name: "admin",
      description: "Administrador con permisos limitados",
      isSystem: true,
    })
    .onConflictDoNothing()
    .returning();

  const [userRole] = await db
    .insert(roles)
    .values({
      name: "user",
      description: "Usuario registrado estándar",
      isSystem: true,
    })
    .onConflictDoNothing()
    .returning();

  const [guestRole] = await db
    .insert(roles)
    .values({
      name: "guest",
      description: "Usuario público sin autenticación",
      isSystem: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log(`   ✓ Roles creados: superadmin, admin, user, guest\n`);

  // ============= 2. CREAR PERMISOS =============
  console.log("2️⃣ Creando permisos...");

  const permissionsData = [
    // Permisos de USERS
    { module: "users", action: "create", description: "Crear usuarios" },
    { module: "users", action: "read", description: "Leer usuarios" },
    { module: "users", action: "update", description: "Actualizar usuarios" },
    { module: "users", action: "delete", description: "Eliminar usuarios" },

    // Permisos de ROLES
    { module: "roles", action: "create", description: "Crear roles" },
    { module: "roles", action: "read", description: "Leer roles" },
    { module: "roles", action: "update", description: "Actualizar roles" },
    { module: "roles", action: "delete", description: "Eliminar roles" },

    // Permisos de PERMISSIONS
    { module: "permissions", action: "create", description: "Crear permisos" },
    { module: "permissions", action: "read", description: "Leer permisos" },
    { module: "permissions", action: "update", description: "Actualizar permisos" },
    { module: "permissions", action: "delete", description: "Eliminar permisos" },

    // Permisos de ROLE_PERMISSIONS (asignación)
    { module: "role_permissions", action: "assign", description: "Asignar permisos a roles" },
    { module: "role_permissions", action: "revoke", description: "Revocar permisos de roles" },
    { module: "role_permissions", action: "read", description: "Ver permisos de roles" },

    // Permisos de CMS - CONTENT TYPES
    { module: "content_types", action: "create", description: "Crear tipos de contenido" },
    { module: "content_types", action: "read", description: "Leer tipos de contenido" },
    { module: "content_types", action: "update", description: "Actualizar tipos de contenido" },
    { module: "content_types", action: "delete", description: "Eliminar tipos de contenido" },

    // Permisos de CMS - CONTENT
    { module: "content", action: "create", description: "Crear contenido" },
    { module: "content", action: "read", description: "Leer contenido" },
    { module: "content", action: "update", description: "Actualizar contenido" },
    { module: "content", action: "delete", description: "Eliminar contenido" },

    // Permisos de CMS - CATEGORIES
    { module: "categories", action: "create", description: "Crear categorías" },
    { module: "categories", action: "read", description: "Leer categorías" },
    { module: "categories", action: "update", description: "Actualizar categorías" },
    { module: "categories", action: "delete", description: "Eliminar categorías" },

    // Permisos de CMS - TAGS
    { module: "tags", action: "create", description: "Crear tags" },
    { module: "tags", action: "read", description: "Leer tags" },
    { module: "tags", action: "update", description: "Actualizar tags" },
    { module: "tags", action: "delete", description: "Eliminar tags" },

    // Permisos de MEDIA
    { module: "media", action: "create", description: "Subir archivos de media" },
    { module: "media", action: "read", description: "Ver archivos de media" },
    { module: "media", action: "update", description: "Actualizar metadata de media" },
    { module: "media", action: "delete", description: "Eliminar archivos de media" },

    // Permisos de MENUS
    { module: "menus", action: "create", description: "Crear menús" },
    { module: "menus", action: "read", description: "Leer menús" },
    { module: "menus", action: "update", description: "Actualizar menús" },
    { module: "menus", action: "delete", description: "Eliminar menús" },

    // Permisos de MENU_ITEMS
    { module: "menu_items", action: "create", description: "Crear items de menú" },
    { module: "menu_items", action: "read", description: "Leer items de menú" },
    { module: "menu_items", action: "update", description: "Actualizar items de menú" },
    { module: "menu_items", action: "delete", description: "Eliminar items de menú" },
  ];

  const createdPermissions = await db
    .insert(permissions)
    .values(permissionsData)
    .onConflictDoNothing()
    .returning();

  console.log(`   ✓ ${createdPermissions.length} permisos creados\n`);

  // ============= 3. ASIGNAR PERMISOS A ROLES =============
  console.log("3️⃣ Asignando permisos a roles...");

  // Obtener todos los permisos
  const allPermissions = await db.query.permissions.findMany();

  // SUPERADMIN: Todos los permisos
  if (superadminRole) {
    const superadminPermissions = allPermissions.map((perm) => ({
      roleId: superadminRole.id,
      permissionId: perm.id,
    }));
    await db.insert(rolePermissions).values(superadminPermissions).onConflictDoNothing();
    console.log(`   ✓ Superadmin: ${allPermissions.length} permisos`);
  }

  // ADMIN: Permisos de lectura y gestión de usuarios, contenido y menús
  if (adminRole) {
    const adminPerms = allPermissions.filter(
      (p) =>
        p.module === "users" ||
        p.module === "content_types" ||
        p.module === "content" ||
        p.module === "categories" ||
        p.module === "tags" ||
        p.module === "media" ||
        p.module === "menus" ||
        p.module === "menu_items" ||
        (p.module === "roles" && p.action === "read") ||
        (p.module === "permissions" && p.action === "read")
    );
    const adminPermissions = adminPerms.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    }));
    await db.insert(rolePermissions).values(adminPermissions).onConflictDoNothing();
    console.log(`   ✓ Admin: ${adminPerms.length} permisos`);
  }

  // USER: Solo lectura de su propio perfil
  if (userRole) {
    const userPerms = allPermissions.filter(
      (p) => p.module === "users" && (p.action === "read" || p.action === "update")
    );
    const userPermissions = userPerms.map((perm) => ({
      roleId: userRole.id,
      permissionId: perm.id,
    }));
    await db.insert(rolePermissions).values(userPermissions).onConflictDoNothing();
    console.log(`   ✓ User: ${userPerms.length} permisos`);
  }

  // GUEST: Solo lectura pública (contenido, categorías, tags, menús)
  if (guestRole) {
    const guestPerms = allPermissions.filter(
      (p) => p.action === "read" && (
        p.module === "content_types" ||
        p.module === "content" ||
        p.module === "categories" ||
        p.module === "tags" ||
        p.module === "menus" ||
        p.module === "menu_items"
      )
    );
    const guestPermissions = guestPerms.map((perm) => ({
      roleId: guestRole.id,
      permissionId: perm.id,
    }));
    await db.insert(rolePermissions).values(guestPermissions).onConflictDoNothing();
    console.log(`   ✓ Guest: ${guestPerms.length} permisos\n`);
  }

  // ============= 4. ACTUALIZAR USUARIO ID=1 A SUPERADMIN =============
  console.log("4️⃣ Actualizando usuario ID=1...");

  if (superadminRole) {
    await db
      .update(users)
      .set({ roleId: superadminRole.id })
      .where(eq(users.id, 1));

    console.log(`   ✓ Usuario ID=1 ahora es superadmin\n`);
  }

  console.log("✅ Seed RBAC completado exitosamente!");
  console.log("\n📋 Resumen:");
  console.log("   - Roles: superadmin, admin, user, guest");
  console.log("   - Módulos: users, roles, permissions, role_permissions");
  console.log("   - Acciones: create, read, update, delete, assign, revoke");
  console.log("\n🔐 Usuario ID=1 tiene rol: superadmin");
} catch (error) {
  console.error("❌ Error en seed RBAC:", error);
  Deno.exit(1);
}

Deno.exit(0);
