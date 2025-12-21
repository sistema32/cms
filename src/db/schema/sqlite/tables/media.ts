import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth.ts";

// ============= MEDIA =============
export const media = sqliteTable("media", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    filename: text("filename").notNull(), // nombre sanitizado: hash_timestamp.webp
    originalFilename: text("original_filename").notNull(), // nombre original del archivo
    mimeType: text("mime_type").notNull(), // image/webp, video/webm, application/pdf
    size: integer("size").notNull(), // tamaño en bytes
    hash: text("hash").notNull().unique(), // SHA-256 hash para evitar duplicados
    path: text("path").notNull(), // ruta relativa: uploads/2025/11/hash_timestamp.webp
    url: text("url").notNull(), // URL completa del archivo
    storageProvider: text("storage_provider").notNull().default("local"), // local, s3, cloudinary
    type: text("type").notNull(), // image, video, audio, document
    width: integer("width"), // para imágenes y videos
    height: integer("height"), // para imágenes y videos
    duration: integer("duration"), // para videos y audios (en segundos)
    uploadedBy: integer("uploaded_by").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= MEDIA_SIZES =============
export const mediaSizes = sqliteTable("media_sizes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mediaId: integer("media_id").notNull().references(() => media.id, {
        onDelete: "cascade",
    }),
    size: text("size").notNull(), // thumbnail, small, medium, large, original
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    path: text("path").notNull(),
    url: text("url").notNull(),
    fileSize: integer("file_size").notNull(), // tamaño en bytes
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= MEDIA_SEO =============
export const mediaSeo = sqliteTable("media_seo", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mediaId: integer("media_id").notNull().references(() => media.id, {
        onDelete: "cascade",
    }).unique(),
    alt: text("alt"), // texto alternativo (crítico para imágenes)
    title: text("title"), // título del medio
    caption: text("caption"), // descripción/caption
    description: text("description"), // descripción larga
    focusKeyword: text("focus_keyword"), // keyword SEO
    credits: text("credits"), // créditos/autor
    copyright: text("copyright"), // información de copyright
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

export type MediaSize = typeof mediaSizes.$inferSelect;
export type NewMediaSize = typeof mediaSizes.$inferInsert;

export type MediaSeo = typeof mediaSeo.$inferSelect;
export type NewMediaSeo = typeof mediaSeo.$inferInsert;
