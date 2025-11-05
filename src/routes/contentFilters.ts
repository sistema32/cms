import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";
import * as contentFilterController from "../controllers/contentFilterController.ts";

const contentFilters = new Hono();

// ============= TODAS LAS RUTAS REQUIEREN ADMIN =============

/**
 * GET /api/content-filters
 * Listar filtros con opciones de filtrado
 * Requiere: content-filters:read (admin)
 */
contentFilters.get(
  "/",
  authMiddleware,
  requirePermission("content-filters", "read"),
  contentFilterController.list,
);

/**
 * POST /api/content-filters
 * Crear nuevo filtro
 * Requiere: content-filters:create (admin)
 */
contentFilters.post(
  "/",
  authMiddleware,
  requirePermission("content-filters", "create"),
  contentFilterController.create,
);

/**
 * POST /api/content-filters/test
 * Probar filtro sin guardarlo
 * Requiere: content-filters:read (admin)
 */
contentFilters.post(
  "/test",
  authMiddleware,
  requirePermission("content-filters", "read"),
  contentFilterController.test,
);

/**
 * GET /api/content-filters/stats
 * Obtener estadísticas de filtros
 * Requiere: content-filters:read (admin)
 */
contentFilters.get(
  "/stats",
  authMiddleware,
  requirePermission("content-filters", "read"),
  contentFilterController.getStats,
);

/**
 * GET /api/content-filters/:id
 * Obtener un filtro por ID
 * Requiere: content-filters:read (admin)
 */
contentFilters.get(
  "/:id",
  authMiddleware,
  requirePermission("content-filters", "read"),
  contentFilterController.getById,
);

/**
 * PATCH /api/content-filters/:id
 * Actualizar filtro
 * Requiere: content-filters:update (admin)
 */
contentFilters.patch(
  "/:id",
  authMiddleware,
  requirePermission("content-filters", "update"),
  contentFilterController.update,
);

/**
 * DELETE /api/content-filters/:id
 * Eliminar filtro
 * Requiere: content-filters:delete (admin)
 */
contentFilters.delete(
  "/:id",
  authMiddleware,
  requirePermission("content-filters", "delete"),
  contentFilterController.deleteFilter,
);

/**
 * PATCH /api/content-filters/:id/toggle
 * Activar/desactivar filtro
 * Requiere: content-filters:update (admin)
 */
contentFilters.patch(
  "/:id/toggle",
  authMiddleware,
  requirePermission("content-filters", "update"),
  contentFilterController.toggle,
);

export default contentFilters;
