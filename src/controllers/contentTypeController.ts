import type { Context } from "hono";
import * as contentTypeService from "../services/contentTypeService.ts";
import { z } from "zod";
import { getErrorMessage } from "../utils/errors.ts";

// Schemas de validación
const createContentTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
  hasCategories: z.boolean().optional(),
  hasTags: z.boolean().optional(),
  hasComments: z.boolean().optional(),
});

const updateContentTypeSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
  hasCategories: z.boolean().optional(),
  hasTags: z.boolean().optional(),
  hasComments: z.boolean().optional(),
});

// Crear tipo de contenido
export async function createContentType(c: Context) {
  try {
    const body = await c.req.json();
    const data = createContentTypeSchema.parse(body);

    const contentType = await contentTypeService.createContentType(data);

    return c.json({ contentType }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Obtener todos los tipos de contenido
export async function getAllContentTypes(c: Context) {
  try {
    const contentTypes = await contentTypeService.getAllContentTypes();
    return c.json({ contentTypes });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

// Obtener tipo de contenido por ID
export async function getContentTypeById(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const contentType = await contentTypeService.getContentTypeById(id);

    if (!contentType) {
      return c.json({ error: "Tipo de contenido no encontrado" }, 404);
    }

    return c.json({ contentType });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

// Obtener tipo de contenido por slug
export async function getContentTypeBySlug(c: Context) {
  try {
    const slug = c.req.param("slug");
    const contentType = await contentTypeService.getContentTypeBySlug(slug);

    if (!contentType) {
      return c.json({ error: "Tipo de contenido no encontrado" }, 404);
    }

    return c.json({ contentType });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
}

// Actualizar tipo de contenido
export async function updateContentType(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const body = await c.req.json();
    const data = updateContentTypeSchema.parse(body);

    const contentType = await contentTypeService.updateContentType(id, data);

    return c.json({ contentType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Datos inválidos", details: error.errors }, 400);
    }
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}

// Eliminar tipo de contenido
export async function deleteContentType(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    await contentTypeService.deleteContentType(id);

    return c.json({ message: "Tipo de contenido eliminado exitosamente" });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }
}
