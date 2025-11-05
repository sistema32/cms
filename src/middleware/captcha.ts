import { Context, Next } from "hono";
import {
  verifyCaptcha,
  selectRandomProvider,
  type CaptchaProvider,
} from "../services/captchaService.ts";

/**
 * Middleware para requerir y verificar CAPTCHA
 *
 * Uso:
 * ```typescript
 * app.post("/api/something", requireCaptcha(), async (c) => {
 *   // El CAPTCHA ya fue verificado
 *   // ...
 * });
 * ```
 *
 * El body debe incluir:
 * - captchaToken: string (requerido)
 * - captchaProvider: "recaptcha" | "hcaptcha" | "turnstile" (opcional)
 *
 * Si captchaProvider no se provee, se selecciona uno aleatorio
 */
export function requireCaptcha() {
  return async (c: Context, next: Next) => {
    try {
      // OPTIMIZACIÓN: Hono permite múltiples lecturas del body, no necesitamos clonarlo
      let body: any;
      try {
        body = await c.req.json();
      } catch (_error) {
        return c.json(
          {
            success: false,
            error: "Body JSON inválido",
          },
          400,
        );
      }

      // Verificar que tenga captchaToken
      const captchaToken = body.captchaToken;
      if (!captchaToken || typeof captchaToken !== "string") {
        return c.json(
          {
            success: false,
            error: "Token de CAPTCHA requerido (captchaToken)",
          },
          400,
        );
      }

      // Obtener o seleccionar provider
      let captchaProvider: CaptchaProvider;

      if (body.captchaProvider) {
        // Validar que sea un provider válido
        if (
          !["recaptcha", "hcaptcha", "turnstile"].includes(body.captchaProvider)
        ) {
          return c.json(
            {
              success: false,
              error:
                "Provider de CAPTCHA inválido. Debe ser: recaptcha, hcaptcha o turnstile",
            },
            400,
          );
        }
        captchaProvider = body.captchaProvider;
      } else {
        // Seleccionar provider aleatorio
        try {
          captchaProvider = await selectRandomProvider();
        } catch (error) {
          return c.json(
            {
              success: false,
              error: error instanceof Error
                ? error.message
                : "Error al seleccionar provider de CAPTCHA",
            },
            500,
          );
        }
      }

      // Verificar CAPTCHA
      const isValid = await verifyCaptcha(captchaToken, captchaProvider);

      if (!isValid) {
        return c.json(
          {
            success: false,
            error: "Verificación de CAPTCHA fallida. Por favor, inténtalo de nuevo.",
          },
          400,
        );
      }

      // CAPTCHA válido, almacenar información en contexto para uso posterior
      c.set("captchaVerified", true);
      c.set("captchaProvider", captchaProvider);

      // Continuar con el siguiente middleware/handler
      await next();
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al verificar CAPTCHA",
        },
        500,
      );
    }
  };
}

/**
 * Middleware opcional que verifica CAPTCHA solo para usuarios no autenticados
 * Usuarios autenticados no necesitan CAPTCHA
 *
 * Útil para endpoints que permiten acceso tanto a usuarios autenticados como guests
 */
export function requireCaptchaForGuests() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    // Si hay usuario autenticado, skip CAPTCHA
    if (user) {
      await next();
      return;
    }

    // Si no hay usuario, requerir CAPTCHA
    return await requireCaptcha()(c, next);
  };
}
