import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { db } from "../config/db.ts";
import {
  content,
  categories as categoriesSchema,
  tags as tagsSchema,
  comments,
} from "../db/schema.ts";
import { eq, desc, count, and, isNull } from "drizzle-orm";
import * as themeService from "../services/themeService.ts";
import * as settingsService from "../services/settingsService.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * Frontend Routes - Rutas públicas del sitio web
 * Sistema multi-theme tipo WordPress con carga dinámica de themes
 */

const frontendRouter = new Hono();

/**
 * Get blog base path from settings
 */
async function getBlogBase(): Promise<string> {
  return await settingsService.getSetting("blog_base", "blog");
}

/**
 * Load theme helpers and templates dynamically with fallback to default theme
 */
async function loadThemeModule(modulePath: string) {
  try {
    const fullPath = join(Deno.cwd(), modulePath);
    const module = await import(`file://${fullPath}`);
    return module;
  } catch (error) {
    console.error(`Error loading theme module ${modulePath}:`, error);
    throw error;
  }
}

async function getThemeHelpers() {
  // Always use default theme helpers for core functions like getPaginatedPosts
  // Theme-specific helpers can be added per theme but core functions should be consistent
  const defaultHelpersPath = `src/themes/default/helpers/index.ts`;
  return await loadThemeModule(defaultHelpersPath);
}

async function getThemeTemplate(templateName: string) {
  const activeTheme = await themeService.getActiveTheme();

  // Try active theme first
  const templatePath = `src/themes/${activeTheme}/templates/${templateName}.tsx`;
  const fullPath = join(Deno.cwd(), templatePath);

  try {
    // Check if template exists in active theme
    await Deno.stat(fullPath);
    const module = await loadThemeModule(templatePath);
    return module.default;
  } catch {
    // Fallback to default theme if template doesn't exist
    console.log(`Template ${templateName}.tsx not found in theme ${activeTheme}, falling back to default theme`);
    const defaultTemplatePath = `src/themes/default/templates/${templateName}.tsx`;
    const module = await loadThemeModule(defaultTemplatePath);
    return module.default;
  }
}

/**
 * Load common data needed by all templates (menus, categories, etc.)
 */
async function loadCommonTemplateData() {
  const themeHelpers = await getThemeHelpers();

  // Load menus (main header menu and footer menu)
  const headerMenu = await themeHelpers.getMenu("main");
  const footerMenu = await themeHelpers.getMenu("footer");

  // Load categories (top 6 by post count)
  const categories = await themeHelpers.getCategories(6);

  return {
    headerMenu,
    footerMenu,
    categories,
  };
}

// ============= RUTAS PÚBLICAS =============
// Nota: Los assets estáticos de themes (/themes/*) se sirven desde index.ts

/**
 * GET / - Homepage estática
 * Usa home.tsx (front-page.tsx en WordPress)
 */
