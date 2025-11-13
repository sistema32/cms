/**
 * Test Comments Seed
 * Crea comentarios de prueba para testing del sistema de comentarios
 */

import { db } from "../../config/db.ts";
import { comments, content, users } from "../schema.ts";
import { eq } from "drizzle-orm";

export async function seedTestComments() {
  console.log("💬 Creando comentarios de prueba...");

  try {
    // Verificar si ya existen comentarios
    const existingComments = await db.query.comments.findMany({
      limit: 1,
    });

    if (existingComments.length > 0) {
      console.log("ℹ️  Ya existen comentarios en la base de datos. Saltando seed.");
      return;
    }

    // Obtener el primer usuario disponible
    const adminUser = await db.query.users.findFirst();

    if (!adminUser) {
      console.log("⚠️  No se encontró ningún usuario. Ejecuta el seed principal primero.");
      return;
    }

    // Obtener el primer contenido publicado
    const firstContent = await db.query.content.findFirst({
      where: eq(content.status, "published"),
    });

    if (!firstContent) {
      console.log("⚠️  No se encontró contenido publicado. Crea contenido primero para agregar comentarios.");
      return;
    }

    // Crear comentarios de ejemplo
    const testComments = [
      {
        contentId: firstContent.id,
        authorId: adminUser.id,
        authorName: adminUser.name || "Admin User",
        authorEmail: adminUser.email,
        body: "¡Excelente artículo! Me ha resultado muy útil la información presentada.",
        bodyCensored: "¡Excelente artículo! Me ha resultado muy útil la información presentada.",
        status: "approved",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
      {
        contentId: firstContent.id,
        authorId: null, // Guest comment
        authorName: "Juan Pérez",
        authorEmail: "juan.perez@example.com",
        authorWebsite: "https://juanperez.com",
        body: "Gracias por compartir este contenido. ¿Podrías profundizar más en el tema?",
        bodyCensored: "Gracias por compartir este contenido. ¿Podrías profundizar más en el tema?",
        status: "approved",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
      },
      {
        contentId: firstContent.id,
        authorId: null,
        authorName: "María González",
        authorEmail: "maria.gonzalez@example.com",
        body: "Muy interesante, aunque tengo algunas dudas sobre la implementación práctica.",
        bodyCensored: "Muy interesante, aunque tengo algunas dudas sobre la implementación práctica.",
        status: "approved",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0",
      },
      {
        contentId: firstContent.id,
        authorId: null,
        authorName: "Carlos Ruiz",
        authorEmail: "carlos.spam@example.com",
        body: "Compra aquí productos increíbles! Visita nuestro sitio web para ofertas especiales!!!",
        bodyCensored: "Compra aquí productos increíbles! Visita nuestro sitio web para ofertas especiales!!!",
        status: "spam",
        ipAddress: "45.123.45.67",
        userAgent: "Python-urllib/3.8",
      },
      {
        contentId: firstContent.id,
        authorId: null,
        authorName: "Ana López",
        authorEmail: "ana.lopez@example.com",
        body: "He leído varios artículos sobre este tema, pero este es definitivamente uno de los mejores. Felicidades!",
        bodyCensored: "He leído varios artículos sobre este tema, pero este es definitivamente uno de los mejores. Felicidades!",
        status: "approved",
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
      },
      {
        contentId: firstContent.id,
        authorId: null,
        authorName: "Pedro Martínez",
        authorEmail: "pedro.martinez@example.com",
        body: "Esto es basura, ¡qué mierda de contenido! No vale para nada.",
        bodyCensored: "Esto es [censurado], ¡qué [censurado] de contenido! No vale para nada.",
        status: "pending",
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
      },
      {
        contentId: firstContent.id,
        authorId: adminUser.id,
        authorName: adminUser.name || "Admin User",
        authorEmail: adminUser.email,
        body: "Gracias a todos por sus comentarios. Pronto publicaré una segunda parte profundizando en estos temas.",
        bodyCensored: "Gracias a todos por sus comentarios. Pronto publicaré una segunda parte profundizando en estos temas.",
        status: "approved",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
      {
        contentId: firstContent.id,
        authorId: null,
        authorName: "Laura Sánchez",
        authorEmail: "laura.sanchez@example.com",
        body: "¿Cuándo estará disponible la segunda parte? Estoy muy interesada en seguir aprendiendo.",
        bodyCensored: "¿Cuándo estará disponible la segunda parte? Estoy muy interesada en seguir aprendiendo.",
        status: "pending",
        ipAddress: "192.168.1.104",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
      },
    ];

    // Insertar comentarios con timestamps escalonados
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < testComments.length; i++) {
      const comment = testComments[i];
      const createdAt = new Date(now - (testComments.length - i) * oneDayMs / 2);

      await db.insert(comments).values({
        ...comment,
        createdAt,
        updatedAt: createdAt,
      });
    }

    console.log(`✅ ${testComments.length} comentarios de prueba creados`);
    console.log(`   - ${testComments.filter(c => c.status === "approved").length} aprobados`);
    console.log(`   - ${testComments.filter(c => c.status === "pending").length} pendientes`);
    console.log(`   - ${testComments.filter(c => c.status === "spam").length} marcados como spam`);

    // Crear algunos comentarios anidados (respuestas)
    const parentComment = await db.query.comments.findFirst({
      where: eq(comments.authorEmail, "juan.perez@example.com"),
    });

    if (parentComment) {
      const replies = [
        {
          contentId: firstContent.id,
          parentId: parentComment.id,
          authorId: adminUser.id,
          authorName: adminUser.name || "Admin User",
          authorEmail: adminUser.email,
          body: "¡Claro! En la próxima publicación profundizaré en los puntos que mencionas. Gracias por el feedback.",
          bodyCensored: "¡Claro! En la próxima publicación profundizaré en los puntos que mencionas. Gracias por el feedback.",
          status: "approved",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
        {
          contentId: firstContent.id,
          parentId: parentComment.id,
          authorId: null,
          authorName: "Roberto Díaz",
          authorEmail: "roberto.diaz@example.com",
          body: "Yo también estoy interesado en ese tema. +1 a la sugerencia de Juan.",
          bodyCensored: "Yo también estoy interesado en ese tema. +1 a la sugerencia de Juan.",
          status: "approved",
          ipAddress: "192.168.1.105",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0",
        },
      ];

      for (const reply of replies) {
        const createdAt = new Date(now - oneDayMs / 4);
        await db.insert(comments).values({
          ...reply,
          createdAt,
          updatedAt: createdAt,
        });
      }

      console.log(`✅ ${replies.length} respuestas (comentarios anidados) creadas`);
    }

  } catch (error) {
    console.error("❌ Error al crear comentarios de prueba:", error);
    throw error;
  }
}
