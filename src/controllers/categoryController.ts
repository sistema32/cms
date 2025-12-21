import type { Context } from "hono";
import * as categoryService from "@/services/content/categoryService.ts";
import { z } from "zod";
import { getErrorMessage } from "@/utils/errors.ts";
import { isSafePublicUrl } from "@/utils/validation.ts";
import { AppError } from "@/platform/errors.ts";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.number().optional(),
  contentTypeId: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

const createCategorySeoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  canonicalUrl: z.string().optional().refine(
    (url) => !url || isSafePublicUrl(url),
    { message: "URL canónica no permitida" },
  ),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
  twitterCard: z.enum(["summary", "summary_large_image", "app", "player"]).optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaJson: z.string().optional(),
  focusKeyword: z.string().optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
});

const updateCategorySeoSchema = createCategorySeoSchema.partial();

const mergeCategoriesSchema = z.object({
  targetCategoryId: z.number().int().positive(),
});

const searchCategoriesSchema = z.object({
  query: z.string().optional(),
  contentTypeId: z.number().optional(),
  parentId: z.number().nullable().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  orderBy: z.enum(["name", "order", "createdAt"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
});

const reorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int(),
    })
  ).min(1),
});

const parseId = (value: string | undefined, label = "ID") => {
  const id = Number(value);
  if (isNaN(id)) {
    throw AppError.fromCatalog("invalid_id", { message: `${label} inválido` });
  }
  return id;
};

export async function createCategory(c: Context) {
  try {
    const body = await c.req.json();
    const data = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(data);
    return c.json({ category }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_create_failed", getErrorMessage(error), 400);
  }
}

export async function getAllCategories(c: Context) {
  try {
    const contentTypeId = c.req.query("contentTypeId");
    const categories = await categoryService.getAllCategories(
      contentTypeId ? Number(contentTypeId) : undefined
    );
    return c.json({ categories });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_list_failed", getErrorMessage(error), 500);
  }
}

export async function getRootCategories(c: Context) {
  try {
    const contentTypeId = c.req.query("contentTypeId");
    const categories = await categoryService.getRootCategories(
      contentTypeId ? Number(contentTypeId) : undefined
    );
    return c.json({ categories });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_root_failed", getErrorMessage(error), 500);
  }
}

export async function getCategoryTree(c: Context) {
  try {
    const contentTypeId = c.req.query("contentTypeId");
    const tree = await categoryService.getCategoryTree(
      contentTypeId ? Number(contentTypeId) : undefined,
    );
    return c.json({ tree });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_tree_failed", getErrorMessage(error), 500);
  }
}

export async function getCategoryById(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

  const category = await categoryService.getCategoryById(id);
  if (!category) throw AppError.fromCatalog("category_not_found");

    return c.json({ category });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_get_failed", getErrorMessage(error), 500);
  }
}

export async function updateCategory(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const body = await c.req.json();
    const data = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, data);

    return c.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_update_failed", getErrorMessage(error), 400);
  }
}

export async function deleteCategory(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    await categoryService.deleteCategory(id);
    return c.json({ message: "Categoría eliminada exitosamente (soft delete)" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_delete_failed", getErrorMessage(error), 400);
  }
}

// ==================== SOFT DELETE ====================

export async function restoreCategory(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const category = await categoryService.restoreCategory(id);
    return c.json({ category, message: "Categoría restaurada exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_restore_failed", getErrorMessage(error), 400);
  }
}

export async function forceDeleteCategory(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    await categoryService.forceDeleteCategory(id);
    return c.json({ message: "Categoría eliminada permanentemente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_force_delete_failed", getErrorMessage(error), 400);
  }
}

// ==================== SEO ====================

export async function createCategorySeo(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const body = await c.req.json();
    const data = createCategorySeoSchema.parse(body);
    const seo = await categoryService.createCategorySeo(id, data);

    return c.json({ seo }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_seo_create_failed", getErrorMessage(error), 400);
  }
}

export async function getCategorySeo(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const seo = await categoryService.getCategorySeo(id);
    if (!seo) throw new AppError("seo_not_found", "SEO no encontrado para esta categoría", 404);

    return c.json({ seo });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_seo_get_failed", getErrorMessage(error), 500);
  }
}

export async function updateCategorySeo(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const body = await c.req.json();
    const data = updateCategorySeoSchema.parse(body);
    const seo = await categoryService.updateCategorySeo(id, data);

    return c.json({ seo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_seo_update_failed", getErrorMessage(error), 400);
  }
}

export async function deleteCategorySeo(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    await categoryService.deleteCategorySeo(id);
    return c.json({ message: "SEO eliminado exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_seo_delete_failed", getErrorMessage(error), 400);
  }
}

// ==================== MERGE ====================

export async function mergeCategoriesController(c: Context) {
  try {
    const sourceId = parseId(c.req.param("id"));

    const body = await c.req.json();
    const { targetCategoryId } = mergeCategoriesSchema.parse(body);

    const result = await categoryService.mergeCategories(sourceId, targetCategoryId);

    return c.json({
      message: "Categorías unificadas exitosamente",
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_merge_failed", getErrorMessage(error), 400);
  }
}

// ==================== BÚSQUEDA AVANZADA ====================

export async function searchCategoriesController(c: Context) {
  try {
    const query = c.req.query("query");
    const contentTypeId = c.req.query("contentTypeId");
    const parentId = c.req.query("parentId");
    const limit = c.req.query("limit");
    const offset = c.req.query("offset");
    const orderBy = c.req.query("orderBy");
    const orderDirection = c.req.query("orderDirection");

    const input = searchCategoriesSchema.parse({
      query,
      contentTypeId: contentTypeId ? Number(contentTypeId) : undefined,
      parentId: parentId === "null" ? null : parentId ? Number(parentId) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      orderBy: orderBy as "name" | "order" | "createdAt" | undefined,
      orderDirection: orderDirection as "asc" | "desc" | undefined,
    });

    const result = await categoryService.searchCategoriesDb(input);

    return c.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Parámetros inválidos" });
    }
    throw error instanceof AppError ? error : new AppError("category_search_failed", getErrorMessage(error), 500);
  }
}

// ==================== CONTENIDO POR CATEGORÍA ====================

export async function getCategoryContentController(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const limit = c.req.query("limit");
    const offset = c.req.query("offset");
    const status = c.req.query("status");
    const visibility = c.req.query("visibility");

    const result = await categoryService.getCategoryContent(id, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      status,
      visibility,
    });

    return c.json(result);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_content_failed", getErrorMessage(error), 500);
  }
}

export async function getCategoryContentCountController(c: Context) {
  try {
    const id = parseId(c.req.param("id"));

    const count = await categoryService.getCategoryContentCount(id);

    return c.json({ categoryId: id, count });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("category_content_count_failed", getErrorMessage(error), 500);
  }
}

// ==================== REORDENAMIENTO ====================

export async function reorderCategoriesController(c: Context) {
  try {
    const body = await c.req.json();
    const { categories } = reorderCategoriesSchema.parse(body);

    await categoryService.reorderCategories(categories);

    return c.json({ message: "Categorías reordenadas exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("category_reorder_failed", getErrorMessage(error), 400);
  }
}
