import { Context } from "hono";
import { z } from "zod";
import * as twoFactorService from "../services/twoFactorService.ts";
import {
  log2FAEnabled,
  log2FADisabled,
  log2FASuccess,
  log2FAFailed,
} from "../utils/securityLogger.ts";

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
      return c.json({ error: "No autorizado" }, 401);
    }

    const result = await twoFactorService.setup2FA(user.userId, user.email);

    return c.json({
      message: "2FA configurado. Escanea el código QR con tu app autenticadora",
      qrCodeUrl: result.qrCodeUrl,
      secret: result.secret, // Para entrada manual
      backupCodes: result.backupCodes, // Guardar en lugar seguro
    }, 200);
  } catch (error) {
    return c.json({ error: String(error) }, 400);
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
      return c.json({ error: "No autorizado" }, 401);
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    await twoFactorService.enable2FA(user.userId, token);

    // Log de seguridad
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    await log2FAEnabled(user.userId, user.email, ip);

    return c.json({
      message: "2FA habilitado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validación fallida", details: error.errors }, 400);
    }
    return c.json({ error: String(error) }, 400);
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
      return c.json({ error: "No autorizado" }, 401);
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    await twoFactorService.disable2FA(user.userId, token);

    // Log de seguridad
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    await log2FADisabled(user.userId, user.email, ip);

    return c.json({
      message: "2FA deshabilitado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validación fallida", details: error.errors }, 400);
    }
    return c.json({ error: String(error) }, 400);
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
      return c.json({ error: "No autorizado" }, 401);
    }

    const body = await c.req.json();
    const { token } = verify2FASchema.parse(body);

    const isValid = await twoFactorService.verify2FA(user.userId, token);

    if (!isValid) {
      const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
      await log2FAFailed(user.userId, user.email, ip);

      return c.json({ error: "Código 2FA inválido" }, 401);
    }

    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    await log2FASuccess(user.userId, user.email, ip);

    return c.json({
      message: "2FA verificado exitosamente",
    }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validación fallida", details: error.errors }, 400);
    }
    return c.json({ error: String(error) }, 400);
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
      return c.json({ error: "No autorizado" }, 401);
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
      return c.json({ error: "Validación fallida", details: error.errors }, 400);
    }
    return c.json({ error: String(error) }, 400);
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
      return c.json({ error: "No autorizado" }, 401);
    }

    const isEnabled = await twoFactorService.has2FAEnabled(user.userId);

    return c.json({
      enabled: isEnabled,
      globallyEnabled: twoFactorService.is2FAEnabled(),
    }, 200);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
}
