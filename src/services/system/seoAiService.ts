/**
 * ============================================
 * SEO AI SERVICE
 * ============================================
 * Servicio para generar sugerencias de metadatos SEO usando AI
 * Soporta Ollama (AI real) y modo simulación (mock)
 */

import { ollamaClient, isOllamaEnabled } from "@/lib/ollamaClient.ts";
import {
  buildContentSeoPrompt,
  buildCategorySeoPrompt,
  buildMediaAltPrompt,
  buildSchemaJsonPrompt,
  buildRegenerateSingleFieldPrompt,
  SYSTEM_PROMPT,
} from "@/utils/seo/prompts.ts";
import {
  parseAiJsonResponse,
  formatSeoObject,
  generateFallbackSeo,
  generateFallbackAlt,
} from "@/utils/seo/formatters.ts";
import { validateContentSeo, validateAltText } from "@/utils/seo/validators.ts";

// Importar mocks
import {
  generateContentSeoMock,
  generateCategorySeoMock,
  generateMediaAltMock,
  generateSchemaJsonMock,
  regenerateSingleFieldMock,
} from "./seoAiService.mock.ts";

/**
 * Interfaz para sugerencias de SEO de contenido
 */
export interface ContentSeoSuggestions {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  focusKeyword: string;
}

/**
 * Interfaz para sugerencias de SEO de categoría
 */
export interface CategorySeoSuggestions {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  focusKeyword: string;
}

/**
 * Interfaz para respuesta de sugerencias (con validación)
 */
export interface SeoSuggestionsResponse<T> {
  preview: true;
  suggestions: T;
  validation: ReturnType<typeof validateContentSeo>;
  source: "ai" | "mock" | "fallback";
}

/**
 * Genera sugerencias de SEO para contenido (posts/páginas)
 */
export async function generateContentSeoSuggestions(
  content: {
    title: string;
    excerpt?: string;
    body?: string;
    categories?: string[];
    contentType?: string;
  },
): Promise<SeoSuggestionsResponse<ContentSeoSuggestions>> {
  let suggestions: ContentSeoSuggestions;
  let source: "ai" | "mock" | "fallback";

  // Verificar si Ollama está habilitado
  if (!isOllamaEnabled()) {
    console.log("[SEO AI] Usando modo simulación (Ollama deshabilitado)");
    suggestions = await generateContentSeoMock(content);
    source = "mock";
  } else {
    try {
      // Verificar si Ollama está disponible
      const isHealthy = await ollamaClient.isHealthy();
      if (!isHealthy) {
        throw new Error("Ollama no disponible");
      }

      console.log("[SEO AI] Generando con Ollama...");

      const prompt = buildContentSeoPrompt(content);
      const response = await ollamaClient.generate({
        prompt,
        system: SYSTEM_PROMPT,
        temperature: 0.7,
        format: "json",
      });

      // Parsear respuesta JSON
      const parsed = parseAiJsonResponse<ContentSeoSuggestions>(response);
      if (!parsed) {
        throw new Error("No se pudo parsear la respuesta de AI");
      }

      // Formatear y truncar campos
      suggestions = formatSeoObject(parsed) as ContentSeoSuggestions;
      source = "ai";

      console.log("[SEO AI] Generación exitosa con Ollama");
    } catch (error) {
      console.error("[SEO AI] Error usando Ollama:", error);
      console.log("[SEO AI] Usando fallback básico");

      // Fallback básico
      const fallback = generateFallbackSeo(content);
      suggestions = {
        ...fallback,
        ogTitle: fallback.metaTitle,
        ogDescription: fallback.metaDescription,
        twitterTitle: fallback.metaTitle,
        twitterDescription: fallback.metaDescription,
      };
      source = "fallback";
    }
  }

  // Validar sugerencias
  const validation = validateContentSeo(suggestions);

  return {
    preview: true,
    suggestions,
    validation,
    source,
  };
}

/**
 * Genera sugerencias de SEO para categoría
 */
export async function generateCategorySeoSuggestions(
  category: {
    name: string;
    description?: string;
    contentCount?: number;
    contentType?: string;
  },
): Promise<SeoSuggestionsResponse<CategorySeoSuggestions>> {
  let suggestions: CategorySeoSuggestions;
  let source: "ai" | "mock" | "fallback";

  if (!isOllamaEnabled()) {
    console.log("[SEO AI] Usando modo simulación para categoría");
    suggestions = await generateCategorySeoMock(category);
    source = "mock";
  } else {
    try {
      const isHealthy = await ollamaClient.isHealthy();
      if (!isHealthy) {
        throw new Error("Ollama no disponible");
      }

      const prompt = buildCategorySeoPrompt(category);
      const response = await ollamaClient.generate({
        prompt,
        system: SYSTEM_PROMPT,
        temperature: 0.7,
        format: "json",
      });

      const parsed = parseAiJsonResponse<CategorySeoSuggestions>(response);
      if (!parsed) {
        throw new Error("No se pudo parsear la respuesta de AI");
      }

      suggestions = formatSeoObject(parsed) as CategorySeoSuggestions;
      source = "ai";
    } catch (error) {
      console.error("[SEO AI] Error usando Ollama:", error);

      // Fallback
      const fallback = generateFallbackSeo({
        title: category.name,
        excerpt: category.description,
      });
      suggestions = {
        ...fallback,
        ogTitle: fallback.metaTitle,
        ogDescription: fallback.metaDescription,
        twitterTitle: fallback.metaTitle,
        twitterDescription: fallback.metaDescription,
      };
      source = "fallback";
    }
  }

  const validation = validateContentSeo(suggestions);

  return {
    preview: true,
    suggestions,
    validation,
    source,
  };
}

