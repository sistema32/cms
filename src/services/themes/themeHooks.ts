/**
 * Theme Hooks and Filters System
 * Sistema de extensión tipo WordPress para themes
 */

import type { ActionCallback, FilterCallback } from "../themes/sdk/types.ts";

interface Hook {
  callback: ActionCallback | FilterCallback;
  priority: number;
  acceptedArgs: number;
}

class ThemeHooksService {
  private actions = new Map<string, Hook[]>();
  private filters = new Map<string, Hook[]>();

  // Stats para debugging
  private stats = {
    actionsRegistered: 0,
    filtersRegistered: 0,
    actionsExecuted: 0,
    filtersExecuted: 0,
  };

  /**
   * Registra una acción
   * @param hook Nombre del hook
   * @param callback Función callback
   * @param priority Prioridad (menor = antes)
   * @param acceptedArgs Número de argumentos aceptados
   */
  registerAction(
    hook: string,
    callback: ActionCallback,
    priority = 10,
    acceptedArgs = 1,
  ): void {
    if (!this.actions.has(hook)) {
      this.actions.set(hook, []);
    }

    this.actions.get(hook)!.push({
      callback,
      priority,
      acceptedArgs,
    });

    // Ordenar por prioridad
    this.actions.get(hook)!.sort((a, b) => a.priority - b.priority);

    this.stats.actionsRegistered++;
  }

  /**
   * Ejecuta una acción
   * @param hook Nombre del hook
   * @param args Argumentos para pasar a los callbacks
   */
  async doAction(hook: string, ...args: any[]): Promise<void> {
    const hooks = this.actions.get(hook);

    if (!hooks || hooks.length === 0) {
      return;
    }

    this.stats.actionsExecuted++;

    for (const { callback, acceptedArgs } of hooks) {
      try {
        const hookArgs = args.slice(0, acceptedArgs);
        await callback(...hookArgs);
      } catch (error) {
        console.error(`Error executing action hook "${hook}":`, error);
      }
    }
  }

  /**
   * Registra un filtro
   * @param hook Nombre del hook
   * @param callback Función callback que modifica el valor
   * @param priority Prioridad (menor = antes)
   * @param acceptedArgs Número de argumentos aceptados
   */
  registerFilter<T = any>(
    hook: string,
    callback: FilterCallback<T>,
    priority = 10,
    acceptedArgs = 1,
  ): void {
    if (!this.filters.has(hook)) {
      this.filters.set(hook, []);
    }

    this.filters.get(hook)!.push({
      callback,
      priority,
      acceptedArgs,
    });

    // Ordenar por prioridad
    this.filters.get(hook)!.sort((a, b) => a.priority - b.priority);

    this.stats.filtersRegistered++;
  }

  /**
   * Aplica filtros a un valor
   * @param hook Nombre del hook
   * @param value Valor inicial
   * @param args Argumentos adicionales para los callbacks
   */
  async applyFilters<T = any>(hook: string, value: T, ...args: any[]): Promise<T> {
    const hooks = this.filters.get(hook);

    if (!hooks || hooks.length === 0) {
      return value;
    }

    this.stats.filtersExecuted++;

    let result = value;

    for (const { callback, acceptedArgs } of hooks) {
      try {
        const hookArgs = [result, ...args].slice(0, acceptedArgs);
        result = await callback(...hookArgs);
      } catch (error) {
        console.error(`Error executing filter hook "${hook}":`, error);
      }
    }

    return result;
  }

  /**
   * Verifica si un hook tiene callbacks registrados
   * @param hook Nombre del hook
   * @param type Tipo de hook (action o filter)
   */
  hasHook(hook: string, type: "action" | "filter" = "action"): boolean {
    const map = type === "action" ? this.actions : this.filters;
    const hooks = map.get(hook);
    return hooks !== undefined && hooks.length > 0;
  }

  /**
   * Obtiene el número de callbacks registrados para un hook
   * @param hook Nombre del hook
   * @param type Tipo de hook
   */
  getHookCount(hook: string, type: "action" | "filter" = "action"): number {
    const map = type === "action" ? this.actions : this.filters;
    const hooks = map.get(hook);
    return hooks ? hooks.length : 0;
  }

  /**
   * Remueve todos los callbacks de un hook
   * @param hook Nombre del hook
   * @param type Tipo de hook
   */
  removeAllHooks(hook: string, type: "action" | "filter" = "action"): void {
    const map = type === "action" ? this.actions : this.filters;
    map.delete(hook);
  }

