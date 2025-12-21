import {
    integer,
    primaryKey,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============= ROLES =============
export const roles = sqliteTable("roles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false), // roles del sistema no se pueden eliminar
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= PERMISSIONS =============
export const permissions = sqliteTable("permissions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    module: text("module").notNull(), // ej: "users", "posts", "comments"
    action: text("action").notNull(), // ej: "create", "read", "update", "delete"
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= ROLE_PERMISSIONS (Many-to-Many) =============
export const rolePermissions = sqliteTable("role_permissions", {
    roleId: integer("role_id").notNull().references(() => roles.id, {
        onDelete: "cascade",
    }),
    permissionId: integer("permission_id").notNull().references(
        () => permissions.id,
        { onDelete: "cascade" },
    ),
}, (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// ============= USERS =============
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name"),
    avatar: text("avatar"), // URL del avatar
    status: text("status").notNull().default("active"), // active, inactive, suspended
    roleId: integer("role_id").references(() => roles.id),
    twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull()
        .default(false),
    twoFactorSecret: text("two_factor_secret"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }), // Último login
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= USER 2FA =============
export const user2FA = sqliteTable("user_2fa", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().unique().references(() => users.id, {
        onDelete: "cascade",
    }),
    secret: text("secret").notNull(), // Secret TOTP (encriptado)
    backupCodes: text("backup_codes").notNull(), // JSON array de códigos hasheados
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(
        false,
    ),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= API KEYS =============
export const apiKeys = sqliteTable("api_keys", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    key: text("key").notNull().unique(),
    userId: integer("user_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    permissions: text("permissions").notNull(), // JSON array of permission strings
    rateLimit: integer("rate_limit"), // Requests per hour
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= TYPES =============
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type User2FA = typeof user2FA.$inferSelect;
export type NewUser2FA = typeof user2FA.$inferInsert;

export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;
