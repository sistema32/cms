import * as settingsService from "./settingsService.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { themeCacheService } from "./themeCacheService.ts";

/**
 * Theme Service - Gestión y carga de themes
 * Inspirado en WordPress y Ghost theme systems
 */

export interface ThemeConfig {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  license: string;
  screenshots?: {
    desktop?: string;
    mobile?: string;
  };
  config: {
    posts_per_page: number;
    image_sizes?: Record<string, { width: number; height?: number }>;
    custom?: Record<string, any>;
  };
  supports?: {
    comments?: boolean;
    customSettings?: boolean;
    widgets?: boolean;
    menus?: string[];
    postFormats?: string[];
    customTemplates?: boolean;
  };
  templates?: Record<string, string>;
  partials?: Record<string, string>;
}

/**
 * Template hierarchy - Orden de búsqueda de templates (WordPress-style)
 */
export const TEMPLATE_HIERARCHY = {
  // Post individual
  post: [
    "post-{slug}.tsx",
    "post-{id}.tsx",
    "post.tsx",
    "single.tsx",
    "index.tsx",
  ],
  // Página individual
  page: [
    "page-{slug}.tsx",
    "page-{id}.tsx",
    "page.tsx",
    "single.tsx",
    "index.tsx",
  ],
  // Home
  home: [
    "front-page.tsx",
    "home.tsx",
    "index.tsx",
  ],
  // Categoría
  category: [
    "category-{slug}.tsx",
    "category-{id}.tsx",
    "category.tsx",
    "archive.tsx",
    "index.tsx",
  ],
  // Tag
  tag: [
    "tag-{slug}.tsx",
    "tag-{id}.tsx",
    "tag.tsx",
    "archive.tsx",
    "index.tsx",
  ],
  // Autor
  author: [
    "author-{slug}.tsx",
    "author-{id}.tsx",
    "author.tsx",
    "archive.tsx",
    "index.tsx",
  ],
  // Búsqueda
  search: [
    "search.tsx",
    "index.tsx",
  ],
  // Error 404
  "404": [
    "404.tsx",
    "error.tsx",
    "index.tsx",
  ],
  // Error general
  error: [
    "error.tsx",
    "index.tsx",
  ],
};

/**
 * Obtiene el theme activo
 */
export async function getActiveTheme(): Promise<string> {
  return await settingsService.getSetting("active_theme", "default");
}

/**
 * Carga la configuración de un theme desde theme.json
 */
export async function loadThemeConfig(
  themeName: string,
): Promise<ThemeConfig | null> {
  // Intentar obtener desde caché
  const cached = themeCacheService.getCachedConfig(themeName);
  if (cached) {
    return cached;
  }

  try {
    const themeDir = join(Deno.cwd(), "src", "themes", themeName);
    const configPath = join(themeDir, "theme.json");

    const configText = await Deno.readTextFile(configPath);
    const config: ThemeConfig = JSON.parse(configText);

    // Cachear la configuración
    themeCacheService.cacheConfig(themeName, config);

    return config;
  } catch (error) {
    console.error(`Error loading theme config for "${themeName}":`, error);
    return null;
  }
}

/**
 * Obtiene la configuración del theme activo
 */
export async function getActiveThemeConfig(): Promise<ThemeConfig | null> {
  const activeTheme = await getActiveTheme();
  return await loadThemeConfig(activeTheme);
}

export async function getThemeCustomSettings(
  themeName: string,
): Promise<Record<string, unknown>> {
  return await settingsService.getThemeCustomSettings(themeName);
}

export async function updateThemeCustomSettings(
  themeName: string,
  values: Record<string, unknown>,
): Promise<void> {
  await settingsService.updateThemeCustomSettings(themeName, values);
}

/**
 * Lista todos los themes disponibles
 */
export async function listAvailableThemes(): Promise<string[]> {
  try {
    const themesDir = join(Deno.cwd(), "src", "themes");
    const themes: string[] = [];

    for await (const entry of Deno.readDir(themesDir)) {
      if (entry.isDirectory) {
        // Verificar que tenga theme.json
        const configPath = join(themesDir, entry.name, "theme.json");
        try {
          await Deno.stat(configPath);
          themes.push(entry.name);
        } catch {
          // No tiene theme.json, ignorar
        }
      }
    }

    return themes;
  } catch (error) {
    console.error("Error listing themes:", error);
    return [];
  }
}

/**
 * Activa un theme
 */
