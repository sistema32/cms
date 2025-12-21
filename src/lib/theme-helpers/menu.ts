import * as menuService from "@/services/content/menuService.ts";
import * as menuItemService from "@/services/content/menuItemService.ts";
import type { MenuItem } from "./types.ts";

export interface NavMenuOptions {
  /**
   * Location slug (equivalente a theme_location en WordPress).
   * Si se pasa `slug`, tiene prioridad sobre location.
   */
  location?: string;
  /**
   * Slug del menú (equivalente a `menu` en wp_nav_menu).
   */
  slug?: string;
  /**
   * Si es false, no se usan fallbacks cuando el menú no existe.
   * Por defecto true.
   */
  fallback?: boolean;
  /**
   * Clases para el contenedor UL principal.
   */
  listClass?: string;
  /**
   * Clases para el contenedor envolvente (div).
   */
  containerClass?: string;
  /**
   * Contenido HTML a inyectar antes del texto del enlace.
   */
  linkBefore?: string;
  /**
   * Contenido HTML a inyectar después del texto del enlace.
   */
  linkAfter?: string;
}

/**
 * Menu Helpers - Functions for menu management
 */

/**
 * Build menu item URL based on its type
 */
function buildMenuItemUrl(item: any): string {
    // If has manual URL, use it directly
    if (item.url) {
        return item.url;
    }

    // If linked to content
    if (item.contentId && item.content) {
        return `/${item.content.slug}`;
    }

    // If linked to category
    if (item.categoryId && item.category) {
        return `/category/${item.category.slug}`;
    }

    // If linked to tag
    if (item.tagId && item.tag) {
        return `/tag/${item.tag.slug}`;
    }

    // Fallback
    return "#";
}

/**
 * Convert menu items from service format to template format
 */
function convertMenuItems(items: any[]): MenuItem[] {
  return items.map((item) => ({
        id: item.id,
        label: item.label,
        url: buildMenuItemUrl(item),
        title: item.title || undefined,
        icon: item.icon || undefined,
        cssClass: item.cssClass || undefined,
        cssId: item.cssId || undefined,
        target: item.target || undefined,
        children: item.children ? convertMenuItems(item.children) : undefined,
    }));
}

/**
 * Get a menu by slug with hierarchical structure
 */
export async function getMenu(slug: string): Promise<MenuItem[]> {
  try {
    const menu = await menuService.getMenuBySlug(slug);

        if (!menu) {
            return [];
        }

        // Build item hierarchy
        const hierarchy = await menuItemService.getMenuItemsHierarchy(menu.id);

        // Convert to expected format
        return convertMenuItems(hierarchy);
    } catch (error) {
        console.error(`Error loading menu '${slug}':`, error);
        return [];
  }
}

/**
 * WP-like helper: obtiene un menú por location o slug con fallback opcional.
 */
export async function getNavMenu(options: NavMenuOptions): Promise<MenuItem[]> {
  const { slug, location, fallback = true } = options;
  try {
    let menuItems: MenuItem[] = [];

    if (slug) {
      menuItems = await getMenu(slug);
    } else if (location) {
      const menu = await menuService.getMenuByLocation(location);
      if (menu) {
        const hierarchy = await menuItemService.getMenuItemsHierarchy(menu.id);
        menuItems = convertMenuItems(hierarchy);
      }
    }

    if (menuItems.length === 0 && fallback) {
      // Fallback al primer menú activo disponible (similar a fallback_cb por defecto)
      const firstMenu = await menuService.getFirstActiveMenu?.();
      if (firstMenu) {
        const hierarchy = await menuItemService.getMenuItemsHierarchy(firstMenu.id);
        return convertMenuItems(hierarchy);
      }
    }

    return menuItems;
  } catch (err) {
    console.error("Error loading nav menu:", err);
    return [];
  }
}

function renderMenuItems(items: MenuItem[], opts: NavMenuOptions): string {
  const listClass = opts.listClass ? ` class="${opts.listClass}"` : "";
  const linkBefore = opts.linkBefore || "";
  const linkAfter = opts.linkAfter || "";

  const renderItem = (item: MenuItem): string => {
    const childrenHtml = item.children && item.children.length > 0
      ? `<ul>${item.children.map(renderItem).join("")}</ul>`
      : "";

    const idAttr = item.cssId ? ` id="${item.cssId}"` : "";
    const classAttr = item.cssClass ? ` class="${item.cssClass}"` : "";
    return `<li>
      <a href="${item.url || "#"}"${item.target ? ` target="${item.target}"` : ""}${item.title ? ` title="${item.title}"` : ""}${classAttr}${idAttr}>${linkBefore}${item.label}${linkAfter}</a>
      ${childrenHtml}
    </li>`;
  };

  return `<ul${listClass}>${items.map(renderItem).join("")}</ul>`;
}

/**
 * Render de menú listo para plantillas (similar a wp_nav_menu).
 */
export async function renderNavMenu(options: NavMenuOptions): Promise<string> {
  const items = await getNavMenu(options);
  if (items.length === 0) return "";

  const outerClass = options.containerClass ? ` class="${options.containerClass}"` : "";
  const markup = renderMenuItems(items, options);

  return `<nav${outerClass} aria-label="${options.location || options.slug || "menu"}">${markup}</nav>`;
}
