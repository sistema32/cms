// @ts-nocheck
import { db } from "@/config/db.ts";
import { settings, type NewSetting, type Setting } from "@/db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { SETTINGS_CATEGORY_KEY_MAP, SETTINGS_FIELD_MAP, resolveFieldDefault } from "@/config/settingsDefinitions.ts";
import { getCache, CacheKeys, CacheTags, CacheTTL } from "@/lib/cache/index.ts";

// ============= CACHE AUTOLOAD (WordPress-style with centralized cache) =============

let cacheInitialized = false;

/**
 * Inicializar cache con todos los settings autoload
 * Esto se ejecuta una vez al inicio para cargar settings frecuentemente usados
 */
async function initializeCache() {
  if (cacheInitialized) return;

  try {
    const cache = getCache();
    const autoloadSettings = await db.query.settings.findMany({
      where: eq(settings.autoload, true),
    });

    for (const setting of autoloadSettings) {
      const value = parseSettingValue(setting.value);
      await cache.set(CacheKeys.setting(setting.key), value, {
        ttl: CacheTTL.DAY, // Settings cache for 24 hours
        tags: [CacheTags.SETTING],
      });
    }

    cacheInitialized = true;
    console.log(`✅ Settings cache initialized with ${autoloadSettings.length} autoload settings`);
  } catch (error) {
    console.warn("⚠️ Failed to initialize settings cache:", error);
    // Continue without cache
  }
}

/**
 * Parse setting value desde JSON string
 */
function parseSettingValue(value: string | null): any {
  if (value === null || value === undefined) return null;

  try {
    return JSON.parse(value);
  } catch {
    // Si no es JSON válido, retornar como string
    return value;
  }
}

/**
 * Serialize value a JSON string para almacenamiento
 */
function serializeSettingValue(value: any): string {
  if (typeof value === "string") {
    // Si ya es string, verificar si es JSON válido
    try {
      JSON.parse(value);
      return value; // Ya es JSON string
    } catch {
      // Es string plano, convertir a JSON
      return JSON.stringify(value);
    }
  }

  return JSON.stringify(value);
}

// ============= GETTERS =============

/**
 * Obtener un setting por key
 * Usa cache si es autoload, sino consulta BD
 */
export async function getSetting<T = any>(
  key: string,
  defaultValue?: T
): Promise<T> {
  await initializeCache();

  try {
    const cache = getCache();
    const cacheKey = CacheKeys.setting(key);

    // Verificar cache primero
    const cachedValue = await cache.get<T>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // No está en cache, buscar en BD
    const setting = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (!setting) {
      return defaultValue as T;
    }

    const value = parseSettingValue(setting.value);

    // Si es autoload, guardar en cache para próxima vez
    if (setting.autoload) {
      await cache.set(cacheKey, value, {
        ttl: CacheTTL.DAY,
        tags: [CacheTags.SETTING],
      });
    }

    return value as T;
  } catch (error) {
    console.warn("⚠️ Cache error in getSetting, falling back to DB:", error);

    // Fallback: consultar directamente a BD
    const setting = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (!setting) {
      return defaultValue as T;
    }

    return parseSettingValue(setting.value) as T;
  }
}

/**
 * Obtener múltiples settings por keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, any>> {
  await initializeCache();

  const results: Record<string, any> = {};

  for (const key of keys) {
    results[key] = await getSetting(key);
  }

  return results;
}

/**
 * Obtener todos los settings de una categoría
 * Basado en el mapa de categorías de WordPress
 */
export async function getSettingsByCategory(
  category: string
): Promise<Record<string, any>> {
  const keys = SETTINGS_CATEGORY_KEY_MAP[category] || [];
  const results: Record<string, any> = {};

  for (const key of keys) {
    const field = SETTINGS_FIELD_MAP.get(key);
    const defaultValue = field ? resolveFieldDefault(field) : undefined;
    const value = await getSetting(key, defaultValue);
    if (value !== null && value !== undefined && value !== "") {
      results[key] = value;
    }
  }

  return results;
}

/**
 * Obtener todos los settings (para admin)
 */
export async function getAllSettings(): Promise<Setting[]> {
  return await db.query.settings.findMany({
    orderBy: (settings, { asc }) => [asc(settings.key)],
  });
}

// ============= SETTERS =============

/**
 * Crear o actualizar un setting
 */
export async function updateSetting(
  key: string,
  value: any,
  autoload = true
): Promise<void> {
  const stringValue = serializeSettingValue(value);

  await db
    .insert(settings)
    .values({
      key,
      value: stringValue,
      autoload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: stringValue,
        autoload,
        updatedAt: new Date(),
      },
    });

  // Actualizar cache
  try {
    const cache = getCache();
    const cacheKey = CacheKeys.setting(key);

    if (autoload) {
      await cache.set(cacheKey, value, {
        ttl: CacheTTL.DAY,
        tags: [CacheTags.SETTING],
      });
    } else {
      await cache.delete(cacheKey);
    }

    // Invalidate settings list cache
    await cache.delete(CacheKeys.settingsList());
  } catch (error) {
    console.warn("⚠️ Cache error in updateSetting:", error);
    // Continue - cache is optional
  }
}

