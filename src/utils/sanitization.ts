/**
 * Utilidades de sanitización para prevenir XSS y otras vulnerabilidades
 */

/**
 * Lista de tags HTML permitidos (whitelist)
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span'
];

/**
 * Atributos permitidos por tag
 */
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'div': ['class'],
  'span': ['class'],
  'p': ['class'],
  'code': ['class'],
};

/**
 * Patrones peligrosos que deben ser removidos
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc.
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
];

/**
 * Sanitiza HTML removiendo scripts y contenido peligroso
 */
export function sanitizeHTML(dirty: string | null | undefined): string {
  if (!dirty) return '';

  let clean = dirty;

  // Remover patrones peligrosos
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Remover tags no permitidos pero mantener contenido
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  clean = clean.replace(tagPattern, (match, tagName) => {
    const tag = tagName.toLowerCase();

    // Si el tag no está permitido, remover el tag pero mantener contenido
    if (!ALLOWED_TAGS.includes(tag)) {
      return '';
    }

    // Si es un tag permitido, limpiar atributos peligrosos
    if (match.includes('=')) {
      const allowedAttrs = ALLOWED_ATTRIBUTES[tag] || [];

      // Extraer y validar atributos
      const attrPattern = /(\w+)\s*=\s*["']([^"']*)["']/g;
      let cleanMatch = `<${match.startsWith('</') ? '/' : ''}${tag}`;

      if (!match.startsWith('</')) {
        const attrs = [...match.matchAll(attrPattern)];
        for (const [, attrName, attrValue] of attrs) {
          if (allowedAttrs.includes(attrName.toLowerCase())) {
            // Validar que no contenga javascript:
            if (!attrValue.toLowerCase().includes('javascript:') &&
              !attrValue.toLowerCase().includes('data:text/html')) {
              cleanMatch += ` ${attrName}="${attrValue}"`;
            }
          }
        }
      }

      cleanMatch += '>';
      return cleanMatch;
    }

    return match;
  });

  return clean.trim();
}

/**
 * Sanitiza texto plano escapando caracteres HTML
 */
export function escapeHTML(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza una URL para prevenir XSS
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '';

  const cleaned = url.trim();

  // Whitelist de protocolos permitidos
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  try {
    const parsedUrl = new URL(cleaned, 'https://example.com');

    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return '';
    }

    return cleaned;
  } catch {
    // Si no es una URL válida, retornar vacío
    return '';
  }
}

/**
 * Sanitiza un objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToSanitize: string[] = ['title', 'body', 'content', 'description', 'caption']
): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string' && fieldsToSanitize.includes(key)) {
      sanitized[key] = sanitizeHTML(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, fieldsToSanitize);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, fieldsToSanitize)
          : item
      ) as any;
    }
  }

  return sanitized;
}

/**
 * Validar que un string no contenga XSS
 * 
 * @deprecated Usar `noXSSSchema` de `utils/validation.ts` para validación con Zod
 * @example
 * ```typescript
 * import { noXSSSchema } from "../utils/validation.ts";
 * const result = noXSSSchema.safeParse(input);
 * if (!result.success) {
 *   // Contiene XSS
 * }
 * ```
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitiza una cadena para uso seguro en queries SQL LIKE
 * Escapa los caracteres especiales de SQL LIKE (%, _) para prevenir SQL injection
 *
 * @param input - La entrada del usuario a sanitizar
 * @returns Cadena sanitizada segura para usar en queries LIKE
 *
 * @example
 * ```typescript
 * const userInput = "test%_value";
 * const safe = sanitizeLikeQuery(userInput);
 * // Resultado: "test\\%\\_value"
 *
 * // Uso en Drizzle ORM:
 * const results = await db.select()
 *   .from(categories)
 *   .where(like(categories.name, `%${sanitizeLikeQuery(query)}%`));
 * ```
 */
export function sanitizeLikeQuery(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  // Convertir a string si no lo es
  const str = String(input);

  // Escapar caracteres especiales de SQL LIKE
  // % - coincide con cualquier secuencia de caracteres
  // _ - coincide con cualquier carácter individual
  return str.replace(/[%_]/g, "\\$&");
}

/**
 * Sanitiza un array de strings para uso en queries SQL LIKE
 *
 * @param inputs - Array de entradas del usuario a sanitizar
 * @returns Array de strings sanitizados
 */
export function sanitizeLikeQueryArray(
  inputs: (string | null | undefined)[],
): string[] {
  return inputs.map((input) => sanitizeLikeQuery(input));
}

/**
 * Valida y sanitiza una consulta de búsqueda
 * Elimina caracteres potencialmente peligrosos y limita la longitud
 *
 * @deprecated Usar `validateSearchQuery` de `utils/validation.ts` para validación con Zod
 * Esta función se mantiene para compatibilidad pero se recomienda migrar.
 * 
 * @param query - La consulta de búsqueda a validar
 * @param maxLength - Longitud máxima permitida (predeterminado: 100)
 * @returns Consulta validada y sanitizada
 * 
 * @example
 * ```typescript
 * // Nueva forma (recomendada):
 * import { validateSearchQuery } from "../utils/validation.ts";
 * const result = validateSearchQuery(query);
 * if (result.success) {
 *   const safeQuery = result.data;
 * }
 * ```
 */
export function validateSearchQuery(
  query: string | null | undefined,
  maxLength: number = 100,
): string {
  if (!query) {
    return "";
  }

  // Convertir a string y eliminar espacios
  let str = String(query).trim();

  // Limitar longitud
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  // Eliminar bytes nulos
  str = str.replace(/\0/g, "");

  // Eliminar caracteres de control excepto newline, tab, carriage return
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return str;
}

/**
 * Combina validación y sanitización LIKE para consultas de búsqueda
 * Esta es la función recomendada para entradas de búsqueda de usuarios
 *
 * @param query - La consulta de búsqueda de la entrada del usuario
 * @param maxLength - Longitud máxima permitida (predeterminado: 100)
 * @returns Consulta validada y sanitizada segura para operaciones LIKE
 *
 * @example
 * ```typescript
 * const userInput = "  test%  ";
 * const safe = sanitizeSearchQuery(userInput);
 * // Resultado: "test\\%"
 *
 * // Uso:
 * const results = await db.select()
 *   .from(posts)
 *   .where(like(posts.title, `%${sanitizeSearchQuery(query)}%`));
 * ```
 */
export function sanitizeSearchQuery(
  query: string | null | undefined,
  maxLength: number = 100,
): string {
  const validated = validateSearchQuery(query, maxLength);
  return sanitizeLikeQuery(validated);
}

/**
 * Verifica si una cadena contiene patrones de inyección SQL
 * Útil para validación adicional
 *
 * @deprecated Usar `noSQLInjectionSchema` de `utils/validation.ts` para validación con Zod
 * @example
 * ```typescript
 * import { noSQLInjectionSchema } from "../utils/validation.ts";
 * const result = noSQLInjectionSchema.safeParse(input);
 * if (!result.success) {
 *   // Contiene patrones de SQL injection
 * }
 * ```
 * 
 * @param input - Cadena a verificar
 * @returns true si se encuentran patrones sospechosos
 */
export function containsSQLInjectionPattern(input: string): boolean {
  const suspiciousPatterns = [
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1
    /union\s+select/i, // UNION SELECT
    /;\s*drop\s+table/i, // DROP TABLE
    /;\s*delete\s+from/i, // DELETE FROM
    /;\s*insert\s+into/i, // INSERT INTO
    /;\s*update\s+.+\s+set/i, // UPDATE SET
    /exec\s*\(/i, // exec()
    /execute\s*\(/i, // execute()
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
