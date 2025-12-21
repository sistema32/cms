import { db } from "@/config/db.ts";
import { menus, type Menu, type NewMenu } from "@/db/schema.ts";
import { eq, and, isNull, or, like, desc, asc } from "drizzle-orm";
import { sanitizeSearchQuery } from "@/utils/sanitization.ts";
import { executeQuery } from "@/db/index.ts";
import { getDbType } from "@/db/config/database-type.ts";
import { getActiveThemeConfig } from "@/services/themes/themeService.ts";

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

/**
 * Devuelve ubicaciones de menú registradas por el theme + las ya usadas en BD.
 * Similar a register_nav_menus en WordPress.
 */
export async function getRegisteredMenuLocations(): Promise<string[]> {
  const locations = new Set<string>();

  // 1) Theme config
  try {
    const themeConfig = await getActiveThemeConfig();
    themeConfig?.supports?.menus?.forEach((loc: string) => {
      if (loc?.trim()) locations.add(loc.trim());
    });
  } catch (_err) {
    // continuar con otras fuentes
  }

  // 2) Lo que ya existe en BD (para no perder ubicaciones previas)
  try {
    const rows: any[] = await executeQuery(
      "SELECT DISTINCT location FROM menus WHERE location IS NOT NULL AND location != ''",
    ) as any[];
    rows?.forEach((r: any) => {
      const loc = (r.location ?? r.LOCATION ?? "").toString().trim();
      if (loc) locations.add(loc);
    });
  } catch (_err) {
    // ignore
  }

  // 3) Defaults si nada viene
  if (locations.size === 0) {
    locations.add("header");
    locations.add("footer");
  }

  return Array.from(locations);
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
  await ensureMenuItemsColumns();
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
 * Obtener un menú por location (para themes)
 */
export async function getMenuByLocation(location: string): Promise<Menu | null> {
  await ensureMenuItemsColumns();
  const menu = await db.query.menus.findFirst({
    where: and(eq(menus.location, location), eq(menus.isActive, true)),
    with: {
      items: {
        where: (menuItems, { eq }) => eq(menuItems.isVisible, true),
        with: {
          content: { columns: { id: true, title: true, slug: true } },
          category: { columns: { id: true, name: true, slug: true } },
          tag: { columns: { id: true, name: true, slug: true } },
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
  await ensureMenuItemsColumns();
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
 * Convenience: get the first active menu (for fallback behaviour)
 */
export async function getFirstActiveMenu(): Promise<Menu | null> {
  await ensureMenuItemsColumns();
  const menu = await db.query.menus.findFirst({
    where: eq(menus.isActive, true),
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
    orderBy: (menus, { asc }) => [asc(menus.id)],
  });
  return menu || null;
}

// --- schema guard to avoid runtime failures when new columns are missing in existing SQLite DBs ---
let ensuredMenuColumns = false;
async function ensureMenuItemsColumns() {
  if (ensuredMenuColumns) return;
  const dbType = getDbType?.() ?? "sqlite";
  if (dbType !== "sqlite") {
    ensuredMenuColumns = true;
    return;
  }
  try {
    const rows: any = await executeQuery("PRAGMA table_info(menu_items)");
    const columns = Array.isArray(rows) ? rows.map((r) => r.name) : [];
    if (!columns.includes("css_id")) {
      await executeQuery("ALTER TABLE menu_items ADD COLUMN css_id TEXT;");
    }
    if (!columns.includes("css_class")) {
      await executeQuery("ALTER TABLE menu_items ADD COLUMN css_class TEXT;");
    }
    if (!columns.includes("title")) {
      await executeQuery("ALTER TABLE menu_items ADD COLUMN title TEXT;");
    }
    ensuredMenuColumns = true;
  } catch (err) {
    console.warn("[menuService] Could not ensure menu_items columns", err);
  }
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

  // Verificar location única (solo un menú activo por ubicación)
  if (data.location) {
    const existingLocation = await db.query.menus.findFirst({
      where: eq(menus.location, data.location),
    });
    if (existingLocation) {
      throw new Error(`La ubicación '${data.location}' ya está asignada al menú '${existingLocation.name}'`);
    }
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

  // Verificar location única en update
  if (data.location && data.location !== existing.location) {
    const existingLocation = await db.query.menus.findFirst({
      where: eq(menus.location, data.location),
    });
    if (existingLocation) {
      throw new Error(`La ubicación '${data.location}' ya está asignada al menú '${existingLocation.name}'`);
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
// @ts-nocheck
