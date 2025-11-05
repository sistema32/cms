import { eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { roles, rolePermissions, permissions } from "../db/schema.ts";
import type { NewRole } from "../db/schema.ts";

/**
 * Obtener todos los roles
 */
export async function getAllRoles() {
  return await db.query.roles.findMany({
    with: {
      rolePermissions: {
        with: {
          permission: true,
        },
      },
    },
  });
}

/**
 * Obtener un rol por ID
 */
export async function getRoleById(roleId: number) {
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
    with: {
      rolePermissions: {
        with: {
          permission: true,
        },
      },
    },
  });

  if (!role) {
    throw new Error("Rol no encontrado");
  }

  return role;
}

/**
 * Obtener un rol por nombre
 */
export async function getRoleByName(name: string) {
  return await db.query.roles.findFirst({
    where: eq(roles.name, name),
    with: {
      rolePermissions: {
        with: {
          permission: true,
        },
      },
    },
  });
}

/**
 * Crear un nuevo rol
 */
export async function createRole(data: NewRole) {
  const existingRole = await db.query.roles.findFirst({
    where: eq(roles.name, data.name),
  });

  if (existingRole) {
    throw new Error("Ya existe un rol con ese nombre");
  }

  const [newRole] = await db.insert(roles).values(data).returning();

  return newRole;
}

/**
 * Actualizar un rol
 */
export async function updateRole(roleId: number, data: Partial<NewRole>) {
  const [updatedRole] = await db
    .update(roles)
    .set(data)
    .where(eq(roles.id, roleId))
    .returning();

  if (!updatedRole) {
    throw new Error("Rol no encontrado");
  }

  return updatedRole;
}

/**
 * Eliminar un rol
 */
export async function deleteRole(roleId: number) {
  // No permitir eliminar roles del sistema
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
  });

  if (role && ["superadmin", "admin", "user", "guest"].includes(role.name)) {
    throw new Error("No se puede eliminar un rol del sistema");
  }

  await db.delete(roles).where(eq(roles.id, roleId));
}

/**
 * Asignar permisos a un rol
 */
export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[]
) {
  // Verificar que el rol existe
  const role = await getRoleById(roleId);

  // Eliminar permisos existentes
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

  // Asignar nuevos permisos
  if (permissionIds.length > 0) {
    const assignments = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await db.insert(rolePermissions).values(assignments);
  }

  return await getRoleById(roleId);
}

/**
 * Obtener permisos de un rol
 */
export async function getRolePermissions(roleId: number) {
  const role = await getRoleById(roleId);

  return role.rolePermissions.map((rp) => rp.permission);
}
