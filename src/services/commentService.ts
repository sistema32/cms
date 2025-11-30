import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../config/db.ts";
import { comments, content, contentTypes } from "../db/schema.ts";
import type { NewComment } from "../db/schema.ts";
import { applyCensorship } from "./censorshipService.ts";
import {
  escapeHTML,
  sanitizeHTML,
  sanitizeURL,
} from "../utils/sanitization.ts";
import { webhookManager } from "../lib/webhooks/index.ts";
import { notificationService } from "../lib/email/index.ts";
import { env } from "../config/env.ts";

async function getAutoModerationSafe() {
  try {
    const mod = await import("../../plugins/auto-moderation/index.ts");
    return typeof mod.getAutoModeration === "function"
      ? mod.getAutoModeration()
      : null;
  } catch (_e) {
    return null;
  }
}

/**
 * Interfaz para crear un comentario
 */
export interface CreateCommentData {
  contentId: number;
  parentId?: number | null;
  authorId?: number | null; // null para guests
  authorName?: string; // para guests
  authorEmail?: string; // para guests
  authorWebsite?: string; // opcional
  body: string;
  captchaToken?: string;
  captchaProvider?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interfaz para opciones de listado
 */
export interface GetCommentsOptions {
  showOriginal?: boolean; // true = admin ve body, false = público ve bodyCensored
  includeReplies?: boolean; // cargar respuestas (threading 1 nivel)
  status?: "approved" | "spam" | "deleted";
  includeDeleted?: boolean; // incluir soft deleted
}

/**
 * Verifica si un contentType tiene comentarios habilitados
 * NOTA: Esta función se mantiene para compatibilidad pero ya no se usa en createComment
 * (se optimizó para hacer validaciones en una sola query)
 */
async function contentHasCommentsEnabled(contentId: number): Promise<boolean> {
  const contentData = await db.query.content.findFirst({
    where: eq(content.id, contentId),
    with: {
      contentType: true,
    },
  });

  if (!contentData) {
    throw new Error("Contenido no encontrado");
  }

  return contentData.contentType.hasComments === true;
}

/**
 * Incrementa el contador de comentarios en content
 */
async function incrementCommentCount(contentId: number) {
  await db
    .update(content)
    .set({
      commentCount: (content.commentCount as any) + 1,
    })
    .where(eq(content.id, contentId));
}

/**
 * Decrementa el contador de comentarios en content
 */
async function decrementCommentCount(contentId: number) {
  await db
    .update(content)
    .set({
      commentCount: (content.commentCount as any) - 1,
    })
    .where(eq(content.id, contentId));
}

/**
 * Determina el estado inicial de un comentario con moderación inteligente
 * Usa el plugin de auto-moderación si está disponible, sino usa reglas básicas
 * Reglas básicas:
 * 1. Usuarios autenticados con historial limpio -> approved
 * 2. Usuarios nuevos o invitados -> pending
 * 3. Contenido censurado -> pending (puede contener spam)
 * 4. Comentarios muy cortos o largos -> pending
 */
async function determineInitialStatus(params: {
  authorId?: number | null;
  authorName?: string | null;
  authorEmail?: string | null;
  authorWebsite?: string | null;
  body: string;
  bodyCensored: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<"approved" | "pending" | "spam"> {
  const {
    authorId,
    authorName,
    authorEmail,
    authorWebsite,
    body,
    bodyCensored,
    ipAddress,
    userAgent,
  } = params;

  // Intentar usar plugin de auto-moderación si está disponible
  const autoModPlugin = await getAutoModerationSafe();
  if (autoModPlugin) {
    try {
      const decision = await autoModPlugin.checkComment({
        authorId,
        authorName,
        authorEmail,
        authorWebsite,
        body,
        ipAddress,
        userAgent,
      });

      console.log("[CommentService] Auto-moderation decision:", {
        action: decision.action,
        score: decision.analysis.score,
        confidence: decision.analysis.confidence,
        reasons: decision.analysis.reasons,
      });

      // Mapear acción del plugin a status de comentario
      if (decision.action === "spam") return "spam";
      if (decision.action === "approve") return "approved";
      if (decision.action === "moderate") return "pending";
    } catch (error) {
      console.error("[CommentService] Error in auto-moderation:", error);
      // Si hay error, continuar con reglas básicas
    }
  }

  // Regla 1: Usuarios autenticados con historial
  if (authorId) {
    // Contar comentarios aprobados del usuario
    const approvedCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(comments)
      .where(
        and(
          eq(comments.authorId, authorId),
          eq(comments.status, "approved"),
        ),
      );

    const count = Number(approvedCount[0]?.count || 0);

    // Si tiene 3+ comentarios aprobados, auto-aprobar
    if (count >= 3) {
      return "approved";
    }
  }

  // Regla 2: Contenido censurado = potencial spam
  if (body !== bodyCensored) {
    // Si hubo censura significativa (más del 20% del texto cambió)
    const censorshipRate = 1 - (bodyCensored.length / body.length);
    if (censorshipRate > 0.2) {
      return "pending";
    }
  }

  // Regla 3: Comentarios muy cortos (posible spam) o muy largos (posible spam)
  const wordCount = body.split(/\s+/).length;
  if (wordCount < 3 || wordCount > 500) {
    return "pending";
  }

  // Regla 4: Detectar patrones de spam comunes
  const spamPatterns = [
    /buy now/i,
    /click here/i,
    /limited time/i,
    /act now/i,
    /100% free/i,
    /make money/i,
    /work from home/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(body)) {
      return "pending";
    }
  }

  // Regla 5: Usuarios invitados van a pending por defecto (moderación manual)
  if (!authorId) {
    return "pending";
  }

  // Por defecto, aprobar
  return "approved";
}

/**
 * Crea un nuevo comentario
 * OPTIMIZACIÓN: Combina todas las validaciones en una sola query (o dos si hay parentId)
 * Antes: 2-3 queries, Ahora: 1-2 queries
 */
export async function createComment(
  data: CreateCommentData,
) {
  // OPTIMIZACIÓN: Single query para validar content + contentType + parentComment (si existe)
  const contentData = await db.query.content.findFirst({
    where: eq(content.id, data.contentId),
    with: {
      contentType: true,
      ...(data.parentId
        ? {
          comments: {
            where: eq(comments.id, data.parentId),
            limit: 1,
          },
        }
        : {}),
    },
  });

  // Validar que el contenido existe
  if (!contentData) {
    throw new Error("Contenido no encontrado");
  }

  // Validar que el contentType permite comentarios
  if (!contentData.contentType.hasComments) {
    throw new Error("Este tipo de contenido no permite comentarios");
  }

  // Validar que el contenido individual tiene comentarios habilitados
  if (!contentData.commentsEnabled) {
    throw new Error("Los comentarios están deshabilitados para este contenido");
  }

  // Validar comentario padre (si existe)
  if (data.parentId) {
    const parentComment = (contentData as any).comments?.[0];

    if (!parentComment) {
      throw new Error("Comentario padre no encontrado");
    }

    // Solo permitir 1 nivel de threading
    if (parentComment.parentId !== null) {
      throw new Error(
        "Solo se permite un nivel de respuestas. No puedes responder a una respuesta.",
      );
    }
  }

  // 1. Sanitizar HTML para prevenir XSS
  const sanitizedBody = sanitizeHTML(data.body);

  // 2. Sanitizar campos de guest (prevenir XSS en nombre, email, website)
  const sanitizedAuthorName = data.authorName
    ? escapeHTML(data.authorName)
    : null;
  const sanitizedAuthorEmail = data.authorEmail
    ? escapeHTML(data.authorEmail)
    : null;
  const sanitizedAuthorWebsite = data.authorWebsite
    ? sanitizeURL(data.authorWebsite)
    : null;

  // 3. Aplicar censura al contenido sanitizado
  const bodyCensored = await applyCensorship(sanitizedBody);

  // 4. Determinar estado inicial con moderación inteligente
  const initialStatus = await determineInitialStatus({
    authorId: data.authorId,
    authorName: sanitizedAuthorName,
    authorEmail: data.authorEmail,
    authorWebsite: sanitizedAuthorWebsite,
    body: sanitizedBody,
    bodyCensored,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  // Crear comentario
  const [comment] = await db
    .insert(comments)
    .values({
      contentId: data.contentId,
      parentId: data.parentId || null,
      authorId: data.authorId || null,
      authorName: sanitizedAuthorName,
      authorEmail: sanitizedAuthorEmail,
      authorWebsite: sanitizedAuthorWebsite,
      body: sanitizedBody, // original sanitizado (sin censura)
      bodyCensored, // versión pública sanitizada + censurada
      captchaToken: data.captchaToken,
      captchaProvider: data.captchaProvider,
      status: initialStatus,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
    .returning();

  // Incrementar contador solo si es comentario principal (no respuesta)
  if (!data.parentId) {
    await incrementCommentCount(data.contentId);
  }

  // Dispatch webhook event
  try {
    await webhookManager.dispatch("comment.created", {
      id: comment.id,
      contentId: comment.contentId,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      parentId: comment.parentId,
      status: comment.status,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.warn("Failed to dispatch comment.created webhook:", error);
  }

  // Create notifications
  try {
    const contentData = await db.query.content.findFirst({
      where: eq(content.id, data.contentId),
      columns: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
      },
    });

    if (contentData) {
      // If this is a reply, notify the parent comment author
      if (data.parentId) {
        const parentComment = await db.query.comments.findFirst({
          where: eq(comments.id, data.parentId),
          columns: {
            authorId: true,
            body: true,
          },
        });

        if (
          parentComment?.authorId && parentComment.authorId !== data.authorId
        ) {
          await notificationService.create({
            userId: parentComment.authorId,
            type: "comment.reply",
            title: "New reply to your comment",
            message: `${
              data.authorName || "Someone"
            } replied to your comment on "${contentData.title}"`,
            link: `/content/${contentData.slug}#comment-${comment.id}`,
            actionLabel: "View Reply",
            actionUrl:
              `${env.BASE_URL}/content/${contentData.slug}#comment-${comment.id}`,
            priority: "normal",
            sendEmail: true,
            data: {
              commentId: comment.id,
              contentId: contentData.id,
              contentSlug: contentData.slug,
            },
          });
        }
      } else if (
        contentData.authorId && contentData.authorId !== data.authorId
      ) {
        // Notify content author about new comment
        await notificationService.create({
          userId: contentData.authorId,
          type: "comment.new",
          title: "New comment on your post",
          message: `${
            data.authorName || "Someone"
          } commented on "${contentData.title}"`,
          link: `/content/${contentData.slug}#comment-${comment.id}`,
          actionLabel: "View Comment",
          actionUrl:
            `${env.BASE_URL}/content/${contentData.slug}#comment-${comment.id}`,
          priority: "normal",
          sendEmail: true,
          data: {
            commentId: comment.id,
            contentId: contentData.id,
            contentSlug: contentData.slug,
          },
        });
      }
    }
  } catch (error) {
    console.warn("Failed to create comment notifications:", error);
  }

  return comment;
}

/**
 * Obtiene comentarios de un contenido
 */
export async function getCommentsByContentId(
  contentId: number,
  options: GetCommentsOptions = {},
) {
  const {
    showOriginal = false,
    includeReplies = true,
    status = "approved",
    includeDeleted = false,
  } = options;

  // Condiciones para la query
  const conditions = [eq(comments.contentId, contentId)];

  // Filtrar por status
  conditions.push(eq(comments.status, status));

  // Excluir soft deleted a menos que se pida explícitamente
  if (!includeDeleted) {
    conditions.push(isNull(comments.deletedAt));
  }

  // Solo comentarios principales (no respuestas)
  conditions.push(isNull(comments.parentId));

  // Obtener comentarios principales
  const mainComments = await db.query.comments.findMany({
    where: and(...conditions),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      replies: includeReplies
        ? {
          where: includeDeleted ? eq(comments.status, status) : and(
            eq(comments.status, status),
            isNull(comments.deletedAt),
          ),
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [comments.createdAt],
        }
        : undefined,
    },
    orderBy: [desc(comments.createdAt)],
  });

  // Si showOriginal es false, eliminar el campo body y solo dejar bodyCensored
  if (!showOriginal) {
    return mainComments.map((comment) => ({
      ...comment,
      body: undefined, // ocultar original
      replies: comment.replies?.map((reply) => ({
        ...reply,
        body: undefined, // ocultar original en respuestas
      })),
    }));
  }

  return mainComments;
}

/**
 * Obtiene un comentario por ID (para ver original sin censura - admin)
 */
export async function getCommentById(
  id: number,
  showOriginal: boolean = false,
) {
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, id),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      content: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!comment) {
    return null;
  }

  // Si no se debe mostrar el original, eliminarlo
  if (!showOriginal) {
    return {
      ...comment,
      body: undefined,
    };
  }

  return comment;
}

/**
 * Actualiza un comentario (solo el autor o admin)
 * OPTIMIZACIÓN: Combina validación y actualización en una sola query
 * Antes: 2 queries (SELECT + UPDATE), Ahora: 1 query (UPDATE con WHERE)
 */
export async function updateComment(
  id: number,
  userId: number,
  data: { body: string },
) {
  // 1. Sanitizar HTML para prevenir XSS
  const sanitizedBody = sanitizeHTML(data.body);

  // 2. Re-aplicar censura al nuevo contenido sanitizado
  const bodyCensored = await applyCensorship(sanitizedBody);

  // OPTIMIZACIÓN: Actualizar solo si el userId coincide con authorId
  const [updated] = await db
    .update(comments)
    .set({
      body: sanitizedBody,
      bodyCensored,
      updatedAt: new Date(),
    })
    .where(and(eq(comments.id, id), eq(comments.authorId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Comentario no encontrado o sin permisos para editarlo");
  }

  return updated;
}

/**
 * Elimina un comentario (soft delete)
 * OPTIMIZACIÓN: Combina validación y eliminación en una sola query
 * Antes: 2 queries (SELECT + UPDATE), Ahora: 1 query (UPDATE con WHERE)
 */
export async function deleteComment(id: number, userId: number) {
  // OPTIMIZACIÓN: Soft delete solo si el userId coincide con authorId
  const [deleted] = await db
    .update(comments)
    .set({
      deletedAt: new Date(),
      status: "deleted",
    })
    .where(and(eq(comments.id, id), eq(comments.authorId, userId)))
    .returning();

  if (!deleted) {
    throw new Error(
      "Comentario no encontrado o no tienes permiso para eliminarlo",
    );
  }

  // Decrementar contador solo si es comentario principal
  if (!deleted.parentId) {
    await decrementCommentCount(deleted.contentId);
  }

  return deleted;
}

/**
 * Modera un comentario (admin) - cambia status
 */
export async function moderateComment(
  id: number,
  status: "approved" | "spam" | "deleted",
) {
  const [moderated] = await db
    .update(comments)
    .set({
      status,
      ...(status === "deleted" ? { deletedAt: new Date() } : {}),
    })
    .where(eq(comments.id, id))
    .returning();

  if (!moderated) {
    throw new Error("Comentario no encontrado");
  }

  // Dispatch webhook event for approved comments
  if (status === "approved") {
    try {
      await webhookManager.dispatch("comment.approved", {
        id: moderated.id,
        contentId: moderated.contentId,
        authorId: moderated.authorId,
        authorName: moderated.authorName,
        authorEmail: moderated.authorEmail,
        approvedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Failed to dispatch comment.approved webhook:", error);
    }
  }

  return moderated;
}

/**
 * Obtiene estadísticas de comentarios de un contenido
 * OPTIMIZACIÓN: Usa SQL aggregation en lugar de cargar todos los comentarios en memoria
 * Antes: Cargaba N comentarios completos + 6 filtrados en JavaScript
 * Ahora: Una sola query con COUNT/SUM en la base de datos
 */
export async function getCommentStats(contentId: number) {
  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      approved: sql<
        number
      >`SUM(CASE WHEN ${comments.status} = 'approved' THEN 1 ELSE 0 END)`,
      spam: sql<
        number
      >`SUM(CASE WHEN ${comments.status} = 'spam' THEN 1 ELSE 0 END)`,
      deleted: sql<
        number
      >`SUM(CASE WHEN ${comments.status} = 'deleted' THEN 1 ELSE 0 END)`,
      mainComments: sql<
        number
      >`SUM(CASE WHEN ${comments.parentId} IS NULL THEN 1 ELSE 0 END)`,
      replies: sql<
        number
      >`SUM(CASE WHEN ${comments.parentId} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(comments)
    .where(eq(comments.contentId, contentId));

  return {
    total: Number(stats.total) || 0,
    approved: Number(stats.approved) || 0,
    spam: Number(stats.spam) || 0,
    deleted: Number(stats.deleted) || 0,
    mainComments: Number(stats.mainComments) || 0,
    replies: Number(stats.replies) || 0,
  };
}
