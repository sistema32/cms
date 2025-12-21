import type { Context } from "hono";
import * as tagService from "@/services/content/tagService.ts";
import { z } from "zod";
import { escapeHTML } from "@/utils/sanitization.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { AppError } from "@/platform/errors.ts";
import { safeSearchSchema } from "@/utils/validation.ts";

const createTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateTagSchema = createTagSchema.partial();

export async function createTag(c: Context) {
  try {
    const body = await c.req.json();
    const data = createTagSchema.parse(body);

    // Sanitizar para prevenir XSS
    const sanitizedData = {
      ...data,
      name: escapeHTML(data.name),
      description: data.description ? escapeHTML(data.description) : undefined,
    };

    const tag = await tagService.createTag(sanitizedData);
    return c.json({ tag }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("tag_create_failed", getErrorMessage(error), 400);
  }
}

export async function getAllTags(c: Context) {
  try {
    const tags = await tagService.getAllTags();
    return c.json({ tags });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("tag_list_failed", getErrorMessage(error), 500);
  }
}

export async function searchTags(c: Context) {
  try {
    const query = c.req.query("q") || "";
    const parsed = safeSearchSchema.safeParse(query);
    if (!parsed.success) {
      // Devolver respuesta segura pero vacía para evitar 500 y dejar trazabilidad
      return new Response(JSON.stringify({ tags: [], success: false, error: "query_blocked" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const tags = await tagService.searchTagsDb(parsed.data);
    return c.json({ tags });
  } catch (error) {
    console.error("tag_search_failed:", error);
    return c.json({ tags: [], success: false, error: "tag_search_failed" }, 200);
  }
}

export async function getTagById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
  if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    const tag = await tagService.getTagById(id);
    if (!tag) throw AppError.fromCatalog("tag_not_found");

    return c.json({ tag });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("tag_get_failed", getErrorMessage(error), 500);
  }
}

export async function getTagContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
  if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    const result = await tagService.getTagContent(id);
    return c.json(result);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("tag_content_failed", getErrorMessage(error), 400);
  }
}

export async function updateTag(c: Context) {
  try {
    const id = Number(c.req.param("id"));
  if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    const body = await c.req.json();
    const data = updateTagSchema.parse(body);

    // Sanitizar para prevenir XSS
    const sanitizedData = {
      ...data,
      name: data.name ? escapeHTML(data.name) : undefined,
      description: data.description ? escapeHTML(data.description) : undefined,
    };

    const tag = await tagService.updateTag(id, sanitizedData);

    return c.json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("tag_update_failed", getErrorMessage(error), 400);
  }
}

export async function deleteTag(c: Context) {
  try {
    const id = Number(c.req.param("id"));
  if (isNaN(id)) throw AppError.fromCatalog("invalid_id");

    await tagService.deleteTag(id);
    return c.json({ message: "Tag eliminado exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("tag_delete_failed", getErrorMessage(error), 400);
  }
}
