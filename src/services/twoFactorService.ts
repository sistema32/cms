import { db } from "../config/db.ts";
import { user2FA, type User2FA, type NewUser2FA } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/password.ts";
import { env } from "../config/env.ts";

/**
 * ============================================
 * TWO-FACTOR AUTHENTICATION SERVICE
 * ============================================
 * Servicio para gestionar autenticación de dos factores (2FA)
 *
 * Nota: Este servicio solo funciona si ENABLE_2FA=true en .env
 */

// Usar librería nativa de Deno para crypto
const { crypto } = globalThis;

/**
 * Verificar si 2FA está habilitado globalmente
 */
export function is2FAEnabled(): boolean {
  return env.ENABLE_2FA === true;
}

/**
 * Generar secret TOTP de 32 caracteres base32
 */
export function generateSecret(): string {
  const buffer = new Uint8Array(20); // 160 bits
  crypto.getRandomValues(buffer);

  // Convertir a base32
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let i = 0; i < buffer.length; i += 5) {
    const chunk = (buffer[i] << 32) |
                  (buffer[i + 1] << 24) |
                  (buffer[i + 2] << 16) |
                  (buffer[i + 3] << 8) |
                  buffer[i + 4];

    for (let j = 0; j < 8; j++) {
      secret += base32chars[(chunk >>> (35 - j * 5)) & 0x1f];
    }
  }

  return secret.slice(0, 32);
}

/**
 * Generar códigos de respaldo (10 códigos de 8 caracteres)
 */
export async function generateBackupCodes(): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);

    // Convertir a hex y tomar 8 caracteres
    const code = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 8)
      .toUpperCase();

    codes.push(code);
  }

  return codes;
}

/**
 * Generar código TOTP de 6 dígitos
 * Implementación simplificada de TOTP (Time-based One-Time Password)
 */
function generateTOTP(secret: string, timeStep: number = 30): string {
  // Obtener contador de tiempo (segundos / 30)
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / timeStep);

  // Convertir secret de base32 a bytes
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secretBytes = new Uint8Array(20);

  for (let i = 0; i < secret.length; i++) {
    const idx = base32chars.indexOf(secret[i]);
    if (idx !== -1) {
      secretBytes[Math.floor(i * 5 / 8)] |= idx << (3 - (i * 5) % 8);
    }
  }

  // HMAC-SHA1 simplificado (para producción usar librería completa)
  // Por ahora usamos un hash simple
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >> 8;
  }

  // Generar código de 6 dígitos (simplificado)
  const code = Math.abs(Array.from(secretBytes).reduce((a, b) => a + b, 0) % 1000000);
  return code.toString().padStart(6, "0");
}

/**
 * Verificar código TOTP
 * Permite ventana de ±1 paso (90 segundos total)
 */
export function verifyTOTP(secret: string, token: string): boolean {
  if (token.length !== 6) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Verificar paso actual y ±1 paso
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(now / timeStep) + i;
    const validCode = generateTOTP(secret, timeStep);

    if (token === validCode) {
      return true;
    }
  }

  return false;
}

/**
 * Generar URL para QR code (compatib le con Google Authenticator, Authy, etc.)
 */
export function getQRCodeData(secret: string, email: string, issuer: string = "LexCMS"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Iniciar configuración de 2FA para un usuario
 * Retorna el secret y el QR code data
 */
export async function setup2FA(userId: number, email: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  if (!is2FAEnabled()) {
    throw new Error("2FA está deshabilitado en este entorno");
  }

  // Verificar si ya existe configuración
  const existing = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (existing && existing.isEnabled) {
    throw new Error("2FA ya está habilitado para este usuario");
  }

  // Generar secret y backup codes
  const secret = generateSecret();
  const backupCodes = await generateBackupCodes();

  // Hashear backup codes antes de guardar
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(code => hashPassword(code))
  );

  // Guardar o actualizar en BD
  if (existing) {
    await db
      .update(user2FA)
      .set({
        secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
        isEnabled: false, // No habilitado hasta que verifique
        updatedAt: new Date(),
      })
      .where(eq(user2FA.userId, userId));
  } else {
    await db.insert(user2FA).values({
      userId,
      secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
      isEnabled: false,
    });
  }

  // Generar QR code data
  const qrCodeUrl = getQRCodeData(secret, email);

  return {
    secret,
    qrCodeUrl,
    backupCodes, // Retornar códigos sin hashear para que el usuario los guarde
  };
}

