import { db } from "../config/db.ts";
import { menus, type Menu, type NewMenu } from "../db/schema.ts";
import { eq, and, isNull, or, like, desc, asc } from "drizzle-orm";
import { sanitizeSearchQuery } from "../utils/sanitization.ts";

/**
 * ============================================
 * MENU SERVICE
 * ============================================
 * Servicio para gestionar menús
 */

// ============= TIPOS =============

export interface GetAllMenusInput {
  limit?: number;
  offset?: number;
  query?: string;
  isActive?: boolean;
  orderBy?: "name" | "slug" | "createdAt";
  orderDirection?: "asc" | "desc";
}

export interface GetAllMenusResult {
  menus: Menu[];
  total: number;
  limit: number;
  offset: number;
}

// ============= CRUD BÁSICO =============

/**
 * Obtener todos los menús con paginación y filtros
 */
export async function getAllMenus(
  input: GetAllMenusInput = {}
): Promise<GetAllMenusResult> {
  const {
    limit = 20,
    offset = 0,
    query,
    isActive,
    orderBy = "createdAt",
    orderDirection = "desc",
  } = input;

  // Validar limit
  const validLimit = Math.min(Math.max(1, limit), 100);

  // Construir condiciones
  const conditions = [];

  if (query) {
    const sanitizedQuery = sanitizeSearchQuery(query);
    conditions.push(
      or(
        like(menus.name, `%${sanitizedQuery}%`),
        like(menus.slug, `%${sanitizedQuery}%`),
        like(menus.description, `%${sanitizedQuery}%`)
      )!
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(menus.isActive, isActive));
  }

  // Obtener total
  const totalResult = await db
    .select({ count: menus.id })
    .from(menus)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = totalResult.length;

  // Ordenamiento
  let orderColumn;
  switch (orderBy) {
    case "name":
      orderColumn = menus.name;
      break;
    case "slug":
      orderColumn = menus.slug;
      break;
    case "createdAt":
    default:
      orderColumn = menus.createdAt;
      break;
  }

  const orderFn = orderDirection === "asc" ? asc : desc;

  // Obtener menús
  const result = await db
    .select()
    .from(menus)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(orderColumn))
    .limit(validLimit)
    .offset(offset);

  return {
    menus: result,
    total,
    limit: validLimit,
    offset,
  };
}

/**
 * Obtener un menú por ID (con sus items)
 */
export async function getMenuById(id: number): Promise<Menu | null> {
  const menu = await db.query.menus.findFirst({
    where: eq(menus.id, id),
    with: {
      items: {
        with: {
          content: true,
          category: true,
          tag: true,
        },
        orderBy: (menuItems, { asc }) => [asc(menuItems.order)],
      },
    },
  });

  return menu || null;
}

/**
 * Obtener un menú por slug (para frontend)
 */
export async function getMenuBySlug(slug: string): Promise<Menu | null> {
  const menu = await db.query.menus.findFirst({
    where: and(eq(menus.slug, slug), eq(menus.isActive, true)),
    with: {
      items: {
        where: (menuItems, { eq }) => eq(menuItems.isVisible, true),
        with: {
          content: {
            columns: {
              id: true,
              title: true,
              slug: true,
            },
          },
          category: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tag: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: (menuItems, { asc }) => [asc(menuItems.order)],
      },
    },
  });

  return menu || null;
}

/**
 * Crear un nuevo menú
 */
export async function createMenu(data: NewMenu): Promise<Menu> {
  // Verificar que el slug sea único
  const existing = await db.query.menus.findFirst({
    where: eq(menus.slug, data.slug),
  });

  if (existing) {
    throw new Error(`El slug '${data.slug}' ya está en uso`);
  }

  const [menu] = await db
    .insert(menus)
    .values(data)
    .returning();

  return menu;
}

/**
 * Actualizar un menú
 */
export async function updateMenu(
  id: number,
  data: Partial<NewMenu>
): Promise<Menu> {
  // Verificar que el menú existe
  const existing = await db.query.menus.findFirst({
    where: eq(menus.id, id),
  });

  if (!existing) {
    throw new Error(`Menú con ID ${id} no encontrado`);
  }

  // Si se actualiza el slug, verificar que sea único
  if (data.slug && data.slug !== existing.slug) {
    const duplicateSlug = await db.query.menus.findFirst({
      where: eq(menus.slug, data.slug),
    });

    if (duplicateSlug) {
      throw new Error(`El slug '${data.slug}' ya está en uso`);
    }
  }

  const [updated] = await db
    .update(menus)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(menus.id, id))
    .returning();

  return updated;
}

/**
 * Eliminar un menú (elimina también sus items por CASCADE)
 */
export async function deleteMenu(id: number): Promise<void> {
  // Verificar que el menú existe
  const existing = await db.query.menus.findFirst({
    where: eq(menus.id, id),
  });

  if (!existing) {
    throw new Error(`Menú con ID ${id} no encontrado`);
  }

  await db.delete(menus).where(eq(menus.id, id));
}

/**
 * Activar/Desactivar un menú
 */
export async function toggleMenuStatus(id: number): Promise<Menu> {
  const existing = await db.query.menus.findFirst({
    where: eq(menus.id, id),
  });

  if (!existing) {
    throw new Error(`Menú con ID ${id} no encontrado`);
  }

  const [updated] = await db
    .update(menus)
    .set({
      isActive: !existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(menus.id, id))
    .returning();

  return updated;
}

/**
 * Verificar si un slug está disponible
 */
export async function isSlugAvailable(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const existing = await db.query.menus.findFirst({
    where: excludeId
      ? and(eq(menus.slug, slug), eq(menus.id, excludeId))
      : eq(menus.slug, slug),
  });

  return !existing;
}
