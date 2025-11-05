import { ensureDir } from "@std/fs";
import { format } from "@std/datetime";

/**
 * ============================================
 * SECURITY LOGGER
 * ============================================
 * Sistema de logging de eventos de seguridad
 */

export enum SecurityEventType {
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
  TWO_FACTOR_FAILED = "TWO_FACTOR_FAILED",
  TWO_FACTOR_SUCCESS = "TWO_FACTOR_SUCCESS",
  BACKUP_CODE_USED = "BACKUP_CODE_USED",
  INVALID_TOKEN = "INVALID_TOKEN",
  PERMISSION_DENIED = "PERMISSION_DENIED",
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: number;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

const LOG_DIR = "./logs/security";

/**
 * Asegurar que el directorio de logs existe
 */
async function ensureLogDir() {
  try {
    await ensureDir(LOG_DIR);
  } catch (error) {
    console.error("Error creando directorio de logs:", error);
  }
}

/**
 * Obtener nombre del archivo de log según la fecha
 */
function getLogFileName(): string {
  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  return `${LOG_DIR}/security-${dateStr}.log`;
}

/**
 * Escribir evento de seguridad en el log
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
  const logEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Formatear como JSON en una línea
  const logLine = JSON.stringify(logEvent) + "\n";

  try {
    await ensureLogDir();
    const logFile = getLogFileName();

    // Escribir en el archivo (append)
    await Deno.writeTextFile(logFile, logLine, { append: true });
  } catch (error) {
    // Fallar silenciosamente para no romper la aplicación
    console.error("Error escribiendo log de seguridad:", error);
  }
}

/**
 * Helpers para eventos comunes
 */

export async function logLoginFailed(email: string, ip?: string, userAgent?: string) {
  await logSecurityEvent({
    type: SecurityEventType.LOGIN_FAILED,
    email,
    ip,
    userAgent,
    details: { reason: "Invalid credentials" },
  });
}

export async function logLoginSuccess(userId: number, email: string, ip?: string, userAgent?: string) {
  await logSecurityEvent({
    type: SecurityEventType.LOGIN_SUCCESS,
    userId,
    email,
    ip,
    userAgent,
  });
}

export async function logUnauthorizedAccess(
  userId: number | undefined,
  path: string,
  ip?: string,
  userAgent?: string
) {
  await logSecurityEvent({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    ip,
    userAgent,
    details: { path },
  });
}

export async function logRateLimitExceeded(ip?: string, path?: string) {
  await logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    ip,
    details: { path },
  });
}

export async function logPasswordChanged(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.PASSWORD_CHANGED,
    userId,
    email,
    ip,
  });
}

export async function log2FAEnabled(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.TWO_FACTOR_ENABLED,
    userId,
    email,
    ip,
  });
}

export async function log2FADisabled(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.TWO_FACTOR_DISABLED,
    userId,
    email,
    ip,
  });
}

export async function log2FAFailed(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.TWO_FACTOR_FAILED,
    userId,
    email,
    ip,
    details: { reason: "Invalid 2FA code" },
  });
}

export async function log2FASuccess(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.TWO_FACTOR_SUCCESS,
    userId,
    email,
    ip,
  });
}

export async function logBackupCodeUsed(userId: number, email: string, ip?: string) {
  await logSecurityEvent({
    type: SecurityEventType.BACKUP_CODE_USED,
    userId,
    email,
    ip,
  });
}

export async function logInvalidToken(ip?: string, userAgent?: string) {
  await logSecurityEvent({
    type: SecurityEventType.INVALID_TOKEN,
    ip,
    userAgent,
  });
}

export async function logPermissionDenied(
  userId: number,
  requiredPermission: string,
  ip?: string
) {
  await logSecurityEvent({
    type: SecurityEventType.PERMISSION_DENIED,
    userId,
    ip,
    details: { requiredPermission },
  });
}

/**
 * Leer logs de un día específico
 * Útil para auditoría y análisis
 */
export async function readSecurityLogs(date?: Date): Promise<SecurityEvent[]> {
  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");
  const logFile = `${LOG_DIR}/security-${dateStr}.log`;

  try {
    const content = await Deno.readTextFile(logFile);
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    return lines.map((line) => JSON.parse(line));
  } catch (error) {
    // Archivo no existe o error leyendo
    return [];
  }
}

/**
 * Obtener estadísticas de eventos de seguridad
 */
export async function getSecurityStats(date?: Date): Promise<Record<string, number>> {
  const events = await readSecurityLogs(date);
  const stats: Record<string, number> = {};

  for (const event of events) {
    stats[event.type] = (stats[event.type] || 0) + 1;
  }

  return stats;
}
