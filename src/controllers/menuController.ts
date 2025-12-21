import { Context } from "hono";
import { z } from "zod";
import * as menuService from "@/services/content/menuService.ts";
import * as menuItemService from "@/services/content/menuItemService.ts";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { isSafePublicUrl } from "@/utils/validation.ts";
import { optionalSafePublicUrl } from "@/lib/security/urlPolicy.ts";

const log = createLogger("menuController");

/**
 * ============================================
 * MENU CONTROLLER
 * ============================================
 * Controladores HTTP para menús y items de menú
 */

// ============= SCHEMAS ZOD =============

// Schema para crear menú
const createMenuSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Schema para actualizar menú
const updateMenuSchema = createMenuSchema.partial();

// Schema para query de getAllMenus
const getAllMenusSchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
  query: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  orderBy: z.enum(["name", "slug", "createdAt"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
});

// Schema para crear item de menú
const createMenuItemSchema = z
  .object({
    menuId: z.number().int().positive(),
    parentId: z.number().int().positive().optional().nullable(),
    label: z.string().min(1, "El label es requerido").max(100),
    title: z.string().max(200).optional(),
    url: z.string().url().optional().nullable().refine(
      (url) => !url || isSafePublicUrl(url),
      { message: "URL no permitida" },
    ),
    contentId: z.number().int().positive().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    tagId: z.number().int().positive().optional().nullable(),
    icon: z.string().max(50).optional(),
    cssClass: z.string().max(100).optional(),
    target: z.enum(["_self", "_blank", "_parent", "_top"]).optional().default("_self"),
    order: z.number().int().optional().default(0),
    isVisible: z.boolean().optional().default(true),
    requiredPermission: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      const linkTypes = [data.url, data.contentId, data.categoryId, data.tagId].filter(
        (v) => v !== null && v !== undefined
      );
      return linkTypes.length === 1;
    },
    {
      message: "Debe especificar exactamente un tipo de enlace (url, contentId, categoryId o tagId)",
    }
  );

// Schema para actualizar item de menú
const updateMenuItemSchema = z
  .object({
    parentId: z.number().int().positive().optional().nullable(),
    label: z.string().min(1).max(100).optional(),
    title: z.string().max(200).optional(),
    url: z.string().url().optional().nullable().refine(
      (url) => !url || isSafePublicUrl(url),
      { message: "URL no permitida" },
    ),
    contentId: z.number().int().positive().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    tagId: z.number().int().positive().optional().nullable(),
    icon: z.string().max(50).optional(),
    cssClass: z.string().max(100).optional(),
    target: z.enum(["_self", "_blank", "_parent", "_top"]).optional(),
    order: z.number().int().optional(),
    isVisible: z.boolean().optional(),
    requiredPermission: z.string().max(100).optional(),
  })
  .partial();

// Schema para reordenar items
const reorderMenuItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        order: z.number().int(),
      })
    )
    .min(1, "Debe proporcionar al menos un item para reordenar"),
});

// Schema para mover item
const moveMenuItemSchema = z.object({
  newParentId: z.number().int().positive().nullable(),
});

// ============= CONTROLADORES DE MENÚS =============

/**
 * GET /api/menus
 * Obtener todos los menús con paginación y filtros
 */
