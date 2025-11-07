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
  parent?: string; // Parent theme name for child themes
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

/**
 * Child Themes Support
 */

/**
 * Verifica si un theme es un child theme
 */
export async function isChildTheme(themeName: string): Promise<boolean> {
  const config = await loadThemeConfig(themeName);
  return config?.parent !== undefined;
}

/**
 * Obtiene el parent theme de un child theme
 */
export async function getParentTheme(themeName: string): Promise<string | null> {
  const config = await loadThemeConfig(themeName);
  return config?.parent || null;
}

/**
 * Obtiene la cadena de herencia del theme (child -> parent -> ... -> base)
 */
export async function getThemeHierarchy(themeName: string): Promise<string[]> {
  const hierarchy: string[] = [themeName];
  let currentTheme = themeName;

  // Prevenir ciclos infinitos (max 5 niveles)
  let depth = 0;
  const maxDepth = 5;

  while (depth < maxDepth) {
    const parent = await getParentTheme(currentTheme);
    if (!parent) break;

    // Detectar ciclo
    if (hierarchy.includes(parent)) {
      console.error(`Circular parent reference detected: ${parent}`);
      break;
    }

    hierarchy.push(parent);
    currentTheme = parent;
    depth++;
  }

  return hierarchy;
}

/**
 * Carga un template con fallback a parent themes
 */
export async function loadTemplateWithFallback(templateName: string): Promise<any> {
  const activeTheme = await getActiveTheme();
  const hierarchy = await getThemeHierarchy(activeTheme);

  for (const theme of hierarchy) {
    const templatePath = join(
      Deno.cwd(),
      "src",
      "themes",
      theme,
      "templates",
      `${templateName}.tsx`,
    );

    try {
      // Intentar obtener desde caché
      const cached = await themeCacheService.getCachedTemplate(templatePath);
      if (cached) {
        return cached;
      }

      // Importar el template
      const module = await import(`file://${templatePath}`);

      // Cachear
      await themeCacheService.cacheTemplate(templatePath, module);

      return module;
    } catch {
      // Continuar con el siguiente en la jerarquía
      continue;
    }
  }

  console.error(`Template "${templateName}" not found in theme hierarchy`);
  return null;
}

/**
 * Carga un partial con fallback a parent themes
 */
export async function loadPartialWithFallback(partialName: string): Promise<any> {
  const activeTheme = await getActiveTheme();
  const hierarchy = await getThemeHierarchy(activeTheme);

  for (const theme of hierarchy) {
    const partialPath = join(
      Deno.cwd(),
      "src",
      "themes",
      theme,
      "partials",
      `${partialName}.tsx`,
    );

    try {
      // Intentar obtener desde caché
      const cached = await themeCacheService.getCachedTemplate(partialPath);
      if (cached) {
        return cached;
      }

      // Importar el partial
      const module = await import(`file://${partialPath}`);

      // Cachear
      await themeCacheService.cacheTemplate(partialPath, module);

      return module;
    } catch {
      // Continuar con el siguiente en la jerarquía
      continue;
    }
  }

  console.error(`Partial "${partialName}" not found in theme hierarchy`);
  return null;
}

/**
 * Obtiene la URL de un asset con fallback a parent themes
 */
export async function getAssetUrlWithFallback(assetPath: string): Promise<string> {
  const activeTheme = await getActiveTheme();
  const hierarchy = await getThemeHierarchy(activeTheme);
  const siteUrl = await settingsService.getSetting("site_url", "");

  for (const theme of hierarchy) {
    const fullPath = join(Deno.cwd(), "src", "themes", theme, "assets", assetPath);

    try {
      await Deno.stat(fullPath);
      return `${siteUrl}/themes/${theme}/assets/${assetPath}`;
    } catch {
      // Continuar con el siguiente
      continue;
    }
  }

  // Si no se encuentra, retornar la URL del child theme de todas formas
  return `${siteUrl}/themes/${activeTheme}/assets/${assetPath}`;
}

/**
 * Obtiene la configuración merged de un child theme con su parent
 */
export async function getMergedThemeConfig(themeName: string): Promise<ThemeConfig | null> {
  const hierarchy = await getThemeHierarchy(themeName);

  if (hierarchy.length === 0) {
    return null;
  }

  // Cargar configs de toda la jerarquía
  const configs: ThemeConfig[] = [];
  for (const theme of hierarchy.reverse()) { // Empezar desde el parent más alto
    const config = await loadThemeConfig(theme);
    if (config) {
      configs.push(config);
    }
  }

  if (configs.length === 0) {
    return null;
  }

  // Merge configs (child sobrescribe parent)
  let merged = configs[0];

  for (let i = 1; i < configs.length; i++) {
    const current = configs[i];

    merged = {
      ...merged,
      ...current,
      config: {
        ...merged.config,
        ...current.config,
        custom: {
          ...merged.config.custom,
          ...current.config.custom,
        },
      },
      supports: {
        ...merged.supports,
        ...current.supports,
      },
      templates: {
        ...merged.templates,
        ...current.templates,
      },
      partials: {
        ...merged.partials,
        ...current.partials,
      },
    };
  }

  return merged;
}

/**
 * Valida que un child theme tiene un parent válido
 */
export async function validateChildTheme(themeName: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const config = await loadThemeConfig(themeName);
  if (!config) {
    errors.push("Theme config not found");
    return { valid: false, errors };
  }

  if (!config.parent) {
    // No es un child theme
    return { valid: true, errors: [] };
  }

  // Verificar que el parent existe
  const parentConfig = await loadThemeConfig(config.parent);
  if (!parentConfig) {
    errors.push(`Parent theme "${config.parent}" not found`);
  }

  // Verificar que no hay ciclos
  const hierarchy = await getThemeHierarchy(themeName);
  const seen = new Set<string>();

  for (const theme of hierarchy) {
    if (seen.has(theme)) {
      errors.push(`Circular parent reference detected: ${theme}`);
      break;
    }
    seen.add(theme);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
