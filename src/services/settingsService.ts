import { db } from "../config/db.ts";
import { settings, type NewSetting, type Setting } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { SETTINGS_CATEGORY_KEY_MAP, SETTINGS_FIELD_MAP, resolveFieldDefault } from "../config/settingsDefinitions.ts";

// ============= CACHE AUTOLOAD (WordPress-style) =============

// Cache para settings con autoload=true (optimización de performance)
const autoloadCache = new Map<string, any>();
let cacheInitialized = false;

/**
 * Inicializar cache con todos los settings autoload
 * Esto se ejecuta una vez al inicio para cargar settings frecuentemente usados
 */
async function initializeCache() {
  if (cacheInitialized) return;

  const autoloadSettings = await db.query.settings.findMany({
    where: eq(settings.autoload, true),
  });

  for (const setting of autoloadSettings) {
    autoloadCache.set(setting.key, parseSettingValue(setting.value));
  }

  cacheInitialized = true;
  console.log(`✅ Settings cache initialized with ${autoloadCache.size} autoload settings`);
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

  // Verificar cache primero
  if (autoloadCache.has(key)) {
    return autoloadCache.get(key) as T;
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
    autoloadCache.set(key, value);
  }

  return value as T;
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
  if (autoload) {
    autoloadCache.set(key, value);
  } else {
    autoloadCache.delete(key);
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
  if (autoload) {
    autoloadCache.set(key, value);
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
  autoloadCache.delete(key);
}

// ============= CACHE MANAGEMENT =============

/**
 * Limpiar cache completo (útil para testing o reload)
 */
export function clearSettingsCache(): void {
  autoloadCache.clear();
  cacheInitialized = false;
  console.log("🗑️  Settings cache cleared");
}

/**
 * Refrescar cache (recargar desde BD)
 */
export async function refreshSettingsCache(): Promise<void> {
  clearSettingsCache();
  await initializeCache();
}

/**
 * Obtener estado del cache (para debugging)
 */
export function getCacheStats() {
  return {
    initialized: cacheInitialized,
    size: autoloadCache.size,
    keys: Array.from(autoloadCache.keys()),
  };
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
