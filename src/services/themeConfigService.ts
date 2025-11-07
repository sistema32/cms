/**
 * Theme Configuration Service
 * Export/Import de configuraciones de themes
 */

import * as themeService from "./themeService.ts";
import * as settingsService from "./settingsService.ts";
import * as menuService from "./menuService.ts";
import * as menuItemService from "./menuItemService.ts";
import type { ThemeConfig } from "./themeService.ts";

export interface ThemeConfigExport {
  version: string;
  exportedAt: string;
  theme: {
    name: string;
    version: string;
    displayName?: string;
  };
  settings: Record<string, any>;
  menus?: Record<string, any[]>;
  metadata?: {
    siteUrl?: string;
    exportedBy?: string;
  };
}

export interface ImportOptions {
  overwrite?: boolean;
  includeMenus?: boolean;
  skipSettings?: string[];
  validateTheme?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: {
    settings: number;
    menus?: number;
  };
  skipped: string[];
  errors: string[];
}

/**
 * Exporta la configuración de un theme
 */
export async function exportThemeConfig(
  themeName: string,
  options?: {
    includeMenus?: boolean;
    metadata?: Record<string, any>;
  },
): Promise<ThemeConfigExport> {
  const { includeMenus = false, metadata = {} } = options || {};

  // Obtener configuración del theme
  const config = await themeService.loadThemeConfig(themeName);
  if (!config) {
    throw new Error(`Theme "${themeName}" not found`);
  }

  // Obtener custom settings
  const settings = await themeService.getThemeCustomSettings(themeName);

  // Exportar object
  const exportData: ThemeConfigExport = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    theme: {
      name: config.name,
      version: config.version,
      displayName: config.displayName,
    },
    settings,
    metadata,
  };

  // Incluir menus si se solicita
  if (includeMenus && config.supports?.menus) {
    const menus: Record<string, any[]> = {};

    for (const menuSlug of config.supports.menus) {
      try {
        const menuData = await menuService.getMenuBySlug(menuSlug);
        if (menuData) {
          const items = await menuItemService.getMenuItemsHierarchy(menuData.id);
          menus[menuSlug] = items;
        }
      } catch (error) {
        console.warn(`Could not export menu "${menuSlug}":`, error);
      }
    }

    exportData.menus = menus;
  }

  return exportData;
}

/**
 * Exporta la configuración del theme activo
 */
export async function exportActiveThemeConfig(
  options?: {
    includeMenus?: boolean;
    metadata?: Record<string, any>;
  },
): Promise<ThemeConfigExport> {
  const activeTheme = await themeService.getActiveTheme();
  return exportThemeConfig(activeTheme, options);
}

/**
 * Importa la configuración de un theme
 */
