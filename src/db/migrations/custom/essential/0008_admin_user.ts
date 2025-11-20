import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";
import { hash } from "bcrypt";

export const migration: CustomMigration = {
    id: "0008_admin_user",
    name: "Create Admin User",
    up: async (db, dbType) => {
        console.log("  👤 Creating admin user...");

        // Hash password
        const hashedPassword = await hash("admin123");

        // Get superadmin role ID
        const roles = await db.all(sql`SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1`);
        const superadminRoleId = roles.length > 0 ? roles[0].id : null;

        if (dbType === "sqlite") {
            await db.run(sql`
        INSERT OR IGNORE INTO users (email, password, name, status, role_id, created_at, updated_at)
        VALUES ('admin@lexcms.local', ${hashedPassword}, 'Admin User', 'active', ${superadminRoleId}, unixepoch(), unixepoch())
      `);
        } else {
            await db.execute(sql`
        INSERT INTO users (email, password, name, status, role_id, created_at, updated_at)
        VALUES ('admin@lexcms.local', ${hashedPassword}, 'Admin User', 'active', ${superadminRoleId}, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `);
        }

        console.log("  ✅ Admin user created");
        console.log("     Email: admin@lexcms.local");
        console.log("     Password: admin123");
    },

    down: async (db, dbType) => {
        console.log("  Reverting admin user...");
    }
};
