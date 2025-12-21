import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { content } from "./content.ts";
import { categories, tags } from "./taxonomy.ts";

// ============= MENUS =============
export const menus = sqliteTable("menus", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    location: text("location"), // e.g. "primary", "footer"
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= MENU_ITEMS =============
export const menuItems = sqliteTable("menu_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    menuId: integer("menu_id").notNull().references(() => menus.id, {
        onDelete: "cascade",
    }),
    parentId: integer("parent_id"), // auto-referencia para jerarquía ilimitada

    // Contenido del item
    label: text("label").notNull(),
    title: text("title"), // atributo title (tooltip)

    // Tipos de enlaces (solo uno debe estar presente)
    url: text("url"),
    contentId: integer("content_id").references(() => content.id, {
        onDelete: "set null",
    }),
    categoryId: integer("category_id").references(() => categories.id, {
        onDelete: "set null",
    }),
    tagId: integer("tag_id").references(() => tags.id, { onDelete: "set null" }),

    // Configuración visual
    icon: text("icon"),
    cssClass: text("css_class"),
    cssId: text("css_id"),
    target: text("target").default("_self"), // "_self", "_blank", "_parent"

    // Control de orden y visibilidad
    order: integer("order").notNull().default(0),
    isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),

    // Control de permisos (opcional)
    requiredPermission: text("required_permission"),

    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= WIDGET AREAS =============
export const widgetAreas = sqliteTable("widget_areas", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    theme: text("theme").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= WIDGETS =============
export const widgets = sqliteTable("widgets", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    areaId: integer("area_id").references(() => widgetAreas.id, {
        onDelete: "cascade",
    }),
    type: text("type").notNull(), // 'search', 'recent-posts', 'custom-html', etc.
    title: text("title"),
    settings: text("settings"), // JSON
    order: integer("order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type WidgetArea = typeof widgetAreas.$inferSelect;
export type NewWidgetArea = typeof widgetAreas.$inferInsert;

export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;
