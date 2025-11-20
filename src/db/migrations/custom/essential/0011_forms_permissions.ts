/**
 * Migration: Add Forms Permissions
 * 
 * Creates RBAC permissions for Form Builder
 */

import type { CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0011_forms_permissions",
    name: "Add Forms Permissions",
    description: "Creates RBAC permissions for Form Builder module",

    async up(db, dbType) {
        console.log("🔐 Adding forms permissions...");

        if (dbType === "sqlite") {
            // Create permissions
            await db.run(sql`
        INSERT OR IGNORE INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'create', 'Create new forms', unixepoch())
      `);

            await db.run(sql`
        INSERT OR IGNORE INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'read', 'View forms and submissions', unixepoch())
      `);

            await db.run(sql`
        INSERT OR IGNORE INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'update', 'Edit forms and fields', unixepoch())
      `);

            await db.run(sql`
        INSERT OR IGNORE INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'delete', 'Delete forms and submissions', unixepoch())
      `);

            // Assign permissions to admin role
            await db.run(sql`
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'admin' AND p.module = 'forms'
      `);

        } else {
            // PostgreSQL / MySQL
            await db.execute(sql`
        INSERT INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'create', 'Create new forms', NOW())
        ON CONFLICT (module, action) DO NOTHING
      `);

            await db.execute(sql`
        INSERT INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'read', 'View forms and submissions', NOW())
        ON CONFLICT (module, action) DO NOTHING
      `);

            await db.execute(sql`
        INSERT INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'update', 'Edit forms and fields', NOW())
        ON CONFLICT (module, action) DO NOTHING
      `);

            await db.execute(sql`
        INSERT INTO permissions (module, action, description, created_at)
        VALUES ('forms', 'delete', 'Delete forms and submissions', NOW())
        ON CONFLICT (module, action) DO NOTHING
      `);

            // Assign permissions to admin role
            await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'admin' AND p.module = 'forms'
        ON CONFLICT DO NOTHING
      `);
        }

        console.log("✅ Forms permissions added successfully");
    },

    async down(db, dbType) {
        console.log("🔐 Removing forms permissions...");

        if (dbType === "sqlite") {
            await db.run(sql`
        DELETE FROM role_permissions
        WHERE permission_id IN (
          SELECT id FROM permissions WHERE module = 'forms'
        )
      `);

            await db.run(sql`
        DELETE FROM permissions WHERE module = 'forms'
      `);
        } else {
            await db.execute(sql`
        DELETE FROM role_permissions
        WHERE permission_id IN (
          SELECT id FROM permissions WHERE module = 'forms'
        )
      `);

            await db.execute(sql`
        DELETE FROM permissions WHERE module = 'forms'
      `);
        }

        console.log("✅ Forms permissions removed");
    },
};
