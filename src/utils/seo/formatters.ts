/**
 * ============================================
 * SEO FORMATTERS
 * ============================================
 * Formateo y sanitización de respuestas de AI
 */

import { SEO_LIMITS } from "./validators.ts";

/**
 * Extrae JSON de una respuesta que puede contener texto adicional
 */
export function extractJsonFromResponse(response: string): string | null {
  // Intentar encontrar JSON entre llaves
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Intentar encontrar JSON entre bloques de código markdown
  const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1];
  }

  return null;
}

/**
 * Trunca texto a una longitud máxima sin cortar palabras
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Cortar en el último espacio antes del límite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace).trim();
  }

  // Si no hay espacios, cortar directamente
  return truncated.trim();
}

/**
 * Trunca metaTitle al límite permitido
 */
export function truncateMetaTitle(title: string): string {
  return truncateAtWord(title, SEO_LIMITS.metaTitle.max);
}

/**
 * Trunca metaDescription al límite permitido
 */
export function truncateMetaDescription(description: string): string {
  return truncateAtWord(description, SEO_LIMITS.metaDescription.max);
}

/**
 * Trunca OG Title
 */
export function truncateOgTitle(title: string): string {
  return truncateAtWord(title, SEO_LIMITS.ogTitle.max);
}

/**
 * Trunca OG Description
 */
export function truncateOgDescription(description: string): string {
  return truncateAtWord(description, SEO_LIMITS.ogDescription.max);
}

/**
 * Trunca Twitter Title
 */
export function truncateTwitterTitle(title: string): string {
  return truncateAtWord(title, SEO_LIMITS.twitterTitle.max);
}

/**
 * Trunca Twitter Description
 */
export function truncateTwitterDescription(description: string): string {
  return truncateAtWord(description, SEO_LIMITS.twitterDescription.max);
}

/**
 * Trunca ALT text
 */
export function truncateAltText(altText: string): string {
  return truncateAtWord(altText, SEO_LIMITS.altText.max);
}

/**
 * Limpia focus keyword (máximo 3 palabras)
 */
export function cleanFocusKeyword(keyword: string): string {
  const words = keyword.trim().split(/\s+/);
  if (words.length > 3) {
    return words.slice(0, 3).join(" ");
  }
  return keyword.trim();
}

/**
 * Limpia y formatea un texto eliminando caracteres problemáticos
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    // Eliminar saltos de línea múltiples
    .replace(/\n{3,}/g, "\n\n")
    // Eliminar espacios múltiples
    .replace(/\s{2,}/g, " ")
    // Eliminar comillas problemáticas
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Eliminar caracteres de control
    .replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Formatea un objeto SEO completo, truncando campos si es necesario
 */
export function formatSeoObject(seo: {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  focusKeyword?: string;
}): {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  focusKeyword?: string;
} {
  const formatted: typeof seo = {};

  if (seo.metaTitle) {
    formatted.metaTitle = truncateMetaTitle(sanitizeText(seo.metaTitle));
  }

  if (seo.metaDescription) {
    formatted.metaDescription = truncateMetaDescription(
      sanitizeText(seo.metaDescription),
    );
  }

  if (seo.ogTitle) {
    formatted.ogTitle = truncateOgTitle(sanitizeText(seo.ogTitle));
  }

  if (seo.ogDescription) {
    formatted.ogDescription = truncateOgDescription(
      sanitizeText(seo.ogDescription),
    );
  }

  if (seo.twitterTitle) {
    formatted.twitterTitle = truncateTwitterTitle(
      sanitizeText(seo.twitterTitle),
    );
  }

  if (seo.twitterDescription) {
    formatted.twitterDescription = truncateTwitterDescription(
      sanitizeText(seo.twitterDescription),
    );
  }

  if (seo.focusKeyword) {
    formatted.focusKeyword = cleanFocusKeyword(sanitizeText(seo.focusKeyword));
  }

  return formatted;
}

/**
 * Parsea respuesta JSON de AI con manejo de errores
 */
export function parseAiJsonResponse<T = any>(response: string): T | null {
  try {
    // Intentar parsear directamente
    return JSON.parse(response) as T;
  } catch {
    // Si falla, extraer JSON del texto
    const extracted = extractJsonFromResponse(response);
    if (extracted) {
      try {
        return JSON.parse(extracted) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Genera valores de fallback básicos si AI falla
 */
export function generateFallbackSeo(content: {
  title: string;
  excerpt?: string;
}): {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
} {
  const title = truncateMetaTitle(content.title);
  const description = content.excerpt
    ? truncateMetaDescription(content.excerpt)
    : truncateMetaDescription(content.title);

  // Extraer primera palabra significativa como keyword
  const words = content.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3); // Filtrar palabras cortas (a, el, de, etc)
  const focusKeyword = words.slice(0, 2).join(" ") || title.split(" ")[0];

  return {
    metaTitle: title,
    metaDescription: description,
    focusKeyword,
  };
}

/**
 * Genera ALT text de fallback básico
 */
export function generateFallbackAlt(media: {
  originalFilename: string;
  title?: string;
}): string {
  // Usar título si existe, sino usar filename limpio
  if (media.title) {
    return truncateAltText(media.title);
  }

  // Limpiar filename: remover extensión y reemplazar guiones/underscores
  const cleanName = media.originalFilename
    .replace(/\.[^.]+$/, "") // Remover extensión
    .replace(/[-_]/g, " ") // Reemplazar separadores
    .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalizar

  return truncateAltText(cleanName);
}

/**
 * Verifica si un schema JSON-LD es válido
 */
export function isValidSchemaJson(schemaString: string): boolean {
  try {
    const schema = JSON.parse(schemaString);

    // Verificar campos obligatorios de schema.org
    if (!schema["@context"] || !schema["@type"]) {
      return false;
    }

    // Verificar que @context sea schema.org
    if (!schema["@context"].includes("schema.org")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Formatea schema JSON-LD con indentación
 */
export function formatSchemaJson(schemaString: string): string {
  try {
    const schema = JSON.parse(schemaString);
    return JSON.stringify(schema, null, 2);
  } catch {
    return schemaString;
  }
}
