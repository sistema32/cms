import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";
import { requireCaptcha, requireCaptchaForGuests } from "@/middleware/captcha.ts";
import * as commentController from "@/controllers/commentController.ts";

const comments = new Hono();

// ============= RUTAS PÚBLICAS =============

/**
 * GET /api/comments/content/:contentId
 * Listar comentarios de un contenido (público - censurados)
 */
comments.get("/content/:contentId", commentController.getByContentId);

/**
 * POST /api/comments
 * Crear nuevo comentario
 * Sin CAPTCHA para desarrollo (TODO: habilitar en producción)
 * Permite guests (sin auth) y usuarios autenticados
 */
comments.post("/", commentController.create);

// ============= RUTAS AUTENTICADAS =============

/**
 * PATCH /api/comments/:id
 * Actualizar propio comentario
 * Requiere: autenticación
 */
comments.patch(
  "/:id",
  authMiddleware,
  requirePermission("comments", "update"),
  commentController.update,
);

/**
 * DELETE /api/comments/:id
 * Eliminar propio comentario
 * Requiere: autenticación
 */
comments.delete(
  "/:id",
  authMiddleware,
  requirePermission("comments", "delete"),
  commentController.deleteComment,
);

// ============= RUTAS ADMIN =============

/**
 * GET /api/comments/:id/original
 * Ver comentario sin censura
 * Requiere: comments:view-original (admin)
 */
comments.get(
  "/:id/original",
  authMiddleware,
  requirePermission("comments", "view-original"),
  commentController.getOriginal,
);

/**
 * POST /api/comments/:id/moderate
 * Moderar comentario (aprobar/spam/eliminar)
 * Requiere: comments:moderate (admin)
 */
comments.post(
  "/:id/moderate",
  authMiddleware,
  requirePermission("comments", "moderate"),
  commentController.moderate,
);

/**
 * GET /api/comments/stats/:contentId
 * Obtener estadísticas de comentarios
 * Requiere: comments:moderate (admin)
 */
comments.get(
  "/stats/:contentId",
  authMiddleware,
  requirePermission("comments", "moderate"),
  commentController.stats,
);

export default comments;
