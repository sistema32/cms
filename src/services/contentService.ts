import { db } from "../config/db.ts";
import {
  type Content,
  content,
  contentCategories,
  contentMeta,
  contentSeo,
  contentTags,
  contentRevisions,
  type NewContent,
  type NewContentMeta,
  type NewContentSeo,
  type NewContentRevision,
} from "../db/schema.ts";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";

export interface CreateContentInput {
  contentTypeId: number;
  parentId?: number; // Para páginas hijas
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  featuredImageId?: number;
  authorId: number;
  status?: "draft" | "published" | "scheduled" | "archived";
  visibility?: "public" | "private" | "password";
  password?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  categoryIds?: number[];
  tagIds?: number[];
  seo?: CreateContentSeoInput;
  meta?: CreateContentMetaInput[];
}

export interface CreateContentSeoInput {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaJson?: string;
  focusKeyword?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface CreateContentMetaInput {
  key: string;
  value: string;
  type?: "string" | "number" | "boolean" | "json";
}

export interface UpdateContentInput {
  parentId?: number; // Para páginas hijas
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  featuredImageId?: number;
  status?: "draft" | "published" | "scheduled" | "archived";
  visibility?: "public" | "private" | "password";
  password?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  categoryIds?: number[];
  tagIds?: number[];
  seo?: CreateContentSeoInput;
  meta?: CreateContentMetaInput[];
  saveRevision?: boolean; // Indica si se debe guardar una revisión
  changesSummary?: string; // Resumen de los cambios realizados
}

export interface ContentFilters {
  contentTypeId?: number;
  status?: string;
  authorId?: number;
  categoryId?: number;
  tagId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

type RawContent = Awaited<
  ReturnType<typeof db.query.content.findFirst>
>;

function normalizeContent(
  raw: RawContent,
) {
  if (!raw) return raw;

  const categories = (raw as any).contentCategories?.map((item: any) =>
    item.category
  ).filter(
    Boolean,
  ) ?? [];
  const tags = (raw as any).contentTags?.map((item: any) => item.tag).filter(
    Boolean,
  ) ?? [];

  return {
    ...raw,
    categories,
    tags,
  };
}

// Generar slug automático desde título
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-"); // Múltiples guiones a uno solo
}

// Crear contenido
export async function createContent(
  data: CreateContentInput,
): Promise<Content> {
  // Verificar que el slug sea único
  const existing = await db.query.content.findFirst({
    where: eq(content.slug, data.slug),
  });

  if (existing) {
    throw new Error(`El contenido con slug '${data.slug}' ya existe`);
  }

  // Validar parentId si se proporciona
  if (data.parentId) {
    const parent = await db.query.content.findFirst({
      where: eq(content.id, data.parentId),
    });
    if (!parent) {
      throw new Error(`El contenido padre con ID ${data.parentId} no existe`);
    }
  }

  // Crear el contenido
  const [newContent] = await db
    .insert(content)
    .values({
      contentTypeId: data.contentTypeId,
      parentId: data.parentId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      featuredImageId: data.featuredImageId,
      authorId: data.authorId,
      status: data.status || "draft",
      visibility: data.visibility || "public",
      password: data.password,
      publishedAt: data.publishedAt,
      scheduledAt: data.scheduledAt,
    })
    .returning();

  // Asignar categorías
  if (data.categoryIds && data.categoryIds.length > 0) {
    await db.insert(contentCategories).values(
      data.categoryIds.map((categoryId) => ({
        contentId: newContent.id,
        categoryId,
      })),
    );
  }

  // Asignar tags
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(contentTags).values(
      data.tagIds.map((tagId) => ({
        contentId: newContent.id,
        tagId,
      })),
    );
  }

  // Crear SEO si se provee
  if (data.seo) {
    await db.insert(contentSeo).values({
      contentId: newContent.id,
      ...data.seo,
    });
  }

  // Crear meta fields si se proveen
  if (data.meta && data.meta.length > 0) {
    await db.insert(contentMeta).values(
      data.meta.map((m) => ({
        contentId: newContent.id,
        key: m.key,
        value: m.value,
        type: m.type || "string",
      })),
    );
  }

  return newContent;
}

