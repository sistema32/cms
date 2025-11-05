import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { db } from "../config/db.ts";
import { content, categories as categoriesSchema, tags as tagsSchema } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import * as themeHelpers from "../themes/default/helpers/index.ts";
import IndexTemplate from "../themes/default/templates/index.tsx";
import HomeTemplate from "../themes/default/templates/home.tsx";
import BlogTemplate from "../themes/default/templates/blog.tsx";
import PostTemplate from "../themes/default/templates/post.tsx";

/**
 * Frontend Routes - Rutas públicas del sitio web
 * Sistema multi-theme tipo WordPress
 */

const frontendRouter = new Hono();

// ============= SERVIR ASSETS ESTÁTICOS =============

// Servir archivos estáticos del theme
frontendRouter.get("/themes/*", serveStatic({ root: "./src" }));

// ============= RUTAS PÚBLICAS =============

/**
 * GET / - Homepage estática
 * Usa home.tsx (front-page.tsx en WordPress)
 */
frontendRouter.get("/", async (c) => {
  try {
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Obtener posts destacados para la homepage
    const featuredPosts = await themeHelpers.getFeaturedPosts(
      custom.homepage_featured_count || 6
    );

    // Obtener categorías para la sección de categorías
    const allCategories = await db.query.categories.findMany({
      limit: 6,
      orderBy: [desc(categoriesSchema.id)],
    });

    const categories = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: 0, // TODO: Contar posts por categoría
    }));

    // Renderizar homepage
    return c.html(
      HomeTemplate({
        site,
        custom,
        featuredPosts,
        categories,
      })
    );
  } catch (error: any) {
    console.error("Error rendering home:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /blog - Página de blog (página 1)
 * Usa blog.tsx
 */
frontendRouter.get("/blog", async (c) => {
  try {
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Obtener posts paginados
    const { posts, total, totalPages } = await themeHelpers.getPaginatedPosts(1);

    // Calcular paginación
    const pagination = await themeHelpers.getPagination(1, total);

    // Posts recientes para sidebar
    const recentPosts = await themeHelpers.getRecentPosts(5);

    // Categorías para sidebar
    const allCategories = await db.query.categories.findMany({
      limit: 10,
    });
    const categories = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: 0,
    }));

    // Tags para sidebar
    const allTags = await db.query.tags.findMany({
      limit: 20,
    });
    const tags = allTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: 0,
    }));

    // Renderizar blog
    return c.html(
      BlogTemplate({
        site,
        custom,
        posts,
        pagination,
        recentPosts,
        categories,
        tags,
      })
    );
  } catch (error: any) {
    console.error("Error rendering blog:", error);
    return c.text("Error al cargar el blog", 500);
  }
});

/**
 * GET /blog/page/:page - Paginación del blog
 * Usa blog.tsx
 */
frontendRouter.get("/blog/page/:page", async (c) => {
  try {
    const page = parseInt(c.req.param("page")) || 1;

    // Redirigir a /blog si es página 1
    if (page === 1) {
      return c.redirect("/blog", 301);
    }

    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Obtener posts paginados
    const { posts, total, totalPages } = await themeHelpers.getPaginatedPosts(page);

    // Si la página no existe, 404
    if (page > totalPages) {
      return c.text("Página no encontrada", 404);
    }

    // Calcular paginación
    const pagination = await themeHelpers.getPagination(page, total);

    // Posts recientes para sidebar
    const recentPosts = await themeHelpers.getRecentPosts(5);

    // Categorías para sidebar
    const allCategories = await db.query.categories.findMany({
      limit: 10,
    });
    const categories = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: 0,
    }));

    // Tags para sidebar
    const allTags = await db.query.tags.findMany({
      limit: 20,
    });
    const tags = allTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: 0,
    }));

    // Renderizar blog
    return c.html(
      BlogTemplate({
        site,
        custom,
        posts,
        pagination,
        recentPosts,
        categories,
        tags,
      })
    );
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /blog/:slug - Post individual
 * Usa post.tsx
 */
frontendRouter.get("/blog/:slug", async (c) => {
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
 * GET /category/:slug - Archivo de categoría
 * TODO: Crear template category.tsx
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
 * TODO: Crear template tag.tsx
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
 * TODO: Crear template search.tsx
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
