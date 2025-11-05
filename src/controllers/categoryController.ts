import type { Context } from "hono";
import * as categoryService from "../services/categoryService.ts";
import { z } from "zod";
import { getErrorMessage } from "../utils/errors.ts";

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
  canonicalUrl: z.string().url().optional(),
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

export async function createCategory(c: Context) {
  try {
    const body = await c.req.json();
    const data = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(data);
    return c.json({ category }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
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
    return c.json({ error: getErrorMessage(error) }, 500);
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
    return c.json({ error: getErrorMessage(error) }, 500);
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
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getCategoryById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const category = await categoryService.getCategoryById(id);
    if (!category) return c.json({ error: "Categoría no encontrada" }, 404);

    return c.json({ category });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function updateCategory(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const body = await c.req.json();
    const data = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, data);

    return c.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function deleteCategory(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    await categoryService.deleteCategory(id);
    return c.json({ message: "Categoría eliminada exitosamente (soft delete)" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// ==================== SOFT DELETE ====================

export async function restoreCategory(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const category = await categoryService.restoreCategory(id);
    return c.json({ category, message: "Categoría restaurada exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function forceDeleteCategory(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    await categoryService.forceDeleteCategory(id);
    return c.json({ message: "Categoría eliminada permanentemente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// ==================== SEO ====================

export async function createCategorySeo(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const body = await c.req.json();
    const data = createCategorySeoSchema.parse(body);
    const seo = await categoryService.createCategorySeo(id, data);

    return c.json({ seo }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function getCategorySeo(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const seo = await categoryService.getCategorySeo(id);
    if (!seo) return c.json({ error: "SEO no encontrado para esta categoría" }, 404);

    return c.json({ seo });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function updateCategorySeo(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const body = await c.req.json();
    const data = updateCategorySeoSchema.parse(body);
    const seo = await categoryService.updateCategorySeo(id, data);

    return c.json({ seo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function deleteCategorySeo(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    await categoryService.deleteCategorySeo(id);
    return c.json({ message: "SEO eliminado exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// ==================== MERGE ====================

export async function mergeCategoriesController(c: Context) {
  try {
    const sourceId = Number(c.req.param("id"));
    if (isNaN(sourceId)) return c.json({ error: "ID inválido" }, 400);

    const body = await c.req.json();
    const { targetCategoryId } = mergeCategoriesSchema.parse(body);

    const result = await categoryService.mergeCategories(sourceId, targetCategoryId);

    return c.json({
      message: "Categorías unificadas exitosamente",
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
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

    const result = await categoryService.searchCategories(input);

    return c.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Parámetros inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

// ==================== CONTENIDO POR CATEGORÍA ====================

export async function getCategoryContentController(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

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
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getCategoryContentCountController(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const count = await categoryService.getCategoryContentCount(id);

    return c.json({ categoryId: id, count });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
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
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}
