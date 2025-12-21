import { db } from "@/config/db.ts";
import { users, roles, rolePermissions, permissions } from "@/db/schema.ts";
import { eq, and } from "drizzle-orm";

/**
 * Cache de permisos de usuario para mejorar el rendimiento
 * Se limpia automáticamente cada 5 minutos
 */
const userPermissionsCache = new Map<number, {
  permissions: Set<string>;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia el cache de permisos de un usuario específico
 */
export function clearUserPermissionsCache(userId: number) {
  userPermissionsCache.delete(userId);
}

/**
 * Limpia todo el cache de permisos
 */
export function clearAllPermissionsCache() {
  userPermissionsCache.clear();
}

/**
 * Obtiene todos los permisos de un usuario
 */
export async function getUserPermissionSet(userId: number): Promise<Set<string>> {
  // Verificar cache
  const cached = userPermissionsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }

  // Obtener usuario con su rol y permisos
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
    return new Set<string>();
  }

  // Construir set de permisos en formato "module.action"
  const permissionSet = new Set<string>();

  for (const rp of user.role.rolePermissions) {
    const permissionString = `${rp.permission.module}.${rp.permission.action}`;
    permissionSet.add(permissionString);
  }

  // Usuario ID 1 siempre tiene todos los permisos (failsafe)
  if (userId === 1 && user.role.name === "superadmin") {
    // Asegurar que el superadmin tenga acceso completo
    permissionSet.add("*.*"); // Permiso comodín
  }

  // Guardar en cache
  userPermissionsCache.set(userId, {
    permissions: permissionSet,
    timestamp: Date.now(),
  });

  return permissionSet;
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export async function hasPermission(
  userId: number,
  module: string,
  action: string
): Promise<boolean> {
  const userPermissions = await getUserPermissionSet(userId);

  // Usuario ID 1 (superadmin) siempre tiene todos los permisos
  if (userId === 1 && userPermissions.has("*.*")) {
    return true;
  }

  // Verificar permiso específico
  const permissionString = `${module}.${action}`;
  return userPermissions.has(permissionString);
}

/**
 * Verifica si un usuario tiene CUALQUIERA de los permisos especificados
 */
export async function hasAnyPermission(
  userId: number,
  permissionsToCheck: Array<{ module: string; action: string }>
): Promise<boolean> {
  const userPermissions = await getUserPermissionSet(userId);

  // Usuario ID 1 (superadmin) siempre tiene todos los permisos
  if (userId === 1 && userPermissions.has("*.*")) {
    return true;
  }

  // Verificar si tiene al menos uno de los permisos
  for (const perm of permissionsToCheck) {
    const permissionString = `${perm.module}.${perm.action}`;
    if (userPermissions.has(permissionString)) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si un usuario tiene TODOS los permisos especificados
 */
export async function hasAllPermissions(
  userId: number,
  permissionsToCheck: Array<{ module: string; action: string }>
): Promise<boolean> {
  const userPermissions = await getUserPermissionSet(userId);

  // Usuario ID 1 (superadmin) siempre tiene todos los permisos
  if (userId === 1 && userPermissions.has("*.*")) {
    return true;
  }

  // Verificar que tenga todos los permisos
  for (const perm of permissionsToCheck) {
    const permissionString = `${perm.module}.${perm.action}`;
    if (!userPermissions.has(permissionString)) {
      return false;
    }
  }

  return true;
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRole(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: true,
    },
  });

  return user?.role || null;
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export async function hasRole(userId: number, roleName: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.name === roleName;
}

/**
 * Verifica si un usuario es superadministrador
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  // El usuario ID 1 siempre es considerado superadmin
  if (userId === 1) {
    return true;
  }

  return await hasRole(userId, "superadmin");
}

/**
 * Verifica si un usuario puede realizar una acción sobre un recurso
 * Incluye verificación de propiedad (ownership)
 */
export async function canAccessResource(
  userId: number,
  module: string,
  action: string,
  resourceOwnerId?: number
): Promise<boolean> {
  // Verificar si tiene el permiso base
  const hasBasePermission = await hasPermission(userId, module, action);

  if (!hasBasePermission) {
    return false;
  }

  // Si no hay dueño del recurso, permitir
  if (resourceOwnerId === undefined) {
    return true;
  }

  // Si el usuario es el dueño del recurso, permitir
  if (userId === resourceOwnerId) {
    return true;
  }

  // Verificar si tiene permisos para acceder a recursos de otros
  // (por ejemplo, para eliminar contenido de otros usuarios)
  const canAccessOthers = await hasPermission(userId, module, `${action}_others`);

  return canAccessOthers;
}

/**
 * Obtiene todas las capacidades de un usuario (lista de permisos)
 */
// ...
export async function getUserCapabilities(userId: number): Promise<string[]> {
  const permissions = await getUserPermissionSet(userId);
  return Array.from(permissions);
}

/**
 * Verifica múltiples permisos y retorna cuáles tiene
 */
export async function checkMultiplePermissions(
  userId: number,
  permissionsToCheck: Array<{ module: string; action: string }>
): Promise<Record<string, boolean>> {
  const userPermissions = await getUserPermissionSet(userId);
  const isSuperAdmin = userId === 1 && userPermissions.has("*.*");

  const result: Record<string, boolean> = {};

  for (const perm of permissionsToCheck) {
    const permissionString = `${perm.module}.${perm.action}`;
    result[permissionString] = isSuperAdmin || userPermissions.has(permissionString);
  }

  return result;
}

/**
 * Obtiene estadísticas de permisos de un usuario
 */
export async function getUserPermissionStats(userId: number) {
  const permissions = await getUserPermissionSet(userId);
  const role = await getUserRole(userId);

  // Agrupar permisos por módulo
  const byModule: Record<string, string[]> = {};

  for (const perm of Array.from(permissions)) {
    if (perm === "*.*") continue; // Saltar permiso comodín

    const [module, action] = perm.split(".");
    if (!byModule[module]) {
      byModule[module] = [];
    }
    byModule[module].push(action);
  }

  return {
    userId,
    role: role?.name || null,
    totalPermissions: permissions.size,
    permissionsByModule: byModule,
    isSuperAdmin: await isSuperAdmin(userId),
  };
}
