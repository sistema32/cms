import { eq, like, or, and, inArray, count, desc, asc } from "drizzle-orm";
import { db } from "../config/db.ts";
import { users, type User, type Role } from "../db/schema.ts";
import type { SafeUser } from "../types/index.ts";
import type { UpdateUserInput } from "../utils/validation.ts";
import { webhookManager } from "../lib/webhooks/index.ts";

export interface UserFilters {
  search?: string;
  status?: string;
  roleId?: number;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsers {
  users: SafeUser[];
  total: number;
  hasMore: boolean;
}

/**
 * Convierte un usuario de BD a SafeUser
 */
function toSafeUser(user: User & { role?: Role }): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Obtiene un usuario por ID (sin password)
 */
export async function getUserById(userId: number): Promise<SafeUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return toSafeUser(user);
}

/**
 * Obtiene un usuario por email (sin password)
 */
export async function getUserByEmail(email: string): Promise<SafeUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return toSafeUser(user);
}

/**
 * Obtiene todos los usuarios (sin passwords)
 */
export async function getAllUsers(): Promise<SafeUser[]> {
  const allUsers = await db.query.users.findMany({
    with: {
      role: true,
    },
    orderBy: [desc(users.createdAt)],
  });

  return allUsers.map(toSafeUser);
}

/**
 * Obtiene usuarios con filtros y paginación
 */
export async function getUsersWithFilters(
  filters: UserFilters = {}
): Promise<PaginatedUsers> {
  const {
    search,
    status,
    roleId,
    limit = 20,
    offset = 0,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  // Construir condiciones WHERE
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }

  if (status) {
    conditions.push(eq(users.status, status));
  }

  if (roleId) {
    conditions.push(eq(users.roleId, roleId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Obtener total de usuarios
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(users)
    .where(whereClause);

  // Determinar orden
  const orderColumn = {
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
    lastLoginAt: users.lastLoginAt,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;

  // Obtener usuarios
  const allUsers = await db.query.users.findMany({
    where: whereClause,
    with: {
      role: true,
    },
    limit,
    offset,
    orderBy: [orderFn(orderColumn)],
  });

  return {
    users: allUsers.map(toSafeUser),
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Actualiza un usuario
 */
export async function updateUser(
  userId: number,
  data: UpdateUserInput
): Promise<SafeUser> {
  // Verificar que el usuario existe
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  // Proteger el usuario ID 1 (superadmin)
  if (userId === 1 && data.roleId && data.roleId !== existingUser.role?.id) {
    throw new Error("No se puede cambiar el rol del superadmin principal");
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("Error al actualizar usuario");
  }

  // Obtener usuario actualizado con rol
  const userWithRole = await getUserById(userId);

  // Dispatch webhook event
  try {
    await webhookManager.dispatch("user.updated", {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      status: updatedUser.status,
      roleId: updatedUser.roleId,
      updatedAt: updatedUser.updatedAt,
      changes: data,
    });
  } catch (error) {
    console.warn("Failed to dispatch user.updated webhook:", error);
  }

  return userWithRole!;
}

/**
 * Cambia el estado de un usuario
 */
export async function updateUserStatus(
  userId: number,
  status: "active" | "inactive" | "suspended"
): Promise<SafeUser> {
  // Proteger el usuario ID 1
  if (userId === 1) {
    throw new Error("No se puede cambiar el estado del superadmin principal");
  }

  return updateUser(userId, { status });
}

/**
 * Actualiza el último login de un usuario
 */
export async function updateLastLogin(userId: number): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Elimina un usuario
 */
export async function deleteUser(userId: number): Promise<void> {
  // Proteger el usuario ID 1
  if (userId === 1) {
    throw new Error("No se puede eliminar el superadmin principal");
  }

  // Get user data before deletion
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  await db.delete(users).where(eq(users.id, userId));

  // Dispatch webhook event
  try {
    await webhookManager.dispatch("user.deleted", {
      id: user.id,
      email: user.email,
      name: user.name,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Failed to dispatch user.deleted webhook:", error);
  }
}

/**
 * Elimina múltiples usuarios (bulk delete)
 */
export async function deleteUsers(userIds: number[]): Promise<number> {
  // Filtrar el usuario ID 1
  const safeIds = userIds.filter((id) => id !== 1);

  if (safeIds.length === 0) {
    return 0;
  }

  const result = await db.delete(users).where(inArray(users.id, safeIds));

  return safeIds.length;
}

/**
 * Cambia el estado de múltiples usuarios (bulk status change)
 */
export async function bulkUpdateUserStatus(
  userIds: number[],
  status: "active" | "inactive" | "suspended"
): Promise<number> {
  // Filtrar el usuario ID 1
  const safeIds = userIds.filter((id) => id !== 1);

  if (safeIds.length === 0) {
    return 0;
  }

  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(inArray(users.id, safeIds));

  return safeIds.length;
}

/**
 * Obtiene estadísticas de usuarios
 */
export async function getUserStats() {
  const allUsers = await db.select().from(users);

  const stats = {
    total: allUsers.length,
    active: allUsers.filter((u) => u.status === "active").length,
    inactive: allUsers.filter((u) => u.status === "inactive").length,
    suspended: allUsers.filter((u) => u.status === "suspended").length,
    with2FA: allUsers.filter((u) => u.twoFactorEnabled).length,
  };

  return stats;
}
