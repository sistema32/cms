import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0006_default_menus",
    name: "Create Default Menus",
    up: async (db, dbType) => {
        console.log("  🧭 Creating default menus...");

        const now = dbType === "sqlite" ? sql`unixepoch()` : sql`NOW()`;
        const boolTrue = dbType === "sqlite" ? 1 : true;

        // 1. Crear menús
        if (dbType === "sqlite") {
            await db.run(sql`
        INSERT OR IGNORE INTO menus (name, slug, description, is_active, created_at, updated_at)
        VALUES 
          ('Main Menu', 'main-menu', 'Menú principal del sitio', ${boolTrue}, ${now}, ${now}),
          ('Footer Menu', 'footer-menu', 'Menú del pie de página', ${boolTrue}, ${now}, ${now})
      `);
        } else {
            await db.execute(sql`
        INSERT INTO menus (name, slug, description, is_active, created_at, updated_at)
        VALUES 
          ('Main Menu', 'main-menu', 'Menú principal del sitio', ${boolTrue}, ${now}, ${now}),
          ('Footer Menu', 'footer-menu', 'Menú del pie de página', ${boolTrue}, ${now}, ${now})
        ON CONFLICT (slug) DO NOTHING
      `);
        }

        // 2. Crear items del menú principal (asumimos menu_id = 1)
        const menuItems = [
            { label: "Inicio", url: "/", order: 1 },
            { label: "Blog", url: "/blog", order: 2 },
            { label: "Acerca de", url: "/about", order: 3 },
            { label: "Contacto", url: "/contact", order: 4 },
        ];

        for (const item of menuItems) {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO menu_items (menu_id, label, url, "order", is_visible, target, created_at, updated_at)
          VALUES (1, ${item.label}, ${item.url}, ${item.order}, ${boolTrue}, '_self', ${now}, ${now})
        `);
            } else {
                await db.execute(sql`
          INSERT INTO menu_items (menu_id, label, url, "order", is_visible, target, created_at, updated_at)
          VALUES (1, ${item.label}, ${item.url}, ${item.order}, ${boolTrue}, '_self', ${now}, ${now})
          ON CONFLICT DO NOTHING
        `);
            }
        }

        console.log(`  ✅ Created 2 menus with ${menuItems.length} items`);
    },

    down: async (db, dbType) => {
        console.log("  Reverting default menus...");
    }
};
