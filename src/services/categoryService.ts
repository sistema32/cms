import { db } from "../config/db.ts";
import {
  categories,
  type Category,
  type CategorySeo,
  categorySeo,
  content,
  contentCategories,
  type ContentType,
  contentTypes,
  type NewCategory,
  type NewCategorySeo,
  type User,
  users,
} from "../db/schema.ts";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
  sql,
} from "drizzle-orm";
import { sanitizeSearchQuery } from "../utils/sanitization.ts";

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  contentTypeId?: number;
  color?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number;
  contentTypeId?: number;
  color?: string;
  icon?: string;
  order?: number;
}

export interface CreateCategorySeoInput {
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

export interface SearchCategoriesInput {
  query?: string;
  contentTypeId?: number;
  parentId?: number | null;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "order" | "createdAt";
  orderDirection?: "asc" | "desc";
}

export interface GetCategoryContentInput {
  limit?: number;
  offset?: number;
  status?: string;
  visibility?: string;
}

export interface ReorderCategoryInput {
  id: number;
  order: number;
}

export interface MergeResult {
  movedContent: number;
  movedSubcategories: number;
  sourceCategory: CategoryWithRelations;
  targetCategory: CategoryWithRelations;
}

type CategoryRow = Category;
type CategoryWithRelations = CategoryRow & {
  parent?: CategoryRow | null;
  children?: CategoryRow[];
  contentType?: ContentType | null;
  seo?: CategorySeo | null;
};

type ContentRow = typeof content.$inferSelect;
type ContentWithRelations = ContentRow & {
  author?: Pick<User, "id" | "name" | "email"> | null;
  contentType?: ContentType | null;
};

// Crear una categoría
export async function createCategory(
  data: CreateCategoryInput,
): Promise<Category> {
  // Verificar si el slug ya existe
  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, data.slug),
  });

  if (existing) {
    throw new Error(`La categoría con slug '${data.slug}' ya existe`);
  }

  // Verificar que el parent existe si se especifica
  if (data.parentId) {
    const parent = await db.query.categories.findFirst({
      where: eq(categories.id, data.parentId),
    });

    if (!parent) {
      throw new Error("La categoría padre no existe");
    }
  }

  const [newCategory] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      contentTypeId: data.contentTypeId,
      color: data.color,
      icon: data.icon,
      order: data.order ?? 0,
    })
    .returning();

  return newCategory;
}

// Obtener todas las categorías (excluye soft deleted)
export async function getAllCategories(
  contentTypeId?: number,
): Promise<Category[]> {
  const whereClause = contentTypeId
    ? and(
      eq(categories.contentTypeId, contentTypeId),
      isNull(categories.deletedAt),
    )
    : isNull(categories.deletedAt);

  return await db
    .select()
    .from(categories)
    .where(whereClause)
    .orderBy(asc(categories.order), asc(categories.name));
}

// Obtener categorías raíz (sin padre, excluye soft deleted)
export async function getRootCategories(
  contentTypeId?: number,
): Promise<CategoryWithRelations[]> {
  const where = contentTypeId
    ? and(
      isNull(categories.parentId),
      eq(categories.contentTypeId, contentTypeId),
      isNull(categories.deletedAt),
    )
    : and(isNull(categories.parentId), isNull(categories.deletedAt));

  return await db.query.categories.findMany({
    where,
    orderBy: () => [asc(categories.order), asc(categories.name)],
    with: {
      children: {
        where: isNull(categories.deletedAt),
      },
    },
  });
}

export async function getCategoryTree(
  contentTypeId?: number,
): Promise<CategoryWithRelations[]> {
  return await getRootCategories(contentTypeId);
}

// Obtener una categoría por ID (excluye soft deleted)
export async function getCategoryById(
  id: number,
  includeDeleted = false,
): Promise<CategoryWithRelations | null> {
  const where = includeDeleted
    ? eq(categories.id, id)
    : and(eq(categories.id, id), isNull(categories.deletedAt));

  const category = await db.query.categories.findFirst({
    where,
    with: {
      parent: true,
      children: {
        where: isNull(categories.deletedAt),
      },
      contentType: true,
      seo: true,
    },
  });

  return category || null;
}

// Obtener una categoría por slug (excluye soft deleted)
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithRelations | null> {
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), isNull(categories.deletedAt)),
    with: {
      parent: true,
      children: {
        where: isNull(categories.deletedAt),
      },
      contentType: true,
      seo: true,
    },
  });

  return category || null;
}

// Actualizar una categoría
export async function updateCategory(
  id: number,
  data: UpdateCategoryInput,
): Promise<Category> {
  const existing = await getCategoryById(id);

  if (!existing) {
    throw new Error("Categoría no encontrada");
  }

  // Verificar slug único
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.query.categories.findFirst({
      where: eq(categories.slug, data.slug),
    });

    if (slugExists) {
      throw new Error(`El slug '${data.slug}' ya está en uso`);
    }
  }

  // Verificar que no se haga circular reference
  if (data.parentId && data.parentId === id) {
    throw new Error("Una categoría no puede ser su propio padre");
  }

  const [updated] = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning();

  return updated;
}

