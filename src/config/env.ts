import { load } from "@std/dotenv";
import { z } from "zod";

function normalizeAdminPath(path: string) {
  let normalized = path.trim();

  if (normalized === "") {
    return "/admincp";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized === "" ? "/admincp" : normalized;
}

// Cargar variables de entorno desde .env
await load({ export: true });

// Esquema de validación
const envSchema = z.object({
  DENO_ENV: z.enum(["development", "production", "test"]).default(
    "development",
  ),
  JWT_SECRET: z.string().min(
    32,
    "JWT_SECRET debe tener al menos 32 caracteres",
  ),
  DATABASE_URL: z.string(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  PORT: z.string().transform(Number).default("8000"),
  BASE_URL: z.string().default("http://localhost:8000"),
  ADMIN_PATH: z.string().default("/admincp").transform(normalizeAdminPath),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ENABLE_2FA: z.string()
    .transform((val) => val === "true")
    .default("false"),
  ENABLE_COMMENTS: z.string()
    .transform((val) => val === "true")
    .default("true"),
  // CAPTCHA keys - opcionales, se verificará en tiempo de ejecución cuáles están disponibles
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  CAPTCHA_PROVIDER: z.enum(["recaptcha", "hcaptcha", "turnstile"]).optional(),
});

// Validar y exportar
export const env = envSchema.parse({
  DENO_ENV: Deno.env.get("DENO_ENV"),
  JWT_SECRET: Deno.env.get("JWT_SECRET"),
  DATABASE_URL: Deno.env.get("DATABASE_URL"),
  DATABASE_AUTH_TOKEN: Deno.env.get("DATABASE_AUTH_TOKEN"),
  PORT: Deno.env.get("PORT"),
  BASE_URL: Deno.env.get("BASE_URL"),
  ADMIN_PATH: Deno.env.get("ADMIN_PATH"),
  CORS_ALLOWED_ORIGINS: Deno.env.get("CORS_ALLOWED_ORIGINS"),
  ENABLE_2FA: Deno.env.get("ENABLE_2FA"),
  ENABLE_COMMENTS: Deno.env.get("ENABLE_COMMENTS"),
  RECAPTCHA_SECRET_KEY: Deno.env.get("RECAPTCHA_SECRET_KEY"),
  HCAPTCHA_SECRET_KEY: Deno.env.get("HCAPTCHA_SECRET_KEY"),
  TURNSTILE_SECRET_KEY: Deno.env.get("TURNSTILE_SECRET_KEY"),
  CAPTCHA_PROVIDER: Deno.env.get("CAPTCHA_PROVIDER"),
});

export const isDevelopment = env.DENO_ENV === "development";
export const isProduction = env.DENO_ENV === "production";
export const isTest = env.DENO_ENV === "test";