// Obtener contenido con todas sus relaciones
export async function getContentById(
  id: number,
  options: { incrementViews?: boolean } = {},
) {
  const result = await db.query.content.findFirst({
    where: eq(content.id, id),
    with: {
      contentType: true,
      featuredImage: true,
      author: {
        columns: {
          password: false, // No incluir password
        },
      },
      contentCategories: {
        with: {
          category: true,
        },
      },
      contentTags: {
        with: {
          tag: true,
        },
      },
      seo: true,
      meta: true,
    },
  });

  if (!result) return null;

  if (options.incrementViews !== false) {
    await db
      .update(content)
      .set({
        viewCount: sql`${content.viewCount} + 1`,
      })
      .where(eq(content.id, id));
  }

  return normalizeContent(result);
}

// Obtener contenido por slug
export async function getContentBySlug(slug: string) {
  const result = await db.query.content.findFirst({
    where: eq(content.slug, slug),
    with: {
      contentType: true,
      featuredImage: true,
      author: {
        columns: {
          password: false,
        },
      },
      contentCategories: {
        with: {
          category: true,
        },
      },
      contentTags: {
        with: {
          tag: true,
        },
      },
      seo: true,
      meta: true,
    },
  });

  if (!result) return null;

  // Incrementar view count
  await db
    .update(content)
    .set({
      viewCount: sql`${content.viewCount} + 1`,
    })
    .where(eq(content.slug, slug));

  return normalizeContent(result);
}