export async function activateTheme(themeName: string): Promise<boolean> {
  // Verificar que el theme existe
  const config = await loadThemeConfig(themeName);
  if (!config) {
    throw new Error(`Theme "${themeName}" not found or invalid`);
  }

  // Activar el theme
  await settingsService.updateSetting("active_theme", themeName);

  // Inicializar custom settings del theme si no existen
  if (config.config.custom) {
    const existingSettings = await getThemeCustomSettings(themeName);

    // Solo crear settings que no existan
    for (const [key, setting] of Object.entries(config.config.custom)) {
      if (!(key in existingSettings)) {
        const defaultValue = (setting as any).default || null;
        await settingsService.updateSetting(
          `theme.${themeName}.${key}`,
          defaultValue,
        );
      }
    }
  }

  // Invalidar caché al activar theme
  themeCacheService.invalidateAll();

  console.log(`✅ Theme "${themeName}" activated`);
  return true;
}

/**
 * Encuentra el template correcto según la jerarquía
 */
export async function findTemplate(
  type: keyof typeof TEMPLATE_HIERARCHY,
  params?: { slug?: string; id?: number },
): Promise<string | null> {
  const activeTheme = await getActiveTheme();
  const themePath = join(Deno.cwd(), "src", "themes", activeTheme, "templates");

  const hierarchy = TEMPLATE_HIERARCHY[type];

  for (let template of hierarchy) {
    // Reemplazar placeholders
    if (params?.slug) {
      template = template.replace("{slug}", params.slug);
    }
    if (params?.id) {
      template = template.replace("{id}", String(params.id));
    }

    // Verificar si el template existe
    const templatePath = join(themePath, template);
    try {
      await Deno.stat(templatePath);
      return template.replace(".tsx", ""); // Retornar sin extensión
    } catch {
      // Template no existe, continuar con el siguiente
    }
  }

  return null;
}

/**
 * Carga un template específico
 */
export async function loadTemplate(templateName: string): Promise<any> {
  const activeTheme = await getActiveTheme();
  const templatePath = join(
    Deno.cwd(),
    "src",
    "themes",
    activeTheme,
    "templates",
    `${templateName}.tsx`,
  );

  try {
    // Intentar obtener desde caché
    const cached = await themeCacheService.getCachedTemplate(templatePath);
    if (cached) {
      return cached;
    }

    // Importar el template dinámicamente
    const module = await import(`file://${templatePath}`);

    // Cachear el template
    await themeCacheService.cacheTemplate(templatePath, module);

    return module;
  } catch (error) {
    console.error(`Error loading template "${templateName}":`, error);
    return null;
  }
}

/**
 * Carga un partial
 */
export async function loadPartial(partialName: string): Promise<any> {
  const activeTheme = await getActiveTheme();
  const partialPath = join(
    Deno.cwd(),
    "src",
    "themes",
    activeTheme,
    "partials",
    `${partialName}.tsx`,
  );

  try {
    // Intentar obtener desde caché
    const cached = await themeCacheService.getCachedTemplate(partialPath);
    if (cached) {
      return cached;
    }

    // Importar el partial dinámicamente
    const module = await import(`file://${partialPath}`);

    // Cachear el partial
    await themeCacheService.cacheTemplate(partialPath, module);

    return module;
  } catch (error) {
    console.error(`Error loading partial "${partialName}":`, error);
    return null;
  }
}

/**
 * Obtiene la URL de un asset del theme
 */
export async function getAssetUrl(assetPath: string): Promise<string> {
  const activeTheme = await getActiveTheme();
  const siteUrl = await settingsService.getSetting("site_url", "");

  return `${siteUrl}/themes/${activeTheme}/assets/${assetPath}`;
}

/**
 * Verifica si un theme soporta una característica
 */
export async function themeSupports(feature: string): Promise<boolean> {
  const config = await getActiveThemeConfig();
  if (!config || !config.supports) return false;

  return (config.supports as any)[feature] === true;
}

/**
 * Obtiene estadísticas del caché de themes
 */
export function getCacheStats() {
  return themeCacheService.getStats();
}

/**
 * Invalida el caché de un theme específico
 */
export function invalidateThemeCache(themeName: string) {
  themeCacheService.invalidateThemeCache(themeName);
}

/**
 * Invalida todo el caché
 */
export function invalidateAllCache() {
  themeCacheService.invalidateAll();
}

/**
 * Pre-calienta el caché con templates comunes
 */
export async function warmupCache(themeName?: string) {
  const theme = themeName || await getActiveTheme();
  const commonTemplates = ["home", "blog", "post", "page"];
  await themeCacheService.warmup(theme, commonTemplates);
}

// Exportar el servicio de caché para uso avanzado
export { themeCacheService };
