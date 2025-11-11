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
await load({ export: true, allowEmptyValues: true });

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
  // Cache configuration
  REDIS_ENABLED: z.string()
    .transform((val) => val === "true")
    .default("false"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default("0"),
  REDIS_KEY_PREFIX: z.string().default("lexcms:"),
  CACHE_MEMORY_MAX_SIZE: z.string().default("10000"),
  CACHE_MEMORY_CLEANUP_INTERVAL: z.string().default("60000"),
  // Email configuration
  EMAIL_PROVIDER: z.string().default("console"),
  EMAIL_FROM: z.string().default("noreply@lexcms.local"),
  EMAIL_FROM_NAME: z.string().default("LexCMS"),
  // SMTP
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.string().default("587"),
  SMTP_SECURE: z.string().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  // Mailgun
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  // Resend
  RESEND_API_KEY: z.string().optional(),
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
  REDIS_ENABLED: Deno.env.get("REDIS_ENABLED"),
  REDIS_HOST: Deno.env.get("REDIS_HOST"),
  REDIS_PORT: Deno.env.get("REDIS_PORT"),
  REDIS_PASSWORD: Deno.env.get("REDIS_PASSWORD"),
  REDIS_DB: Deno.env.get("REDIS_DB"),
  REDIS_KEY_PREFIX: Deno.env.get("REDIS_KEY_PREFIX"),
  CACHE_MEMORY_MAX_SIZE: Deno.env.get("CACHE_MEMORY_MAX_SIZE"),
  CACHE_MEMORY_CLEANUP_INTERVAL: Deno.env.get("CACHE_MEMORY_CLEANUP_INTERVAL"),
  // Email
  EMAIL_PROVIDER: Deno.env.get("EMAIL_PROVIDER"),
  EMAIL_FROM: Deno.env.get("EMAIL_FROM"),
  EMAIL_FROM_NAME: Deno.env.get("EMAIL_FROM_NAME"),
  SMTP_HOST: Deno.env.get("SMTP_HOST"),
  SMTP_PORT: Deno.env.get("SMTP_PORT"),
  SMTP_SECURE: Deno.env.get("SMTP_SECURE"),
  SMTP_USER: Deno.env.get("SMTP_USER"),
  SMTP_PASS: Deno.env.get("SMTP_PASS"),
  SENDGRID_API_KEY: Deno.env.get("SENDGRID_API_KEY"),
  MAILGUN_API_KEY: Deno.env.get("MAILGUN_API_KEY"),
  MAILGUN_DOMAIN: Deno.env.get("MAILGUN_DOMAIN"),
  RESEND_API_KEY: Deno.env.get("RESEND_API_KEY"),
});

export const isDevelopment = env.DENO_ENV === "development";
export const isProduction = env.DENO_ENV === "production";
export const isTest = env.DENO_ENV === "test";