/**
 * Actualizar múltiples settings a la vez
 */
export async function updateSettings(
  settingsMap: Record<string, any>,
  autoload = true
): Promise<void> {
  for (const [key, value] of Object.entries(settingsMap)) {
    await updateSetting(key, value, autoload);
  }
}

/**
 * Crear un setting (falla si ya existe)
 */
export async function createSetting(
  key: string,
  value: any,
  autoload = true
): Promise<Setting> {
  const stringValue = serializeSettingValue(value);

  const [newSetting] = await db
    .insert(settings)
    .values({
      key,
      value: stringValue,
      autoload,
    })
    .returning();

  // Agregar a cache si es autoload
  try {
    const cache = getCache();
    if (autoload) {
      await cache.set(CacheKeys.setting(key), value, {
        ttl: CacheTTL.DAY,
        tags: [CacheTags.SETTING],
      });
    }

    // Invalidate settings list cache
    await cache.delete(CacheKeys.settingsList());
  } catch (error) {
    console.warn("⚠️ Cache error in createSetting:", error);
    // Continue - cache is optional
  }

  return newSetting;
}

// ============= DELETE =============

/**
 * Eliminar un setting
 */
export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key));

  // Remover de cache
  try {
    const cache = getCache();
    await cache.delete(CacheKeys.setting(key));
    await cache.delete(CacheKeys.settingsList());
  } catch (error) {
    console.warn("⚠️ Cache error in deleteSetting:", error);
    // Continue - cache is optional
  }
}

// ============= CACHE MANAGEMENT =============

/**
 * Limpiar cache completo (útil para testing o reload)
 */
export async function clearSettingsCache(): Promise<void> {
  try {
    const cache = getCache();
    await cache.deleteByTag(CacheTags.SETTING);
    cacheInitialized = false;
    console.log("🗑️  Settings cache cleared");
  } catch (error) {
    console.warn("⚠️ Failed to clear settings cache:", error);
  }
}

/**
 * Refrescar cache (recargar desde BD)
 */
export async function refreshSettingsCache(): Promise<void> {
  await clearSettingsCache();
  await initializeCache();
}

/**
 * Obtener estado del cache (para debugging)
 */
export async function getCacheStats() {
  try {
    const cache = getCache();
    const stats = await cache.getStats();
    return {
      initialized: cacheInitialized,
      ...stats,
    };
  } catch (error) {
    return {
      initialized: cacheInitialized,
      error: "Cache not available",
    };
  }
}

// ============= HELPERS ESPECÍFICOS =============

/**
 * Obtener custom settings de un theme
 */
export async function getThemeCustomSettings(
  themeName: string
): Promise<Record<string, any>> {
  const prefix = `theme.${themeName}.`;

  const themeSettings = await db.query.settings.findMany({
    where: sql`${settings.key} LIKE ${prefix + "%"}`,
  });

  const customSettings: Record<string, any> = {};
  for (const setting of themeSettings) {
    const key = setting.key.replace(prefix, "");
    customSettings[key] = parseSettingValue(setting.value);
  }

  return customSettings;
}

/**
 * Guardar custom settings de un theme
 */
export async function updateThemeCustomSettings(
  themeName: string,
  customSettings: Record<string, any>
): Promise<void> {
  for (const [key, value] of Object.entries(customSettings)) {
    const fullKey = `theme.${themeName}.${key}`;
    await updateSetting(fullKey, value, true);
  }
}

// ============= HOMEPAGE CONFIGURATION =============

/**
 * Homepage Configuration Type
 */
export interface HomepageConfig {
  type: "theme_home" | "static_page" | "posts_list";
  pageId?: number;
  postsPage?: string;
}

/**
 * Get homepage configuration
 */
export async function getHomepageConfig(): Promise<HomepageConfig> {
  const homepageType = await getSetting<string>("homepage_type", "posts_list");
  const homepagePageId = await getSetting<number | null>("homepage_page_id", null);
  const postsPage = await getSetting<string | null>("posts_page", null);

  return {
    type: homepageType as "theme_home" | "static_page" | "posts_list",
    pageId: homepagePageId || undefined,
    postsPage: postsPage || undefined,
  };
}

/**
 * Set homepage configuration
 */
export async function setHomepageConfig(config: HomepageConfig): Promise<void> {
  // Validate configuration
  if (config.type === "static_page" && !config.pageId) {
    throw new Error("Page ID is required when homepage type is 'static_page'");
  }

  if (config.type === "theme_home" && !config.postsPage) {
    throw new Error("Posts page is required when homepage type is 'theme_home'");
  }

  // Save settings
  await updateSetting("homepage_type", config.type, true);

  if (config.pageId) {
    await updateSetting("homepage_page_id", config.pageId, true);
  } else {
    await deleteSetting("homepage_page_id");
  }

  if (config.postsPage) {
    await updateSetting("posts_page", config.postsPage, true);
  } else {
    await deleteSetting("posts_page");
  }
}
