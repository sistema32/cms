import type { Context } from "hono";
import * as tagService from "../services/tagService.ts";
import { z } from "zod";
import { escapeHTML } from "../utils/sanitization.ts";
import { getErrorMessage } from "../utils/errors.ts";

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
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function getAllTags(c: Context) {
  try {
    const tags = await tagService.getAllTags();
    return c.json({ tags });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function searchTags(c: Context) {
  try {
    const query = c.req.query("q") || "";
    const tags = await tagService.searchTags(query);
    return c.json({ tags });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getTagById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const tag = await tagService.getTagById(id);
    if (!tag) return c.json({ error: "Tag no encontrado" }, 404);

    return c.json({ tag });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

export async function getTagContent(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    const result = await tagService.getTagContent(id);
    return c.json(result);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function updateTag(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

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
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

export async function deleteTag(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID inválido" }, 400);

    await tagService.deleteTag(id);
    return c.json({ message: "Tag eliminado exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}
