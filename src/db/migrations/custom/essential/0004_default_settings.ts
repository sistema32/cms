import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0004_settings_seed",
    name: "Seed Default Settings",
    up: async (db, dbType) => {
        console.log("  ⚙️  Seeding default settings...");

        const settings = [
            // General
            { key: "site_title", value: "LexCMS", category: "general", autoload: true },
            { key: "site_description", value: "A modern CMS built with Deno", category: "general", autoload: true },
            { key: "site_url", value: "http://localhost:8000", category: "general", autoload: true },
            { key: "admin_email", value: "admin@lexcms.local", category: "general", autoload: true },
            { key: "timezone", value: "UTC", category: "general", autoload: true },
            { key: "date_format", value: "Y-m-d", category: "general", autoload: true },
            { key: "time_format", value: "H:i:s", category: "general", autoload: true },

            // Reading
            { key: "posts_per_page", value: "10", category: "reading", autoload: true },
            { key: "show_on_front", value: "posts", category: "reading", autoload: true },

            // Discussion
            { key: "default_comment_status", value: "open", category: "discussion", autoload: true },
            { key: "require_name_email", value: "true", category: "discussion", autoload: true },
            { key: "comment_moderation", value: "false", category: "discussion", autoload: true },

            // Media
            { key: "thumbnail_size_w", value: "150", category: "media", autoload: true },
            { key: "thumbnail_size_h", value: "150", category: "media", autoload: true },
            { key: "medium_size_w", value: "300", category: "media", autoload: true },
            { key: "medium_size_h", value: "300", category: "media", autoload: true },
            { key: "large_size_w", value: "1024", category: "media", autoload: true },
            { key: "large_size_h", value: "1024", category: "media", autoload: true },

            // Permalinks
            { key: "permalink_structure", value: "/%postname%/", category: "permalinks", autoload: true },
        ];

        for (const setting of settings) {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO settings (key, value, category, autoload, created_at, updated_at)
          VALUES (${setting.key}, ${setting.value}, ${setting.category}, ${setting.autoload ? 1 : 0}, unixepoch(), unixepoch())
        `);
            } else {
                await db.execute(sql`
          INSERT INTO settings (key, value, category, autoload, created_at, updated_at)
          VALUES (${setting.key}, ${setting.value}, ${setting.category}, ${setting.autoload}, NOW(), NOW())
          ON CONFLICT (key) DO NOTHING
        `);
            }
        }

        console.log(`  ✅ Created ${settings.length} default settings`);
    },

    down: async (db, dbType) => {
        console.log("  Reverting settings seed...");
    }
};
