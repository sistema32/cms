import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0009_test_content",
    name: "Create Test Content (Optional)",
    up: async (db, dbType) => {
        console.log("  📝 Creating test content...");

        // Get user ID (admin)
        const users = await db.all(sql`SELECT id FROM users WHERE email = 'admin@lexcms.local' LIMIT 1`);
        if (users.length === 0) {
            console.log("  ⚠️  No admin user found, skipping test content");
            return;
        }
        const userId = users[0].id;

        // Get content type ID (post)
        const contentTypes = await db.all(sql`SELECT id FROM content_types WHERE slug = 'post' LIMIT 1`);
        if (contentTypes.length === 0) {
            console.log("  ⚠️  No 'post' content type found, skipping");
            return;
        }
        const postTypeId = contentTypes[0].id;

        // Get category IDs
        const techCat = await db.all(sql`SELECT id FROM categories WHERE slug = 'tecnologia' LIMIT 1`);
        const newsCat = await db.all(sql`SELECT id FROM categories WHERE slug = 'negocios' LIMIT 1`);

        // Get tag IDs
        const jsTag = await db.all(sql`SELECT id FROM tags WHERE slug = 'javascript' LIMIT 1`);
        const denoTag = await db.all(sql`SELECT id FROM tags WHERE slug = 'deno' LIMIT 1`);

        const now = dbType === "sqlite" ? sql`unixepoch()` : sql`NOW()`;

        // Create test posts
        const posts = [
            {
                title: "Introducción a Deno 2.0",
                slug: "introduccion-deno-2",
                excerpt: "Descubre las nuevas características de Deno 2.0 y cómo está revolucionando el desarrollo web moderno.",
                body: "<h2>¿Qué es Deno?</h2><p>Deno es un runtime moderno para JavaScript y TypeScript construido sobre el motor V8 de Chrome.</p><h3>Características principales</h3><ul><li>Soporte nativo de TypeScript</li><li>Seguridad por defecto</li><li>Módulos ES modernos</li><li>APIs Web estándar</li></ul>",
                status: "published",
            },
            {
                title: "Construyendo APIs RESTful con Hono",
                slug: "apis-restful-hono",
                excerpt: "Aprende a crear APIs rápidas y escalables usando Hono, el framework web ultra-ligero para Deno.",
                body: "<h2>Hono Framework</h2><p>Hono es un framework web minimalista y ultra-rápido que funciona en múltiples plataformas.</p><h3>¿Por qué Hono?</h3><ul><li>Extremadamente rápido</li><li>Middleware potente</li><li>TypeScript first</li><li>Compatible con Deno, Bun, y Node.js</li></ul>",
                status: "published",
            },
            {
                title: "El futuro del desarrollo web",
                slug: "futuro-desarrollo-web",
                excerpt: "Una mirada a las tecnologías emergentes que están transformando la forma en que construimos aplicaciones web.",
                body: "<h2>Tecnologías emergentes</h2><p>El desarrollo web está evolucionando rápidamente con nuevas herramientas y paradigmas.</p><h3>Tendencias clave</h3><ul><li>Edge Computing</li><li>Server Components</li><li>WebAssembly</li><li>Progressive Web Apps</li></ul>",
                status: "published",
            },
        ];

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];

            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT OR IGNORE INTO content (title, slug, excerpt, body, status, author_id, content_type_id, created_at, updated_at, published_at)
          VALUES (${post.title}, ${post.slug}, ${post.excerpt}, ${post.body}, ${post.status}, ${userId}, ${postTypeId}, ${now}, ${now}, ${now})
        `);
            } else {
                await db.execute(sql`
          INSERT INTO content (title, slug, excerpt, body, status, author_id, content_type_id, created_at, updated_at, published_at)
          VALUES (${post.title}, ${post.slug}, ${post.excerpt}, ${post.body}, ${post.status}, ${userId}, ${postTypeId}, ${now}, ${now}, ${now})
          ON CONFLICT (slug) DO NOTHING
        `);
            }

            // Get the created content ID
            const contentResult = await db.all(sql`SELECT id FROM content WHERE slug = ${post.slug} LIMIT 1`);
            if (contentResult.length > 0) {
                const contentId = contentResult[0].id;

                // Assign categories
                if (i === 0 && techCat.length > 0) {
                    if (dbType === "sqlite") {
                        await db.run(sql`INSERT OR IGNORE INTO content_categories (content_id, category_id) VALUES (${contentId}, ${techCat[0].id})`);
                    } else {
                        await db.execute(sql`INSERT INTO content_categories (content_id, category_id) VALUES (${contentId}, ${techCat[0].id}) ON CONFLICT DO NOTHING`);
                    }
                }
                if (i === 1 && techCat.length > 0) {
                    if (dbType === "sqlite") {
                        await db.run(sql`INSERT OR IGNORE INTO content_categories (content_id, category_id) VALUES (${contentId}, ${techCat[0].id})`);
                    } else {
                        await db.execute(sql`INSERT INTO content_categories (content_id, category_id) VALUES (${contentId}, ${techCat[0].id}) ON CONFLICT DO NOTHING`);
                    }
                }
                if (i === 2 && newsCat.length > 0) {
                    if (dbType === "sqlite") {
                        await db.run(sql`INSERT OR IGNORE INTO content_categories (content_id, category_id) VALUES (${contentId}, ${newsCat[0].id})`);
                    } else {
                        await db.execute(sql`INSERT INTO content_categories (content_id, category_id) VALUES (${contentId}, ${newsCat[0].id}) ON CONFLICT DO NOTHING`);
                    }
                }

                // Assign tags
                if (i === 0 && denoTag.length > 0) {
                    if (dbType === "sqlite") {
                        await db.run(sql`INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${denoTag[0].id})`);
                    } else {
                        await db.execute(sql`INSERT INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${denoTag[0].id}) ON CONFLICT DO NOTHING`);
                    }
                }
                if (i === 1 && jsTag.length > 0 && denoTag.length > 0) {
                    if (dbType === "sqlite") {
                        await db.run(sql`INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${jsTag[0].id})`);
                        await db.run(sql`INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${denoTag[0].id})`);
                    } else {
                        await db.execute(sql`INSERT INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${jsTag[0].id}) ON CONFLICT DO NOTHING`);
                        await db.execute(sql`INSERT INTO content_tags (content_id, tag_id) VALUES (${contentId}, ${denoTag[0].id}) ON CONFLICT DO NOTHING`);
                    }
                }
            }
        }

        console.log(`  ✅ Created ${posts.length} test posts with categories and tags`);
    },

    down: async (db, dbType) => {
        console.log("  Reverting test content...");
    }
};