  /**
   * Remueve un callback específico de un hook
   * @param hook Nombre del hook
   * @param callback Callback a remover
   * @param type Tipo de hook
   */
  removeHook(
    hook: string,
    callback: ActionCallback | FilterCallback,
    type: "action" | "filter" = "action",
  ): boolean {
    const map = type === "action" ? this.actions : this.filters;
    const hooks = map.get(hook);

    if (!hooks) return false;

    const index = hooks.findIndex((h) => h.callback === callback);
    if (index > -1) {
      hooks.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Lista todos los hooks registrados
   */
  listHooks(): {
    actions: string[];
    filters: string[];
  } {
    return {
      actions: Array.from(this.actions.keys()),
      filters: Array.from(this.filters.keys()),
    };
  }

  /**
   * Obtiene estadísticas del sistema de hooks
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Resetea estadísticas
   */
  resetStats(): void {
    this.stats = {
      actionsRegistered: 0,
      filtersRegistered: 0,
      actionsExecuted: 0,
      filtersExecuted: 0,
    };
  }

  /**
   * Limpia todos los hooks (útil para testing)
   */
  clearAll(): void {
    this.actions.clear();
    this.filters.clear();
    this.resetStats();
  }
}

// Singleton
export const themeHooks = new ThemeHooksService();

// Aliases convenientes
export const registerAction = themeHooks.registerAction.bind(themeHooks);
export const doAction = themeHooks.doAction.bind(themeHooks);
export const registerFilter = themeHooks.registerFilter.bind(themeHooks);
export const applyFilters = themeHooks.applyFilters.bind(themeHooks);
export const hasHook = themeHooks.hasHook.bind(themeHooks);
export const removeHook = themeHooks.removeHook.bind(themeHooks);
export const removeAllHooks = themeHooks.removeAllHooks.bind(themeHooks);

/**
 * Hooks disponibles en el sistema
 */
export const AVAILABLE_HOOKS = {
  // Theme lifecycle
  THEME_SETUP: "theme_setup",
  THEME_ACTIVATED: "theme_activated",
  THEME_DEACTIVATED: "theme_deactivated",

  // Template rendering
  BEFORE_TEMPLATE_RENDER: "before_template_render",
  AFTER_TEMPLATE_RENDER: "after_template_render",
  TEMPLATE_CONTENT: "template_content", // filter

  // Content rendering
  BEFORE_POST_CONTENT: "before_post_content",
  AFTER_POST_CONTENT: "after_post_content",
  POST_CONTENT: "post_content", // filter
  POST_EXCERPT: "post_excerpt", // filter
  POST_TITLE: "post_title", // filter

  // Head and footer
  HEAD: "head",
  FOOTER: "footer",
  BEFORE_HEADER: "before_header",
  AFTER_HEADER: "after_header",
  BEFORE_FOOTER: "before_footer",
  AFTER_FOOTER: "after_footer",

  // Settings and config
  THEME_SETTINGS: "theme_settings", // filter
  THEME_CONFIG: "theme_config", // filter
  CUSTOM_CSS: "custom_css", // filter
  CUSTOM_JS: "custom_js", // filter

  // Menu
  MENU_ITEMS: "menu_items", // filter
  MENU_ITEM_CLASSES: "menu_item_classes", // filter

  // Widgets
  WIDGET_AREAS: "widget_areas", // filter
  WIDGET_CONTENT: "widget_content", // filter

  // SEO
  META_TAGS: "meta_tags", // filter
  PAGE_TITLE: "page_title", // filter
  META_DESCRIPTION: "meta_description", // filter

  // Assets
  ENQUEUE_STYLES: "enqueue_styles",
  ENQUEUE_SCRIPTS: "enqueue_scripts",

  // Cache
  CACHE_INVALIDATED: "cache_invalidated",
} as const;

/**
 * Helpers para registrar hooks comunes
 */
export function onThemeSetup(callback: ActionCallback, priority = 10): void {
  registerAction(AVAILABLE_HOOKS.THEME_SETUP, callback, priority);
}

export function onThemeActivated(callback: ActionCallback, priority = 10): void {
  registerAction(AVAILABLE_HOOKS.THEME_ACTIVATED, callback, priority);
}

export function filterPostContent<T>(callback: FilterCallback<T>, priority = 10): void {
  registerFilter(AVAILABLE_HOOKS.POST_CONTENT, callback, priority);
}

export function filterThemeSettings<T>(callback: FilterCallback<T>, priority = 10): void {
  registerFilter(AVAILABLE_HOOKS.THEME_SETTINGS, callback, priority);
}