/**
 * Genera sugerencia de ALT text para media
 */
export async function generateMediaAltSuggestion(
  media: {
    originalFilename: string;
    title?: string;
    caption?: string;
    description?: string;
    context?: string;
  },
): Promise<{
  preview: true;
  altSuggestion: string;
  validation: ReturnType<typeof validateAltText>;
  source: "ai" | "mock" | "fallback";
}> {
  let altSuggestion: string;
  let source: "ai" | "mock" | "fallback";

  if (!isOllamaEnabled()) {
    console.log("[SEO AI] Usando modo simulación para ALT text");
    altSuggestion = await generateMediaAltMock(media);
    source = "mock";
  } else {
    try {
      const isHealthy = await ollamaClient.isHealthy();
      if (!isHealthy) {
        throw new Error("Ollama no disponible");
      }

      const prompt = buildMediaAltPrompt(media);
      const response = await ollamaClient.generate({
        prompt,
        system: SYSTEM_PROMPT,
        temperature: 0.7,
      });

      altSuggestion = response.trim().substring(0, 125);
      source = "ai";
    } catch (error) {
      console.error("[SEO AI] Error usando Ollama:", error);

      // Fallback
      altSuggestion = generateFallbackAlt(media);
      source = "fallback";
    }
  }

  const validation = validateAltText(altSuggestion);

  return {
    preview: true,
    altSuggestion,
    validation,
    source,
  };
}

/**
 * Genera sugerencia de schema JSON-LD
 */
export async function generateSchemaJsonSuggestion(
  content: {
    type: "Article" | "BlogPosting" | "WebPage" | "NewsArticle";
    title: string;
    description: string;
    author: string;
    publishedDate?: Date;
    modifiedDate?: Date;
    imageUrl?: string;
    url?: string;
    siteName?: string;
  },
): Promise<{
  preview: true;
  schemaJson: string;
  source: "ai" | "mock" | "fallback";
}> {
  let schemaJson: string;
  let source: "ai" | "mock" | "fallback";

  if (!isOllamaEnabled()) {
    console.log("[SEO AI] Usando modo simulación para schema JSON");
    schemaJson = await generateSchemaJsonMock(content);
    source = "mock";
  } else {
    try {
      const isHealthy = await ollamaClient.isHealthy();
      if (!isHealthy) {
        throw new Error("Ollama no disponible");
      }

      const prompt = buildSchemaJsonPrompt(content);
      const response = await ollamaClient.generate({
        prompt,
        system: SYSTEM_PROMPT,
        temperature: 0.3, // Menos creatividad para JSON estructurado
        format: "json",
      });

      // Extraer y validar JSON
      const parsed = parseAiJsonResponse(response);
      if (!parsed) {
        throw new Error("No se pudo parsear schema JSON");
      }

      schemaJson = JSON.stringify(parsed, null, 2);
      source = "ai";
    } catch (error) {
      console.error("[SEO AI] Error usando Ollama:", error);

      // Fallback básico
      schemaJson = await generateSchemaJsonMock(content);
      source = "fallback";
    }
  }

  return {
    preview: true,
    schemaJson,
    source,
  };
}

/**
 * Regenera un campo específico con variación
 */
export async function regenerateSingleField(
  field: string,
  originalValue: string,
  context: string,
): Promise<{
  newValue: string;
  source: "ai" | "mock";
}> {
  let newValue: string;
  let source: "ai" | "mock";

  if (!isOllamaEnabled()) {
    newValue = await regenerateSingleFieldMock(field, originalValue, context);
    source = "mock";
  } else {
    try {
      const isHealthy = await ollamaClient.isHealthy();
      if (!isHealthy) {
        throw new Error("Ollama no disponible");
      }

      const prompt = buildRegenerateSingleFieldPrompt(
        field,
        originalValue,
        context,
      );
      const response = await ollamaClient.generate({
        prompt,
        system: SYSTEM_PROMPT,
        temperature: 0.8, // Más creatividad para generar variaciones
      });

      newValue = response.trim();
      source = "ai";
    } catch (error) {
      console.error("[SEO AI] Error regenerando campo:", error);
      newValue = await regenerateSingleFieldMock(field, originalValue, context);
      source = "mock";
    }
  }

  return { newValue, source };
}

/**
 * Verifica el estado del servicio de AI
 */
export async function checkAiServiceHealth(): Promise<{
  enabled: boolean;
  available: boolean;
  model?: string;
  mode: "ai" | "mock";
}> {
  const enabled = isOllamaEnabled();

  if (!enabled) {
    return {
      enabled: false,
      available: false,
      mode: "mock",
    };
  }

  try {
    const isHealthy = await ollamaClient.isHealthy();
    const modelInfo = await ollamaClient.getModelInfo();

    return {
      enabled: true,
      available: isHealthy,
      model: modelInfo?.name,
      mode: isHealthy ? "ai" : "mock",
    };
  } catch {
    return {
      enabled: true,
      available: false,
      mode: "mock",
    };
  }
}