// Soft delete de una categoría
export async function deleteCategory(id: number): Promise<void> {
  const category = await getCategoryById(id);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  // Verificar si tiene hijos
  if (category.children?.length) {
    throw new Error(
      "No se puede eliminar una categoría con subcategorías. Elimina primero las subcategorías.",
    );
  }

  // Soft delete
  await db
    .update(categories)
    .set({ deletedAt: new Date() })
    .where(eq(categories.id, id));
}

// Restaurar una categoría eliminada (soft delete)
export async function restoreCategory(id: number): Promise<Category> {
  const category = await getCategoryById(id, true);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  if (!category.deletedAt) {
    throw new Error("La categoría no está eliminada");
  }

  const [restored] = await db
    .update(categories)
    .set({ deletedAt: null })
    .where(eq(categories.id, id))
    .returning();

  return restored;
}

// Eliminar permanentemente una categoría (force delete)
export async function forceDeleteCategory(id: number): Promise<void> {
  const category = await getCategoryById(id, true);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  // Verificar si tiene hijos
  const children = await db.query.categories.findMany({
    where: eq(categories.parentId, id),
  });

  if (children.length > 0) {
    throw new Error(
      "No se puede eliminar permanentemente una categoría con subcategorías.",
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
}

// ==================== SEO ====================

// Crear SEO para una categoría
export async function createCategorySeo(
  categoryId: number,
  data: CreateCategorySeoInput,
): Promise<CategorySeo> {
  const category = await getCategoryById(categoryId);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  // Verificar si ya tiene SEO
  const existingSeo = await db.query.categorySeo.findFirst({
    where: eq(categorySeo.categoryId, categoryId),
  });

  if (existingSeo) {
    throw new Error(
      "La categoría ya tiene metadatos SEO. Usa update en su lugar.",
    );
  }

  const [newSeo] = await db
    .insert(categorySeo)
    .values({
      categoryId,
      ...data,
    })
    .returning();

  return newSeo;
}

// Obtener SEO de una categoría
export async function getCategorySeo(
  categoryId: number,
): Promise<CategorySeo | null> {
  const seo = await db.query.categorySeo.findFirst({
    where: eq(categorySeo.categoryId, categoryId),
  });

  return seo || null;
}

// Actualizar SEO de una categoría
export async function updateCategorySeo(
  categoryId: number,
  data: Partial<CreateCategorySeoInput>,
): Promise<CategorySeo> {
  const category = await getCategoryById(categoryId);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  const existingSeo = await getCategorySeo(categoryId);

  if (!existingSeo) {
    throw new Error("La categoría no tiene metadatos SEO. Usa create primero.");
  }

  const [updated] = await db
    .update(categorySeo)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categorySeo.categoryId, categoryId))
    .returning();

  return updated;
}

// Eliminar SEO de una categoría
export async function deleteCategorySeo(categoryId: number): Promise<void> {
  const seo = await getCategorySeo(categoryId);

  if (!seo) {
    throw new Error("La categoría no tiene metadatos SEO");
  }

  await db.delete(categorySeo).where(eq(categorySeo.categoryId, categoryId));
}

// ==================== MERGE ====================

// Unificar/Merge dos categorías
export async function mergeCategories(
  sourceId: number,
  targetId: number,
): Promise<MergeResult> {
  // Validaciones
  if (sourceId === targetId) {
    throw new Error("No se puede unificar una categoría consigo misma");
  }

  const sourceCategory = await getCategoryById(sourceId);
  const targetCategory = await getCategoryById(targetId);

  if (!sourceCategory) {
    throw new Error("Categoría origen no encontrada");
  }

  if (!targetCategory) {
    throw new Error("Categoría destino no encontrada");
  }

  return await db.transaction(async (tx) => {
    const contentToMove = await tx.query.contentCategories.findMany({
      where: eq(contentCategories.categoryId, sourceId),
    });

    const contentIds = contentToMove.map((entry) => entry.contentId);
    let movedContent = 0;

    if (contentIds.length > 0) {
      const existing = await tx.query.contentCategories.findMany({
        where: and(
          eq(contentCategories.categoryId, targetId),
          inArray(contentCategories.contentId, contentIds),
        ),
      });

      const alreadyInTarget = new Set(existing.map((row) => row.contentId));
      const toUpdate = contentIds.filter((id) => !alreadyInTarget.has(id));
      const toDelete = contentIds.filter((id) => alreadyInTarget.has(id));

      if (toUpdate.length > 0) {
        movedContent = toUpdate.length;
        await tx
          .update(contentCategories)
          .set({ categoryId: targetId })
          .where(
            and(
              eq(contentCategories.categoryId, sourceId),
              inArray(contentCategories.contentId, toUpdate),
            ),
          );
      }

      if (toDelete.length > 0) {
        await tx
          .delete(contentCategories)
          .where(
            and(
              eq(contentCategories.categoryId, sourceId),
              inArray(contentCategories.contentId, toDelete),
            ),
          );
      }
    }

    const subcategoriesMoved = await tx
      .update(categories)
      .set({ parentId: targetId })
      .where(eq(categories.parentId, sourceId))
      .returning()
      .then((rows) => rows.length);

    await tx
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(eq(categories.id, sourceId));

    return {
      movedContent,
      movedSubcategories: subcategoriesMoved,
      sourceCategory,
      targetCategory,
    };
  });
}

