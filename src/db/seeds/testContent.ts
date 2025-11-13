/**
 * Test Content Seed
 * Crea contenido de prueba para testing del frontend
 */

import { db } from "../../config/db.ts";
import {
  users,
  categories,
  tags,
  content,
  contentCategories,
  contentTags,
  contentTypes
} from "../schema.ts";

export async function seedTestContent() {
  console.log("🌱 Creando contenido de prueba...");

  try {
    // Crear content type "Post" si no existe
    let postType = await db.query.contentTypes.findFirst({
      where: (contentTypes, { eq }) => eq(contentTypes.name, "post")
    });

    if (!postType) {
      [postType] = await db.insert(contentTypes).values({
        name: "post",
        slug: "post",
        description: "Blog posts",
        isPublic: true,
        hasCategories: true,
        hasTags: true,
        hasComments: false
      }).returning();
      console.log("✅ Content type 'post' creado");
    } else {
      console.log("✅ Content type 'post' ya existe");
    }

    // Obtener el primer usuario disponible (normalmente el admin)
    const existingUser = await db.query.users.findFirst();

    if (!existingUser) {
      console.log("⚠️  No se encontró ningún usuario. Ejecuta el seed principal primero.");
      return;
    }

    const userId = existingUser.id;
    console.log(`✅ Usando usuario: ${existingUser.email}`);

    // Crear categorías (solo si no existen)
    let techCat = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, "tecnologia")
    });
    if (!techCat) {
      [techCat] = await db.insert(categories).values({
        name: "Tecnología",
        slug: "tecnologia",
        description: "Artículos sobre tecnología"
      }).returning();
    }

    let newsCat = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.slug, "noticias")
    });
    if (!newsCat) {
      [newsCat] = await db.insert(categories).values({
        name: "Noticias",
        slug: "noticias",
        description: "Últimas noticias"
      }).returning();
    }

    console.log("✅ Categorías verificadas");

    // Crear tags (solo si no existen)
    let jsTag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.slug, "javascript")
    });
    if (!jsTag) {
      [jsTag] = await db.insert(tags).values({
        name: "JavaScript",
        slug: "javascript"
      }).returning();
    }

    let denoTag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.slug, "deno")
    });
    if (!denoTag) {
      [denoTag] = await db.insert(tags).values({
        name: "Deno",
        slug: "deno"
      }).returning();
    }

    let webTag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.slug, "web-development")
    });
    if (!webTag) {
      [webTag] = await db.insert(tags).values({
        name: "Web Development",
        slug: "web-development"
      }).returning();
    }

    console.log("✅ Tags verificados");

    // Crear posts de prueba
    const posts = [
      {
        title: "Introducción a Deno 2.0",
        slug: "introduccion-deno-2",
        excerpt: "Descubre las nuevas características de Deno 2.0 y cómo está revolucionando el desarrollo web moderno.",
        body: `<h2>¿Qué es Deno?</h2>
        <p>Deno es un runtime moderno para JavaScript y TypeScript construido sobre el motor V8 de Chrome.</p>
        <p>En esta guía exploraremos las características más importantes de Deno 2.0.</p>
        <h3>Características principales</h3>
        <ul>
          <li>Soporte nativo de TypeScript</li>
          <li>Seguridad por defecto</li>
          <li>Módulos ES modernos</li>
          <li>APIs Web estándar</li>
        </ul>`,
        status: "published",
        authorId: userId,
        contentTypeId: postType.id
      },
      {
        title: "Construyendo APIs RESTful con Hono",
        slug: "apis-restful-hono",
        excerpt: "Aprende a crear APIs rápidas y escalables usando Hono, el framework web ultra-ligero para Deno.",
        body: `<h2>Hono Framework</h2>
        <p>Hono es un framework web minimalista y ultra-rápido que funciona en múltiples plataformas.</p>
        <h3>¿Por qué Hono?</h3>
        <ul>
          <li>Extremadamente rápido</li>
          <li>Middleware potente</li>
          <li>TypeScript first</li>
          <li>Compatible con Deno, Bun, y Node.js</li>
        </ul>`,
        status: "published",
        authorId: userId,
        contentTypeId: postType.id
      },
      {
        title: "El futuro del desarrollo web",
        slug: "futuro-desarrollo-web",
        excerpt: "Una mirada a las tecnologías emergentes que están transformando la forma en que construimos aplicaciones web.",
        body: `<h2>Tecnologías emergentes</h2>
        <p>El desarrollo web está evolucionando rápidamente con nuevas herramientas y paradigmas.</p>
        <h3>Tendencias clave</h3>
        <ul>
          <li>Edge Computing</li>
          <li>Server Components</li>
          <li>WebAssembly</li>
          <li>Progressive Web Apps</li>
        </ul>`,
        status: "published",
        authorId: userId,
        contentTypeId: postType.id
      }
    ];

    const createdPosts = [];
    for (const post of posts) {
      const [created] = await db.insert(content).values(post).returning();
      createdPosts.push(created);
    }

    console.log("✅ Posts creados");

    // Asignar categorías a posts
    await db.insert(contentCategories).values([
      { contentId: createdPosts[0].id, categoryId: techCat.id },
      { contentId: createdPosts[1].id, categoryId: techCat.id },
      { contentId: createdPosts[2].id, categoryId: newsCat.id }
    ]);

    // Asignar tags a posts
    await db.insert(contentTags).values([
      { contentId: createdPosts[0].id, tagId: denoTag.id },
      { contentId: createdPosts[1].id, tagId: jsTag.id },
      { contentId: createdPosts[1].id, tagId: denoTag.id },
      { contentId: createdPosts[2].id, tagId: webTag.id }
    ]);

    console.log("✅ Relaciones creadas");
    console.log("\n🎉 Contenido de prueba creado exitosamente!");
    console.log(`   - ${createdPosts.length} posts`);
    console.log(`   - 2 categorías`);
    console.log(`   - 3 tags`);

  } catch (error) {
    console.error("❌ Error creando contenido de prueba:", error);
    throw error;
  }
}

// Si se ejecuta directamente
if (import.meta.main) {
  await seedTestContent();
  Deno.exit(0);
}