export async function getAllMenus(c: Context) {
  try {
    const query = c.req.query();
    const params = getAllMenusSchema.parse(query);

    const result = await menuService.getAllMenus(params);

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    log.error("Error al obtener menús", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_list_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/menus/:id
 * Obtener un menú por ID con sus items
 */
export async function getMenuById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de menú");

    const menu = await menuService.getMenuById(id);

    if (!menu) {
      throw AppError.fromCatalog("menu_not_found");
    }

    return c.json(menu, 200);
  } catch (error) {
    log.error("Error al obtener menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_get_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/menus/slug/:slug
 * Obtener un menú por slug (para frontend)
 */
export async function getMenuBySlug(c: Context) {
  try {
    const slug = c.req.param("slug");

    const menu = await menuService.getMenuBySlug(slug);

    if (!menu) {
      throw AppError.fromCatalog("menu_not_found");
    }

    return c.json(menu, 200);
  } catch (error) {
    log.error("Error al obtener menú por slug", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_get_failed", getErrorMessage(error), 500);
  }
}

/**
 * POST /api/menus
 * Crear un nuevo menú
 */
export async function createMenu(c: Context) {
  try {
    const body = await c.req.json();
    const data = createMenuSchema.parse(body);

    const menu = await menuService.createMenu(data);

    return c.json(menu, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    log.error("Error al crear menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_create_failed", getErrorMessage(error), 500);
  }
}

/**
 * PATCH /api/menus/:id
 * Actualizar un menú
 */
export async function updateMenu(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de menú");

    const body = await c.req.json();
    const data = updateMenuSchema.parse(body);

    const menu = await menuService.updateMenu(id, data);

    return c.json(menu, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    log.error("Error al actualizar menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_update_failed", getErrorMessage(error), 500);
  }
}

/**
 * DELETE /api/menus/:id
 * Eliminar un menú
 */
export async function deleteMenu(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de menú");

    await menuService.deleteMenu(id);

    return c.json({ message: "Menú eliminado exitosamente" }, 200);
  } catch (error) {
    log.error("Error al eliminar menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_delete_failed", getErrorMessage(error), 500);
  }
}

/**
 * PATCH /api/menus/:id/toggle
 * Activar/Desactivar un menú
 */
export async function toggleMenuStatus(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de menú");

    const menu = await menuService.toggleMenuStatus(id);

    return c.json(menu, 200);
  } catch (error) {
    log.error("Error al cambiar estado del menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_toggle_failed", getErrorMessage(error), 500);
  }
}

// ============= CONTROLADORES DE ITEMS DE MENÚ =============

/**
 * GET /api/menus/:menuId/items
 * Obtener items de un menú (plano)
 */
export async function getMenuItems(c: Context) {
  try {
    const menuId = parseNumericParam(c.req.param("menuId"), "ID de menú");

    const items = await menuItemService.getMenuItems(menuId);

    return c.json({ items }, 200);
  } catch (error) {
    log.error("Error al obtener items de menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_items_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/menus/:menuId/items/hierarchy
 * Obtener items de un menú en estructura jerárquica
 */
export async function getMenuItemsHierarchy(c: Context) {
  try {
    const menuId = parseNumericParam(c.req.param("menuId"), "ID de menú");

    const hierarchy = await menuItemService.getMenuItemsHierarchy(menuId);

    return c.json({ items: hierarchy }, 200);
  } catch (error) {
    log.error("Error al obtener jerarquía de menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_items_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/menu-items/:id
 * Obtener un item de menú por ID
 */
export async function getMenuItemById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de item");

    const item = await menuItemService.getMenuItemById(id);

    if (!item) {
      throw AppError.fromCatalog("menu_item_not_found");
    }

    return c.json(item, 200);
  } catch (error) {
    log.error("Error al obtener item de menú", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("menu_item_get_failed", getErrorMessage(error), 500);
  }
}

/**
 * POST /api/menu-items
 * Crear un nuevo item de menú
 */
export async function createMenuItem(c: Context) {
  try {
    const body = await c.req.json();
    const data = createMenuItemSchema.parse(body);
    const safeUrl = optionalSafePublicUrl(data.url, "menu.item.url");
    data.url = safeUrl ?? null;

    const item = await menuItemService.createMenuItem(data);

    return c.json(item, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("menu_item_create_failed", getErrorMessage(error), 500);
  }
}

/**
 * PATCH /api/menu-items/:id
 * Actualizar un item de menú
 */
export async function updateMenuItem(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de item");

    const body = await c.req.json();
    const data = updateMenuItemSchema.parse(body);
    if (data.url !== undefined) {
      data.url = optionalSafePublicUrl(data.url, "menu.item.url") ?? null;
    }

    const item = await menuItemService.updateMenuItem(id, data);

    return c.json(item, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("menu_item_update_failed", getErrorMessage(error), 500);
  }
}

/**
 * DELETE /api/menu-items/:id
 * Eliminar un item de menú
 */
export async function deleteMenuItem(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de item");

    await menuItemService.deleteMenuItem(id);

    return c.json({ message: "Item eliminado exitosamente" }, 200);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("menu_item_delete_failed", getErrorMessage(error), 500);
  }
}

/**
 * POST /api/menu-items/reorder
 * Reordenar items de menú (batch update)
 */
export async function reorderMenuItems(c: Context) {
  try {
    const body = await c.req.json();
    const { items } = reorderMenuItemsSchema.parse(body);

    await menuItemService.reorderMenuItems(items);

    return c.json({ message: "Items reordenados exitosamente" }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("menu_item_reorder_failed", getErrorMessage(error), 500);
  }
}

/**
 * PATCH /api/menu-items/:id/move
 * Mover un item a otro padre
 */
export async function moveMenuItem(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de item");

    const body = await c.req.json();
    const { newParentId } = moveMenuItemSchema.parse(body);

    const item = await menuItemService.moveMenuItem(id, newParentId);

    return c.json(item, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("menu_item_move_failed", getErrorMessage(error), 500);
  }
}

/**
 * POST /api/menu-items/:id/duplicate
 * Duplicar un item de menú
 */
export async function duplicateMenuItem(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de item");

    const item = await menuItemService.duplicateMenuItem(id);

    return c.json(item, 201);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("menu_item_duplicate_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/menus/:menuId/items/count
 * Contar items de un menú
 */
export async function countMenuItems(c: Context) {
  try {
    const menuId = parseNumericParam(c.req.param("menuId"), "ID de menú");

    const count = await menuItemService.countMenuItems(menuId);

    return c.json({ menuId, count }, 200);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("menu_item_count_failed", getErrorMessage(error), 500);
  }
}
