import type { Context } from "hono";
import * as contentService from "../services/contentService.ts";
import { z } from "zod";
import { sanitizeHTML, escapeHTML } from "../utils/sanitization.ts";
import { getErrorMessage } from "../utils/errors.ts";

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
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
  canonicalUrl: z.string().optional(),
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

const updateContentSchema = createContentSchema.partial().omit({ contentTypeId: true });

export async function createContent(c: Context) {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const data = createContentSchema.parse(body);

    // Sanitizar campos HTML para prevenir XSS
    const sanitizedData = {
      ...data,
      title: escapeHTML(data.title), // El título debe ser texto plano
      excerpt: data.excerpt ? sanitizeHTML(data.excerpt) : undefined,
      body: data.body ? sanitizeHTML(data.body) : undefined,
    };

    const createdContent = await contentService.createContent({
      ...sanitizedData,
      authorId: user.userId,
    });

    const content = await contentService.getContentById(
      createdContent.id,
      { incrementViews: false },
    );

    return c.json({ content: content ?? createdContent }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
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
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getContentById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const content = await contentService.getContentById(id);
    if (!content) return c.json({ error: "Contenido no encontrado" }, 404);

    return c.json({ content });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getContentBySlug(c: Context) {
  try {
    const slug = c.req.param("slug");
    const content = await contentService.getContentBySlug(slug);

    if (!content) return c.json({ error: "Contenido no encontrado" }, 404);

    return c.json({ content });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function searchContent(c: Context) {
  try {
    const query = c.req.query("q") ?? "";
    const limit = Number(c.req.query("limit")) || 20;

    const results = await contentService.searchContent(query, limit);

    return c.json({ results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function updateContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const body = await c.req.json();
    const data = updateContentSchema.parse(body);

    // Sanitizar campos HTML para prevenir XSS
    const sanitizedData = {
      ...data,
      title: data.title ? escapeHTML(data.title) : undefined,
      excerpt: data.excerpt ? sanitizeHTML(data.excerpt) : undefined,
      body: data.body ? sanitizeHTML(data.body) : undefined,
    };

    const content = await contentService.updateContent(id, sanitizedData);

    return c.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function deleteContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    await contentService.deleteContent(id);

    return c.json({ message: "Contenido eliminado exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
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
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function getContentSeoByContentId(c: Context) {
  try {
    const contentId = Number(c.req.param("id"));
    if (isNaN(contentId)) return c.json({ error: "ID inválido" }, 400);

    const seo = await contentService.getContentSeoEntry(contentId);

    if (!seo) {
      return c.json({ error: "SEO no encontrado" }, 404);
    }

    return c.json({ seo });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
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
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Endpoint especial para generar slug desde título
export async function generateSlug(c: Context) {
  try {
    const { title } = await c.req.json();
    if (!title) return c.json({ error: "Título requerido" }, 400);

    const slug = contentService.generateSlug(title);
    return c.json({ slug });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// ============= ENDPOINTS DE REVISIONES =============

// Obtener todas las revisiones de un contenido
export async function getContentRevisions(c: Context) {
  try {
    const contentId = Number(c.req.param("id"));
    if (isNaN(contentId)) return c.json({ error: "ID inválido" }, 400);

    const revisions = await contentService.getContentRevisions(contentId);
    return c.json({ revisions });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Obtener una revisión específica
export async function getRevisionById(c: Context) {
  try {
    const revisionId = Number(c.req.param("revisionId"));
    if (isNaN(revisionId)) return c.json({ error: "ID de revisión inválido" }, 400);

    const revision = await contentService.getRevisionById(revisionId);
    if (!revision) return c.json({ error: "Revisión no encontrada" }, 404);

    return c.json({ revision });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Restaurar una revisión
export async function restoreRevision(c: Context) {
  try {
    const user = c.get("user");
    const contentId = Number(c.req.param("id"));
    const revisionId = Number(c.req.param("revisionId"));

    if (isNaN(contentId) || isNaN(revisionId)) {
      return c.json({ error: "IDs inválidos" }, 400);
    }

    const content = await contentService.restoreRevision(contentId, revisionId, user.userId);
    return c.json({ content, message: "Revisión restaurada exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Comparar dos revisiones
export async function compareRevisions(c: Context) {
  try {
    const revisionId1 = Number(c.req.query("revision1"));
    const revisionId2 = Number(c.req.query("revision2"));

    if (isNaN(revisionId1) || isNaN(revisionId2)) {
      return c.json({ error: "IDs de revisión inválidos" }, 400);
    }

    const comparison = await contentService.compareRevisions(revisionId1, revisionId2);
    return c.json({ comparison });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Eliminar una revisión
export async function deleteRevision(c: Context) {
  try {
    const revisionId = Number(c.req.param("revisionId"));
    if (isNaN(revisionId)) return c.json({ error: "ID de revisión inválido" }, 400);

    await contentService.deleteRevision(revisionId);
    return c.json({ message: "Revisión eliminada exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// ============= ENDPOINTS DE PÁGINAS HIJAS =============

// Obtener páginas hijas de una página
export async function getChildPages(c: Context) {
  try {
    const parentId = Number(c.req.param("id"));
    if (isNaN(parentId)) return c.json({ error: "ID inválido" }, 400);

    const children = await contentService.getChildPages(parentId);
    return c.json({ children });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}
