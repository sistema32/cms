import { eq, and } from "drizzle-orm";
import { db } from "../config/db.ts";
import { permissions, users, rolePermissions } from "../db/schema.ts";
import type { NewPermission } from "../db/schema.ts";

/**
 * Obtener todos los permisos
 */
export async function getAllPermissions() {
  return await db.query.permissions.findMany();
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
  });
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
