
import { Context } from "hono";
import { db } from "@/config/db.ts";
import { menus, menuItems } from "@/db/schema.ts";
import { eq, desc, asc, count } from "drizzle-orm";
import { env } from "@/config/env.ts";
import { createLogger } from "@/platform/logger.ts";
import * as menuService from "@/services/content/menuService.ts";
import MenuListNexus from "@/admin/pages/menus/MenuListNexus.tsx";
import MenuEditorNexus from "@/admin/pages/menus/MenuEditorNexus.tsx";
import { getActiveThemeConfig } from "@/services/themes/themeService.ts";

const log = createLogger("adminMenuController");

/**
 * Controller for managing menus in the Admin Panel
 */
export const adminMenuController = {

    /**
     * List all menus
     */
    async list(c: Context) {
        try {
            const user = c.get("user");
            const page = parseInt(c.req.query("page") || "1");
            const limit = 20;
            const offset = (page - 1) * limit;

            const [menusList, totalResult] = await Promise.all([
                db.query.menus.findMany({
                    limit,
                    offset,
                    orderBy: [desc(menus.createdAt)],
                }),
                db.select({ count: count() }).from(menus),
            ]);

            const total = totalResult[0]?.count || 0;
            const totalPages = Math.ceil(total / limit);

            // Get registered locations from active theme
            const registeredLocations = await menuService.getRegisteredMenuLocations();

            return c.html(MenuListNexus({
                user,
                menus: menusList,
                registeredLocations,
                pagination: {
                    page,
                    totalPages,
                    total
                }
            }));
        } catch (error) {
            log.error("Error rendering menu list", error instanceof Error ? error : undefined, { error });
            return c.text("Error rendering menu list", 500);
        }
    },

    /**
     * Handle Create Menu (POST)
     */
    async create(c: Context) {
        try {
            const body = await c.req.parseBody();
            const name = body.name as string;
            const slug = body.slug as string;
            const location = body.location as string || null;

            if (!name || !slug) {
                // TODO: Flash message error
                return c.redirect(`${env.ADMIN_PATH}/appearance/menus?error=Name+and+Slug+required`);
            }

            await menuService.createMenu({
                name,
                slug,
                location,
                isActive: true
            });

            return c.redirect(`${env.ADMIN_PATH}/appearance/menus?success=Menu+Created`);
        } catch (error: any) {
            log.error("Error creating menu", error);
            return c.redirect(`${env.ADMIN_PATH}/appearance/menus?error=${encodeURIComponent(error.message)}`);
        }
    },

    /**
     * Edit Menu (Show Editor)
     */
    async edit(c: Context) {
        try {
            const user = c.get("user");
            const id = parseInt(c.req.param("id"));

            const menu = await menuService.getMenuById(id);
            if (!menu) return c.text("Menu not found", 404);

            // Load available content for sidebar
            const [pagesResult, categoriesResult, postsResult] = await Promise.all([
                // TODO: Use specific services to get available items
                db.query.content.findMany({
                    where: (content, { eq }) => eq(content.contentTypeId, 2), // Assuming 2 is Page 
                    limit: 20
                }),
                db.query.categories.findMany({ limit: 50 }),
                db.query.content.findMany({
                    where: (content, { eq }) => eq(content.contentTypeId, 1), // Assuming 1 is Post
                    limit: 20
                }),
            ]);

            // Get registered locations
            const registeredLocations = await menuService.getRegisteredMenuLocations();

            return c.html(MenuEditorNexus({
                user,
                menu,
                registeredLocations,
                availableItems: {
                    pages: pagesResult,
                    categories: categoriesResult,
                    posts: postsResult,
                }
            }));

        } catch (error) {
            log.error("Error rendering menu editor", error instanceof Error ? error : undefined, { error });
            return c.text("Error rendering editor", 500);
        }
    },

    /**
     * Update Menu Metadata (POST)
     */
    async update(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.parseBody();

            await menuService.updateMenu(id, {
                name: body.name as string,
                location: (body.location as string) || null,
                isActive: body.isActive === "on"
            });

            return c.redirect(`${env.ADMIN_PATH}/appearance/menus/${id}?success=Updated`);
        } catch (error: any) {
            const id = c.req.param("id");
            return c.redirect(`${env.ADMIN_PATH}/appearance/menus/${id}?error=${encodeURIComponent(error.message)}`);
        }
    },

    /**
     * Delete Menu (POST/DELETE)
     */
    async delete(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            await menuService.deleteMenu(id);
            return c.json({ success: true });
        } catch (error: any) {
            return c.json({ success: false, error: error.message }, 500);
        }
    },

    /**
     * Save Menu Items Structure (POST /items)
     * Receives a flat list or nested JSON of items
     */
    /**
     * Save Menu Items Structure (POST /items)
     * Receives a flat list of items with tempId and parentId (referring to tempId)
     * Guaranteed order: Parents first.
     */
    async saveItems(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const items = body.items; // Array of { tempId, parentId, order, ... }

            // Transaction-like behavior
            await db.delete(menuItems).where(eq(menuItems.menuId, id));

            if (items && items.length > 0) {
                const tempIdToDbId = new Map<string, number>();

                for (const item of items) {
                    // Resolve parent ID
                    let dbParentId = null;
                    if (item.parentId && tempIdToDbId.has(item.parentId)) {
                        dbParentId = tempIdToDbId.get(item.parentId);
                    }

                    const [inserted] = await db.insert(menuItems).values({
                        menuId: id,
                        parentId: dbParentId ? dbParentId : null,
                        label: item.label,
                        url: item.url,
                        title: item.title,
                        contentId: item.contentId ? parseInt(item.contentId) : null,
                        categoryId: item.categoryId ? parseInt(item.categoryId) : null,
                        order: item.order,
                        icon: item.icon,
                        cssId: item.cssId || null,
                        cssClass: item.cssClass || null,
                        target: item.target || "_self",
                    }).returning();

                    if (item.tempId) {
                        tempIdToDbId.set(item.tempId, inserted.id);
                    }
                }
            }

            return c.json({ success: true });
        } catch (error: any) {
            log.error("Error saving menu items", error);
            return c.json({ success: false, error: error.message }, 500);
        }
    }
};
