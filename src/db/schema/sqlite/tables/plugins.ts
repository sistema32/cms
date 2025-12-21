import {
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
// Plugin tables don't necessarily depend on users for FKs except grants, 
// which might refer to users?
// Checking index.ts: pluginPermissionGrants refers to users.id? 
// No, index.ts said `granted_by: integer("granted_by")` with no reference!
// Wait, looking at index.ts lines 118-128:
// grantedBy: integer("granted_by"), // userId opcional
// It does NOT have .references(). So no dependency on users.ts needed.

// ============= PLUGINS (DB-first) =============
export const plugins = sqliteTable("plugins", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(), // slug
    displayName: text("display_name"),
    version: text("version"),
    description: text("description"),
    author: text("author"),
    homepage: text("homepage"),
    sourceUrl: text("source_url"),
    manifestHash: text("manifest_hash"),
    manifestSignature: text("manifest_signature"),
    status: text("status").notNull().default("inactive"), // inactive|active|error|degraded
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false), // no desactivable si true
    settings: text("settings"), // JSON string
    permissions: text("permissions"), // JSON string declarativa
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// Migraciones por plugin
export const pluginMigrations = sqliteTable("plugin_migrations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // nombre/filename
    appliedAt: integer("applied_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
}, (table) => ({
    uniqueMigration: uniqueIndex("plugin_migrations_unique_idx").on(table.pluginId, table.name),
}));

// Auditoría y health
export const pluginHealth = sqliteTable("plugin_health", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ok"), // ok|degraded|error
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
    lastError: text("last_error"),
    latencyMs: integer("latency_ms"),
});

// Permisos concedidos (granular) por plugin
export const pluginPermissionGrants = sqliteTable("plugin_permission_grants", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(), // ej: hook:cms_theme:head, route:GET:/foo
    granted: integer("granted", { mode: "boolean" }).notNull().default(true),
    grantedBy: integer("granted_by"), // userId opcional
    grantedAt: integer("granted_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= TYPES =============
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

export type PluginMigration = typeof pluginMigrations.$inferSelect;
export type NewPluginMigration = typeof pluginMigrations.$inferInsert;

export type PluginHealth = typeof pluginHealth.$inferSelect;
export type NewPluginHealth = typeof pluginHealth.$inferInsert;

export type PluginPermissionGrant = typeof pluginPermissionGrants.$inferSelect;
export type NewPluginPermissionGrant = typeof pluginPermissionGrants.$inferInsert;
