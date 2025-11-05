import { eq, count } from "drizzle-orm";
import { db } from "../config/db.ts";
import { roles, rolePermissions, permissions, users } from "../db/schema.ts";
import type { NewRole } from "../db/schema.ts";

export interface RoleWithStats {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  userCount: number;
  permissionCount: number;
  permissions?: any[];
}

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
 * Obtener todos los roles con estadísticas
 */
export async function getAllRolesWithStats(): Promise<RoleWithStats[]> {
  const allRoles = await getAllRoles();

  // Obtener conteo de usuarios por rol
  const allUsers = await db.select().from(users);
  const userCountByRole = allUsers.reduce((acc, user) => {
    if (user.roleId) {
      acc[user.roleId] = (acc[user.roleId] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  return allRoles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    userCount: userCountByRole[role.id] || 0,
    permissionCount: role.rolePermissions.length,
    permissions: role.rolePermissions.map((rp) => rp.permission),
  }));
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
 * Obtener un rol por ID con estadísticas
 */
export async function getRoleByIdWithStats(roleId: number): Promise<RoleWithStats> {
  const role = await getRoleById(roleId);

  // Contar usuarios con este rol
  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.roleId, roleId));

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    userCount,
    permissionCount: role.rolePermissions.length,
    permissions: role.rolePermissions.map((rp) => rp.permission),
  };
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
  // Verificar si es un rol del sistema
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
  });

  if (role?.isSystem && data.name && data.name !== role.name) {
    throw new Error("No se puede cambiar el nombre de un rol del sistema");
  }

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

  if (!role) {
    throw new Error("Rol no encontrado");
  }

  if (role.isSystem) {
    throw new Error("No se puede eliminar un rol del sistema");
  }

  // Verificar si hay usuarios con este rol
  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.roleId, roleId));

  if (userCount > 0) {
    throw new Error(
      `No se puede eliminar el rol porque tiene ${userCount} usuario(s) asignado(s)`
    );
  }

  await db.delete(roles).where(eq(roles.id, roleId));
}

/**
 * Clonar un rol (duplicar rol con sus permisos)
 */
export async function cloneRole(
  roleId: number,
  newName: string,
  newDescription?: string
): Promise<any> {
  // Obtener el rol original
  const originalRole = await getRoleById(roleId);

  // Verificar que no exista un rol con el nuevo nombre
  const existingRole = await db.query.roles.findFirst({
    where: eq(roles.name, newName),
  });

  if (existingRole) {
    throw new Error("Ya existe un rol con ese nombre");
  }

  // Crear el nuevo rol
  const [newRole] = await db
    .insert(roles)
    .values({
      name: newName,
      description: newDescription || `Clonado de ${originalRole.name}`,
      isSystem: false, // Los roles clonados nunca son del sistema
    })
    .returning();

  // Copiar los permisos
  if (originalRole.rolePermissions.length > 0) {
    const permissionAssignments = originalRole.rolePermissions.map((rp) => ({
      roleId: newRole.id,
      permissionId: rp.permissionId,
    }));

    await db.insert(rolePermissions).values(permissionAssignments);
  }

  return await getRoleById(newRole.id);
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

/**
 * Obtiene estadísticas generales de roles
 */
export async function getRoleStats() {
  const allRoles = await db.select().from(roles);
  const allUsers = await db.select().from(users);

  const stats = {
    totalRoles: allRoles.length,
    systemRoles: allRoles.filter((r) => r.isSystem).length,
    customRoles: allRoles.filter((r) => !r.isSystem).length,
    totalUsers: allUsers.length,
    usersWithoutRole: allUsers.filter((u) => !u.roleId).length,
  };

  return stats;
}
