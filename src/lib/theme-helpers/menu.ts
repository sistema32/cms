import * as menuService from "../../services/menuService.ts";
import * as menuItemService from "../../services/menuItemService.ts";
import type { MenuItem } from "./types.ts";

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
