import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0007_security_permissions",
    name: "Add Security Permissions",
    up: async (db, dbType) => {
        console.log("  🔒 Adding security permissions...");

        const securityPerms = [
            { module: "security", action: "view", description: "View security dashboard and logs" },
            { module: "security", action: "manage_ips", description: "Manage IP blacklist and whitelist" },
            { module: "security", action: "manage_rules", description: "Manage security rules and rate limiting" },
            { module: "security", action: "manage_settings", description: "Manage security settings and configuration" },
            { module: "security", action: "export_logs", description: "Export security logs" },
        ];

        for (const perm of securityPerms) {
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

        console.log(`  ✅ Added ${securityPerms.length} security permissions`);
    },

    down: async (db, dbType) => {
        console.log("  Reverting security permissions...");
    }
};
