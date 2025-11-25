import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { db } from "../config/db.ts";
import {
  categories as categoriesSchema,
  comments,
  content,
  tags as tagsSchema,
} from "../db/schema.ts";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import * as themeService from "../services/themeService.ts";
import * as settingsService from "../services/settingsService.ts";
import * as contentTypeService from "../services/contentTypeService.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { SEOHelper } from "../lib/seo/SEOHelper.ts";
import { StructuredDataGenerator } from "../lib/seo/StructuredDataGenerator.ts";
import { URLOptimizer } from "../lib/seo-optimization/URLOptimizer.ts";
import { env } from "../config/env.ts";
import { hookManager } from "../lib/plugin-system/HookManager.ts";

/**
 * Frontend Routes - Rutas públicas del sitio web
 * Sistema multi-theme tipo WordPress con carga dinámica de themes
 */

const frontendRouter = new Hono();

/**
 * Cache en memoria para common data
 */
const commonDataCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Invalida el cache de common data
 */
export function invalidateCommonDataCache() {
  commonDataCache.clear();
  console.log("✅ Common data cache invalidated");
}

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
  // Use helper loader service (loads once on theme activation, then cached)
  const { loadThemeHelpers } = await import("../services/themeHelperLoader.ts");
  const activeTheme = await themeService.getActiveTheme();
  return await loadThemeHelpers(activeTheme);
}

/**
 * Crea un template de emergencia cuando falla la carga
 */
