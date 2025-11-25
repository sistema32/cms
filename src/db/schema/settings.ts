import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Site Settings Table
 * Stores global site configuration
 */
export const siteSettings = sqliteTable("site_settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    value: text("value"),
    type: text("type").notNull().default("string"), // string, number, boolean, json
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;
