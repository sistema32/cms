import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0003_cms_seed",
    name: "Seed CMS (Content Types, Categories, Tags)",
    up: async (db, dbType) => {
        console.log("  📝 Seeding CMS data...");

        const now = dbType === "sqlite" ? "unixepoch()" : "NOW()";
        const nowValue = dbType === "sqlite" ? sql`unixepoch()` : sql`NOW()`;

        // 1. Content Types
        if (dbType === "sqlite") {
            await db.run(sql`
        INSERT OR IGNORE INTO content_types (name, slug, description, icon, is_public, has_categories, has_tags, has_comments, created_at, updated_at)
        VALUES 
          ('Post', 'post', 'Entradas de blog estándar', '📝', 1, 1, 1, 1, unixepoch(), unixepoch()),
          ('Page', 'page', 'Páginas estáticas del sitio', '📄', 1, 0, 0, 0, unixepoch(), unixepoch())
      `);
        } else {
            await db.execute(sql`
        INSERT INTO content_types (name, slug, description, icon, is_public, has_categories, has_tags, has_comments, created_at, updated_at)
        VALUES 
          ('Post', 'post', 'Entradas de blog estándar', '📝', true, true, true, true, NOW(), NOW()),
          ('Page', 'page', 'Páginas estáticas del sitio', '📄', true, false, false, false, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
      `);
        }

        // 2. Categories (necesitamos obtener el ID del content type 'post')
        // Por simplicidad, asumimos que 'post' tiene ID 1 (primera inserción)
        const categories = [
            { name: "Tecnología", slug: "tecnologia", description: "Artículos sobre tecnología y desarrollo", color: "#3b82f6", icon: "💻", order: 1, parentId: null },
            { name: "Diseño", slug: "diseno", description: "Artículos sobre diseño y UX/UI", color: "#8b5cf6", icon: "🎨", order: 2, parentId: null },
            { name: "Negocios", slug: "negocios", description: "Artículos sobre negocios y emprendimiento", color: "#10b981", icon: "💼", order: 3, parentId: null },
        ];

        for (const cat of categories) {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO categories (name, slug, description, parent_id, content_type_id, color, icon, "order", created_at, updated_at)
          VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.parentId}, 1, ${cat.color}, ${cat.icon}, ${cat.order}, unixepoch(), unixepoch())
        `);
            } else {
                await db.execute(sql`
          INSERT INTO categories (name, slug, description, parent_id, content_type_id, color, icon, "order", created_at, updated_at)
          VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.parentId}, 1, ${cat.color}, ${cat.icon}, ${cat.order}, NOW(), NOW())
          ON CONFLICT (slug) DO NOTHING
        `);
            }
        }

        // 3. Tags
        const tags = [
            { name: "JavaScript", slug: "javascript", description: "Todo sobre JavaScript", color: "#f7df1e" },
            { name: "TypeScript", slug: "typescript", description: "TypeScript y tipos", color: "#3178c6" },
            { name: "Deno", slug: "deno", description: "Runtime de Deno", color: "#000000" },
            { name: "React", slug: "react", description: "Biblioteca React", color: "#61dafb" },
            { name: "API", slug: "api", description: "Desarrollo de APIs", color: "#ef4444" },
            { name: "Tutorial", slug: "tutorial", description: "Tutoriales paso a paso", color: "#06b6d4" },
            { name: "Guía", slug: "guia", description: "Guías completas", color: "#8b5cf6" },
        ];

        for (const tag of tags) {
            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO tags (name, slug, description, color, created_at)
          VALUES (${tag.name}, ${tag.slug}, ${tag.description}, ${tag.color}, unixepoch())
        `);
            } else {
                await db.execute(sql`
          INSERT INTO tags (name, slug, description, color, created_at)
          VALUES (${tag.name}, ${tag.slug}, ${tag.description}, ${tag.color}, NOW())
          ON CONFLICT (slug) DO NOTHING
        `);
            }
        }

        console.log("  ✅ CMS seed completed: 2 content types, 3 categories, 7 tags");
    },

    down: async (db, dbType) => {
        console.log("  Reverting CMS seed...");
    }
};
