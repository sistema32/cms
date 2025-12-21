import { Context } from "hono";
import { z } from "zod";
import * as twoFactorService from "@/services/auth/twoFactorService.ts";
import {
  log2FAEnabled,
  log2FADisabled,
  log2FASuccess,
  log2FAFailed,
} from "@/utils/securityLogger.ts";
import { AppError } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { getErrorMessage } from "@/utils/errors.ts";

const log = createLogger("twoFactorController");
const getClientIp = (c: Context) => c.req.header("x-forwarded-for") || c.req.header("x-real-ip");

/**
 * ============================================
 * TWO-FACTOR AUTHENTICATION CONTROLLER
 * ============================================
 */

// Schemas de validación
const verify2FASchema = z.object({
  token: z.string().length(6, "El código debe tener 6 dígitos"),
});

const regenerateBackupCodesSchema = z.object({
  token: z.string().length(6, "El código debe tener 6 dígitos"),
});

/**
 * POST /api/auth/2fa/setup
 * Iniciar configuración de 2FA (genera secret y QR code)
 */
export async function setup2FA(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const result = await twoFactorService.setup2FA(user.userId, user.email);

    return c.json({
      message: "2FA configurado. Escanea el código QR con tu app autenticadora",
      qrCodeUrl: result.qrCodeUrl,
      secret: result.secret, // Para entrada manual
      backupCodes: result.backupCodes, // Guardar en lugar seguro
    }, 200);
  } catch (error) {
    log.error("Error al configurar 2FA", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("twofa_setup_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/auth/2fa/enable
 * Habilitar 2FA verificando el código
 */
export async function enable2FA(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    await twoFactorService.enable2FA(user.userId, token);

    // Log de seguridad
    const ip = getClientIp(c);
    await log2FAEnabled(user.userId, user.email, ip);

    return c.json({
      message: "2FA habilitado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("twofa_enable_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/auth/2fa/disable
 * Deshabilitar 2FA
 */
export async function disable2FA(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    await twoFactorService.disable2FA(user.userId, token);

    // Log de seguridad
    const ip = getClientIp(c);
    await log2FADisabled(user.userId, user.email, ip);

    return c.json({
      message: "2FA deshabilitado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("twofa_disable_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/auth/2fa/verify
 * Verificar código 2FA durante login
 */
export async function verify2FA(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    const isValid = await twoFactorService.verify2FA(user.userId, token);

    if (!isValid) {
      const ip = getClientIp(c);
      await log2FAFailed(user.userId, user.email, ip);

      throw new AppError("invalid_2fa_code", "Código 2FA inválido", 401);
    }

    const ip = getClientIp(c);
    await log2FASuccess(user.userId, user.email, ip);

    return c.json({
      message: "2FA verificado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("twofa_verify_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/auth/2fa/backup-codes
 * Regenerar códigos de respaldo
 */
export async function regenerateBackupCodes(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const body = await c.req.json();
    const { token } = regenerateBackupCodesSchema.parse(body);

    const newBackupCodes = await twoFactorService.regenerateBackupCodes(user.userId, token);

    return c.json({
      message: "Códigos de respaldo regenerados",
      backupCodes: newBackupCodes,
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("twofa_regenerate_failed", getErrorMessage(error), 400);
  }
}

/**
 * GET /api/auth/2fa/status
 * Verificar si el usuario tiene 2FA habilitado
 */
export async function get2FAStatus(c: Context) {
  try {
    const user = c.get("user");

    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const isEnabled = await twoFactorService.has2FAEnabled(user.userId);

    return c.json({
      enabled: isEnabled,
      globallyEnabled: twoFactorService.is2FAEnabled(),
    }, 200);
  } catch (error) {
    log.error("Error al obtener estado de 2FA", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("twofa_status_failed", getErrorMessage(error), 500);
  }
}
