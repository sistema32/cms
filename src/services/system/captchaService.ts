import { env } from "@/config/env.ts";
import * as settingsService from "./settingsService.ts";

/**
 * Tipos de providers de CAPTCHA disponibles
 */
export type CaptchaProvider = "recaptcha" | "hcaptcha" | "turnstile";

/**
 * Obtiene la lista de providers disponibles según las keys configuradas
 * AHORA LEE DESDE SETTINGS DB (con fallback a .env para retrocompatibilidad)
 */
export async function getAvailableProviders(): Promise<CaptchaProvider[]> {
  const providers: CaptchaProvider[] = [];

  // Leer desde settings DB primero, fallback a .env
  const recaptchaKey = await settingsService.getSetting("captcha_recaptcha_secret", env.RECAPTCHA_SECRET_KEY);
  const hcaptchaKey = await settingsService.getSetting("captcha_hcaptcha_secret", env.HCAPTCHA_SECRET_KEY);
  const turnstileKey = await settingsService.getSetting("captcha_turnstile_secret", env.TURNSTILE_SECRET_KEY);

  if (recaptchaKey) {
    providers.push("recaptcha");
  }
  if (hcaptchaKey) {
    providers.push("hcaptcha");
  }
  if (turnstileKey) {
    providers.push("turnstile");
  }

  return providers;
}

/**
 * Selecciona un provider aleatorio entre los disponibles
 * Si hay CAPTCHA_PROVIDER configurado y disponible, lo usa
 * Si no, selecciona uno aleatorio
 */
export async function selectRandomProvider(): Promise<CaptchaProvider> {
  // Leer provider desde settings DB primero, fallback a .env
  const configuredProvider = await settingsService.getSetting<CaptchaProvider>("captcha_provider", env.CAPTCHA_PROVIDER);

  // Si hay un provider específico configurado, usarlo
  if (configuredProvider) {
    const providers = await getAvailableProviders();
    if (providers.includes(configuredProvider)) {
      return configuredProvider;
    }
  }

  // Seleccionar provider aleatorio entre los disponibles
  const availableProviders = await getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error(
      "No hay providers de CAPTCHA configurados. Configura al menos uno en Settings",
    );
  }

  const randomIndex = Math.floor(Math.random() * availableProviders.length);
  return availableProviders[randomIndex];
}

/**
 * Verifica un token de Google reCAPTCHA v2/v3
 * Docs: https://developers.google.com/recaptcha/docs/verify
 * AHORA LEE DESDE SETTINGS DB
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = await settingsService.getSetting("captcha_recaptcha_secret", env.RECAPTCHA_SECRET_KEY);

  if (!secretKey) {
    throw new Error("RECAPTCHA_SECRET_KEY no está configurado en Settings");
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const data = await response.json();

    // reCAPTCHA v2: solo verifica success
    // reCAPTCHA v3: también tiene score (0.0 - 1.0)
    // Para v3, puedes ajustar el threshold según necesites
    if (data.success) {
      // Si hay score (v3), verificar que sea mayor a 0.5
      if (data.score !== undefined) {
        return data.score >= 0.5;
      }
      // Si no hay score (v2), solo verificar success
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error verificando reCAPTCHA:", error);
    return false;
  }
}

/**
 * Verifica un token de hCaptcha
 * Docs: https://docs.hcaptcha.com/#verify-the-user-response-server-side
 * AHORA LEE DESDE SETTINGS DB
 */
export async function verifyHcaptcha(token: string): Promise<boolean> {
  const secretKey = await settingsService.getSetting("captcha_hcaptcha_secret", env.HCAPTCHA_SECRET_KEY);

  if (!secretKey) {
    throw new Error("HCAPTCHA_SECRET_KEY no está configurado en Settings");
  }

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Error verificando hCaptcha:", error);
    return false;
  }
}

/**
 * Verifica un token de Cloudflare Turnstile
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 * AHORA LEE DESDE SETTINGS DB
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = await settingsService.getSetting("captcha_turnstile_secret", env.TURNSTILE_SECRET_KEY);

  if (!secretKey) {
    throw new Error("TURNSTILE_SECRET_KEY no está configurado en Settings");
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Error verificando Turnstile:", error);
    return false;
  }
}

/**
 * Verifica un token de CAPTCHA usando el provider especificado
 * @param token - Token del CAPTCHA
 * @param provider - Provider a usar (recaptcha, hcaptcha, turnstile)
 * @returns true si el token es válido, false en caso contrario
 */
export async function verifyCaptcha(
  token: string,
  provider: CaptchaProvider,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  // BYPASS PARA DESARROLLO: Aceptar token especial en development
  if (env.DENO_ENV === "development" && token === "dev-bypass-token") {
    console.log("⚠️ CAPTCHA bypass activado (solo desarrollo)");
    return true;
  }

  switch (provider) {
    case "recaptcha":
      return await verifyRecaptcha(token);
    case "hcaptcha":
      return await verifyHcaptcha(token);
    case "turnstile":
      return await verifyTurnstile(token);
    default:
      throw new Error(`Provider de CAPTCHA no soportado: ${provider}`);
  }
}

/**
 * Verifica si los comentarios están habilitados
 * AHORA LEE DESDE SETTINGS DB
 */
export async function areCommentsEnabled(): Promise<boolean> {
  return await settingsService.getSetting("enable_comments", env.ENABLE_COMMENTS === true);
}

/**
 * Obtiene información sobre la configuración de CAPTCHA
 * AHORA LEE DESDE SETTINGS DB
 */
export async function getCaptchaInfo() {
  const availableProviders = await getAvailableProviders();
  const forcedProvider = await settingsService.getSetting<CaptchaProvider>("captcha_provider", env.CAPTCHA_PROVIDER);
  const captchaEnabled = await settingsService.getSetting("captcha_enabled", false);

  return {
    enabled: captchaEnabled,
    availableProviders,
    forcedProvider,
    mode: forcedProvider ? "forced" : "random",
  };
}
