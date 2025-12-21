import { Hono } from "hono";
import { requirePermission, allowPublic } from "@/middleware/permission.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import * as menuController from "@/controllers/menuController.ts";

/**
 * ============================================
 * RUTAS DE MENÚS Y MENU ITEMS
 * ============================================
 */

const menus = new Hono();

// ============= RUTAS PÚBLICAS DE MENÚS =============

/**
 * GET /api/menus/slug/:slug
 * Obtener menú por slug (frontend público)
 */
menus.get("/slug/:slug", allowPublic("menus", "read"), menuController.getMenuBySlug);

/**
 * GET /api/menus
 * Listar todos los menús
 * Público: solo menús activos
 * Admin: todos los menús con filtros
 */
menus.get("/", allowPublic("menus", "read"), menuController.getAllMenus);

/**
 * GET /api/menus/:id
 * Obtener menú por ID con sus items
 */
menus.get("/:id", allowPublic("menus", "read"), menuController.getMenuById);

// ============= RUTAS PROTEGIDAS DE MENÚS =============

// Aplicar middleware de autenticación para rutas protegidas
menus.use("*", authMiddleware);

/**
 * POST /api/menus
 * Crear nuevo menú
 * Requiere: menus:create
 */
menus.post("/", requirePermission("menus", "create"), menuController.createMenu);

/**
 * PATCH /api/menus/:id
 * Actualizar menú
 * Requiere: menus:update
 */
menus.patch("/:id", requirePermission("menus", "update"), menuController.updateMenu);

/**
 * DELETE /api/menus/:id
 * Eliminar menú
 * Requiere: menus:delete
 */
menus.delete("/:id", requirePermission("menus", "delete"), menuController.deleteMenu);

/**
 * PATCH /api/menus/:id/toggle
 * Activar/Desactivar menú
 * Requiere: menus:update
 */
menus.patch("/:id/toggle", requirePermission("menus", "update"), menuController.toggleMenuStatus);

// ============= RUTAS PÚBLICAS DE ITEMS DE MENÚ =============

/**
 * GET /api/menus/:menuId/items
 * Obtener items de un menú (plano)
 */
menus.get("/:menuId/items", allowPublic("menu_items", "read"), menuController.getMenuItems);

/**
 * GET /api/menus/:menuId/items/hierarchy
 * Obtener items de un menú en estructura jerárquica
 */
menus.get("/:menuId/items/hierarchy", allowPublic("menu_items", "read"), menuController.getMenuItemsHierarchy);

/**
 * GET /api/menus/:menuId/items/count
 * Contar items de un menú
 */
menus.get("/:menuId/items/count", allowPublic("menu_items", "read"), menuController.countMenuItems);

// ============= RUTAS PROTEGIDAS DE ITEMS DE MENÚ =============

const menuItems = new Hono();

/**
 * GET /api/menu-items/:id
 * Obtener item por ID
 */
menuItems.get("/:id", allowPublic("menu_items", "read"), menuController.getMenuItemById);

// Aplicar middleware de autenticación para rutas protegidas
menuItems.use("*", authMiddleware);

/**
 * POST /api/menu-items
 * Crear nuevo item de menú
 * Requiere: menu_items:create
 */
menuItems.post("/", requirePermission("menu_items", "create"), menuController.createMenuItem);

/**
 * PATCH /api/menu-items/:id
 * Actualizar item de menú
 * Requiere: menu_items:update
 */
menuItems.patch("/:id", requirePermission("menu_items", "update"), menuController.updateMenuItem);

/**
 * DELETE /api/menu-items/:id
 * Eliminar item de menú
 * Requiere: menu_items:delete
 */
menuItems.delete("/:id", requirePermission("menu_items", "delete"), menuController.deleteMenuItem);

/**
 * POST /api/menu-items/reorder
 * Reordenar items de menú (batch)
 * Requiere: menu_items:update
 */
menuItems.post("/reorder", requirePermission("menu_items", "update"), menuController.reorderMenuItems);

/**
 * PATCH /api/menu-items/:id/move
 * Mover item a otro padre
 * Requiere: menu_items:update
 */
menuItems.patch("/:id/move", requirePermission("menu_items", "update"), menuController.moveMenuItem);

/**
 * POST /api/menu-items/:id/duplicate
 * Duplicar item de menú
 * Requiere: menu_items:create
 */
menuItems.post("/:id/duplicate", requirePermission("menu_items", "create"), menuController.duplicateMenuItem);

// Exportar ambos routers
export { menus, menuItems };
