import { Hono } from "hono";
import { z } from "npm:zod";
import * as settingsService from "../services/settingsService.ts";

const settingsRouter = new Hono();

// ============= SCHEMAS DE VALIDACIÓN =============

const createSettingSchema = z.object({
  key: z.string().min(1, "La key es requerida"),
  value: z.any(),
  autoload: z.boolean().optional().default(true),
});

const updateSettingSchema = z.object({
  value: z.any(),
  autoload: z.boolean().optional(),
});

const bulkUpdateSchema = z.record(z.string(), z.any());

// ============= ENDPOINTS =============

/**
 * GET /api/settings
 * Obtener todos los settings (admin only)
 */
settingsRouter.get("/", async (c) => {
  try {
    const allSettings = await settingsService.getAllSettings();

    return c.json({
      success: true,
      settings: allSettings,
      count: allSettings.length,
    });
  } catch (error: any) {
    console.error("Error fetching all settings:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener settings",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/settings/category/:category
 * Obtener settings por categoría
 */
settingsRouter.get("/category/:category", async (c) => {
  try {
    const { category } = c.req.param();

    const validCategories = [
      "general",
      "reading",
      "writing",
      "discussion",
      "media",
      "permalinks",
      "privacy",
      "seo",
      "captcha",
      "theme",
      "advanced",
    ];

    if (!validCategories.includes(category)) {
      return c.json(
        {
          success: false,
          error: "Categoría inválida",
          validCategories,
        },
        400
      );
    }

    const categorySettings = await settingsService.getSettingsByCategory(
      category
    );

    return c.json({
      success: true,
      category,
      settings: categorySettings,
    });
  } catch (error: any) {
    console.error("Error fetching category settings:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener settings de categoría",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/settings/:key
 * Obtener un setting específico
 */
settingsRouter.get("/:key", async (c) => {
  try {
    const { key } = c.req.param();

    const value = await settingsService.getSetting(key);

    if (value === null || value === undefined) {
      return c.json(
        {
          success: false,
          error: "Setting no encontrado",
          key,
        },
        404
      );
    }

    return c.json({
      success: true,
      key,
      value,
    });
  } catch (error: any) {
    console.error("Error fetching setting:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener setting",
        details: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/settings
 * Crear un nuevo setting
 */
settingsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validation = createSettingSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400
      );
    }

    const { key, value, autoload } = validation.data;

    const newSetting = await settingsService.createSetting(
      key,
      value,
      autoload
    );

    return c.json(
      {
        success: true,
        message: "Setting creado exitosamente",
        setting: newSetting,
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating setting:", error);

    // Manejar error de duplicado
    if (error.message?.includes("UNIQUE constraint failed")) {
      return c.json(
        {
          success: false,
          error: "Ya existe un setting con esa key",
        },
        409
      );
    }

    return c.json(
      {
        success: false,
        error: "Error al crear setting",
        details: error.message,
      },
      500
    );
  }
});

/**
 * PUT /api/settings/:key
 * Actualizar un setting existente
 */
settingsRouter.put("/:key", async (c) => {
  try {
    const { key } = c.req.param();
    const body = await c.req.json();
    const validation = updateSettingSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400
      );
    }

    const { value, autoload } = validation.data;

    await settingsService.updateSetting(
      key,
      value,
      autoload !== undefined ? autoload : true
    );

    return c.json({
      success: true,
      message: "Setting actualizado exitosamente",
      key,
      value,
    });
  } catch (error: any) {
    console.error("Error updating setting:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar setting",
        details: error.message,
      },
      500
    );
  }
});

/**
 * PUT /api/settings/bulk
 * Actualizar múltiples settings a la vez
 */
settingsRouter.put("/bulk/update", async (c) => {
  try {
    const body = await c.req.json();
    const validation = bulkUpdateSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400
      );
    }

    await settingsService.updateSettings(validation.data);

    return c.json({
      success: true,
      message: "Settings actualizados exitosamente",
      count: Object.keys(validation.data).length,
    });
  } catch (error: any) {
    console.error("Error bulk updating settings:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar settings",
        details: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/settings/:key
 * Eliminar un setting
 */
settingsRouter.delete("/:key", async (c) => {
  try {
    const { key } = c.req.param();

    await settingsService.deleteSetting(key);

    return c.json({
      success: true,
      message: "Setting eliminado exitosamente",
      key,
    });
  } catch (error: any) {
    console.error("Error deleting setting:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar setting",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/settings/cache/stats
 * Obtener estadísticas del cache (debugging)
 */
settingsRouter.get("/cache/stats", (c) => {
  const stats = settingsService.getCacheStats();

  return c.json({
    success: true,
    cache: stats,
  });
});

/**
 * POST /api/settings/cache/refresh
 * Refrescar cache de settings
 */
settingsRouter.post("/cache/refresh", async (c) => {
  try {
    await settingsService.refreshSettingsCache();

    return c.json({
      success: true,
      message: "Cache refrescado exitosamente",
    });
  } catch (error: any) {
    console.error("Error refreshing cache:", error);
    return c.json(
      {
        success: false,
        error: "Error al refrescar cache",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/settings/theme/:themeName
 * Obtener custom settings de un theme
 */
settingsRouter.get("/theme/:themeName", async (c) => {
  try {
    const { themeName } = c.req.param();

    const customSettings = await settingsService.getThemeCustomSettings(
      themeName
    );

    return c.json({
      success: true,
      themeName,
      customSettings,
    });
  } catch (error: any) {
    console.error("Error fetching theme settings:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener configuración del theme",
        details: error.message,
      },
      500
    );
  }
});

/**
 * PUT /api/settings/theme/:themeName
 * Actualizar custom settings de un theme
 */
settingsRouter.put("/theme/:themeName", async (c) => {
  try {
    const { themeName } = c.req.param();
    const body = await c.req.json();
    const validation = bulkUpdateSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400
      );
    }

    await settingsService.updateThemeCustomSettings(
      themeName,
      validation.data
    );

    return c.json({
      success: true,
      message: "Configuración del theme actualizada exitosamente",
      themeName,
    });
  } catch (error: any) {
    console.error("Error updating theme settings:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar configuración del theme",
        details: error.message,
      },
      500
    );
  }
});

export default settingsRouter;
