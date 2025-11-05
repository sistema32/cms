import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { db } from "../config/db.ts";
import { content } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import * as themeHelpers from "../themes/default/helpers/index.ts";
import IndexTemplate from "../themes/default/templates/index.tsx";
import PostTemplate from "../themes/default/templates/post.tsx";

/**
 * Frontend Routes - Rutas públicas del sitio web
 * Usa los templates del theme activo para renderizar páginas
 */

const frontendRouter = new Hono();

// ============= SERVIR ASSETS ESTÁTICOS =============

// Servir archivos estáticos del theme
frontendRouter.get("/themes/*", serveStatic({ root: "./src" }));

// ============= RUTAS PÚBLICAS =============

/**
 * GET / - Página principal (home)
 */
frontendRouter.get("/", async (c) => {
  try {
    // Obtener datos del sitio y custom settings
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Obtener posts
    const posts = await themeHelpers.getRecentPosts(
      custom.posts_per_page || 10
    );

    // Calcular paginación
    const totalPosts = posts.length; // TODO: Obtener total real de la BD
    const pagination = await themeHelpers.getPagination(1, totalPosts);

    // Renderizar template
    return c.html(
      IndexTemplate({
        site,
        custom,
        posts,
        pagination,
      })
    );
  } catch (error: any) {
    console.error("Error rendering home:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /:slug - Post individual por slug
 */
frontendRouter.get("/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    // Buscar el post por slug
    const post = await db.query.content.findFirst({
      where: eq(content.slug, slug),
      with: {
        author: true,
        contentCategories: {
          with: {
            category: true,
          },
        },
        contentTags: {
          with: {
            tag: true,
          },
        },
        featuredImage: true,
      },
    });

    if (!post) {
      return c.text("Post no encontrado", 404);
    }

    // Formatear datos del post
    const postData = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || undefined,
      body: post.body || undefined,
      featureImage: post.featuredImage?.url || undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name || post.author.email,
        email: post.author.email,
      },
      categories: post.contentCategories.map((cc) => ({
        id: cc.category.id,
        name: cc.category.name,
        slug: cc.category.slug,
      })),
      tags: post.contentTags.map((ct) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        slug: ct.tag.slug,
      })),
    };

    // Obtener datos del sitio y custom settings
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Obtener posts relacionados (por ahora, posts recientes)
    const relatedPosts = await themeHelpers.getRecentPosts(3);

    // Renderizar template
    return c.html(
      PostTemplate({
        site,
        custom,
        post: postData,
        relatedPosts,
      })
    );
  } catch (error: any) {
    console.error("Error rendering post:", error);
    return c.text("Error al cargar el post", 500);
  }
});

/**
 * GET /page/:page - Paginación de posts
 */
frontendRouter.get("/page/:page", async (c) => {
  try {
    const page = parseInt(c.req.param("page")) || 1;

    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    const postsPerPage = custom.posts_per_page || 10;

    // TODO: Implementar paginación real con offset/limit
    const posts = await themeHelpers.getRecentPosts(postsPerPage);
    const totalPosts = posts.length;
    const pagination = await themeHelpers.getPagination(page, totalPosts);

    return c.html(
      IndexTemplate({
        site,
        custom,
        posts,
        pagination,
      })
    );
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /category/:slug - Archivo de categoría
 */
frontendRouter.get("/category/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    // TODO: Implementar filtrado por categoría
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    return c.html(
      IndexTemplate({
        site,
        custom,
        posts,
        pagination,
      })
    );
  } catch (error: any) {
    console.error("Error rendering category:", error);
    return c.text("Error al cargar la categoría", 500);
  }
});

/**
 * GET /tag/:slug - Archivo de tag
 */
frontendRouter.get("/tag/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    // TODO: Implementar filtrado por tag
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    return c.html(
      IndexTemplate({
        site,
        custom,
        posts,
        pagination,
      })
    );
  } catch (error: any) {
    console.error("Error rendering tag:", error);
    return c.text("Error al cargar el tag", 500);
  }
});

/**
 * GET /search - Búsqueda
 */
frontendRouter.get("/search", async (c) => {
  try {
    const query = c.req.query("q") || "";

    // TODO: Implementar búsqueda real
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    return c.html(
      IndexTemplate({
        site,
        custom,
        posts,
        pagination,
      })
    );
  } catch (error: any) {
    console.error("Error rendering search:", error);
    return c.text("Error al realizar la búsqueda", 500);
  }
});

export default frontendRouter;
