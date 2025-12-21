import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============= CONTENT TYPES =============
export const contentTypes = sqliteTable("content_types", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(), // post, page, product, event
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"), // emoji o nombre de icono
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    hasCategories: integer("has_categories", { mode: "boolean" }).notNull()
        .default(true),
    hasTags: integer("has_tags", { mode: "boolean" }).notNull().default(true),
    hasComments: integer("has_comments", { mode: "boolean" }).notNull().default(
        false,
    ),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= CATEGORIES =============
export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: integer("parent_id"), // auto-referencia para jerarquía
    contentTypeId: integer("content_type_id").references(() => contentTypes.id, {
        onDelete: "cascade",
    }),
    color: text("color"), // hex color
    icon: text("icon"),
    order: integer("order").default(0),
    deletedAt: integer("deleted_at", { mode: "timestamp" }), // soft delete
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= CATEGORY_SEO =============
export const categorySeo = sqliteTable("category_seo", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").notNull().references(() => categories.id, {
        onDelete: "cascade",
    }).unique(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    ogType: text("og_type").default("website"),
    twitterCard: text("twitter_card").default("summary_large_image"),
    twitterTitle: text("twitter_title"),
    twitterDescription: text("twitter_description"),
    twitterImage: text("twitter_image"),
    schemaJson: text("schema_json"), // JSON-LD
    focusKeyword: text("focus_keyword"),
    noIndex: integer("no_index", { mode: "boolean" }).notNull().default(false),
    noFollow: integer("no_follow", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TAGS =============
export const tags = sqliteTable("tags", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type ContentType = typeof contentTypes.$inferSelect;
export type NewContentType = typeof contentTypes.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type CategorySeo = typeof categorySeo.$inferSelect;
export type NewCategorySeo = typeof categorySeo.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
