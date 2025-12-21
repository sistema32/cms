import { Context } from "hono";
import { z } from "zod";
import * as contentFilterService from "@/services/content/contentFilterService.ts";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";

/**
 * Esquemas de validación Zod
 */
const createFilterSchema = z.object({
  type: z.enum(["word", "email", "link", "phone"]),
  pattern: z.string().min(1, "El patrón no puede estar vacío"),
  isRegex: z.boolean().default(false),
  replacement: z.string().min(1, "El texto de reemplazo no puede estar vacío"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateFilterSchema = z.object({
  type: z.enum(["word", "email", "link", "phone"]).optional(),
  pattern: z.string().min(1).optional(),
  isRegex: z.boolean().optional(),
  replacement: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const toggleFilterSchema = z.object({
  isActive: z.boolean(),
});

const testFilterSchema = z.object({
  pattern: z.string().min(1),
  isRegex: z.boolean().default(false),
  replacement: z.string().default("[FILTRADO]"),
  text: z.string().min(1, "Debes proporcionar texto para probar"),
});

/**
 * POST /api/content-filters
 * Crear nuevo filtro (admin)
 */
export async function create(c: Context) {
  try {
    const body = await c.req.json();
    const data = createFilterSchema.parse(body);

    const user = c.get("user");
    if (!user) {
      throw AppError.fromCatalog("unauthorized");
    }

    const filter = await contentFilterService.createFilter({
      ...data,
      createdBy: user.userId,
    });

    return c.json(
      {
        success: true,
        data: filter,
        message: "Filtro creado exitosamente",
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("filter_create_failed", getErrorMessage(error), 400);
  }
}

/**
 * GET /api/content-filters
 * Listar filtros con opciones de filtrado (admin)
 */
export async function list(c: Context) {
  try {
    const query = c.req.query();

    const options: any = {};

    // Filtrar por tipo
    if (query.type) {
      if (!["word", "email", "link", "phone"].includes(query.type)) {
        throw new AppError("invalid_filter_type", "Tipo de filtro inválido", 400);
      }
      options.type = query.type;
    }

    // Filtrar por estado activo/inactivo
    if (query.isActive !== undefined) {
      options.isActive = query.isActive === "true";
    }

    // Paginación
    if (query.limit) {
      const limit = Number(query.limit);
      if (Number.isNaN(limit)) {
        throw new AppError("invalid_limit", "Límite inválido", 400);
      }
      options.limit = limit;
    }
    if (query.offset) {
      const offset = Number(query.offset);
      if (Number.isNaN(offset)) {
        throw new AppError("invalid_offset", "Offset inválido", 400);
      }
      options.offset = offset;
    }

    const filters = await contentFilterService.getFilters(options);

    return c.json({
      success: true,
      data: filters,
      meta: {
        count: filters.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("filter_list_failed", getErrorMessage(error), 400);
  }
}

/**
 * GET /api/content-filters/:id
 * Obtener un filtro por ID (admin)
 */
export async function getById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de filtro");

    const filter = await contentFilterService.getFilterById(id);

    if (!filter) {
      throw AppError.fromCatalog("not_found", { message: "Filtro no encontrado" });
    }

    return c.json({
      success: true,
      data: filter,
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("filter_get_failed", getErrorMessage(error), 400);
  }
}

/**
 * PATCH /api/content-filters/:id
 * Actualizar filtro (admin)
 */
export async function update(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de filtro");

    const body = await c.req.json();
    const data = updateFilterSchema.parse(body);

    const filter = await contentFilterService.updateFilter(id, data);

    return c.json({
      success: true,
      data: filter,
      message: "Filtro actualizado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("filter_update_failed", getErrorMessage(error), 400);
  }
}

/**
 * DELETE /api/content-filters/:id
 * Eliminar filtro (admin)
 */
export async function deleteFilter(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de filtro");

    await contentFilterService.deleteFilter(id);

    return c.json({
      success: true,
      message: "Filtro eliminado exitosamente",
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("filter_delete_failed", getErrorMessage(error), 400);
  }
}

/**
 * PATCH /api/content-filters/:id/toggle
 * Activar/desactivar filtro (admin)
 */
export async function toggle(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de filtro");

    const body = await c.req.json();
    const data = toggleFilterSchema.parse(body);

    const filter = await contentFilterService.toggleFilter(id, data.isActive);

    return c.json({
      success: true,
      data: filter,
      message: `Filtro ${data.isActive ? "activado" : "desactivado"} exitosamente`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("filter_toggle_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/content-filters/test
 * Probar filtro sin guardarlo (admin)
 */
export async function test(c: Context) {
  try {
    const body = await c.req.json();
    const data = testFilterSchema.parse(body);

    const result = contentFilterService.testFilter(
      data.pattern,
      data.text,
      data.isRegex,
      data.replacement,
    );

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("filter_test_failed", getErrorMessage(error), 400);
  }
}

/**
 * GET /api/content-filters/stats
 * Obtener estadísticas de filtros (admin)
 */
export async function getStats(c: Context) {
  try {
    const stats = await contentFilterService.getFilterStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("filter_stats_failed", getErrorMessage(error), 400);
  }
}
