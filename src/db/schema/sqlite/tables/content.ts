import {
    integer,
    primaryKey,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth.ts";
import { media } from "./media.ts";
import { categories, contentTypes, tags } from "./taxonomy.ts";

// ============= CONTENT =============
export const content = sqliteTable("content", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentTypeId: integer("content_type_id").notNull().references(
        () => contentTypes.id,
        { onDelete: "cascade" },
    ),
    parentId: integer("parent_id"), // Para páginas hijas (child pages)
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body"),
    featuredImageId: integer("featured_image_id").references(() => media.id, {
        onDelete: "set null",
    }),
    authorId: integer("author_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    status: text("status").notNull().default("draft"), // draft, published, scheduled, archived
    visibility: text("visibility").notNull().default("public"), // public, private, password
    password: text("password"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    commentsEnabled: integer("comments_enabled", { mode: "boolean" }).notNull()
        .default(false), // Control de comentarios a nivel de contenido individual
    template: text("template"), // Template personalizado para páginas (ej: "page-inicio", "page-contacto")
    featured: integer("featured", { mode: "boolean" }).notNull().default(false), // Post destacado para homepage y destacados
    sticky: integer("sticky", { mode: "boolean" }).notNull().default(false), // Post fijo en la parte superior de listados
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= CONTENT_CATEGORIES (Many-to-Many) =============
export const contentCategories = sqliteTable("content_categories", {
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    categoryId: integer("category_id").notNull().references(() => categories.id, {
        onDelete: "cascade",
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.categoryId] }),
}));

// ============= CONTENT_TAGS (Many-to-Many) =============
export const contentTags = sqliteTable("content_tags", {
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    tagId: integer("tag_id").notNull().references(() => tags.id, {
        onDelete: "cascade",
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.tagId] }),
}));

// ============= CONTENT_SEO =============
export const contentSeo = sqliteTable("content_seo", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }).unique(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    ogType: text("og_type").default("article"),
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

// ============= CONTENT_META =============
export const contentMeta = sqliteTable("content_meta", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    key: text("key").notNull(),
    value: text("value"),
    type: text("type").default("string"), // string, number, boolean, json
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= CONTENT REVISIONS (Historial de Versiones) =============
export const contentRevisions = sqliteTable("content_revisions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    status: text("status").notNull(),
    visibility: text("visibility").notNull(),
    password: text("password"),
    featuredImageId: integer("featured_image_id"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    // Metadatos de la revisión
    revisionNumber: integer("revision_number").notNull(), // Número secuencial de versión
    authorId: integer("author_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }), // Autor de esta versión
    changesSummary: text("changes_summary"), // Resumen opcional de los cambios
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;

export type ContentCategory = typeof contentCategories.$inferSelect;
export type NewContentCategory = typeof contentCategories.$inferInsert;

export type ContentTag = typeof contentTags.$inferSelect;
export type NewContentTag = typeof contentTags.$inferInsert;

export type ContentSeo = typeof contentSeo.$inferSelect;
export type NewContentSeo = typeof contentSeo.$inferInsert;

export type ContentMeta = typeof contentMeta.$inferSelect;
export type NewContentMeta = typeof contentMeta.$inferInsert;

export type ContentRevision = typeof contentRevisions.$inferSelect;
export type NewContentRevision = typeof contentRevisions.$inferInsert;
