import { z } from "zod";

// ============================================
// USER AUTHENTICATION SCHEMAS
// ============================================

// Esquema para registro de usuario
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Debe contener al menos un símbolo especial"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
});

// Esquema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// Esquema para actualizar usuario
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

// Esquema para URLs
export const urlSchema = z.string().url("URL inválida").refine(
  (url) => {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: "Protocolo de URL no permitido. Solo se permiten: http, https, mailto, tel" }
);

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^0\.0\.0\.0$/,
  /^169\.254\./,
  /^\[?::1\]?$/,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Validates URLs that must not point to private/internal hosts (basic SSRF guard).
 */
export function isSafePublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname;
    if (!hostname) return false;
    if (isPrivateHost(hostname)) return false;
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

// Esquema para búsquedas (search queries)
export const searchQuerySchema = z.string()
  .max(100, "La búsqueda no puede exceder 100 caracteres")
  .transform((val) => val.trim())
  .refine(
    (val) => !val.includes('\0'),
    { message: "La búsqueda contiene caracteres no permitidos" }
  )
  .refine(
    (val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val),
    { message: "La búsqueda contiene caracteres de control no permitidos" }
  );

// Esquema para slugs
export const slugSchema = z.string()
  .min(1, "El slug no puede estar vacío")
  .max(200, "El slug no puede exceder 200 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede contener letras minúsculas, números y guiones");

// Esquema para validar que no contenga XSS
export const noXSSSchema = z.string().refine(
  (val) => {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];
    return !xssPatterns.some(pattern => pattern.test(val));
  },
  { message: "El contenido contiene patrones potencialmente peligrosos (XSS)" }
);

// Esquema para validar que no contenga SQL injection
export const noSQLInjectionSchema = z.string().refine(
  (val) => {
    const suspiciousPatterns = [
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
      /union\s+select/i,
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*insert\s+into/i,
      /;\s*update\s+.+\s+set/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(val));
  },
  { message: "El contenido contiene patrones sospechosos de SQL injection" }
);

// Esquema combinado para búsquedas seguras (sin XSS ni SQL injection)
export const safeSearchSchema = searchQuerySchema
  .pipe(noXSSSchema)
  .pipe(noSQLInjectionSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valida un email usando Zod
 */
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Valida una URL usando Zod
 */
export function validateURL(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Valida una búsqueda de forma segura
 */
export function validateSearchQuery(query: string): { success: boolean; data?: string; error?: string } {
  const result = safeSearchSchema.safeParse(query);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message };
}

/**
 * Valida un slug
 */
export function validateSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

// ============================================
// TYPE EXPORTS
// ============================================

// Tipos inferidos
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