// Obtener lista de contenido con filtros
export async function getContentList(filters: ContentFilters = {}) {
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  const conditions = [];

  if (filters.contentTypeId) {
    conditions.push(eq(content.contentTypeId, filters.contentTypeId));
  }

  if (filters.status) {
    conditions.push(eq(content.status, filters.status));
  }

  if (filters.authorId) {
    conditions.push(eq(content.authorId, filters.authorId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.query.content.findMany({
    with: {
      contentType: true,
      featuredImage: true,
      author: {
        columns: {
          password: false,
        },
      },
      contentCategories: {
        with: {
          category: true,
        },
      },
      contentTags: {
        with: {
          tag: true,
        },
      },
    },
    where: whereClause,
    orderBy: (content, { desc }) => [
      desc(content.publishedAt),
      desc(content.createdAt),
    ],
    limit,
    offset,
  });

  const results = await query;
  return results.map((item) => normalizeContent(item));
}

export async function searchContent(query: string, limit = 20) {
  const pattern = `%${query}%`;

  if (!query.trim()) {
    return [];
  }

  const results = await db.query.content.findMany({
    where: and(
      eq(content.status, "published"),
      or(
        like(content.title, pattern),
        like(content.excerpt, pattern),
        like(content.body, pattern),
      ),
    ),
    with: {
      contentType: true,
      featuredImage: true,
    },
    limit,
  });

  return results.map((item) => normalizeContent(item));
}

// Actualizar contenido
export async function updateContent(
  id: number,
  data: UpdateContentInput,
): Promise<Content> {
  const existing = await db.query.content.findFirst({
    where: eq(content.id, id),
  });

  if (!existing) {
    throw new Error("Contenido no encontrado");
  }

  // Verificar slug único si se cambia
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.query.content.findFirst({
      where: eq(content.slug, data.slug),
    });

    if (slugExists) {
      throw new Error(`El slug '${data.slug}' ya está en uso`);
    }
  }

  // Validar parentId si se proporciona
  if (data.parentId !== undefined && data.parentId !== null) {
    // No permitir que una página sea su propia hija
    if (data.parentId === id) {
      throw new Error("Un contenido no puede ser su propia página padre");
    }
    const parent = await db.query.content.findFirst({
      where: eq(content.id, data.parentId),
    });
    if (!parent) {
      throw new Error(`El contenido padre con ID ${data.parentId} no existe`);
    }
  }

  // Guardar revisión si se solicita (por defecto se guarda si hay cambios importantes)
  const shouldSaveRevision = data.saveRevision !== false && (
    data.title !== undefined ||
    data.body !== undefined ||
    data.excerpt !== undefined ||
    data.status !== undefined
  );

  if (shouldSaveRevision) {
    await createRevision(id, existing, data.changesSummary);
  }

  // Actualizar contenido
  const [updated] = await db
    .update(content)
    .set({
      parentId: data.parentId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      featuredImageId: data.featuredImageId,
      status: data.status,
      visibility: data.visibility,
      password: data.password,
      publishedAt: data.publishedAt,
      scheduledAt: data.scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(content.id, id))
    .returning();

  if (data.categoryIds !== undefined) {
    const current = await db.query.contentCategories.findMany({
      where: eq(contentCategories.contentId, id),
    });
    const currentIds = new Set(current.map((c) => c.categoryId));
    const newIds = new Set(data.categoryIds);

    const toInsert = data.categoryIds.filter((categoryId) =>
      !currentIds.has(categoryId)
    );
    const toDelete = current.filter((c) => !newIds.has(c.categoryId)).map((c) =>
      c.categoryId
    );

    if (toDelete.length > 0) {
      await db
        .delete(contentCategories)
        .where(
          and(
            eq(contentCategories.contentId, id),
            inArray(contentCategories.categoryId, toDelete),
          ),
        );
    }

    if (toInsert.length > 0) {
      await db.insert(contentCategories).values(
        toInsert.map((categoryId) => ({
          contentId: id,
          categoryId,
        })),
      );
    }
  }

  if (data.tagIds !== undefined) {
    const current = await db.query.contentTags.findMany({
      where: eq(contentTags.contentId, id),
    });
    const currentIds = new Set(current.map((t) => t.tagId));
    const newIds = new Set(data.tagIds);

    const toInsert = data.tagIds.filter((tagId) => !currentIds.has(tagId));
    const toDelete = current.filter((t) => !newIds.has(t.tagId)).map((t) =>
      t.tagId
    );

    if (toDelete.length > 0) {
      await db
        .delete(contentTags)
        .where(
          and(
            eq(contentTags.contentId, id),
            inArray(contentTags.tagId, toDelete),
          ),
        );
    }

    if (toInsert.length > 0) {
      await db.insert(contentTags).values(
        toInsert.map((tagId) => ({
          contentId: id,
          tagId,
        })),
      );
    }
  }

  // Actualizar SEO si se provee
  if (data.seo) {
    const existingSeo = await db.query.contentSeo.findFirst({
      where: eq(contentSeo.contentId, id),
    });

    if (existingSeo) {
      await db
        .update(contentSeo)
        .set({
          ...data.seo,
          updatedAt: new Date(),
        })
        .where(eq(contentSeo.contentId, id));
    } else {
      await db.insert(contentSeo).values({
        contentId: id,
        ...data.seo,
      });
    }
  }

  // Actualizar meta si se provee
  if (data.meta) {
    await db.delete(contentMeta).where(eq(contentMeta.contentId, id));
    if (data.meta.length > 0) {
      await db.insert(contentMeta).values(
        data.meta.map((m) => ({
          contentId: id,
          key: m.key,
          value: m.value,
          type: m.type || "string",
        })),
      );
    }
  }

  return updated;
}

// Eliminar contenido
export async function deleteContent(id: number): Promise<void> {
  const existing = await db.query.content.findFirst({
    where: eq(content.id, id),
  });

  if (!existing) {
    throw new Error("Contenido no encontrado");
  }

  await db.delete(content).where(eq(content.id, id));
}

export async function upsertContentSeoEntry(
  contentId: number,
  data: CreateContentSeoInput,
) {
  const existingContent = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });

  if (!existingContent) {
    throw new Error("Contenido no encontrado");
  }

  const existingSeo = await db.query.contentSeo.findFirst({
    where: eq(contentSeo.contentId, contentId),
  });

  if (existingSeo) {
    await db
      .update(contentSeo)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contentSeo.contentId, contentId));
  } else {
    await db.insert(contentSeo).values({
      contentId,
      ...data,
    });
  }

  return await db.query.contentSeo.findFirst({
    where: eq(contentSeo.contentId, contentId),
  });
}

export async function getContentSeoEntry(contentId: number) {
  return await db.query.contentSeo.findFirst({
    where: eq(contentSeo.contentId, contentId),
  });
}

export async function createContentMetaEntry(
  contentId: number,
  meta: CreateContentMetaInput,
) {
  const existingContent = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });

  if (!existingContent) {
    throw new Error("Contenido no encontrado");
  }

  const [created] = await db.insert(contentMeta).values({
    contentId,
    key: meta.key,
    value: meta.value,
    type: meta.type || "string",
  }).returning();

  return created;
}

// ============= FUNCIONES DE REVISIONES =============

