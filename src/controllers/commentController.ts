import { Context } from "hono";
import { z } from "zod";
import * as commentService from "../services/commentService.ts";
import { notificationService } from "../lib/email/index.ts";
import { db } from "../config/db.ts";
import { content } from "../db/schema.ts";
import { eq } from "drizzle-orm";

/**
 * Esquemas de validación Zod
 */
const createCommentSchema = z.object({
  contentId: z.number(),
  parentId: z.number().optional(),
  body: z.string().min(1, "El comentario no puede estar vacío").max(
    5000,
    "El comentario no puede exceder 5000 caracteres",
  ),
  // CAPTCHA ya se verifica en el middleware, no necesitamos estos campos
  // Para guests
  authorName: z.string().optional(),
  authorEmail: z.string().email("Email inválido").optional(),
  authorWebsite: z.string().url("URL inválida").optional(),
});

const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

const moderateCommentSchema = z.object({
  status: z.enum(["approved", "spam", "deleted"]),
});

/**
 * POST /api/comments
 * Crear nuevo comentario (público con CAPTCHA)
 *
 * NOTA: El CAPTCHA se verifica en el middleware requireCaptcha()
 * El middleware clona el request para no consumir el body,
 * verifica el token y guarda captchaProvider en el contexto.
 */
export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const data = createCommentSchema.parse(body);

    // Obtener user si está autenticado
    const user = c.get("user");

    // Si no es usuario autenticado, verificar que tenga datos de guest
    if (!user && (!data.authorName || !data.authorEmail)) {
      return c.json(
        {
          success: false,
          error:
            "Debes proporcionar nombre y email, o iniciar sesión para comentar",
        },
        400,
      );
    }

    // CAPTCHA ya fue verificado en el middleware
    // Obtener información del CAPTCHA desde el contexto
    const captchaProvider = c.get("captchaProvider");

    // Obtener IP y User-Agent
    const ipAddress = c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip");
    const userAgent = c.req.header("user-agent");

    // Crear comentario
    const comment = await commentService.createComment({
      contentId: data.contentId,
      parentId: data.parentId,
      authorId: user?.userId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorWebsite: data.authorWebsite,
      body: data.body,
      captchaToken: undefined, // Ya no lo necesitamos
      captchaProvider,
      ipAddress,
      userAgent,
    });

    // Notify content author about new comment
    try {
      const contentData = await db.query.content.findFirst({
        where: eq(content.id, data.contentId),
        columns: {
          authorId: true,
          title: true,
          slug: true,
        },
      });

      if (contentData && contentData.authorId !== user?.userId) {
        const authorName = user ? user.name : data.authorName || "Un visitante";
        await notificationService.create({
          userId: contentData.authorId,
          type: "comment.new",
          title: "Nuevo comentario en tu contenido",
          message: `${authorName} comentó en "${contentData.title}"`,
          actionLabel: "Ver comentario",
          actionUrl: `/content/${contentData.slug}#comment-${comment.id}`,
          priority: "normal",
        });
      }
    } catch (notifError) {
      console.error("Error sending comment notification:", notifError);
      // Don't fail the comment creation if notification fails
    }

    // No retornar el body original, solo el censurado
    return c.json(
      {
        success: true,
        data: {
          ...comment,
          body: undefined, // Ocultar original
        },
        message: "Comentario publicado exitosamente",
      },
      201,
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al crear comentario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * GET /api/comments/content/:contentId
 * Listar comentarios de un contenido (público - censurados)
 */
export async function getByContentId(c: Context) {
  try {
    const contentId = parseInt(c.req.param("contentId"));

    if (isNaN(contentId)) {
      return c.json({ success: false, error: "ID de contenido inválido" }, 400);
    }

    // Solo mostrar originales si es admin
    const user = c.get("user");
    const isAdmin = user?.userId === 1; // Simplificado, se puede mejorar con permisos

    const comments = await commentService.getCommentsByContentId(contentId, {
      showOriginal: isAdmin,
      includeReplies: true,
      status: "approved",
    });

    return c.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener comentarios";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * PATCH /api/comments/:id
 * Actualizar propio comentario (autenticado)
 */
export async function update(c: Context) {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (!user) {
      return c.json({ success: false, error: "No autenticado" }, 401);
    }

    const body = await c.req.json();
    const data = updateCommentSchema.parse(body);

    const comment = await commentService.updateComment(
      id,
      user.userId,
      data,
    );

    return c.json({
      success: true,
      data: {
        ...comment,
        body: undefined, // No retornar original
      },
      message: "Comentario actualizado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al actualizar comentario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * DELETE /api/comments/:id
 * Eliminar propio comentario (autenticado)
 */
export async function deleteComment(c: Context) {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (!user) {
      return c.json({ success: false, error: "No autenticado" }, 401);
    }

    await commentService.deleteComment(id, user.userId);

    return c.json({
      success: true,
      message: "Comentario eliminado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al eliminar comentario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * GET /api/comments/:id/original
 * Ver comentario sin censura (admin)
 */
export async function getOriginal(c: Context) {
  try {
    const id = parseInt(c.req.param("id"));

    const comment = await commentService.getCommentById(id, true);

    if (!comment) {
      return c.json({ success: false, error: "Comentario no encontrado" }, 404);
    }

    return c.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener comentario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * POST /api/comments/:id/moderate
 * Moderar comentario (admin)
 */
export async function moderate(c: Context) {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const data = moderateCommentSchema.parse(body);

    // Get comment before moderation to check original status
    const commentBefore = await commentService.getCommentById(id, true);
    if (!commentBefore) {
      return c.json({ success: false, error: "Comentario no encontrado" }, 404);
    }

    const comment = await commentService.moderateComment(id, data.status);

    // Feedback loop removed (auto-moderation plugin eliminado)

    return c.json({
      success: true,
      data: comment,
      message: `Comentario marcado como ${data.status}`,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al moderar comentario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * GET /api/comments/stats/:contentId
 * Estadísticas de comentarios (admin)
 */
export async function stats(c: Context) {
  try {
    const contentId = parseInt(c.req.param("contentId"));

    if (isNaN(contentId)) {
      return c.json({ success: false, error: "ID de contenido inválido" }, 400);
    }

    const statistics = await commentService.getCommentStats(contentId);

    return c.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener estadísticas";
    return c.json({ success: false, error: message }, 400);
  }
}
