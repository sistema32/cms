import { eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { users } from "../db/schema.ts";
import type { SafeUser } from "../types/index.ts";
import type { UpdateUserInput } from "../utils/validation.ts";

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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Obtiene todos los usuarios (sin passwords)
 */
export async function getAllUsers(): Promise<SafeUser[]> {
  const allUsers = await db.query.users.findMany({
    with: {
      role: true,
    },
  });

  return allUsers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

/**
 * Actualiza un usuario
 */
export async function updateUser(
  userId: number,
  data: UpdateUserInput
): Promise<SafeUser> {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("Usuario no encontrado");
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
}

/**
 * Elimina un usuario
 */
export async function deleteUser(userId: number): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
