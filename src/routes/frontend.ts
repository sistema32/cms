import { Hono } from "hono";
import { FrontendController } from "@/controllers/frontend/FrontendController.ts";
import { FrontendService } from "@/services/frontend/FrontendService.ts";

/**
 * Frontend Routes - Rutas públicas del sitio web
 * Sistema multi-theme tipo WordPress con carga dinámica de themes
 */

const frontendRouter = new Hono();
const frontendController = new FrontendController();
const frontendService = FrontendService.getInstance();

/**
 * Invalida el cache de common data
 */
export function invalidateCommonDataCache() {
  frontendService.invalidateCommonDataCache();
}

// ============= RUTAS PÚBLICAS =============

/**
 * GET / - Homepage dinámica
 */
frontendRouter.get("/", frontendController.home);

// ============= RUTAS ESPECÍFICAS (deben ir primero) =============

/**
 * GET /page/:page - Paginación cuando posts están en homepage
 */
frontendRouter.get("/page/:page", frontendController.page);

/**
 * GET /search - Búsqueda
 */
frontendRouter.get("/search", frontendController.search);

/**
 * GET /category/:slug - Archivo de categoría
 */
frontendRouter.get("/category/:slug", frontendController.category);

/**
 * GET /tag/:slug - Archivo de tag
 */
frontendRouter.get("/tag/:slug", frontendController.tag);

// ============= RUTAS DINÁMICAS (deben ir al final) =============

/**
 * GET /:slug - Página estática o Posts Page
 */
frontendRouter.get("/:slug", frontendController.dynamicRoute);

/**
 * GET /:slug/page/:page - Paginación para páginas de posts configuradas
 */
frontendRouter.get("/:slug/page/:page", frontendController.dynamicRoutePage);

/**
 * GET /:blogBase - Página de blog (página 1)
 */
frontendRouter.get("/:blogBase", frontendController.blogIndex);

/**
 * GET /:blogBase/page/:page - Paginación del blog
 */
frontendRouter.get("/:blogBase/page/:page", frontendController.blogPage);

/**
 * GET /:blogBase/:slug - Post individual
 */
frontendRouter.get("/:blogBase/:slug", frontendController.singlePost);

export default frontendRouter;
