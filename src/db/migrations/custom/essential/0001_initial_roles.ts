import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0001_initial_roles_seed",
    name: "Seed Initial Roles",
    up: async (db, dbType) => {
        console.log("  🌱 Seeding initial roles...");

        if (dbType === "sqlite") {
            await db.run(sql`
        INSERT OR IGNORE INTO roles (name, description, is_system, created_at)
        VALUES ('admin', 'Administrator with full access', 1, unixepoch())
      `);
            await db.run(sql`
        INSERT OR IGNORE INTO roles (name, description, is_system, created_at)
        VALUES ('editor', 'Content editor', 0, unixepoch())
      `);
        } else {
            // PostgreSQL / MySQL
            await db.execute(sql`
        INSERT INTO roles (name, description, is_system, created_at)
        VALUES ('admin', 'Administrator with full access', true, NOW())
        ON CONFLICT (name) DO NOTHING
      `);
            await db.execute(sql`
        INSERT INTO roles (name, description, is_system, created_at)
        VALUES ('editor', 'Content editor', false, NOW())
        ON CONFLICT (name) DO NOTHING
      `);
        }
    },
    down: async (db, dbType) => {
        // Optional: rollback logic
        console.log("  Reverting initial roles seed...");
    }
};
