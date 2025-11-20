import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0010_test_comments",
    name: "Create Test Comments (Optional)",
    up: async (db, dbType) => {
        console.log("  💬 Creating test comments...");

        // Get first published content
        const contents = await db.all(sql`SELECT id FROM content WHERE status = 'published' LIMIT 1`);
        if (contents.length === 0) {
            console.log("  ⚠️  No published content found, skipping test comments");
            return;
        }
        const contentId = contents[0].id;

        // Get admin user
        const users = await db.all(sql`SELECT id, name, email FROM users WHERE email = 'admin@lexcms.local' LIMIT 1`);
        const userId = users.length > 0 ? users[0].id : null;
        const userName = users.length > 0 ? users[0].name : "Admin";
        const userEmail = users.length > 0 ? users[0].email : "admin@lexcms.local";

        const now = dbType === "sqlite" ? sql`unixepoch()` : sql`NOW()`;

        // Create test comments
        const comments = [
            {
                authorId: userId,
                authorName: userName,
                authorEmail: userEmail,
                body: "¡Excelente artículo! Me ha resultado muy útil la información presentada.",
                status: "approved",
            },
            {
                authorId: null,
                authorName: "Juan Pérez",
                authorEmail: "juan.perez@example.com",
                authorWebsite: "https://juanperez.com",
                body: "Gracias por compartir este contenido. ¿Podrías profundizar más en el tema?",
                status: "approved",
            },
            {
                authorId: null,
                authorName: "María González",
                authorEmail: "maria.gonzalez@example.com",
                body: "Muy interesante, aunque tengo algunas dudas sobre la implementación práctica.",
                status: "approved",
            },
            {
                authorId: null,
                authorName: "Carlos Spam",
                authorEmail: "spam@example.com",
                body: "Compra aquí productos increíbles! Visita nuestro sitio web!!!",
                status: "spam",
            },
        ];

        for (const comment of comments) {
            const bodyCensored = comment.status === "spam" ? "[SPAM BLOQUEADO]" : comment.body;
            const ipAddress = comment.status === "spam" ? "45.123.45.67" : "192.168.1.100";

            if (dbType === "sqlite") {
                await db.run(sql`
          INSERT INTO comments (
            content_id, author_id, author_name, author_email, author_website,
            body, body_censored, status, ip_address, user_agent, created_at, updated_at
          ) VALUES (
            ${contentId}, ${comment.authorId}, ${comment.authorName}, ${comment.authorEmail}, ${comment.authorWebsite || null},
            ${comment.body}, ${bodyCensored}, ${comment.status}, ${ipAddress}, 'Mozilla/5.0', ${now}, ${now}
          )
        `);
            } else {
                await db.execute(sql`
          INSERT INTO comments (
            content_id, author_id, author_name, author_email, author_website,
            body, body_censored, status, ip_address, user_agent, created_at, updated_at
          ) VALUES (
            ${contentId}, ${comment.authorId}, ${comment.authorName}, ${comment.authorEmail}, ${comment.authorWebsite || null},
            ${comment.body}, ${bodyCensored}, ${comment.status}, ${ipAddress}, 'Mozilla/5.0', ${now}, ${now}
          )
        `);
            }
        }

        console.log(`  ✅ Created ${comments.length} test comments (${comments.filter(c => c.status === 'approved').length} approved, ${comments.filter(c => c.status === 'spam').length} spam)`);
    },

    down: async (db, dbType) => {
        console.log("  Reverting test comments...");
    }
};
