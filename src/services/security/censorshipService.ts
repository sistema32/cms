// @ts-nocheck
import { getActiveFilters, type FilterType } from "./contentFilterService.ts";
import type { ContentFilter } from "@/db/schema.ts";

/**
 * Cache global para regex compilados
 * OPTIMIZACIÓN: Evita recompilar los mismos patrones en cada request
 */
const regexCache = new Map<string, RegExp>();

/**
 * Obtiene un regex del cache o lo compila y cachea
 * @param pattern - Patrón regex o texto
 * @param flags - Flags del regex (default: "gi")
 * @returns RegExp compilado
 */
function getCachedRegex(pattern: string, flags: string = "gi"): RegExp {
  const cacheKey = `${pattern}:${flags}`;

  if (!regexCache.has(cacheKey)) {
    try {
      regexCache.set(cacheKey, new RegExp(pattern, flags));
    } catch (error) {
      console.error(`Error compilando regex pattern: ${pattern}`, error);
      // Retornar regex que no matchea nada si hay error
      return /(?!)/;
    }
  }

  return regexCache.get(cacheKey)!;
}

/**
 * Aplica una lista de filtros al texto
 * OPTIMIZACIÓN: Usa cache de regex para evitar recompilación
 */
function applyFilters(text: string, filters: ContentFilter[]): string {
  let result = text;

  for (const filter of filters) {
    try {
      if (filter.isRegex) {
        const regex = getCachedRegex(filter.pattern, "gi");
        result = result.replace(regex, filter.replacement);
      } else {
        // Búsqueda case-insensitive para texto plano
        const escapedPattern = filter.pattern.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const regex = getCachedRegex(escapedPattern, "gi");
        result = result.replace(regex, filter.replacement);
      }
    } catch (error) {
      console.error(`Error aplicando filtro ${filter.id}:`, error);
    }
  }

  return result;
}

/**
 * Filtros base de links
 * Detecta URLs, dominios y variaciones comunes
 */
