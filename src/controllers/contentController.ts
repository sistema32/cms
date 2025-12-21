import type { Context } from "hono";
import * as contentService from "@/services/content/contentService.ts";
import { z } from "zod";
import { escapeHTML, sanitizeRichText } from "@/utils/sanitization.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { notificationService } from "@/lib/email/index.ts";
import { db } from "@/config/db.ts";
import { users, content } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { isSafePublicUrl } from "@/utils/validation.ts";
import { AppError } from "@/platform/errors.ts";

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional().refine(
    (url) => !url || isSafePublicUrl(url),
    { message: "URL canónica no permitida" },
  ),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaJson: z.string().optional(),
  focusKeyword: z.string().optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
}).optional();

const metaFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).optional(),
});

const contentSeoPayloadSchema = z.object({
  contentId: z.number(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional().refine(
    (url) => !url || isSafePublicUrl(url),
    { message: "URL canónica no permitida" },
  ),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaJson: z.string().optional(),
  focusKeyword: z.string().optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
});

const contentMetaPayloadSchema = z.object({
  contentId: z.number(),
  key: z.string(),
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).optional(),
});

const createContentSchema = z.object({
  contentTypeId: z.number(),
  parentId: z.number().optional(), // Para páginas hijas
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  featuredImageId: z.number().optional(),
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  visibility: z.enum(["public", "private", "password"]).optional(),
  password: z.string().optional(),
  publishedAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  scheduledAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  categoryIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
  seo: seoSchema,
  meta: z.array(metaFieldSchema).optional(),
});

const updateContentSchema = createContentSchema.partial().omit({ contentTypeId: true }).extend({
  saveRevision: z.boolean().optional(),
  changesSummary: z.string().optional(),
});

export async function createContent(c: Context) {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const data = createContentSchema.parse(body);

    // Sanitizar campos HTML para prevenir XSS
    const sanitizedData = {
      ...data,
      title: escapeHTML(data.title), // El título debe ser texto plano
      excerpt: data.excerpt ? sanitizeRichText(data.excerpt, "adminNote") : undefined,
      body: data.body ? sanitizeRichText(data.body, "adminNote") : undefined,
    };

    const createdContent = await contentService.createContent({
      ...sanitizedData,
      authorId: user.userId,
    });

    const content = await contentService.getContentById(
      createdContent.id,
      { incrementViews: false },
    );

    // Notify admins when content is published
    if (data.status === "published") {
      try {
        const admins = await db.query.users.findMany({
          where: eq(users.roleId, 1), // Assuming role 1 is admin
        });

        for (const admin of admins) {
          if (admin.id !== user.userId) {
            await notificationService.create({
              userId: admin.id,
              type: "content.published",
              title: "Nuevo contenido publicado",
              message: `${user.name || "Un usuario"} publicó "${data.title}"`,
              actionLabel: "Ver contenido",
              actionUrl: `/content/${data.slug}`,
              priority: "low",
            });
          }
        }
      } catch (notifError) {
        console.error("Error sending content notification:", notifError);
      }
    }

    // Trigger content:created hook
    const { doAction } = await import("@/lib/hooks/index.ts");
    await doAction("content:created", content ?? createdContent);
    await doAction("cms_content:created", content ?? createdContent);

    return c.json({ content: content ?? createdContent }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", {
        details: { issues: error.errors },
      });
    }
    throw error instanceof AppError ? error : new AppError("content_create_failed", getErrorMessage(error), 400);
  }
}

export async function getAllContent(c: Context) {
  try {
    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;
    const contentTypeId = c.req.query("contentTypeId");
    const status = c.req.query("status");
    const authorId = c.req.query("authorId");

    const content = await contentService.getContentList({
      limit,
      offset,
      contentTypeId: contentTypeId ? Number(contentTypeId) : undefined,
      status,
      authorId: authorId ? Number(authorId) : undefined,
    });

    return c.json({ content, limit, offset });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_list_failed", getErrorMessage(error), 500);
  }
}

export async function getContentById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    const found = await contentService.getContentById(id);
    if (!found) throw AppError.fromCatalog("content_not_found");

    return c.json({ content: found });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_get_failed", getErrorMessage(error), 500);
  }
}

export async function getContentBySlug(c: Context) {
  try {
    const slug = c.req.param("slug");
    const found = await contentService.getContentBySlug(slug);

    if (!found) throw AppError.fromCatalog("content_not_found");

    return c.json({ content: found });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_get_failed", getErrorMessage(error), 500);
  }
}

export async function searchContent(c: Context) {
  try {
    const query = c.req.query("q") ?? "";
    const limit = Number(c.req.query("limit")) || 20;

    const results = await contentService.searchContentDb(query, limit);

    return c.json({ results });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_search_failed", getErrorMessage(error), 400);
  }
}

export async function updateContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    const body = await c.req.json();
    const data = updateContentSchema.parse(body);

    // Sanitizar campos HTML para prevenir XSS
    const sanitizedData = {
      ...data,
      title: data.title ? escapeHTML(data.title) : undefined,
      excerpt: data.excerpt ? sanitizeRichText(data.excerpt, "adminNote") : undefined,
      body: data.body ? sanitizeRichText(data.body, "adminNote") : undefined,
    };

    const content = await contentService.updateContent(id, sanitizedData);

    // Notify admins when content is updated/published
    if (data.status === "published" || data.status) {
      try {
        const user = c.get("user");
        const admins = await db.query.users.findMany({
          where: eq(users.roleId, 1),
        });

        for (const admin of admins) {
          if (admin.id !== user.userId) {
            await notificationService.create({
              userId: admin.id,
              type: "content.updated",
              title: "Contenido modificado",
              message: `${user.name || "Un usuario"} modificó "${data.title || content.title}"`,
              actionLabel: "Ver contenido",
              actionUrl: `/content/${content.slug}`,
              priority: "low",
            });
          }
        }
      } catch (notifError) {
        console.error("Error sending content update notification:", notifError);
      }
    }

    return c.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("content_update_failed", getErrorMessage(error), 400);
  }
}

