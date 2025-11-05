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