export function censorLinksBase(text: string): string {
  let result = text;

  // Lista de patrones de links
  const linkPatterns = [
    // URLs completas con protocolo
    {
      pattern: /https?:\/\/[^\s]+/gi,
      replacement: "[link removido]",
    },
    // www.dominio.com
    {
      pattern: /www\.[a-z0-9\-]+\.[a-z]{2,}/gi,
      replacement: "[link removido]",
    },
    // dominio.com sin www (solo si tiene TLD común)
    {
      pattern: /\b[a-z0-9\-]+\.(com|net|org|io|co|app|dev|edu|gov|info|me|tv|xyz|online|site|tech|ai|blog|shop|store|web)\b/gi,
      replacement: "[link removido]",
    },
    // Dominios sin espacios pero con punto
    {
      pattern: /\b[a-z0-9]+\s?\.\s?[a-z]{2,}\b/gi,
      replacement: "[link removido]",
    },
  ];

  for (const { pattern, replacement } of linkPatterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Filtros base de teléfonos
 * Detecta números de teléfono en MÚLTIPLES formatos
 */
export function censorPhonesBase(text: string): string {
  let result = text;

  // Lista de patrones de teléfonos
  const phonePatterns = [
    // 10-15 dígitos seguidos
    {
      pattern: /\b\d{10,15}\b/g,
      replacement: "[teléfono oculto]",
    },
    // Formatos con separadores: 123-456-7890, 123.456.7890, 123 456 7890
    {
      pattern: /\b\d{2,4}[\s\.\-]\d{2,4}[\s\.\-]\d{4}\b/g,
      replacement: "[teléfono oculto]",
    },
    // Formato (123) 456-7890
    {
      pattern: /\(\d{2,4}\)\s?\d{2,4}[\s\-]?\d{4}/g,
      replacement: "[teléfono oculto]",
    },
    // Con código de país: +1 123-456-7890, +52 123 456 7890
    {
      pattern: /\+\d{1,3}\s?\d{2,4}[\s\.\-]?\d{2,4}[\s\.\-]?\d{4}/g,
      replacement: "[teléfono oculto]",
    },
    // Números con emojis numéricos (0️⃣-9️⃣)
    {
      pattern: /[0-9️⃣]{10,}/g,
      replacement: "[teléfono oculto]",
    },
    // Números separados por espacios individuales: 1 2 3 4 5 6 7 8 9 0
    {
      pattern: /\b\d(\s\d){9,14}\b/g,
      replacement: "[teléfono oculto]",
    },
    // Números escritos: "uno dos tres cuatro cinco seis siete ocho nueve cero"
    // Esta es una aproximación, detecta 10+ palabras numéricas seguidas
    {
      pattern:
        /\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)(\s+(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)){9,}\b/gi,
      replacement: "[teléfono oculto]",
    },
    // Variaciones con guiones y paréntesis mezclados
    {
      pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g,
      replacement: "[teléfono oculto]",
    },
  ];

  for (const { pattern, replacement } of phonePatterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Filtros base de emails
 * Detecta correos electrónicos y variaciones para saltarse filtros
 */
export function censorEmailsBase(text: string): string {
  let result = text;

  // Lista de patrones de emails
  const emailPatterns = [
    // Email estándar: usuario@dominio.com
    {
      pattern: /[a-z0-9\.\-_]+@[a-z0-9\.\-_]+\.[a-z]{2,}/gi,
      replacement: "[email removido]",
    },
    // @ escrito como "arroba", "at", "(at)", " at ", etc.
    {
      pattern: /[a-z0-9\.\-_]+\s?(arroba|at|\(at\))\s?[a-z0-9\.\-_]+\.[a-z]{2,}/gi,
      replacement: "[email removido]",
    },
    // Emails con espacios entre caracteres: e m a i l @ d o m i n i o . c o m
    {
      pattern: /\b([a-z]\s){3,}@\s?([a-z]\s?)+\.\s?[a-z]{2,}/gi,
      replacement: "[email removido]",
    },
    // Punto escrito como "punto" o "dot"
    {
      pattern: /[a-z0-9\-_]+@[a-z0-9\-_]+\s?(punto|dot)\s?(com|net|org|io|co)/gi,
      replacement: "[email removido]",
    },
    // @ con espacios: usuario @ dominio.com
    {
      pattern: /[a-z0-9\.\-_]+\s?@\s?[a-z0-9\.\-_]+\.[a-z]{2,}/gi,
      replacement: "[email removido]",
    },
  ];

  for (const { pattern, replacement } of emailPatterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Filtros base de palabras ofensivas
 * Lista predefinida de palabras comunes a censurar
 */
export function censorBadWordsBase(text: string): string {
  let result = text;

  // Lista básica de palabras ofensivas (ampliar según necesidad)
  const badWords = [
    "spam",
    "scam",
    "fraude",
    // Agregar más palabras según necesidad del proyecto
  ];

  for (const word of badWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, "***");
  }

  return result;
}

/**
 * Aplica censura completa: filtros base + filtros dinámicos de BD
 * Orden de aplicación:
 * 1. Filtros base de links
 * 2. Filtros custom de links
 * 3. Filtros base de teléfonos
 * 4. Filtros custom de teléfonos
 * 5. Filtros base de emails
 * 6. Filtros custom de emails
 * 7. Filtros base de palabras
 * 8. Filtros custom de palabras
 *
 * OPTIMIZACIÓN: Hace UNA SOLA query a la BD para obtener todos los filtros activos,
 * luego los agrupa en memoria por tipo. Antes: 4 queries, Ahora: 1 query.
 */
export async function applyCensorship(text: string): Promise<string> {
  let result = text;

  // OPTIMIZACIÓN: Single query para todos los filtros activos
  const allFilters = await getActiveFilters();

  // Agrupar filtros por tipo en memoria (operación rápida)
  const linkFilters = allFilters.filter((f) => f.type === "link");
  const phoneFilters = allFilters.filter((f) => f.type === "phone");
  const emailFilters = allFilters.filter((f) => f.type === "email");
  const wordFilters = allFilters.filter((f) => f.type === "word");

  // 1. Filtros base de links
  result = censorLinksBase(result);

  // 2. Filtros custom de links
  result = applyFilters(result, linkFilters);

  // 3. Filtros base de teléfonos
  result = censorPhonesBase(result);

  // 4. Filtros custom de teléfonos
  result = applyFilters(result, phoneFilters);

  // 5. Filtros base de emails
  result = censorEmailsBase(result);

  // 6. Filtros custom de emails
  result = applyFilters(result, emailFilters);

  // 7. Filtros base de palabras
  result = censorBadWordsBase(result);

  // 8. Filtros custom de palabras
  result = applyFilters(result, wordFilters);

  return result;
}

/**
 * Versión síncrona de censura (solo filtros base, sin BD)
 * Útil para previews o cuando no se puede hacer async
 */
export function applyCensorshipSync(text: string): string {
  let result = text;

  result = censorLinksBase(result);
  result = censorPhonesBase(result);
  result = censorEmailsBase(result);
  result = censorBadWordsBase(result);

  return result;
}

/**
 * Verifica si un texto contiene contenido que será censurado
 * Útil para alertar al usuario antes de publicar
 */
export async function hasCensorableContent(text: string): Promise<{
  hasIssues: boolean;
  issues: string[];
}> {
  const original = text;
  const censored = await applyCensorship(text);

  const issues: string[] = [];

  if (original !== censored) {
    // Detectar qué tipo de contenido fue censurado
    if (censored.includes("[link removido]")) {
      issues.push("links");
    }
    if (censored.includes("[teléfono oculto]")) {
      issues.push("teléfonos");
    }
    if (censored.includes("[email removido]")) {
      issues.push("emails");
    }
    if (censored.includes("***")) {
      issues.push("palabras prohibidas");
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
}