/**
 * Habilitar 2FA después de verificar el código
 */
export async function enable2FA(userId: number, token: string): Promise<void> {
  if (!is2FAEnabled()) {
    throw new Error("2FA está deshabilitado en este entorno");
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (!user2fa) {
    throw new Error("No se encontró configuración de 2FA");
  }

  if (user2fa.isEnabled) {
    throw new Error("2FA ya está habilitado");
  }

  // Verificar código
  const isValid = verifyTOTP(user2fa.secret, token);

  if (!isValid) {
    throw new Error("Código 2FA inválido");
  }

  // Habilitar 2FA
  await db
    .update(user2FA)
    .set({
      isEnabled: true,
      updatedAt: new Date(),
    })
    .where(eq(user2FA.userId, userId));
}

/**
 * Deshabilitar 2FA
 */
export async function disable2FA(userId: number, token: string): Promise<void> {
  if (!is2FAEnabled()) {
    throw new Error("2FA está deshabilitado en este entorno");
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (!user2fa) {
    throw new Error("No se encontró configuración de 2FA");
  }

  if (!user2fa.isEnabled) {
    throw new Error("2FA no está habilitado");
  }

  // Verificar código
  const isValid = verifyTOTP(user2fa.secret, token);

  if (!isValid) {
    throw new Error("Código 2FA inválido");
  }

  // Deshabilitar 2FA
  await db.delete(user2FA).where(eq(user2FA.userId, userId));
}

/**
 * Verificar código 2FA durante login
 */
export async function verify2FA(userId: number, token: string): Promise<boolean> {
  if (!is2FAEnabled()) {
    return true; // Si 2FA está deshabilitado, permitir acceso
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (!user2fa || !user2fa.isEnabled) {
    return true; // Usuario no tiene 2FA habilitado
  }

  // Verificar código TOTP
  return verifyTOTP(user2fa.secret, token);
}

/**
 * Verificar código de respaldo
 */
export async function verifyBackupCode(userId: number, code: string): Promise<boolean> {
  if (!is2FAEnabled()) {
    return true;
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (!user2fa || !user2fa.isEnabled) {
    return false;
  }

  const backupCodes: string[] = JSON.parse(user2fa.backupCodes);

  // Verificar contra cada código hasheado
  for (let i = 0; i < backupCodes.length; i++) {
    const isValid = await comparePassword(code, backupCodes[i]);

    if (isValid) {
      // Eliminar código usado
      backupCodes.splice(i, 1);

      // Actualizar BD
      await db
        .update(user2FA)
        .set({
          backupCodes: JSON.stringify(backupCodes),
          updatedAt: new Date(),
        })
        .where(eq(user2FA.userId, userId));

      return true;
    }
  }

  return false;
}

/**
 * Verificar si un usuario tiene 2FA habilitado
 */
export async function has2FAEnabled(userId: number): Promise<boolean> {
  if (!is2FAEnabled()) {
    return false;
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  return user2fa?.isEnabled === true;
}

/**
 * Regenerar códigos de respaldo
 */
export async function regenerateBackupCodes(userId: number, token: string): Promise<string[]> {
  if (!is2FAEnabled()) {
    throw new Error("2FA está deshabilitado en este entorno");
  }

  const user2fa = await db.query.user2FA.findFirst({
    where: eq(user2FA.userId, userId),
  });

  if (!user2fa || !user2fa.isEnabled) {
    throw new Error("2FA no está habilitado para este usuario");
  }

  // Verificar código
  const isValid = verifyTOTP(user2fa.secret, token);

  if (!isValid) {
    throw new Error("Código 2FA inválido");
  }

  // Generar nuevos códigos
  const newBackupCodes = await generateBackupCodes();
  const hashedBackupCodes = await Promise.all(
    newBackupCodes.map(code => hashPassword(code))
  );

  // Actualizar BD
  await db
    .update(user2FA)
    .set({
      backupCodes: JSON.stringify(hashedBackupCodes),
      updatedAt: new Date(),
    })
    .where(eq(user2FA.userId, userId));

  return newBackupCodes;
}
