import { eq, and, sql } from "drizzle-orm";
import { db } from "../config/db.ts";
import { contentFilters } from "../db/schema.ts";
import type { NewContentFilter } from "../db/schema.ts";

/**
 * Tipos de filtro disponibles
 */
export type FilterType = "word" | "email" | "link" | "phone";

/**
 * Crea un nuevo filtro de contenido
 */
export async function createFilter(
  data: Omit<NewContentFilter, "createdAt" | "updatedAt">,
) {
  // Validar regex si es regex
  if (data.isRegex) {
    try {
      new RegExp(data.pattern);
    } catch (error) {
      throw new Error(
        `Patrón regex inválido: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  const [filter] = await db
    .insert(contentFilters)
    .values(data)
    .returning();

  return filter;
}

/**
 * Obtiene todos los filtros con opciones de filtrado
 */
export async function getFilters(options?: {
  type?: FilterType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = db.select().from(contentFilters);

  // Construir condiciones
  const conditions = [];

  if (options?.type) {
    conditions.push(eq(contentFilters.type, options.type));
  }

  if (options?.isActive !== undefined) {
    conditions.push(eq(contentFilters.isActive, options.isActive));
  }

  // Aplicar condiciones si existen
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Aplicar paginación
  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  if (options?.offset) {
    query = query.offset(options.offset) as any;
  }

  const filters = await query;
  return filters;
}

/**
 * Obtiene solo los filtros activos (para usar en censura)
 * Si no se especifica tipo, retorna TODOS los filtros activos.
 * OPTIMIZACIÓN: Permite hacer una sola query para todos los tipos.
 */
export async function getActiveFilters(type?: FilterType) {
  return await getFilters({
    type,
    isActive: true,
  });
}

/**
 * Obtiene un filtro por ID
 */
export async function getFilterById(id: number) {
  const filter = await db.query.contentFilters.findFirst({
    where: eq(contentFilters.id, id),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return filter;
}

/**
 * Actualiza un filtro
 */
export async function updateFilter(
  id: number,
  data: Partial<Omit<NewContentFilter, "createdBy" | "createdAt">>,
) {
  // Validar regex si se está actualizando y es regex
  if (data.isRegex && data.pattern) {
    try {
      new RegExp(data.pattern);
    } catch (error) {
      throw new Error(
        `Patrón regex inválido: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  const [filter] = await db
    .update(contentFilters)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(contentFilters.id, id))
    .returning();

  if (!filter) {
    throw new Error("Filtro no encontrado");
  }

  return filter;
}

/**
 * Elimina un filtro
 */
export async function deleteFilter(id: number) {
  const [deleted] = await db
    .delete(contentFilters)
    .where(eq(contentFilters.id, id))
    .returning();

  if (!deleted) {
    throw new Error("Filtro no encontrado");
  }

  return deleted;
}

/**
 * Activa o desactiva un filtro
 */
export async function toggleFilter(id: number, isActive: boolean) {
  return await updateFilter(id, { isActive });
}

/**
 * Prueba un filtro sin guardarlo (útil para admin)
 * Retorna el texto original y el texto con el filtro aplicado
 */
export function testFilter(
  pattern: string,
  text: string,
  isRegex: boolean = false,
  replacement: string = "[FILTRADO]",
): { original: string; filtered: string; matches: number } {
  let filtered = text;
  let matches = 0;

  try {
    if (isRegex) {
      const regex = new RegExp(pattern, "gi");
      const matchArray = text.match(regex);
      matches = matchArray ? matchArray.length : 0;
      filtered = text.replace(regex, replacement);
    } else {
      // Búsqueda case-insensitive para texto plano
      const regex = new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      const matchArray = text.match(regex);
      matches = matchArray ? matchArray.length : 0;
      filtered = text.replace(regex, replacement);
    }

    return {
      original: text,
      filtered,
      matches,
    };
  } catch (error) {
    throw new Error(
      `Error probando filtro: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
}

/**
 * Obtiene estadísticas de los filtros
 * OPTIMIZACIÓN: Usa SQL aggregation en lugar de cargar y filtrar en memoria
 * Antes: Cargaba N filtros + 10 iteraciones en JavaScript
 * Ahora: Una sola query con COUNT/SUM en la base de datos
 */
export async function getFilterStats() {
  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`SUM(CASE WHEN ${contentFilters.isActive} = 1 THEN 1 ELSE 0 END)`,
      inactive: sql<number>`SUM(CASE WHEN ${contentFilters.isActive} = 0 THEN 1 ELSE 0 END)`,
      // By type
      word: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'word' THEN 1 ELSE 0 END)`,
      email: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'email' THEN 1 ELSE 0 END)`,
      link: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'link' THEN 1 ELSE 0 END)`,
      phone: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'phone' THEN 1 ELSE 0 END)`,
      // By type active
      wordActive: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'word' AND ${contentFilters.isActive} = 1 THEN 1 ELSE 0 END)`,
      emailActive: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'email' AND ${contentFilters.isActive} = 1 THEN 1 ELSE 0 END)`,
      linkActive: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'link' AND ${contentFilters.isActive} = 1 THEN 1 ELSE 0 END)`,
      phoneActive: sql<number>`SUM(CASE WHEN ${contentFilters.type} = 'phone' AND ${contentFilters.isActive} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(contentFilters);

  return {
    total: Number(stats.total) || 0,
    active: Number(stats.active) || 0,
    inactive: Number(stats.inactive) || 0,
    byType: {
      word: Number(stats.word) || 0,
      email: Number(stats.email) || 0,
      link: Number(stats.link) || 0,
      phone: Number(stats.phone) || 0,
    },
    byTypeActive: {
      word: Number(stats.wordActive) || 0,
      email: Number(stats.emailActive) || 0,
      link: Number(stats.linkActive) || 0,
      phone: Number(stats.phoneActive) || 0,
    },
  };
}
