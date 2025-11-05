import { eq, and, sql } from "drizzle-orm";
import { db } from "../config/db.ts";
import { permissions, users, rolePermissions } from "../db/schema.ts";
import type { NewPermission } from "../db/schema.ts";

export interface PermissionsByModule {
  module: string;
  permissions: any[];
  count: number;
}

export interface PermissionStats {
  totalPermissions: number;
  totalModules: number;
  moduleBreakdown: Array<{ module: string; count: number }>;
}

/**
 * Obtener todos los permisos
 */
export async function getAllPermissions() {
  return await db.query.permissions.findMany({
    orderBy: (permissions, { asc }) => [asc(permissions.module), asc(permissions.action)],
  });
}

/**
 * Obtener permisos agrupados por módulo
 */
export async function getPermissionsGroupedByModule(): Promise<PermissionsByModule[]> {
  const allPermissions = await getAllPermissions();

  // Agrupar por módulo
  const grouped = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  // Convertir a array
  return Object.entries(grouped).map(([module, perms]) => ({
    module,
    permissions: perms,
    count: perms.length,
  }));
}

/**
 * Obtener un permiso por ID
 */
export async function getPermissionById(permissionId: number) {
  const permission = await db.query.permissions.findFirst({
    where: eq(permissions.id, permissionId),
  });

  if (!permission) {
    throw new Error("Permiso no encontrado");
  }

  return permission;
}

/**
 * Obtener permisos por módulo
 */
export async function getPermissionsByModule(module: string) {
  return await db.query.permissions.findMany({
    where: eq(permissions.module, module),
    orderBy: (permissions, { asc }) => [asc(permissions.action)],
  });
}

/**
 * Obtener lista de módulos únicos
 */
export async function getModules(): Promise<string[]> {
  const allPermissions = await db.select().from(permissions);
  const modules = [...new Set(allPermissions.map((p) => p.module))];
  return modules.sort();
}

/**
 * Crear un nuevo permiso
 */
export async function createPermission(data: NewPermission) {
  const existingPermission = await db.query.permissions.findFirst({
    where: and(
      eq(permissions.module, data.module),
      eq(permissions.action, data.action)
    ),
  });

  if (existingPermission) {
    throw new Error("Ya existe un permiso con ese módulo y acción");
  }

  const [newPermission] = await db.insert(permissions).values(data).returning();

  return newPermission;
}

/**
 * Crear múltiples permisos para un módulo (helper)
 */
export async function createModulePermissions(
  module: string,
  actions: Array<{ action: string; description?: string }>
) {
  const permissionsToCreate = actions.map((a) => ({
    module,
    action: a.action,
    description: a.description || `${a.action} ${module}`,
  }));

  const results = [];
  for (const perm of permissionsToCreate) {
    try {
      const created = await createPermission(perm);
      results.push(created);
    } catch (error) {
      // Si ya existe, continuar
      console.log(`Permission ${module}:${perm.action} already exists`);
    }
  }

  return results;
}

/**
 * Actualizar un permiso
 */
export async function updatePermission(
  permissionId: number,
  data: Partial<NewPermission>
) {
  const [updatedPermission] = await db
    .update(permissions)
    .set(data)
    .where(eq(permissions.id, permissionId))
    .returning();

  if (!updatedPermission) {
    throw new Error("Permiso no encontrado");
  }

  return updatedPermission;
}

/**
 * Eliminar un permiso
 */
export async function deletePermission(permissionId: number) {
  await db.delete(permissions).where(eq(permissions.id, permissionId));
}

/**
 * Eliminar todos los permisos de un módulo
 */
export async function deleteModulePermissions(module: string): Promise<number> {
  const perms = await getPermissionsByModule(module);

  if (perms.length > 0) {
    await db.delete(permissions).where(eq(permissions.module, module));
  }

  return perms.length;
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export async function userHasPermission(
  userId: number,
  module: string,
  action: string
): Promise<boolean> {
  // Obtener usuario con su rol
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: {
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) {
    return false;
  }

  // Usuario inactivo o suspendido no tiene permisos
  if (user.status !== "active") {
    return false;
  }

  // Usuario ID 1 siempre tiene todos los permisos
  if (user.id === 1) {
    return true;
  }

  // Superadmin siempre tiene todos los permisos
  if (user.role.name === "superadmin") {
    return true;
  }

  // Verificar si el rol tiene el permiso
  const hasPermission = user.role.rolePermissions.some(
    (rp) => rp.permission.module === module && rp.permission.action === action
  );

  return hasPermission;
}

/**
 * Verificar múltiples permisos a la vez
 */
export async function userHasAnyPermission(
  userId: number,
  permissionChecks: Array<{ module: string; action: string }>
): Promise<boolean> {
  for (const check of permissionChecks) {
    const has = await userHasPermission(userId, check.module, check.action);
    if (has) return true;
  }
  return false;
}

/**
 * Verificar que el usuario tenga todos los permisos especificados
 */
export async function userHasAllPermissions(
  userId: number,
  permissionChecks: Array<{ module: string; action: string }>
): Promise<boolean> {
  for (const check of permissionChecks) {
    const has = await userHasPermission(userId, check.module, check.action);
    if (!has) return false;
  }
  return true;
}

/**
 * Obtener todos los permisos de un usuario
 */
export async function getUserPermissions(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: {
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) {
    return [];
  }

  return user.role.rolePermissions.map((rp) => rp.permission);
}

/**
 * Obtener permisos de un usuario agrupados por módulo
 */
export async function getUserPermissionsGrouped(userId: number): Promise<PermissionsByModule[]> {
  const userPerms = await getUserPermissions(userId);

  // Agrupar por módulo
  const grouped = userPerms.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([module, perms]) => ({
    module,
    permissions: perms,
    count: perms.length,
  }));
}

/**
 * Obtiene estadísticas de permisos
 */
export async function getPermissionStats(): Promise<PermissionStats> {
  const allPermissions = await getAllPermissions();
  const modules = [...new Set(allPermissions.map((p) => p.module))];

  const moduleBreakdown = modules.map((module) => ({
    module,
    count: allPermissions.filter((p) => p.module === module).length,
  }));

  return {
    totalPermissions: allPermissions.length,
    totalModules: modules.length,
    moduleBreakdown: moduleBreakdown.sort((a, b) => b.count - a.count),
  };
}
