import { db } from "../../config/db.ts";
import { roles, permissions, rolePermissions, users } from "../schema.ts";
import { eq } from "drizzle-orm";

/**
 * Definición de módulos y acciones del sistema RBAC
 */
const MODULES = {
  // Contenido
  posts: { name: "posts", description: "Artículos y publicaciones" },
  pages: { name: "pages", description: "Páginas estáticas" },
  categories: { name: "categories", description: "Categorías de contenido" },
  tags: { name: "tags", description: "Etiquetas de contenido" },
  comments: { name: "comments", description: "Comentarios" },

  // Media
  media: { name: "media", description: "Biblioteca de medios" },

  // Usuarios y acceso
  users: { name: "users", description: "Usuarios del sistema" },
  roles: { name: "roles", description: "Roles y permisos" },

  // Sistema
  settings: { name: "settings", description: "Configuración del sistema" },
  menus: { name: "menus", description: "Menús de navegación" },
  plugins: { name: "plugins", description: "Plugins y extensiones" },
  backups: { name: "backups", description: "Copias de seguridad" },
  audit: { name: "audit", description: "Registros de auditoría" },
  webhooks: { name: "webhooks", description: "Webhooks" },

  // Especiales
  dashboard: { name: "dashboard", description: "Panel de administración" },
} as const;

const ACTIONS = {
  create: "Crear",
  read: "Leer",
  update: "Actualizar",
  delete: "Eliminar",
} as const;

/**
 * Permisos especiales adicionales
 */
const SPECIAL_PERMISSIONS = [
  // Media
  { module: "media", action: "upload", description: "Subir archivos a la biblioteca" },
  { module: "media", action: "delete_others", description: "Eliminar archivos de otros usuarios" },

  // Comentarios
  { module: "comments", action: "moderate", description: "Moderar comentarios" },
  { module: "comments", action: "approve", description: "Aprobar comentarios" },

  // Usuarios
  { module: "users", action: "manage_roles", description: "Asignar roles a usuarios" },
  { module: "users", action: "manage_2fa", description: "Gestionar autenticación de dos factores" },

  // Settings
  { module: "settings", action: "manage", description: "Administrar toda la configuración" },

  // Plugins
  { module: "plugins", action: "install", description: "Instalar plugins" },
  { module: "plugins", action: "activate", description: "Activar/desactivar plugins" },
  { module: "plugins", action: "configure", description: "Configurar plugins" },

  // Backups
  { module: "backups", action: "create", description: "Crear copias de seguridad" },
  { module: "backups", action: "restore", description: "Restaurar desde copias de seguridad" },
  { module: "backups", action: "download", description: "Descargar copias de seguridad" },

  // Dashboard
  { module: "dashboard", action: "access", description: "Acceder al panel de administración" },
  { module: "dashboard", action: "view_stats", description: "Ver estadísticas del dashboard" },

  // Audit
  { module: "audit", action: "view", description: "Ver registros de auditoría" },

  // Webhooks
  { module: "webhooks", action: "test", description: "Probar webhooks" },
] as const;

/**
 * Seed de permisos: crea todos los permisos del sistema
 */
async function seedPermissions() {
  console.log("🔐 Creando permisos del sistema...");

  const permissionsToCreate = [];

  // Crear permisos CRUD para cada módulo
  for (const [moduleKey, moduleData] of Object.entries(MODULES)) {
    for (const [actionKey, actionName] of Object.entries(ACTIONS)) {
      permissionsToCreate.push({
        module: moduleData.name,
        action: actionKey,
        description: `${actionName} ${moduleData.description.toLowerCase()}`,
      });
    }
  }

  // Agregar permisos especiales
  permissionsToCreate.push(...SPECIAL_PERMISSIONS);

  // Insertar permisos (ignorar duplicados)
  let createdCount = 0;
  for (const permission of permissionsToCreate) {
    try {
      const existing = await db.query.permissions.findFirst({
        where: (p, { and, eq }) =>
          and(
            eq(p.module, permission.module),
            eq(p.action, permission.action)
          ),
      });

      if (!existing) {
        await db.insert(permissions).values(permission);
        createdCount++;
      }
    } catch (error) {
      console.warn(`Permiso ya existe: ${permission.module}.${permission.action}`);
    }
  }

  console.log(`✅ ${createdCount} permisos creados`);

  // Retornar todos los permisos
  return await db.query.permissions.findMany();
}