frontendRouter.get("/", async (c) => {
  try {
    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const HomeTemplate = await getThemeTemplate("home");

    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const blogUrl = await getBlogBase().then(base => `/${base}`);

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();

    // Obtener posts destacados para la homepage
    const featuredPosts = await themeHelpers.getFeaturedPosts(
      custom.homepage_featured_count || 6
    );

    // Renderizar homepage
    return c.html(
      HomeTemplate({
        site,
        custom,
        activeTheme,
        featuredPosts,
        categories: commonData.categories,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
      })
    );
  } catch (error: any) {
    console.error("Error rendering home:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /:blogBase - Página de blog (página 1)
 * Usa blog.tsx
 * La ruta es dinámica basada en la configuración blog_base
 */
frontendRouter.get("/:blogBase", async (c) => {
  const pathSegment = c.req.param("blogBase");
  const blogBase = await getBlogBase();

  // Verificar si esta ruta es para el blog
  if (pathSegment !== blogBase) {
    return c.notFound();
  }
  try {
    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const BlogTemplate = await getThemeTemplate("blog");

    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();

    // Obtener posts paginados
    const { posts, total, totalPages } = await themeHelpers.getPaginatedPosts(1);

    // Calcular paginación
    const pagination = await themeHelpers.getPagination(1, total);

    // Posts recientes para sidebar
    const recentPosts = await themeHelpers.getRecentPosts(5);

    // Tags para sidebar
    const tags = await themeHelpers.getPopularTags(20);

    // Renderizar blog
    return c.html(
      BlogTemplate({
        site,
        custom,
        activeTheme,
        posts,
        pagination,
        recentPosts,
        categories: commonData.categories,
        tags,
        blogBase,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
      })
    );
  } catch (error: any) {
    console.error("Error rendering blog:", error);
    return c.text("Error al cargar el blog", 500);
  }
});

/**
 * GET /:blogBase/page/:page - Paginación del blog
 * Usa blog.tsx
 * La ruta es dinámica basada en la configuración blog_base
 */
frontendRouter.get("/:blogBase/page/:page", async (c) => {
  try {
    const pathSegment = c.req.param("blogBase");
    const blogBase = await getBlogBase();

    // Verificar si esta ruta es para el blog
    if (pathSegment !== blogBase) {
      return c.notFound();
    }

    const page = parseInt(c.req.param("page")) || 1;

    // Redirigir a /:blogBase si es página 1
    if (page === 1) {
      return c.redirect(`/${blogBase}`, 301);
    }

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const BlogTemplate = await getThemeTemplate("blog");

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

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();

    // Posts recientes para sidebar
    const recentPosts = await themeHelpers.getRecentPosts(5);

    // Tags para sidebar
    const tags = await themeHelpers.getPopularTags(20);

    // Renderizar blog
    return c.html(
      BlogTemplate({
        site,
        custom,
        activeTheme,
        posts,
        pagination,
        recentPosts,
        categories: commonData.categories,
        tags,
        blogBase,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
      })
    );
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /:blogBase/:slug - Post individual
 * Usa post.tsx
 * La ruta es dinámica basada en la configuración blog_base
 */
frontendRouter.get("/:blogBase/:slug", async (c) => {
  try {
    const pathSegment = c.req.param("blogBase");
    const blogBase = await getBlogBase();

    // Verificar si esta ruta es para el blog
    if (pathSegment !== blogBase) {
      return c.notFound();
    }

    const { slug } = c.req.param();

    // Si slug está vacío o es "page", redirigir al blog principal
    if (!slug || slug === '' || slug === 'page') {
      return c.redirect(`/${blogBase}`, 301);
    }

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

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const PostTemplate = await getThemeTemplate("post");

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

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();

    // Obtener posts relacionados (por ahora, posts recientes)
    const relatedPosts = await themeHelpers.getRecentPosts(3);

    const blogUrl = await getBlogBase().then(base => `/${base}`);

    // Load comments for this post
    const postComments = await db.query.comments.findMany({
      where: and(
        eq(comments.contentId, post.id),
        eq(comments.status, "approved"),
        isNull(comments.deletedAt),
        isNull(comments.parentId) // Only top-level comments
      ),
      orderBy: [desc(comments.createdAt)],
      limit: 50,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Get comments stats
    const [approvedCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.contentId, post.id),
          eq(comments.status, "approved"),
          isNull(comments.deletedAt)
        )
      );

    const [pendingCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.contentId, post.id),
          eq(comments.status, "pending"),
          isNull(comments.deletedAt)
        )
      );

    const commentsStats = {
      total: approvedCount.count + pendingCount.count,
      approved: approvedCount.count,
      pending: pendingCount.count,
    };

    // Format comments
    const formattedComments = postComments.map((comment) => ({
      id: comment.id,
      parentId: comment.parentId,
      author: {
        id: comment.authorId || undefined,
        name: comment.authorName,
        email: comment.authorEmail,
        website: comment.authorWebsite || undefined,
        avatar: comment.author?.avatar || undefined,
      },
      body: comment.body,
      bodyCensored: comment.bodyCensored,
      createdAt: comment.createdAt,
      status: comment.status as "approved" | "pending" | "spam" | "deleted",
    }));

    // Renderizar template
    return c.html(
      PostTemplate({
        site,
        custom,
        activeTheme,
        post: postData,
        relatedPosts,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
        comments: formattedComments,
        commentsStats,
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

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // TODO: Implementar filtrado por categoría
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then(base => `/${base}`);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
        posts,
        pagination,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
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

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // TODO: Implementar filtrado por tag
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then(base => `/${base}`);
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
        posts,
        pagination,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
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

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // TODO: Implementar búsqueda real
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const posts = await themeHelpers.getRecentPosts(10);
    const pagination = await themeHelpers.getPagination(1, posts.length);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
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
