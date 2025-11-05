import { eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import { users, roles } from "../db/schema.ts";
import { hashPassword, comparePassword } from "../utils/password.ts";
import { generateToken } from "../utils/jwt.ts";
import type { RegisterInput, LoginInput } from "../utils/validation.ts";
import type { AuthResponse, SafeUser } from "../types/index.ts";
import { has2FAEnabled } from "./twoFactorService.ts";
import { logLoginSuccess, logLoginFailed } from "../utils/securityLogger.ts";

/**
 * Registra un nuevo usuario
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  // Verificar si el usuario ya existe
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  // Obtener rol "user" por defecto
  const userRole = await db.query.roles.findFirst({
    where: eq(roles.name, "user"),
  });

  // Hashear contraseña
  const hashedPassword = await hashPassword(data.password);

  // Crear usuario con rol por defecto
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      roleId: userRole?.id,
    })
    .returning();

  // Obtener usuario con rol
  const userWithRole = await db.query.users.findFirst({
    where: eq(users.id, newUser.id),
    with: {
      role: true,
    },
  });

  // Generar token
  const token = await generateToken({
    userId: newUser.id,
    email: newUser.email,
  });

  // Retornar usuario sin password
  const safeUser: SafeUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    avatar: newUser.avatar,
    status: newUser.status,
    role: userWithRole?.role,
    lastLoginAt: newUser.lastLoginAt,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };

  return { user: safeUser, token };
}

/**
 * Autentica un usuario
 */
export async function login(
  data: LoginInput,
  ip?: string,
  userAgent?: string
): Promise<AuthResponse & { requires2FA?: boolean }> {
  // Buscar usuario con rol
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
    with: {
      role: true,
    },
  });

  if (!user) {
    // Log de intento fallido
    await logLoginFailed(data.email, ip, userAgent);
    throw new Error("Credenciales inválidas");
  }

  // Verificar contraseña
  const isValidPassword = await comparePassword(data.password, user.password);

  if (!isValidPassword) {
    // Log de intento fallido
    await logLoginFailed(data.email, ip, userAgent);
    throw new Error("Credenciales inválidas");
  }

  // Verificar si el usuario tiene 2FA habilitado
  const has2FA = await has2FAEnabled(user.id);

  if (has2FA) {
    // Generar token temporal (válido solo para verificar 2FA)
    const tempToken = await generateToken({
      userId: user.id,
      email: user.email,
      temp2FA: true,
    });

    const safeUser: SafeUser = {
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

    return {
      user: safeUser,
      token: tempToken,
      requires2FA: true,
    };
  }

  // Generar token normal
  const token = await generateToken({
    userId: user.id,
    email: user.email,
  });

  // Log de login exitoso
  await logLoginSuccess(user.id, user.email, ip, userAgent);

  // Actualizar último login
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Retornar usuario sin password
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    role: user.role,
    lastLoginAt: new Date(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: safeUser, token };
}
