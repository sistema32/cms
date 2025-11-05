import { Hono } from "hono";
import { z } from "zod";
import {
  generateContentSeoSuggestions,
  generateCategorySeoSuggestions,
  generateMediaAltSuggestion,
  generateSchemaJsonSuggestion,
  regenerateSingleField,
  checkAiServiceHealth,
} from "../services/seoAiService.ts";

/**
 * ============================================
 * SEO AI ROUTES
 * ============================================
 * Endpoints para generar sugerencias de SEO con AI
 * Todas las respuestas son PREVIEW (no se guardan en BD)
 */

const seoRouter = new Hono();

// ========== SCHEMAS DE VALIDACIÓN ==========

const contentSeoSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  categories: z.array(z.string()).optional(),
  contentType: z.string().optional(),
});

const categorySeoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().optional(),
  contentCount: z.number().int().min(0).optional(),
  contentType: z.string().optional(),
});

const mediaAltSchema = z.object({
  originalFilename: z.string().min(1, "El filename es requerido"),
  title: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  context: z.string().optional(),
});

const schemaJsonSchema = z.object({
  type: z.enum(["Article", "BlogPosting", "WebPage", "NewsArticle"]),
  title: z.string().min(1),
  description: z.string().min(1),
  author: z.string().min(1),
  publishedDate: z.string().datetime().optional(),
  modifiedDate: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  siteName: z.string().optional(),
});

const regenerateFieldSchema = z.object({
  field: z.enum([
    "metaTitle",
    "metaDescription",
    "ogTitle",
    "ogDescription",
    "twitterTitle",
    "twitterDescription",
    "focusKeyword",
  ]),
  originalValue: z.string().min(1),
  context: z.string().min(1),
});

// ========== ENDPOINTS ==========

/**
 * POST /api/seo/suggest/content
 * Genera sugerencias de SEO para contenido (posts/páginas)
 */
seoRouter.post("/suggest/content", async (c) => {
  try {
    const body = await c.req.json();

    const validation = contentSeoSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400,
      );
    }

    const result = await generateContentSeoSuggestions(validation.data);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[SEO API] Error en suggest/content:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error generando sugerencias SEO",
      },
      500,
    );
  }
});

/**
 * POST /api/seo/suggest/category
 * Genera sugerencias de SEO para categoría
 */
seoRouter.post("/suggest/category", async (c) => {
  try {
    const body = await c.req.json();

    const validation = categorySeoSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400,
      );
    }

    const result = await generateCategorySeoSuggestions(validation.data);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[SEO API] Error en suggest/category:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error generando sugerencias SEO",
      },
      500,
    );
  }
});

/**
 * POST /api/seo/suggest/media-alt
 * Genera sugerencia de ALT text para media
 */
seoRouter.post("/suggest/media-alt", async (c) => {
  try {
    const body = await c.req.json();

    const validation = mediaAltSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400,
      );
    }

    const result = await generateMediaAltSuggestion(validation.data);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[SEO API] Error en suggest/media-alt:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error generando ALT text",
      },
      500,
    );
  }
});

/**
 * POST /api/seo/suggest/schema
 * Genera schema JSON-LD
 */
seoRouter.post("/suggest/schema", async (c) => {
  try {
    const body = await c.req.json();

    const validation = schemaJsonSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400,
      );
    }

    // Convertir strings de fecha a Date
    const data = {
      ...validation.data,
      publishedDate: validation.data.publishedDate
        ? new Date(validation.data.publishedDate)
        : undefined,
      modifiedDate: validation.data.modifiedDate
        ? new Date(validation.data.modifiedDate)
        : undefined,
    };

    const result = await generateSchemaJsonSuggestion(data);

    return c.json({
      success: true,
      ...result,
      // También retornar parseado para facilidad de uso
      schemaParsed: JSON.parse(result.schemaJson),
    });
  } catch (error) {
    console.error("[SEO API] Error en suggest/schema:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error generando schema JSON",
      },
      500,
    );
  }
});

/**
 * POST /api/seo/regenerate-field
 * Regenera un campo específico con variación
 */
seoRouter.post("/regenerate-field", async (c) => {
  try {
    const body = await c.req.json();

    const validation = regenerateFieldSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        400,
      );
    }

    const result = await regenerateSingleField(
      validation.data.field,
      validation.data.originalValue,
      validation.data.context,
    );

    return c.json({
      success: true,
      field: validation.data.field,
      originalValue: validation.data.originalValue,
      ...result,
    });
  } catch (error) {
    console.error("[SEO API] Error en regenerate-field:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error regenerando campo",
      },
      500,
    );
  }
});

/**
 * GET /api/seo/health
 * Verifica el estado del servicio de AI
 */
seoRouter.get("/health", async (c) => {
  try {
    const health = await checkAiServiceHealth();

    return c.json({
      success: true,
      ...health,
      message: health.mode === "mock"
        ? "Modo simulación activo (sin AI real)"
        : `AI disponible: ${health.model}`,
    });
  } catch (error) {
    console.error("[SEO API] Error en health check:", error);
    return c.json(
      {
        success: false,
        enabled: false,
        available: false,
        mode: "mock",
        message: "Error verificando estado de AI",
      },
      500,
    );
  }
});

/**
 * GET /api/seo/info
 * Información sobre el servicio de SEO AI
 */
seoRouter.get("/info", (c) => {
  return c.json({
    success: true,
    service: "SEO AI Service",
    version: "1.0.0",
    endpoints: {
      "POST /api/seo/suggest/content": "Generar SEO para posts/páginas",
      "POST /api/seo/suggest/category": "Generar SEO para categorías",
      "POST /api/seo/suggest/media-alt": "Generar ALT text para imágenes",
      "POST /api/seo/suggest/schema": "Generar schema JSON-LD",
      "POST /api/seo/regenerate-field": "Regenerar un campo específico",
      "GET /api/seo/health": "Estado del servicio AI",
      "GET /api/seo/info": "Información del servicio",
    },
    modes: {
      ai: "Ollama con modelos LLM (requiere instalación)",
      mock: "Simulación para testing/desarrollo sin AI",
    },
    note: "Todas las respuestas son PREVIEW. El usuario debe revisar y aprobar antes de guardar.",
  });
});

export default seoRouter;