export async function importThemeConfig(
  exportData: ThemeConfigExport,
  options?: ImportOptions,
): Promise<ImportResult> {
  const {
    overwrite = false,
    includeMenus = false,
    skipSettings = [],
    validateTheme = true,
  } = options || {};

  const result: ImportResult = {
    success: false,
    imported: {
      settings: 0,
      menus: 0,
    },
    skipped: [],
    errors: [],
  };

  try {
    // Validar version
    if (exportData.version !== "1.0.0") {
      result.errors.push(`Unsupported export version: ${exportData.version}`);
      return result;
    }

    const themeName = exportData.theme.name;

    // Validar que el theme existe
    if (validateTheme) {
      const config = await themeService.loadThemeConfig(themeName);
      if (!config) {
        result.errors.push(`Theme "${themeName}" not found in this installation`);
        return result;
      }

      // Verificar version del theme
      if (config.version !== exportData.theme.version) {
        result.errors.push(
          `Theme version mismatch: expected ${exportData.theme.version}, found ${config.version}`,
        );
        // Continuamos de todas formas, es solo una advertencia
      }
    }

    // Obtener settings existentes
    const existingSettings = await themeService.getThemeCustomSettings(themeName);

    // Importar settings
    for (const [key, value] of Object.entries(exportData.settings)) {
      // Saltar si está en skipSettings
      if (skipSettings.includes(key)) {
        result.skipped.push(key);
        continue;
      }

      // Saltar si ya existe y no queremos sobrescribir
      if (!overwrite && key in existingSettings) {
        result.skipped.push(key);
        continue;
      }

      try {
        await settingsService.updateSetting(`theme.${themeName}.${key}`, value);
        result.imported.settings++;
      } catch (error) {
        result.errors.push(`Failed to import setting "${key}": ${error.message}`);
      }
    }

    // Importar menus si está incluido
    if (includeMenus && exportData.menus) {
      let menusImported = 0;

      for (const [slug, items] of Object.entries(exportData.menus)) {
        try {
          // Verificar si el menu existe
          let menu = await menuService.getMenuBySlug(slug);

          if (!menu) {
            // Crear menu
            const menuId = await menuService.createMenu({
              name: slug.charAt(0).toUpperCase() + slug.slice(1),
              slug,
              description: `Imported from ${exportData.theme.displayName || exportData.theme.name}`,
              isActive: true,
            });

            menu = await menuService.getMenuById(menuId);
          }

          if (menu) {
            // TODO: Importar items del menu (requiere implementación de bulk insert)
            // Por ahora solo creamos el menu
            menusImported++;
          }
        } catch (error) {
          result.errors.push(`Failed to import menu "${slug}": ${error.message}`);
        }
      }

      result.imported.menus = menusImported;
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(`Import failed: ${error.message}`);
    result.success = false;
  }

  return result;
}

/**
 * Valida un export antes de importar
 */
export async function validateThemeConfigExport(
  exportData: ThemeConfigExport,
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar estructura básica
  if (!exportData.version) {
    errors.push("Missing export version");
  }

  if (!exportData.theme?.name) {
    errors.push("Missing theme name");
  }

  if (!exportData.settings) {
    warnings.push("No settings to import");
  }

  // Validar que el theme existe
  if (exportData.theme?.name) {
    const config = await themeService.loadThemeConfig(exportData.theme.name);
    if (!config) {
      errors.push(`Theme "${exportData.theme.name}" not found`);
    } else {
      // Verificar version
      if (config.version !== exportData.theme.version) {
        warnings.push(
          `Theme version mismatch: export is for v${exportData.theme.version}, installed is v${config.version}`,
        );
      }

      // Validar settings contra theme.json
      if (config.config?.custom) {
        for (const key of Object.keys(exportData.settings)) {
          if (!(key in config.config.custom)) {
            warnings.push(`Setting "${key}" not defined in current theme version`);
          }
        }
      }
    }
  }

  // Validar menus
  if (exportData.menus) {
    if (typeof exportData.menus !== "object") {
      errors.push("Invalid menus format");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Crea un backup de la configuración actual antes de importar
 */
export async function createConfigBackup(themeName: string): Promise<ThemeConfigExport> {
  return exportThemeConfig(themeName, {
    includeMenus: true,
    metadata: {
      type: "backup",
      backupAt: new Date().toISOString(),
    },
  });
}

/**
 * Compara dos configuraciones y devuelve las diferencias
 */
export function compareConfigs(
  config1: ThemeConfigExport,
  config2: ThemeConfigExport,
): {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
} {
  const keys1 = Object.keys(config1.settings);
  const keys2 = Object.keys(config2.settings);

  const added = keys2.filter((k) => !keys1.includes(k));
  const removed = keys1.filter((k) => !keys2.includes(k));
  const common = keys1.filter((k) => keys2.includes(k));

  const modified: string[] = [];
  const unchanged: string[] = [];

  for (const key of common) {
    if (JSON.stringify(config1.settings[key]) !== JSON.stringify(config2.settings[key])) {
      modified.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { added, removed, modified, unchanged };
}

/**
 * Formatea el export como JSON string
 */
export function formatExport(exportData: ThemeConfigExport, pretty = true): string {
  return JSON.stringify(exportData, null, pretty ? 2 : 0);
}

/**
 * Parsea un export desde JSON string
 */
export function parseExport(jsonString: string): ThemeConfigExport {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

/**
 * Genera un filename para el export
 */
export function generateExportFilename(themeName: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${themeName}-theme-config-${date}.json`;
}
