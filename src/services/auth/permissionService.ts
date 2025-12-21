import { eq, and, like, or, desc } from "drizzle-orm";
import { db } from "@/config/db.ts";
import { permissions, users, rolePermissions } from "@/db/schema.ts";
import type { NewPermission } from "@/db/schema.ts";
import { clearUserPermissionsCache } from "./authorizationService.ts";
import { sanitizeSearchQuery } from "@/utils/sanitization.ts";

export interface PermissionsByModule {
  module: string;
  permissions: any[];
  count: number;
}

export interface PermissionStats {
  totalPermissions: number;
  totalModules: number;
  moduleBreakdown: Array<{ module: string; count: number }>;
  permissionsByModule?: Record<string, number>;
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
 * Obtener un permiso por módulo y acción
 */
export async function getPermissionByModuleAndAction(module: string, action: string) {
  return await db.query.permissions.findFirst({
    where: and(
      eq(permissions.module, module),
      eq(permissions.action, action)
    ),
  });
}

/**
 * Actualizar un permiso
 */
export async function updatePermission(
  permissionId: number,
  data: Partial<NewPermission>
) {
  // Verificar que el permiso existe
  await getPermissionById(permissionId);

  // Si se está cambiando módulo o acción, verificar que no exista otro con esos valores
  if (data.module || data.action) {
    const current = await getPermissionById(permissionId);
    const newModule = data.module || current.module;
    const newAction = data.action || current.action;

    const existing = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.module, newModule),
        eq(permissions.action, newAction)
      ),
    });

    if (existing && existing.id !== permissionId) {
      throw new Error(`Ya existe un permiso para ${newModule}.${newAction}`);
    }
  }

  const [updatedPermission] = await db
    .update(permissions)
    .set(data)
    .where(eq(permissions.id, permissionId))
    .returning();

  if (!updatedPermission) {
    throw new Error("Error al actualizar permiso");
  }

  // Limpiar cache de permisos de usuarios
  clearAllUsersCacheForPermission(permissionId);

  return updatedPermission;
}

/**
 * Eliminar un permiso
 */
export async function deletePermission(permissionId: number) {
  // Verificar que el permiso existe
  await getPermissionById(permissionId);

  // Verificar si hay roles usando este permiso
  const rolesUsingPermission = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.permissionId, permissionId),
  });

  if (rolesUsingPermission.length > 0) {
    throw new Error(
      `No se puede eliminar el permiso porque está asignado a ${rolesUsingPermission.length} rol(es)`
    );
  }

  await db.delete(permissions).where(eq(permissions.id, permissionId));

  // Limpiar cache de permisos de usuarios
  clearAllUsersCacheForPermission(permissionId);
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
 * Busca permisos por módulo o descripción
 */
export async function searchPermissions(query: string) {
  const sanitizedQuery = sanitizeSearchQuery(query);
  return await db.query.permissions.findMany({
    where: or(
      like(permissions.module, `%${sanitizedQuery}%`),
      like(permissions.action, `%${sanitizedQuery}%`),
      like(permissions.description, `%${sanitizedQuery}%`)
    ),
    orderBy: [desc(permissions.module)],
  });
}

/**
 * Obtiene todos los módulos únicos
 */
export async function getAllModules(): Promise<string[]> {
  const allPermissions = await db.select({
    module: permissions.module,
  }).from(permissions);

  const uniqueModules = new Set(allPermissions.map(p => p.module));
  return Array.from(uniqueModules).sort();
}

/**
 * Sincroniza permisos: crea permisos que faltan basándose en una lista
 */
export async function syncPermissions(
  permissionsToSync: Array<{ module: string; action: string; description?: string }>
) {
  const created = [];
  const skipped = [];

  for (const perm of permissionsToSync) {
    const existing = await getPermissionByModuleAndAction(perm.module, perm.action);

    if (!existing) {
      const newPerm = await createPermission({
        module: perm.module,
        action: perm.action,
        description: perm.description || `${perm.action} ${perm.module}`,
      });
      created.push(newPerm);
    } else {
      skipped.push(existing);
    }
  }

  return {
    created: created.length,
    skipped: skipped.length,
    total: permissionsToSync.length,
  };
}

/**
 * Crea permisos CRUD para un módulo
 */
export async function createCRUDPermissionsForModule(
  module: string,
  moduleDescription: string
) {
  const actions = [
    { action: "create", description: `Crear ${moduleDescription.toLowerCase()}` },
    { action: "read", description: `Leer ${moduleDescription.toLowerCase()}` },
    { action: "update", description: `Actualizar ${moduleDescription.toLowerCase()}` },
    { action: "delete", description: `Eliminar ${moduleDescription.toLowerCase()}` },
  ];

  const created = [];

  for (const actionData of actions) {
    const existing = await getPermissionByModuleAndAction(module, actionData.action);

    if (!existing) {
      const newPerm = await createPermission({
        module,
        action: actionData.action,
        description: actionData.description,
      });
      created.push(newPerm);
    }
  }

  return created;
}

/**
 * Limpia cache de permisos de usuarios afectados por cambio en un permiso
 */
async function clearAllUsersCacheForPermission(permissionId: number) {
  // Obtener todos los roles que tienen este permiso
  const rolesWithPermission = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.permissionId, permissionId),
  });

  if (rolesWithPermission.length === 0) {
    return;
  }

  const roleIds = rolesWithPermission.map(rp => rp.roleId);

  // Obtener todos los usuarios con esos roles
  const usersWithRoles = await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.roleId, roleIds),
  });

  // Limpiar cache de cada usuario
  for (const user of usersWithRoles) {
    clearUserPermissionsCache(user.id);
  }
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

  // Contar permisos por módulo (para compatibilidad)
  const permissionsByModule: Record<string, number> = {};
  for (const permission of allPermissions) {
    permissionsByModule[permission.module] =
      (permissionsByModule[permission.module] || 0) + 1;
  }

  return {
    totalPermissions: allPermissions.length,
    totalModules: modules.length,
    moduleBreakdown: moduleBreakdown.sort((a, b) => b.count - a.count),
    permissionsByModule,
  };
}

export const permissionService = {
  getAllPermissions,
  getPermissionsGroupedByModule,
  getPermissionById,
  getPermissionsByModule,
  getModules,
  createPermission,
  createModulePermissions,
  getPermissionByModuleAndAction,
  updatePermission,
  deletePermission,
  deleteModulePermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  getUserPermissions,
  getUserPermissionsGrouped,
  searchPermissions,
  getAllModules,
  syncPermissions,
  createCRUDPermissionsForModule,
  getPermissionStats,
};