export async function deleteContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    // Get content before deletion for hook
    const existingContent = await db.query.content.findFirst({
      where: eq(content.id, id)
    });

    if (!existingContent) {
      throw AppError.fromCatalog("content_not_found");
    }

    // Trigger content:beforeDelete hook
    const { doAction } = await import("@/lib/hooks/index.ts");
    await doAction("content:beforeDelete", existingContent);

    await contentService.deleteContent(id);

    return c.json({ message: "Contenido eliminado exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_delete_failed", getErrorMessage(error), 400);
  }
}

export async function upsertContentSeo(c: Context) {
  try {
    const body = await c.req.json();
    const data = contentSeoPayloadSchema.parse(body);

    const { contentId, ...seoData } = data;

    const seo = await contentService.upsertContentSeoEntry(contentId, seoData);

    return c.json({ seo }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("content_seo_failed", getErrorMessage(error), 400);
  }
}

export async function getContentSeoByContentId(c: Context) {
  try {
    const contentId = Number(c.req.param("id"));
    if (isNaN(contentId)) throw AppError.fromCatalog("invalid_id");

    const seo = await contentService.getContentSeoEntry(contentId);

    if (!seo) {
      throw AppError.fromCatalog("seo_not_found");
    }

    return c.json({ seo });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_seo_failed", getErrorMessage(error), 400);
  }
}

export async function createContentMetaEntry(c: Context) {
  try {
    const body = await c.req.json();
    const data = contentMetaPayloadSchema.parse(body);

    const meta = await contentService.createContentMetaEntry(data.contentId, {
      key: data.key,
      value: data.value,
      type: data.type,
    });

    return c.json({ meta }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("content_meta_failed", getErrorMessage(error), 400);
  }
}

// Endpoint especial para generar slug desde título
export async function generateSlug(c: Context) {
  try {
    const { title } = await c.req.json();
    if (!title) throw AppError.fromCatalog("validation_error", { message: "Título requerido" });

    const slug = contentService.generateSlug(title);
    return c.json({ slug });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("slug_generate_failed", getErrorMessage(error), 400);
  }
}

// ============= ENDPOINTS DE REVISIONES =============

// Obtener todas las revisiones de un contenido
export async function getContentRevisions(c: Context) {
  try {
    const contentId = Number(c.req.param("id"));
    if (isNaN(contentId)) throw AppError.fromCatalog("invalid_id");

    const revisions = await contentService.getContentRevisions(contentId);
    return c.json({ revisions });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_revisions_failed", getErrorMessage(error), 400);
  }
}

// Obtener una revisión específica
export async function getRevisionById(c: Context) {
  try {
    const revisionId = Number(c.req.param("revisionId"));
    if (isNaN(revisionId)) throw AppError.fromCatalog("invalid_id", { message: "ID de revisión inválido" });

    const revision = await contentService.getRevisionById(revisionId);
    if (!revision) throw AppError.fromCatalog("revision_not_found");

    return c.json({ revision });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("revision_get_failed", getErrorMessage(error), 400);
  }
}

// Restaurar una revisión
export async function restoreRevision(c: Context) {
  try {
    const user = c.get("user");
    const contentId = Number(c.req.param("id"));
    const revisionId = Number(c.req.param("revisionId"));

    if (isNaN(contentId) || isNaN(revisionId)) {
      throw AppError.fromCatalog("invalid_id", { message: "IDs inválidos" });
    }

    const restored = await contentService.restoreRevision(contentId, revisionId, user.userId);
    return c.json({ content: restored, message: "Revisión restaurada exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("revision_restore_failed", getErrorMessage(error), 400);
  }
}

// Comparar dos revisiones
export async function compareRevisions(c: Context) {
  try {
    const revisionId1 = Number(c.req.query("revision1"));
    const revisionId2 = Number(c.req.query("revision2"));

    if (isNaN(revisionId1) || isNaN(revisionId2)) {
      throw AppError.fromCatalog("invalid_id", { message: "IDs de revisión inválidos" });
    }

    const comparison = await contentService.compareRevisions(revisionId1, revisionId2);
    return c.json({ comparison });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("revision_compare_failed", getErrorMessage(error), 400);
  }
}

// Eliminar una revisión
export async function deleteRevision(c: Context) {
  try {
    const revisionId = Number(c.req.param("revisionId"));
    if (isNaN(revisionId)) throw AppError.fromCatalog("invalid_id", { message: "ID de revisión inválido" });

    await contentService.deleteRevision(revisionId);
    return c.json({ message: "Revisión eliminada exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("revision_delete_failed", getErrorMessage(error), 400);
  }
}

// ============= ENDPOINTS DE PÁGINAS HIJAS =============

// Obtener páginas hijas de una página
export async function getChildPages(c: Context) {
  try {
    const parentId = Number(c.req.param("id"));
    if (isNaN(parentId)) throw AppError.fromCatalog("invalid_id");

    const children = await contentService.getChildPages(parentId);
    return c.json({ children });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_children_failed", getErrorMessage(error), 400);
  }
}
