import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0002_rbac_seed",
    name: "Seed RBAC (Roles, Permissions, Assignments)",
    up: async (db, dbType) => {
        console.log("  🔐 Seeding RBAC data...");

        // Helper para INSERT condicional
        const insertRole = async (name: string, description: string, isSystem = false) => {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO roles (name, description, is_system, created_at)
          VALUES (${name}, ${description}, ${isSystem ? 1 : 0}, unixepoch())
        `);
            } else {
                await db.execute(sql`
          INSERT INTO roles (name, description, is_system, created_at)
          VALUES (${name}, ${description}, ${isSystem}, NOW())
          ON CONFLICT (name) DO NOTHING
        `);
            }
        };

        // 1. Crear roles
        await insertRole("superadmin", "Super administrador con todos los permisos", true);
        await insertRole("admin", "Administrador con permisos limitados", true);
        await insertRole("editor", "Editor de contenido", false);
        await insertRole("user", "Usuario registrado estándar", false);
        await insertRole("guest", "Usuario público sin autenticación", false);

        // 2. Crear permisos
        const permissions = [
            // Users
            { module: "users", action: "create", description: "Crear usuarios" },
            { module: "users", action: "read", description: "Leer usuarios" },
            { module: "users", action: "update", description: "Actualizar usuarios" },
            { module: "users", action: "delete", description: "Eliminar usuarios" },
            // Roles
            { module: "roles", action: "create", description: "Crear roles" },
            { module: "roles", action: "read", description: "Leer roles" },
            { module: "roles", action: "update", description: "Actualizar roles" },
            { module: "roles", action: "delete", description: "Eliminar roles" },
            // Permissions
            { module: "permissions", action: "create", description: "Crear permisos" },
            { module: "permissions", action: "read", description: "Leer permisos" },
            { module: "permissions", action: "update", description: "Actualizar permisos" },
            { module: "permissions", action: "delete", description: "Eliminar permisos" },
            // Content Types
            { module: "content_types", action: "create", description: "Crear tipos de contenido" },
            { module: "content_types", action: "read", description: "Leer tipos de contenido" },
            { module: "content_types", action: "update", description: "Actualizar tipos de contenido" },
            { module: "content_types", action: "delete", description: "Eliminar tipos de contenido" },
            // Content
            { module: "content", action: "create", description: "Crear contenido" },
            { module: "content", action: "read", description: "Leer contenido" },
            { module: "content", action: "update", description: "Actualizar contenido" },
            { module: "content", action: "delete", description: "Eliminar contenido" },
            { module: "content", action: "publish", description: "Publicar contenido" },
            // Categories
            { module: "categories", action: "create", description: "Crear categorías" },
            { module: "categories", action: "read", description: "Leer categorías" },
            { module: "categories", action: "update", description: "Actualizar categorías" },
            { module: "categories", action: "delete", description: "Eliminar categorías" },
            // Tags
            { module: "tags", action: "create", description: "Crear tags" },
            { module: "tags", action: "read", description: "Leer tags" },
            { module: "tags", action: "update", description: "Actualizar tags" },
            { module: "tags", action: "delete", description: "Eliminar tags" },
            // Media
            { module: "media", action: "create", description: "Subir archivos de media" },
            { module: "media", action: "read", description: "Ver archivos de media" },
            { module: "media", action: "update", description: "Actualizar metadata de media" },
            { module: "media", action: "delete", description: "Eliminar archivos de media" },
            // Menus
            { module: "menus", action: "create", description: "Crear menús" },
            { module: "menus", action: "read", description: "Leer menús" },
            { module: "menus", action: "update", description: "Actualizar menús" },
            { module: "menus", action: "delete", description: "Eliminar menús" },
            // Settings
            { module: "settings", action: "create", description: "Crear configuraciones" },
            { module: "settings", action: "read", description: "Leer configuraciones" },
            { module: "settings", action: "update", description: "Actualizar configuraciones" },
            { module: "settings", action: "delete", description: "Eliminar configuraciones" },
        ];

        for (const perm of permissions) {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO permissions (module, action, description, created_at)
          VALUES (${perm.module}, ${perm.action}, ${perm.description}, unixepoch())
        `);
            } else {
                await db.execute(sql`
          INSERT INTO permissions (module, action, description, created_at)
          VALUES (${perm.module}, ${perm.action}, ${perm.description}, NOW())
          ON CONFLICT (module, action) DO NOTHING
        `);
            }
        }

        console.log(`  ✅ Created ${permissions.length} permissions`);

        // 3. Asignar permisos a roles (esto se hará en una migración posterior cuando tengamos IDs)
        console.log("  ℹ️  Role-permission assignments will be done via application logic");
    },

    down: async (db, dbType) => {
        console.log("  Reverting RBAC seed...");
        // Optional: cleanup logic
    }
};