function createEmergencyTemplate(templateName: string, themeName: string) {
  return (props: any) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Template no encontrado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      padding: 40px;
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a202c;
      font-size: 28px;
      margin-bottom: 16px;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    code {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: 'Courier New', monospace;
      color: #e53e3e;
    }
    .details {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      text-align: left;
    }
    .details h3 {
      color: #c53030;
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    a {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover {
      background: #5a67d8;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Error de configuración del theme</h1>
    <p>El template <code>${templateName}.tsx</code> no se encontró en el theme <code>${themeName}</code> ni en el theme por defecto.</p>

    <div class="details">
      <h3>Detalles técnicos</h3>
      <p><strong>Template solicitado:</strong> ${templateName}.tsx</p>
      <p><strong>Theme activo:</strong> ${themeName}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>

    <p style="margin-top: 24px; font-size: 14px;">
      Este error ha sido reportado automáticamente al administrador del sitio.
    </p>

    <a href="/">Volver al inicio</a>
  </div>
</body>
</html>`;
  };
}

/**
 * Notifica al admin sobre templates faltantes
 */
async function notifyAdminAboutMissingTemplate(
  templateName: string,
  themeName: string,
) {
  try {
    const errorKey = `theme_error_missing_template_${Date.now()}`;
    await settingsService.updateSetting(
      errorKey,
      JSON.stringify({
        type: "missing_template",
        template: templateName,
        theme: themeName,
        timestamp: new Date().toISOString(),
      }),
    );
    console.error(
      `❌ CRITICAL: Missing template "${templateName}.tsx" in theme "${themeName}" - Error logged to settings`,
    );
  } catch (error) {
    console.error("Failed to log missing template error:", error);
  }
}

/**
 * Obtiene un template con manejo robusto de errores
 */
async function getThemeTemplate(templateName: string) {
  const activeTheme = await themeService.getActiveTheme();

  // Try 1: Active theme
  let templatePath =
    `src/themes/${activeTheme}/templates/${templateName}.tsx`;
  let fullPath = join(Deno.cwd(), templatePath);

  try {
    await Deno.stat(fullPath);
    const module = await loadThemeModule(templatePath);

    // Apply theme:template filter (allows plugins to override template)
    const filteredPath = await hookManager.applyFilters("theme:template", templatePath, templateName, activeTheme);
    if (filteredPath !== templatePath) {
      console.log(`🔄 Template overridden by filter: ${filteredPath}`);
      const overrideModule = await loadThemeModule(filteredPath);
      return overrideModule.default;
    }

    return module.default;
  } catch (error) {
    console.warn(
      `⚠️  Template ${templateName}.tsx not found in theme ${activeTheme}, trying fallback...`,
    );
  }

  // Try 2: Default theme
  try {
    const defaultTemplatePath =
      `src/themes/default/templates/${templateName}.tsx`;
    const module = await loadThemeModule(defaultTemplatePath);
    console.log(`✅ Using fallback template from default theme`);

    // Apply filter even for fallback
    const filteredPath = await hookManager.applyFilters("theme:template", defaultTemplatePath, templateName, "default");
    if (filteredPath !== defaultTemplatePath) {
      const overrideModule = await loadThemeModule(filteredPath);
      return overrideModule.default;
    }

    return module.default;
  } catch (error) {
    console.error(
      `❌ CRITICAL: Template ${templateName}.tsx not found in default theme!`,
    );
  }

  // Try 3: Emergency fallback
  await notifyAdminAboutMissingTemplate(templateName, activeTheme);
  return createEmergencyTemplate(templateName, activeTheme);
}

/**
 * Carga un template de página con sistema de fallback multinivel
 * @param templateName - Nombre del template personalizado (ej: "page-inicio")
 * @param activeTheme - Tema activo
 * @returns Template module
 */
async function loadPageTemplate(
  templateName: string | null,
  activeTheme: string,
) {
  // Nivel 1: Template personalizado en tema activo
  // Ejemplo: themes/modern/templates/pages/page-inicio.tsx
  if (templateName) {
    let customPath =
      `src/themes/${activeTheme}/templates/pages/${templateName}.tsx`;
    let fullPath = join(Deno.cwd(), customPath);

    try {
      await Deno.stat(fullPath);

      // Apply theme:pageTemplate filter
      customPath = await hookManager.applyFilters("theme:pageTemplate", customPath, templateName, activeTheme);

      const module = await loadThemeModule(customPath);
      console.log(
        `✅ Cargando template personalizado: ${templateName} (${activeTheme})`,
      );
      return module.default;
    } catch (error) {
      console.log(
        `⚠️ Template personalizado no encontrado: ${templateName} en ${activeTheme}`,
      );
    }
  }

  // Nivel 2: Template default del tema activo
  // Ejemplo: themes/modern/templates/page.tsx
  let themeDefaultPath = `src/themes/${activeTheme}/templates/page.tsx`;
  let themeDefaultFullPath = join(Deno.cwd(), themeDefaultPath);

  try {
    await Deno.stat(themeDefaultFullPath);

    // Apply theme:pageTemplate filter
    themeDefaultPath = await hookManager.applyFilters("theme:pageTemplate", themeDefaultPath, null, activeTheme);

    const module = await loadThemeModule(themeDefaultPath);
    console.log(`✅ Usando template default del tema: ${activeTheme}`);
    return module.default;
  } catch (error) {
    console.log(`⚠️ Template default no encontrado en tema: ${activeTheme}`);
  }

  // Nivel 3: Template default del tema base (fallback final)
  // Ejemplo: themes/base/templates/page.tsx
  const basePath = `src/themes/base/templates/page.tsx`;
  const baseFullPath = join(Deno.cwd(), basePath);

  try {
    await Deno.stat(baseFullPath);
    const module = await loadThemeModule(basePath);
    console.log(`✅ Usando template default del tema base (fallback)`);
    return module.default;
  } catch (error) {
    console.error(`❌ CRITICAL: No se pudo cargar ningún template de página!`);
  }

  // Nivel 4: Error crítico
  const errorMsg =
    `No se pudo cargar ningún template de página. Template solicitado: ${templateName}, Tema: ${activeTheme}`;
  console.error(errorMsg);
  await notifyAdminAboutMissingTemplate(templateName || "page", activeTheme);
  return createEmergencyTemplate(templateName || "page", activeTheme);
}

/**
 * Load common data needed by all templates (menus, categories, etc.)
 * Con caching para mejorar performance
 */
async function loadCommonTemplateData() {
  const cacheKey = "common_template_data";
  const cached = commonDataCache.get(cacheKey);

  // Retornar desde cache si es válido
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Cargar datos frescos
  const themeHelpers = await getThemeHelpers();

  // Usar Promise.all para cargar en paralelo
  const [headerMenu, footerMenu, categories] = await Promise.all([
    themeHelpers.getMenu("main"),
    themeHelpers.getMenu("footer"),
    themeHelpers.getCategories(6),
  ]);

  const data = {
    headerMenu,
    footerMenu,
    categories,
  };

  // Guardar en cache
  commonDataCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

// ============= FUNCIONES AUXILIARES DE SEO =============

const seoHelper = SEOHelper.getInstance();
const structuredDataGenerator = new StructuredDataGenerator();
const urlOptimizer = new URLOptimizer();

/**
 * Genera todos los meta tags SEO completos para una página
 */
async function generateSEOMetaTags(options: {
  content?: any;
  url: string;
  pageType?: "article" | "website" | "blog";
  title?: string;
  description?: string;
  image?: string;
  author?: { name: string; email?: string };
  categories?: Array<{ name: string; slug: string }>;
  tags?: Array<{ name: string; slug: string }>;
  breadcrumbs?: Array<{ label: string; url: string }>;
  pagination?: { prev?: string; next?: string };
}): Promise<string> {
  const {
    content: contentData,
    url,
    pageType = "website",
    title: defaultTitle,
    description: defaultDescription,
    image: defaultImage,
    author,
    categories,
    tags,
    breadcrumbs,
    pagination,
  } = options;

  const site = await settingsService.getSetting("site_name", "LexCMS");
  const siteUrl = await settingsService.getSetting(
    "site_url",
    env.BASE_URL || "http://localhost:8000",
  );
  const twitterHandle = await settingsService.getSetting(
    "twitter_handle",
    "@lexcms",
  );

  let metadata: any = {
    title: defaultTitle || site,
    description: defaultDescription || "",
    canonical: `${siteUrl}${url}`,
    robots: "index,follow",
    openGraph: {
      title: defaultTitle || site,
      type: pageType,
      url: `${siteUrl}${url}`,
      siteName: site,
      locale: "es_ES",
    },
    twitterCard: {
      card: "summary_large_image",
      title: defaultTitle || site,
      site: twitterHandle,
    },
  };

  // Si hay contenido, usar datos SEO personalizados si existen
  if (contentData) {
    const seoData = contentData.contentSeo;

    // Título
    const finalTitle = seoData?.metaTitle || contentData.title ||
      defaultTitle || site;
    metadata.title = finalTitle;
    metadata.openGraph.title = seoData?.ogTitle || finalTitle;
    metadata.twitterCard.title = seoData?.twitterTitle || finalTitle;

    // Descripción
    const finalDescription = seoData?.metaDescription || contentData.excerpt ||
      defaultDescription || "";
    metadata.description = finalDescription;
    metadata.openGraph.description = seoData?.ogDescription || finalDescription;
    metadata.twitterCard.description = seoData?.twitterDescription ||
      finalDescription;

    // Imagen
    const finalImage = seoData?.ogImage || contentData.featuredImage?.url ||
      contentData.featureImage || defaultImage;
    if (finalImage) {
      metadata.openGraph.image = finalImage.startsWith("http")
        ? finalImage
        : `${siteUrl}${finalImage}`;
      metadata.twitterCard.image = metadata.openGraph.image;
      metadata.twitterCard.imageAlt = seoData?.twitterImageAlt ||
        contentData.title;
    }

    // Canonical
    if (seoData?.canonicalUrl) {
      metadata.canonical = seoData.canonicalUrl;
    }

    // Robots
    const noIndex = seoData?.noIndex || false;
    const noFollow = seoData?.noFollow || false;
    if (noIndex || noFollow) {
      const robots = [];
      if (noIndex) robots.push("noindex");
      else robots.push("index");
      if (noFollow) robots.push("nofollow");
      else robots.push("follow");
      metadata.robots = robots.join(",");
    }

    // Open Graph type para artículos
    if (pageType === "article" && seoData?.ogType) {
      metadata.openGraph.type = seoData.ogType;
    } else if (pageType === "article") {
      metadata.openGraph.type = "article";
      metadata.openGraph.publishedTime = contentData.publishedAt?.toISOString();
      metadata.openGraph.modifiedTime = contentData.updatedAt?.toISOString();
      if (author) {
        metadata.openGraph.author = author.name;
      }
      if (categories && categories.length > 0) {
        metadata.openGraph.section = categories[0].name;
      }
      if (tags && tags.length > 0) {
        metadata.openGraph.tags = tags.map((t: any) => t.name);
      }
    }

    // Structured Data (Schema.org)
    if (pageType === "article") {
      const articleSchema = structuredDataGenerator.generateArticleSchema({
        title: finalTitle,
        description: finalDescription,
        url: metadata.canonical,
        image: metadata.openGraph.image || "",
        datePublished: contentData.publishedAt?.toISOString() ||
          contentData.createdAt?.toISOString(),
        dateModified: contentData.updatedAt?.toISOString(),
        author: author
          ? {
            name: author.name,
            url: `${siteUrl}/author/${author.email}`,
          }
          : undefined,
      });
      metadata.schema = articleSchema;
    } else if (seoData?.schemaJson) {
      // Usar schema personalizado si existe
      try {
        metadata.schema = JSON.parse(seoData.schemaJson);
      } catch (e) {
        console.error("Error parsing custom schema JSON:", e);
      }
    }
  }

  // Generar meta tags HTML
  let metaTags = seoHelper.generateAllMetaTags(metadata);

  // Agregar breadcrumbs si existen
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = urlOptimizer.generateBreadcrumbSchema(breadcrumbs);
    metaTags += `\n<script type="application/ld+json">\n${JSON.stringify(breadcrumbSchema, null, 2)
      }\n</script>`;
  }

  // Agregar pagination links
  if (pagination) {
    if (pagination.prev) {
      metaTags += `\n<link rel="prev" href="${siteUrl}${pagination.prev}" />`;
    }
    if (pagination.next) {
      metaTags += `\n<link rel="next" href="${siteUrl}${pagination.next}" />`;
    }
  }

  // Preload de recursos críticos
  metaTags += "\n<!-- Preload Critical Resources -->";
  metaTags += `\n<link rel="preconnect" href="${siteUrl}" />`;
  metaTags +=
    '\n<link rel="dns-prefetch" href="https://fonts.googleapis.com" />';

  return metaTags;
}

// ============= FUNCIONES AUXILIARES DE RENDERIZADO =============

/**
 * Renderiza la lista de posts (blog)
 */
async function renderBlogTemplate(c: any, page = 1) {
  const activeTheme = await themeService.getActiveTheme();
  const themeHelpers = await getThemeHelpers();
  const BlogTemplate = await getThemeTemplate("blog");
  const blogBase = await getBlogBase();

  const site = await themeHelpers.getSiteData();
  const custom = await themeHelpers.getCustomSettings();
  const commonData = await loadCommonTemplateData();

  const { posts, total, totalPages } = await themeHelpers.getPaginatedPosts(
    page,
  );

  // Si la página no existe, 404
  if (page > totalPages && totalPages > 0) {
    return c.text("Página no encontrada", 404);
  }

  const pagination = await themeHelpers.getPagination(page, total);
  const recentPosts = await themeHelpers.getRecentPosts(5);
  const tags = await themeHelpers.getPopularTags(20);

  // Generar pagination links
  const paginationLinks: { prev?: string; next?: string } = {};
  if (page > 1) {
    paginationLinks.prev = page === 2
      ? `/${blogBase}`
      : `/${blogBase}/page/${page - 1}`;
  }
  if (page < totalPages) {
    paginationLinks.next = `/${blogBase}/page/${page + 1}`;
  }

  // Generar breadcrumbs
  const breadcrumbs = [
    { label: "Inicio", url: "/" },
    { label: "Blog", url: `/${blogBase}` },
  ];
  if (page > 1) {
    breadcrumbs.push({
      label: `Página ${page}`,
      url: `/${blogBase}/page/${page}`,
    });
  }

  // Generar meta tags SEO completos
  const blogTitle = page > 1 ? `Blog - Página ${page}` : "Blog";
  const blogDescription = await settingsService.getSetting(
    "blog_description",
    "Todos nuestros artículos",
  );
  const seoMetaTags = await generateSEOMetaTags({
    url: page === 1 ? `/${blogBase}` : `/${blogBase}/page/${page}`,
    pageType: "blog",
    title: blogTitle,
    description: blogDescription,
    breadcrumbs,
    pagination: paginationLinks,
  });

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
      seoMetaTags,
    }),
  );
}

/**
 * Renderiza una página estática por ID
 */
async function renderPageById(c: any, pageId: number) {
  const activeTheme = await themeService.getActiveTheme();
  const themeHelpers = await getThemeHelpers();

  // Buscar la página por ID
  const page = await db.query.content.findFirst({
    where: eq(content.id, pageId),
    with: {
      author: true,
      featuredImage: true,
      seo: true,
    },
  });

  if (!page) {
    return c.text("Página no encontrada", 404);
  }

  // Cargar template con sistema de fallback multinivel
  const PageTemplate = await loadPageTemplate(page.template, activeTheme);

  const site = await themeHelpers.getSiteData();
  const custom = await themeHelpers.getCustomSettings();
  const commonData = await loadCommonTemplateData();
  const blogUrl = await getBlogBase().then((base) => `/${base}`);

  const pageData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    body: await hookManager.applyFilters("content:render", page.body || ""),
    featureImage: page.featuredImage?.url || undefined,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    author: {
      id: page.author.id,
      name: page.author.name || page.author.email,
      email: page.author.email,
    },
  };

  // Generar breadcrumbs para página
  const breadcrumbs = [
    { label: "Inicio", url: "/" },
    { label: page.title, url: `/${page.slug}` },
  ];

  // Generar meta tags SEO completos
  const seoMetaTags = await generateSEOMetaTags({
    content: page,
    url: `/${page.slug}`,
    pageType: "website",
    author: pageData.author,
    breadcrumbs,
  });

  return c.html(
    PageTemplate({
      site,
      custom,
      activeTheme,
      page: pageData,
      blogUrl,
      menu: commonData.headerMenu,
      footerMenu: commonData.footerMenu,
      categories: commonData.categories,
      seoMetaTags,
    }),
  );
}

/**
 * Renderiza el template home.tsx tradicional
 */
async function renderHomeTemplate(c: any) {
  const activeTheme = await themeService.getActiveTheme();
  const themeHelpers = await getThemeHelpers();
  const HomeTemplate = await getThemeTemplate("home");

  const site = await themeHelpers.getSiteData();
  const custom = await themeHelpers.getCustomSettings();
  const blogUrl = await getBlogBase().then((base) => `/${base}`);
  const commonData = await loadCommonTemplateData();

  const featuredPosts = await themeHelpers.getFeaturedPosts(
    custom.homepage_featured_count || 6,
  );

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
    }),
  );
}

// ============= RUTAS PÚBLICAS =============
// Nota: Los assets estáticos de themes (/themes/*) se sirven desde index.ts

/**
 * GET / - Homepage dinámica
 * Comportamiento basado en configuración (estilo WordPress):
 * - homepage_type = "posts_list" → Lista de posts
 * - homepage_type = "static_page" → Página estática por ID
 * - homepage_type = "theme_home" → Template home.tsx del tema
 */
frontendRouter.get("/", async (c) => {
  try {
    const homepageConfig = await settingsService.getHomepageConfig();

    // Modo 1: Mostrar lista de posts en la homepage
    if (homepageConfig.type === "posts_list") {
      console.log("📄 Rendering homepage as blog (posts list)");
      return await renderBlogTemplate(c, 1);
    }

    // Modo 2: Mostrar página estática específica
    if (homepageConfig.type === "static_page" && homepageConfig.pageId) {
      console.log(`📄 Rendering homepage as static page (ID: ${homepageConfig.pageId})`);
      return await renderPageById(c, homepageConfig.pageId);
    }

    // Modo 3: Template home.tsx del tema
    if (homepageConfig.type === "theme_home") {
      console.log("📄 Rendering homepage with theme home.tsx template");
      return await renderHomeTemplate(c);
    }

    // Fallback: posts list
    console.log("📄 Fallback: Rendering homepage as posts list");
    return await renderBlogTemplate(c, 1);
  } catch (error: any) {
    console.error("Error rendering home:", error);
    return c.text("Error al cargar la página", 500);
  }
});

// ============= RUTAS ESPECÍFICAS (deben ir primero) =============

/**
 * GET /page/:page - Paginación cuando posts están en homepage
 * Solo se usa cuando front_page_type = "posts"
 */
frontendRouter.get("/page/:page", async (c) => {
  try {
    const page = parseInt(c.req.param("page")) || 1;
    const frontPageType = await settingsService.getSetting(
      "front_page_type",
      "posts",
    );

    // Solo funciona si los posts están en la homepage
    if (frontPageType !== "posts") {
      const blogBase = await getBlogBase();
      return c.redirect(`/${blogBase}/page/${page}`, 301);
    }

    // Redirigir a / si es página 1
    if (page === 1) {
      return c.redirect("/", 301);
    }

    console.log(`📄 Rendering homepage page ${page}`);
    return await renderBlogTemplate(c, page);
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /search - Búsqueda
 * TODO: Crear template search.tsx
 */
frontendRouter.get("/search", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // Implementar búsqueda
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const result = await themeHelpers.searchPosts(query, page);
    const pagination = await themeHelpers.getPagination(page, result.total);

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then((base) => `/${base}`);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
        posts: result.posts,
        pagination,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering search:", error);
    return c.text("Error al realizar la búsqueda", 500);
  }
});

/**
 * GET /category/:slug - Archivo de categoría
 * TODO: Crear template category.tsx
 */
frontendRouter.get("/category/:slug", async (c) => {
  try {
    const { slug } = c.req.param();
    const page = parseInt(c.req.query("page") || "1");

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // Obtener posts de la categoría
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const result = await themeHelpers.getPostsByCategory(slug, page);

    if (!result.category) {
      return c.text("Categoría no encontrada", 404);
    }

    const pagination = await themeHelpers.getPagination(page, result.total);

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then((base) => `/${base}`);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
        posts: result.posts,
        pagination,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
      }),
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
    const page = parseInt(c.req.query("page") || "1");

    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();
    const IndexTemplate = await getThemeTemplate("index");

    // Obtener posts del tag
    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const result = await themeHelpers.getPostsByTag(slug, page);

    if (!result.tag) {
      return c.text("Tag no encontrado", 404);
    }

    const pagination = await themeHelpers.getPagination(page, result.total);

    // Load common data (menus, categories)
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then((base) => `/${base}`);

    return c.html(
      IndexTemplate({
        site,
        custom,
        activeTheme,
        posts: result.posts,
        pagination,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering tag:", error);
    return c.text("Error al cargar el tag", 500);
  }
});

/**
 * GET /:slug - Página estática o Posts Page
 * Renderiza páginas con templates personalizados o default
 * También maneja la posts page configurable
 */
frontendRouter.get("/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const homepageConfig = await settingsService.getHomepageConfig();

    // Check if this slug is the configured posts page
    if (homepageConfig.postsPage && slug === homepageConfig.postsPage) {
      console.log(`📄 Rendering posts page: /${slug}`);
      return await renderBlogTemplate(c, 1);
    }

    const blogBase = await getBlogBase();

    // Evitar conflicto con la ruta del blog
    if (slug === blogBase) {
      return c.notFound();
    }

    // Obtener el tipo de contenido "page"
    const pageType = await contentTypeService.getContentTypeBySlug("page");
    if (!pageType) {
      console.error("❌ Content type 'page' no encontrado");
      return c.notFound();
    }

    // Buscar la página por slug
    const page = await db.query.content.findFirst({
      where: and(
        eq(content.slug, slug),
        eq(content.contentTypeId, pageType.id),
        eq(content.status, "published"),
      ),
      with: {
        author: true,
        featuredImage: true,
        seo: true,
      },
    });

    if (!page) {
      return c.notFound();
    }

    // Cargar theme y helpers
    const activeTheme = await themeService.getActiveTheme();
    const themeHelpers = await getThemeHelpers();

    // Cargar template con sistema de fallback multinivel
    const PageTemplate = await loadPageTemplate(page.template, activeTheme);

    const site = await themeHelpers.getSiteData();
    const custom = await themeHelpers.getCustomSettings();
    const commonData = await loadCommonTemplateData();
    const blogUrl = await getBlogBase().then((base) => `/${base}`);

    // Transform page data
    const pageData = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      body: page.body || "",
      featureImage: page.featuredImage?.url || null,
      author: {
        id: page.author.id,
        name: page.author.name || page.author.email,
        email: page.author.email,
        avatar: page.author.avatar || null,
      },
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };

    // SEO Meta Tags
    const seoMetaTags = page.seo
      ? {
        title: page.seo.metaTitle || page.title,
        description: page.seo.metaDescription || "",
        canonical: page.seo.canonicalUrl || "",
        ogTitle: page.seo.ogTitle || page.title,
        ogDescription: page.seo.ogDescription || "",
        ogImage: page.seo.ogImage || "",
      }
      : null;

    console.log(
      `📄 Rendering page: ${slug} with template: ${page.template || "default"}`,
    );

    return c.html(
      PageTemplate({
        site,
        custom,
        activeTheme,
        page: pageData,
        blogUrl,
        menu: commonData.headerMenu,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
        seoMetaTags,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

// ============= RUTAS DINÁMICAS (deben ir al final) =============

/**
 * GET /:slug/page/:page - Paginación para páginas de posts configuradas
 * Si una página está configurada como página de posts, permitir paginación en esa página
 */
frontendRouter.get("/:slug/page/:page", async (c) => {
  try {
    const slug = c.req.param("slug");
    const page = parseInt(c.req.param("page")) || 1;
    const blogBase = await getBlogBase();

    // Evitar conflicto con la ruta del blog
    if (slug === blogBase) {
      return c.notFound();
    }

    // Obtener el tipo de contenido "page"
    const pageType = await contentTypeService.getContentTypeBySlug("page");
    if (!pageType) {
      console.error("❌ Content type 'page' no encontrado");
      return c.notFound();
    }

    // Buscar la página por slug
    const pageRecord = await db.query.content.findFirst({
      where: and(
        eq(content.slug, slug),
        eq(content.contentTypeId, pageType.id),
        eq(content.status, "published"),
      ),
    });

    if (!pageRecord) {
      return c.notFound();
    }

    // Verificar si esta página está configurada como la página de posts
    const postsPageId = await settingsService.getSetting("posts_page_id", null);
    if (postsPageId && parseInt(postsPageId as string) === pageRecord.id) {
      // Esta página está configurada como la página de posts, mostrar la lista de posts paginada
      console.log(
        `📄 Rendering blog posts page ${page} at /${slug}/page/${page} (posts page ID: ${pageRecord.id})`,
      );
      return await renderBlogTemplate(c, page);
    }

    // Si no es la página de posts, devolver not found
    return c.notFound();
  } catch (error: any) {
    console.error("Error rendering paged posts:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /:blogBase - Página de blog (página 1)
 * Usa blog.tsx
 * Si hay una página de posts configurada, redirige a esa página
 * Redirige a / si los posts están configurados para mostrarse en la homepage
 */
frontendRouter.get("/:blogBase", async (c) => {
  const pathSegment = c.req.param("blogBase");
  const blogBase = await getBlogBase();

  // Verificar si esta ruta es para el blog
  if (pathSegment !== blogBase) {
    return c.notFound();
  }

  try {
    const frontPageType = await settingsService.getSetting(
      "front_page_type",
      "posts",
    );
    const postsPageId = await settingsService.getSetting("posts_page_id", null);

    // Si los posts están en la homepage, redirigir
    if (frontPageType === "posts") {
      console.log(`🔄 Redirecting /${blogBase} to / (posts are on homepage)`);
      return c.redirect("/", 301);
    }

    // Si hay una página específica configurada para los posts, redirigir a esa página
    if (postsPageId) {
      const postsPage = await db.query.content.findFirst({
        where: and(
          eq(content.id, parseInt(postsPageId as string)),
          eq(content.status, "published"),
        ),
      });
      if (postsPage) {
        console.log(
          `🔄 Redirecting /${blogBase} to /${postsPage.slug} (configured posts page)`,
        );
        return c.redirect(`/${postsPage.slug}`, 301);
      }
    }

    // Renderizar blog normalmente
    console.log(`📄 Rendering blog at /${blogBase}`);
    return await renderBlogTemplate(c, 1);
  } catch (error: any) {
    console.error("Error rendering blog:", error);
    return c.text("Error al cargar el blog", 500);
  }
});

/**
 * GET /:blogBase/page/:page - Paginación del blog
 * Redirige a /page/:page si los posts están en la homepage
 * Si hay una página de posts configurada, redirige a la página de posts con paginación
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
    const frontPageType = await settingsService.getSetting(
      "front_page_type",
      "posts",
    );
    const postsPageId = await settingsService.getSetting("posts_page_id", null);

    // Si los posts están en la homepage
    if (frontPageType === "posts") {
      if (page === 1) {
        console.log(`🔄 Redirecting /${blogBase}/page/1 to /`);
        return c.redirect("/", 301);
      }
      console.log(`🔄 Redirecting /${blogBase}/page/${page} to /page/${page}`);
      return c.redirect(`/page/${page}`, 301);
    }

    // Si hay una página específica configurada para los posts, redirigir a esa página
    if (postsPageId) {
      const postsPage = await db.query.content.findFirst({
        where: and(
          eq(content.id, parseInt(postsPageId as string)),
          eq(content.status, "published"),
        ),
      });
      if (postsPage) {
        if (page === 1) {
          console.log(
            `🔄 Redirecting /${blogBase}/page/1 to /${postsPage.slug} (configured posts page)`,
          );
          return c.redirect(`/${postsPage.slug}`, 301);
        } else {
          console.log(
            `🔄 Redirecting /${blogBase}/page/${page} to /${postsPage.slug}/page/${page} (configured posts page)`,
          );
          return c.redirect(`/${postsPage.slug}/page/${page}`, 301);
        }
      }
    }

    // Redirigir a /:blogBase si es página 1
    if (page === 1) {
      return c.redirect(`/${blogBase}`, 301);
    }

    // Renderizar blog con paginación
    console.log(`📄 Rendering blog page ${page} at /${blogBase}/page/${page}`);
    return await renderBlogTemplate(c, page);
  } catch (error: any) {
    console.error("Error rendering page:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * GET /:blogBase/:slug - Post individual
 * Usa post.tsx
 * La ruta es dinámica basada en la configuración blog_base
 * NOTA: Esta ruta mantiene el patrón de URL original (ej. /blog/post-slug)
 * incluso cuando se configura una página de posts específica, ya que
 * las URLs de posts individuales no cambian en WordPress-style CMS
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
    if (!slug || slug === "" || slug === "page") {
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
        seo: true,
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

    const blogUrl = await getBlogBase().then((base) => `/${base}`);

    // Load comments for this post
    const postComments = await db.query.comments.findMany({
      where: and(
        eq(comments.contentId, post.id),
        eq(comments.status, "approved"),
        isNull(comments.deletedAt),
        isNull(comments.parentId), // Only top-level comments
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
          isNull(comments.deletedAt),
        ),
      );

    const [pendingCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.contentId, post.id),
          eq(comments.status, "pending"),
          isNull(comments.deletedAt),
        ),
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

    // Generar breadcrumbs
    const breadcrumbs = [
      { label: "Inicio", url: "/" },
      { label: "Blog", url: blogUrl },
    ];
    if (postData.categories.length > 0) {
      breadcrumbs.push({
        label: postData.categories[0].name,
        url: `/category/${postData.categories[0].slug}`,
      });
    }
    breadcrumbs.push({ label: post.title, url: `${blogUrl}/${post.slug}` });

    // Generar meta tags SEO completos
    const seoMetaTags = await generateSEOMetaTags({
      content: post,
      url: `${blogUrl}/${post.slug}`,
      pageType: "article",
      author: postData.author,
      categories: postData.categories,
      tags: postData.tags,
      breadcrumbs,
    });

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
        seoMetaTags,
        footerMenu: commonData.footerMenu,
        categories: commonData.categories,
        comments: formattedComments,
        commentsStats,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering post:", error);
    return c.text("Error al cargar el post", 500);
  }
});

export default frontendRouter;