/**
 * Seed de roles: crea roles por defecto
 */
async function seedRoles(allPermissions: any[]) {
  console.log("👥 Creando roles del sistema...");

  // 1. Crear rol de Superadministrador
  let superadminRole = await db.query.roles.findFirst({
    where: eq(roles.name, "superadmin"),
  });

  if (!superadminRole) {
    const [role] = await db.insert(roles).values({
      name: "superadmin",
      description: "Superadministrador con acceso total al sistema",
      isSystem: true,
    }).returning();
    superadminRole = role;
    console.log("✅ Rol 'superadmin' creado");
  } else {
    console.log("ℹ️  Rol 'superadmin' ya existe");
  }

  // Asignar TODOS los permisos al superadmin
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, superadminRole.id));

  const superadminPermissions = allPermissions.map(p => ({
    roleId: superadminRole.id,
    permissionId: p.id,
  }));

  if (superadminPermissions.length > 0) {
    await db.insert(rolePermissions).values(superadminPermissions);
    console.log(`✅ ${superadminPermissions.length} permisos asignados a superadmin`);
  }

  // 2. Crear rol de Usuario Público
  let publicRole = await db.query.roles.findFirst({
    where: eq(roles.name, "public_user"),
  });

  if (!publicRole) {
    const [role] = await db.insert(roles).values({
      name: "public_user",
      description: "Usuario público con acceso solo a lectura de contenido público",
      isSystem: true,
    }).returning();
    publicRole = role;
    console.log("✅ Rol 'public_user' creado");
  } else {
    console.log("ℹ️  Rol 'public_user' ya existe");
  }

  // Asignar solo permisos de lectura pública
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, publicRole.id));

  const publicPermissions = allPermissions.filter(p => {
    return (
      // Solo lectura de contenido público
      (p.module === "posts" && p.action === "read") ||
      (p.module === "pages" && p.action === "read") ||
      (p.module === "categories" && p.action === "read") ||
      (p.module === "tags" && p.action === "read") ||
      (p.module === "media" && p.action === "read") ||
      (p.module === "comments" && p.action === "read") ||
      (p.module === "comments" && p.action === "create") // Pueden crear comentarios
    );
  }).map(p => ({
    roleId: publicRole.id,
    permissionId: p.id,
  }));

  if (publicPermissions.length > 0) {
    await db.insert(rolePermissions).values(publicPermissions);
    console.log(`✅ ${publicPermissions.length} permisos asignados a public_user`);
  }

  return { superadminRole, publicRole };
}

/**
 * Asignar rol de superadmin al usuario ID 1
 */
async function assignSuperadminToUser1(superadminRoleId: number) {
  console.log("👤 Asignando rol de superadmin al usuario ID 1...");

  const user1 = await db.query.users.findFirst({
    where: eq(users.id, 1),
  });

  if (!user1) {
    console.warn("⚠️  Usuario ID 1 no encontrado. Se asignará el rol cuando se cree.");
    return;
  }

  await db.update(users)
    .set({ roleId: superadminRoleId })
    .where(eq(users.id, 1));

  console.log("✅ Usuario ID 1 ahora es superadministrador");
}

/**
 * Función principal de seed
 */
export async function seedRBAC() {
  console.log("\n🚀 Iniciando seed de RBAC...\n");

  try {
    // 1. Crear todos los permisos
    const allPermissions = await seedPermissions();

    // 2. Crear roles y asignar permisos
    const { superadminRole, publicRole } = await seedRoles(allPermissions);

    // 3. Asignar superadmin al usuario ID 1
    await assignSuperadminToUser1(superadminRole.id);

    console.log("\n✅ Seed de RBAC completado exitosamente!\n");

    return {
      permissionsCount: allPermissions.length,
      roles: { superadminRole, publicRole },
    };
  } catch (error) {
    console.error("❌ Error en seed de RBAC:", error);
    throw error;
  }
}

/**
 * Ejecutar seed si se llama directamente
 */
if (import.meta.main) {
  await seedRBAC();
  console.log("✨ Proceso completado");
  Deno.exit(0);
}