// ==================== BÚSQUEDA AVANZADA ====================

// Buscar categorías con filtros y paginación
export async function searchCategories(
  input: SearchCategoriesInput,
): Promise<{ categories: CategoryWithRelations[]; total: number }> {
  const {
    query,
    contentTypeId,
    parentId,
    limit = 20,
    offset = 0,
    orderBy = "name",
    orderDirection = "asc",
  } = input;

  const conditions = [isNull(categories.deletedAt)];

  // Filtro por búsqueda de texto
  if (query) {
    const sanitizedQuery = sanitizeSearchQuery(query);
    conditions.push(
      or(
        like(categories.name, `%${sanitizedQuery}%`),
        like(categories.slug, `%${sanitizedQuery}%`),
        like(categories.description, `%${sanitizedQuery}%`),
      )!,
    );
  }

  // Filtro por content type
  if (contentTypeId) {
    conditions.push(eq(categories.contentTypeId, contentTypeId));
  }

  // Filtro por parent (puede ser null para raíz)
  if (parentId !== undefined) {
    if (parentId === null) {
      conditions.push(isNull(categories.parentId));
    } else {
      conditions.push(eq(categories.parentId, parentId));
    }
  }

  const whereClause = and(...conditions);

  // Ordenamiento
  const orderColumnMap = {
    name: categories.name,
    order: categories.order,
    createdAt: categories.createdAt,
  } as const;

  const orderColumn = orderColumnMap[orderBy];
  const orderFn = orderDirection === "asc" ? asc : desc;

  const results = await db.query.categories.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: orderFn(orderColumn),
    with: {
      parent: true,
      contentType: true,
      seo: true,
    },
  });

  // Contar total (sin paginación)
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  return {
    categories: results,
    total,
  };
}

// ==================== CONTENIDO POR CATEGORÍA ====================

// Obtener contenido de una categoría
export async function getCategoryContent(
  categoryId: number,
  input: GetCategoryContentInput = {},
): Promise<{
  content: ContentWithRelations[];
  total: number;
  limit: number;
  offset: number;
}> {
  const category = await getCategoryById(categoryId);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  const { limit = 20, offset = 0, status, visibility } = input;

  const filters = [eq(contentCategories.categoryId, categoryId)];

  if (status) {
    filters.push(eq(content.status, status));
  }

  if (visibility) {
    filters.push(eq(content.visibility, visibility));
  }

  const whereClause = and(...filters);

  const rows = await db
    .select({
      content,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      contentTypeRow: contentTypes,
    })
    .from(contentCategories)
    .innerJoin(content, eq(contentCategories.contentId, content.id))
    .leftJoin(users, eq(content.authorId, users.id))
    .leftJoin(contentTypes, eq(content.contentTypeId, contentTypes.id))
    .where(whereClause)
    .orderBy(desc(content.publishedAt), desc(content.createdAt))
    .limit(limit)
    .offset(offset);

  const contentList: ContentWithRelations[] = rows.map((row) => ({
    ...row.content,
    author: row.authorId
      ? {
        id: row.authorId,
        name: row.authorName!,
        email: row.authorEmail!,
      }
      : undefined,
    contentType: row.contentTypeRow
      ? (row.contentTypeRow as ContentType)
      : undefined,
  }));

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contentCategories)
    .innerJoin(content, eq(contentCategories.contentId, content.id))
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  return {
    content: contentList,
    total,
    limit,
    offset,
  };
}

// Contar contenido de una categoría
export async function getCategoryContentCount(
  categoryId: number,
): Promise<number> {
  const category = await getCategoryById(categoryId);

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contentCategories)
    .where(eq(contentCategories.categoryId, categoryId));

  return Number(result[0]?.count || 0);
}

// ==================== REORDENAMIENTO ====================

// Reordenar categorías en batch
export async function reorderCategories(
  reorders: ReorderCategoryInput[],
): Promise<void> {
  if (reorders.length === 0) return;

  const validIds = reorders.map((r) => r.id);
  const existing = await db.query.categories.findMany({
    where: inArray(categories.id, validIds),
  });

  if (existing.length !== reorders.length) {
    throw new Error("Una o más categorías no existen");
  }

  await db.transaction(async (tx) => {
    for (const { id, order } of reorders) {
      await tx
        .update(categories)
        .set({ order })
        .where(eq(categories.id, id));
    }
  });
}
