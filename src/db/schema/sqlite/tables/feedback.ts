import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth.ts";
import { content } from "./content.ts";

// ============= COMMENTS =============
export const comments = sqliteTable("comments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    parentId: integer("parent_id"), // self-reference para threading (1 nivel)
    authorId: integer("author_id").references(() => users.id, {
        onDelete: "set null",
    }), // nullable para guests
    authorName: text("author_name"), // para guests
    authorEmail: text("author_email"), // para guests
    authorWebsite: text("author_website"), // opcional
    body: text("body").notNull(), // contenido original sin censura
    bodyCensored: text("body_censored").notNull(), // contenido público con censura aplicada
    captchaToken: text("captcha_token"), // token del captcha verificado
    captchaProvider: text("captcha_provider"), // recaptcha, hcaptcha, turnstile
    status: text("status").notNull().default("approved"), // approved, spam, deleted
    ipAddress: text("ip_address"), // para seguridad/spam prevention
    userAgent: text("user_agent"), // para seguridad
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    deletedAt: integer("deleted_at", { mode: "timestamp" }), // soft delete
});

// ============= CONTENT_FILTERS =============
export const contentFilters = sqliteTable("content_filters", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(), // word, email, link, phone
    pattern: text("pattern").notNull(), // texto o regex
    isRegex: integer("is_regex", { mode: "boolean" }).notNull().default(false), // si es regex o texto plano
    replacement: text("replacement").notNull(), // texto que reemplaza (ej: "[link removido]")
    description: text("description"), // opcional, para documentar el filtro
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // si está activo
    createdBy: integer("created_by").notNull().references(() => users.id, {
        onDelete: "cascade",
    }), // admin que lo creó
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type ContentFilter = typeof contentFilters.$inferSelect;
export type NewContentFilter = typeof contentFilters.$inferInsert;