// Crear una revisión del contenido actual
async function createRevision(
  contentId: number,
  currentContent: Content,
  changesSummary?: string,
) {
  // Obtener el número de revisión siguiente
  const lastRevision = await db.query.contentRevisions.findFirst({
    where: eq(contentRevisions.contentId, contentId),
    orderBy: (revisions, { desc }) => [desc(revisions.revisionNumber)],
  });

  const nextRevisionNumber = (lastRevision?.revisionNumber || 0) + 1;

  // Crear la revisión
  await db.insert(contentRevisions).values({
    contentId,
    title: currentContent.title,
    slug: currentContent.slug,
    excerpt: currentContent.excerpt,
    body: currentContent.body,
    status: currentContent.status,
    visibility: currentContent.visibility,
    password: currentContent.password,
    featuredImageId: currentContent.featuredImageId,
    publishedAt: currentContent.publishedAt,
    scheduledAt: currentContent.scheduledAt,
    revisionNumber: nextRevisionNumber,
    authorId: currentContent.authorId,
    changesSummary,
  });
}

// Obtener todas las revisiones de un contenido
export async function getContentRevisions(contentId: number) {
  const revisions = await db.query.contentRevisions.findMany({
    where: eq(contentRevisions.contentId, contentId),
    orderBy: (revisions, { desc }) => [desc(revisions.revisionNumber)],
    with: {
      author: {
        columns: {
          password: false,
        },
      },
    },
  });

  return revisions;
}

// Obtener una revisión específica por ID
export async function getRevisionById(revisionId: number) {
  const revision = await db.query.contentRevisions.findFirst({
    where: eq(contentRevisions.id, revisionId),
    with: {
      author: {
        columns: {
          password: false,
        },
      },
    },
  });

  return revision;
}

// Restaurar una revisión (copiar sus datos al contenido actual)
export async function restoreRevision(
  contentId: number,
  revisionId: number,
  restoredByUserId: number,
) {
  const revision = await getRevisionById(revisionId);

  if (!revision) {
    throw new Error("Revisión no encontrada");
  }

  if (revision.contentId !== contentId) {
    throw new Error("La revisión no pertenece a este contenido");
  }

  const currentContent = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });

  if (!currentContent) {
    throw new Error("Contenido no encontrado");
  }

  // Guardar el estado actual como una revisión antes de restaurar
  await createRevision(contentId, currentContent, `Restaurado desde revisión #${revision.revisionNumber}`);

  // Restaurar los datos de la revisión
  const [restored] = await db
    .update(content)
    .set({
      title: revision.title,
      slug: revision.slug,
      excerpt: revision.excerpt,
      body: revision.body,
      status: revision.status,
      visibility: revision.visibility,
      password: revision.password,
      featuredImageId: revision.featuredImageId,
      publishedAt: revision.publishedAt,
      scheduledAt: revision.scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(content.id, contentId))
    .returning();

  return restored;
}

// Eliminar una revisión
export async function deleteRevision(revisionId: number) {
  const revision = await db.query.contentRevisions.findFirst({
    where: eq(contentRevisions.id, revisionId),
  });

  if (!revision) {
    throw new Error("Revisión no encontrada");
  }

  await db.delete(contentRevisions).where(eq(contentRevisions.id, revisionId));
}

// Comparar dos versiones (útil para ver qué cambió)
export async function compareRevisions(revisionId1: number, revisionId2: number) {
  const [revision1, revision2] = await Promise.all([
    getRevisionById(revisionId1),
    getRevisionById(revisionId2),
  ]);

  if (!revision1 || !revision2) {
    throw new Error("Una o ambas revisiones no fueron encontradas");
  }

  return {
    revision1,
    revision2,
    differences: {
      title: revision1.title !== revision2.title,
      slug: revision1.slug !== revision2.slug,
      excerpt: revision1.excerpt !== revision2.excerpt,
      body: revision1.body !== revision2.body,
      status: revision1.status !== revision2.status,
      visibility: revision1.visibility !== revision2.visibility,
    },
  };
}

// Obtener páginas hijas de una página
export async function getChildPages(parentId: number) {
  const children = await db.query.content.findMany({
    where: eq(content.parentId, parentId),
    with: {
      contentType: true,
      author: {
        columns: {
          password: false,
        },
      },
    },
    orderBy: (content, { asc }) => [asc(content.title)],
  });

  return children.map((item) => normalizeContent(item));
}
