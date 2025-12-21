import type { Context } from "hono";
import * as contentTypeService from "@/services/content/contentTypeService.ts";
import { z } from "zod";
import { getErrorMessage } from "@/utils/errors.ts";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("contentTypeController");

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
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("content_type_create_failed", getErrorMessage(error), 400);
  }
}

// Obtener todos los tipos de contenido
export async function getAllContentTypes(c: Context) {
  try {
    const contentTypes = await contentTypeService.getAllContentTypes();
    return c.json({ contentTypes });
  } catch (error) {
    log.error("Error al obtener tipos de contenido", error instanceof Error ? error : undefined);
    throw new AppError("content_type_list_failed", getErrorMessage(error), 500);
  }
}

// Obtener tipo de contenido por ID
export async function getContentTypeById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de tipo de contenido");

    const contentType = await contentTypeService.getContentTypeById(id);

    if (!contentType) {
      throw AppError.fromCatalog("not_found", { message: "Tipo de contenido no encontrado" });
    }

    return c.json({ contentType });
  } catch (error) {
    log.error("Error al obtener tipo de contenido", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("content_type_get_failed", getErrorMessage(error), 500);
  }
}

// Obtener tipo de contenido por slug
export async function getContentTypeBySlug(c: Context) {
  try {
    const slug = c.req.param("slug");
    const contentType = await contentTypeService.getContentTypeBySlug(slug);

    if (!contentType) {
      throw AppError.fromCatalog("not_found", { message: "Tipo de contenido no encontrado" });
    }

    return c.json({ contentType });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_type_get_failed", getErrorMessage(error), 500);
  }
}

// Actualizar tipo de contenido
export async function updateContentType(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de tipo de contenido");

    const body = await c.req.json();
    const data = updateContentTypeSchema.parse(body);

    const contentType = await contentTypeService.updateContentType(id, data);

    return c.json({ contentType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("content_type_update_failed", getErrorMessage(error), 400);
  }
}

// Eliminar tipo de contenido
export async function deleteContentType(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de tipo de contenido");

    await contentTypeService.deleteContentType(id);

    return c.json({ message: "Tipo de contenido eliminado exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("content_type_delete_failed", getErrorMessage(error), 400);
  }
}
