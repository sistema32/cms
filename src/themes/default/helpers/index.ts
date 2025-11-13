import * as settingsService from "../../../services/settingsService.ts";
import * as menuService from "../../../services/menuService.ts";
import * as menuItemService from "../../../services/menuItemService.ts";
import { db } from "../../../config/db.ts";
import { content, users, categories, tags } from "../../../db/schema.ts";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * Theme Helpers - Funciones auxiliares para templates
 * Inspirado en Ghost Handlebars helpers pero adaptado a TypeScript/JSX
 */

// ============= SITE HELPERS (@site en Ghost) =============

export interface SiteData {
  name: string;
  description: string;
  url: string;
  logo: string | null;
  language: string;
  timezone: string;
}

/**
 * Obtiene datos globales del sitio
 */
export async function getSiteData(): Promise<SiteData> {
  return {
    name: await settingsService.getSetting("site_name", "LexCMS"),
    description: await settingsService.getSetting("site_description", ""),
    url: await settingsService.getSetting("site_url", "http://localhost:8000"),
    logo: await settingsService.getSetting("logo_image", null),
    language: await settingsService.getSetting("language", "es"),
    timezone: await settingsService.getSetting("timezone", "UTC"),
  };
}

// ============= CUSTOM SETTINGS HELPERS (@custom en Ghost) =============

/**
 * Obtiene custom settings del theme activo
 */
export async function getCustomSettings(themeName?: string): Promise<Record<string, any>> {
  const activeTheme = themeName || await settingsService.getSetting("active_theme", "default");
  return await settingsService.getThemeCustomSettings(activeTheme);
}

// ============= MENU HELPERS =============

export interface MenuItem {
  id: number;
  label: string;
  url: string;
  title?: string;
  icon?: string;
  cssClass?: string;
  target?: string;
  children?: MenuItem[];
}

/**
 * Construye la URL de un item de menú según su tipo
 */
function buildMenuItemUrl(item: any): string {
  // Si tiene URL manual, usarla directamente
  if (item.url) {
    return item.url;
  }

  // Si está vinculado a contenido
  if (item.contentId && item.content) {
    return `/${item.content.slug}`;
  }

  // Si está vinculado a categoría
  if (item.categoryId && item.category) {
    return `/category/${item.category.slug}`;
  }

  // Si está vinculado a tag
  if (item.tagId && item.tag) {
    return `/tag/${item.tag.slug}`;
  }

  // Fallback
  return "#";
}

/**
 * Convierte items de menú del servicio al formato esperado por los templates
 */
function convertMenuItems(items: any[]): MenuItem[] {
  return items.map(item => ({
    id: item.id,
    label: item.label,
    url: buildMenuItemUrl(item),
    title: item.title || undefined,
    icon: item.icon || undefined,
    cssClass: item.cssClass || undefined,
    target: item.target || undefined,
    children: item.children ? convertMenuItems(item.children) : undefined,
  }));
}

/**
 * Obtiene un menú por slug con estructura jerárquica
 */
export async function getMenu(slug: string): Promise<MenuItem[]> {
  try {
    const menu = await menuService.getMenuBySlug(slug);

    if (!menu || !menu.items) {
      return [];
    }

    // Construir jerarquía de items
    const hierarchy = await menuItemService.getMenuItemsHierarchy(menu.id);

    // Convertir al formato esperado
    return convertMenuItems(hierarchy);
  } catch (error) {
    console.error(`Error loading menu '${slug}':`, error);
    return [];
  }
}

// ============= CONTENT HELPERS =============

export interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  featureImage?: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name: string;
    email: string;
  };
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
}

/**
 * Obtiene posts recientes
 */
export async function getRecentPosts(limit = 5): Promise<PostData[]> {
  const posts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    orderBy: [desc(content.publishedAt)],
    limit,
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
      contentSeo: true,
    },
  });

  return posts.map((post) => ({
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
  }));
}

/**
 * Obtiene posts paginados con offset/limit real
 * Los posts sticky aparecen primero (solo en página 1)
 */
export async function getPaginatedPosts(
  page: number = 1,
  perPage?: number
): Promise<{ posts: PostData[]; total: number; totalPages: number }> {
  const postsPerPage = perPage || await settingsService.getSetting("posts_per_page", 10);
  const offset = (page - 1) * postsPerPage;

  // Obtener total de posts publicados
  const total = await getTotalPosts();

  let allPosts: PostData[] = [];

  // En la primera página, obtener posts sticky primero
  if (page === 1) {
    // Obtener posts sticky
    const stickyPosts = await db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        eq(content.sticky, true)
      ),
      orderBy: [desc(content.publishedAt)],
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
        contentSeo: true,
      },
    });

    const stickyData = stickyPosts.map((post) => ({
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
    }));

    // Agregar sticky posts
    allPosts.push(...stickyData);

    // Calcular cuántos posts normales necesitamos
    const remainingSlots = postsPerPage - stickyData.length;

    if (remainingSlots > 0) {
      // Obtener posts normales (no sticky)
      const normalPosts = await db.query.content.findMany({
        where: and(
          eq(content.status, "published"),
          eq(content.sticky, false)
        ),
        orderBy: [desc(content.publishedAt)],
        limit: remainingSlots,
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
          contentSeo: true,
        },
      });

      const normalData = normalPosts.map((post) => ({
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
      }));

      allPosts.push(...normalData);
    }
  } else {
    // En páginas > 1, solo posts normales con offset ajustado
    const posts = await db.query.content.findMany({
      where: and(
        eq(content.status, "published"),
        eq(content.sticky, false)
      ),
      orderBy: [desc(content.publishedAt)],
      limit: postsPerPage,
      offset: offset,
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
        contentSeo: true,
      },
    });

    allPosts = posts.map((post) => ({
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
    }));
  }

  const totalPages = Math.ceil(total / postsPerPage);

  return { posts: allPosts, total, totalPages };
}

/**
 * Cuenta el total de posts publicados
 */
export async function getTotalPosts(): Promise<number> {
  const result = await db.query.content.findMany({
    where: eq(content.status, "published"),
  });
  return result.length;
}

/**
 * Obtiene posts destacados (featured)
 */
export async function getFeaturedPosts(limit = 3): Promise<PostData[]> {
  const posts = await db.query.content.findMany({
    where: and(
      eq(content.status, "published"),
      eq(content.featured, true)
    ),
    orderBy: [desc(content.publishedAt)],
    limit,
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
      contentSeo: true,
    },
  });

  // Si no hay posts featured, retornar los más recientes
  if (posts.length === 0) {
    return await getRecentPosts(limit);
  }

  return posts.map((post) => ({
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
  }));
}

// ============= DATE HELPERS =============

/**
 * Formatea una fecha según el formato configurado
 */
export async function formatDate(date: Date, format?: string): Promise<string> {
  const dateFormat = format || await settingsService.getSetting("date_format", "DD/MM/YYYY");

  // Implementación simple de formateo
  // TODO: Usar librería de formateo de fechas más robusta
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return dateFormat
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", String(year));
}

/**
 * Formatea hora según el formato configurado
 */
export async function formatTime(date: Date, format?: string): Promise<string> {
  const timeFormat = format || await settingsService.getSetting("time_format", "HH:mm");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return timeFormat
    .replace("HH", hours)
    .replace("mm", minutes);
}

// ============= EXCERPT HELPER =============

/**
 * Extrae un excerpt de un contenido
 */
export function excerpt(content: string, words = 50): string {
  if (!content) return "";

  // Remover HTML tags
  const textOnly = content.replace(/<[^>]*>/g, "");

  // Dividir en palabras
  const wordArray = textOnly.split(/\s+/);

  // Tomar solo las primeras N palabras
  if (wordArray.length <= words) {
    return textOnly;
  }

  return wordArray.slice(0, words).join(" ") + "...";
}

// ============= IMAGE HELPERS =============

/**
 * Genera URL de imagen responsiva
 */
export function imgUrl(url: string, size?: string): string {
  if (!url) return "";

  // Si no se especifica tamaño, retornar URL original
  if (!size) return url;

  // TODO: Implementar generación de URLs para diferentes tamaños
  // Por ahora retornamos la URL original
  return url;
}

// ============= URL HELPERS =============

/**
 * Genera URL para un post
 */
export async function postUrl(slug: string): Promise<string> {
  const siteUrl = await settingsService.getSetting("site_url", "");
  const permalinkStructure = await settingsService.getSetting("permalink_structure", "/:slug/");

  return `${siteUrl}${permalinkStructure.replace(":slug", slug)}`;
}

/**
 * Genera URL para el blog
 */
export async function blogUrl(): Promise<string> {
  const blogBase = await settingsService.getSetting("blog_base", "blog");
  return `/${blogBase}`;
}

/**
 * Genera URL para una categoría
 */
export async function categoryUrl(slug: string): Promise<string> {
  const siteUrl = await settingsService.getSetting("site_url", "");
  const categoryBase = await settingsService.getSetting("category_base", "category");

  return `${siteUrl}/${categoryBase}/${slug}`;
}

/**
 * Genera URL para un tag
 */
export async function tagUrl(slug: string): Promise<string> {
  const siteUrl = await settingsService.getSetting("site_url", "");
  const tagBase = await settingsService.getSetting("tag_base", "tag");

  return `${siteUrl}/${tagBase}/${slug}`;
}

// ============= PAGINATION HELPER =============

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

/**
 * Calcula datos de paginación
 */
export async function getPagination(
  currentPage: number,
  totalItems: number,
  itemsPerPage?: number
): Promise<PaginationData> {
  const perPage = itemsPerPage || await settingsService.getSetting("posts_per_page", 10);
  const totalPages = Math.ceil(totalItems / perPage);

  return {
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
}

/**
 * Genera array de números de página para la paginación
 * Ejemplo: [1, 2, 3, "...", 8, 9, 10]
 */
export function getPaginationNumbers(
  currentPage: number,
  totalPages: number,
  delta: number = 2
): (number | string)[] {
  if (totalPages <= 1) return [1];

  const range: (number | string)[] = [];
  const rangeWithDots: (number | string)[] = [];

  // Siempre incluir primera página
  range.push(1);

  // Incluir páginas alrededor de la actual
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i > 1 && i < totalPages) {
      range.push(i);
    }
  }

  // Siempre incluir última página
  if (totalPages > 1) {
    range.push(totalPages);
  }

  // Agregar puntos suspensivos donde haya gaps
  let prev = 0;
  for (const page of range) {
    if (typeof page === "number") {
      if (page - prev === 2) {
        rangeWithDots.push(prev + 1);
      } else if (page - prev !== 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(page);
      prev = page;
    }
  }

  return rangeWithDots;
}

// ============= BODY CLASS HELPER (WordPress-style) =============

/**
 * Genera clases CSS para el body según el contexto
 */
export function bodyClass(context: {
  isHome?: boolean;
  isPost?: boolean;
  isPage?: boolean;
  isCategory?: boolean;
  isTag?: boolean;
  isAuthor?: boolean;
  isSearch?: boolean;
  isError?: boolean;
  slug?: string;
}): string {
  const classes: string[] = [];

  if (context.isHome) classes.push("home");
  if (context.isPost) classes.push("post", `post-${context.slug}`);
  if (context.isPage) classes.push("page", `page-${context.slug}`);
  if (context.isCategory) classes.push("category", `category-${context.slug}`);
  if (context.isTag) classes.push("tag", `tag-${context.slug}`);
  if (context.isAuthor) classes.push("author");
  if (context.isSearch) classes.push("search");
  if (context.isError) classes.push("error");

  return classes.join(" ");
}

// ============= POST CLASS HELPER (WordPress-style) =============

/**
 * Genera clases CSS para un post
 */
export function postClass(post: {
  id: number;
  status: string;
  slug: string;
  featured?: boolean;
}): string {
  const classes: string[] = ["post"];

  classes.push(`post-${post.id}`);
  classes.push(`post-${post.slug}`);
  classes.push(`status-${post.status}`);

  if (post.featured) {
    classes.push("featured");
  }

  return classes.join(" ");
}

// ============= CATEGORY & TAG HELPERS =============

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

/**
 * Obtiene todas las categorías
 */
export async function getCategories(limit?: number): Promise<CategoryData[]> {
  const allCategories = await db.query.categories.findMany({
    orderBy: [desc(categories.name)],
  });

  // Contar posts por categoría
  const categoriesWithCount = await Promise.all(
    allCategories.map(async (cat) => {
      const posts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        with: {
          contentCategories: {
            where: (contentCategories, { eq }) => eq(contentCategories.categoryId, cat.id),
          },
        },
      });

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || undefined,
        count: posts.filter(p => p.contentCategories.length > 0).length,
      };
    })
  );

  // Filtrar categorías con posts y ordenar por cantidad de posts
  const categoriesWithPosts = categoriesWithCount
    .filter(cat => cat.count && cat.count > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  if (limit) {
    return categoriesWithPosts.slice(0, limit);
  }

  return categoriesWithPosts;
}

export interface TagData {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

/**
 * Obtiene tags populares
 */
export async function getPopularTags(limit = 10): Promise<TagData[]> {
  const allTags = await db.query.tags.findMany({
    orderBy: [desc(tags.name)],
  });

  // Contar posts por tag
  const tagsWithCount = await Promise.all(
    allTags.map(async (tag) => {
      const posts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        with: {
          contentTags: {
            where: (contentTags, { eq }) => eq(contentTags.tagId, tag.id),
          },
        },
      });

      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: posts.filter(p => p.contentTags.length > 0).length,
      };
    })
  );

  // Filtrar tags con posts y ordenar por cantidad
  const tagsWithPosts = tagsWithCount
    .filter(tag => tag.count && tag.count > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  return tagsWithPosts.slice(0, limit);
}

/**
 * Obtiene una categoría por slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryData | null> {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return null;
  }

  // Contar posts en esta categoría
  const posts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    with: {
      contentCategories: {
        where: (contentCategories, { eq }) => eq(contentCategories.categoryId, category.id),
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    count: posts.filter(p => p.contentCategories.length > 0).length,
  };
}

/**
 * Obtiene un tag por slug
 */
export async function getTagBySlug(slug: string): Promise<TagData | null> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });

  if (!tag) {
    return null;
  }

  // Contar posts con este tag
  const posts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    with: {
      contentTags: {
        where: (contentTags, { eq }) => eq(contentTags.tagId, tag.id),
      },
    },
  });

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    count: posts.filter(p => p.contentTags.length > 0).length,
  };
}

/**
 * Obtiene posts de una categoría específica con paginación
 */
export async function getPostsByCategory(
  categorySlug: string,
  page: number = 1,
  perPage?: number
): Promise<{ posts: PostData[]; total: number; totalPages: number; category: CategoryData | null }> {
  const postsPerPage = perPage || await settingsService.getSetting("posts_per_page", 10);
  const offset = (page - 1) * postsPerPage;

  // Obtener categoría
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { posts: [], total: 0, totalPages: 0, category: null };
  }

  // Obtener posts de esta categoría
  const allPosts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    orderBy: [desc(content.publishedAt)],
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
      contentSeo: true,
    },
  });

  // Filtrar solo posts de esta categoría
  const categoryPosts = allPosts.filter(post =>
    post.contentCategories.some(cc => cc.categoryId === category.id)
  );

  const total = categoryPosts.length;
  const totalPages = Math.ceil(total / postsPerPage);

  // Aplicar paginación
  const paginatedPosts = categoryPosts.slice(offset, offset + postsPerPage);

  // Formatear posts
  const formattedPosts: PostData[] = paginatedPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || undefined,
    body: post.body,
    featureImage: post.featureImage || undefined,
    status: post.status,
    featured: post.featured || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || post.createdAt,
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
    },
    categories: post.contentCategories.map(cc => ({
      id: cc.category.id,
      name: cc.category.name,
      slug: cc.category.slug,
    })),
    tags: post.contentTags.map(ct => ({
      id: ct.tag.id,
      name: ct.tag.name,
      slug: ct.tag.slug,
    })),
  }));

  return { posts: formattedPosts, total, totalPages, category };
}

/**
 * Obtiene posts de un tag específico con paginación
 */
export async function getPostsByTag(
  tagSlug: string,
  page: number = 1,
  perPage?: number
): Promise<{ posts: PostData[]; total: number; totalPages: number; tag: TagData | null }> {
  const postsPerPage = perPage || await settingsService.getSetting("posts_per_page", 10);
  const offset = (page - 1) * postsPerPage;

  // Obtener tag
  const tag = await getTagBySlug(tagSlug);

  if (!tag) {
    return { posts: [], total: 0, totalPages: 0, tag: null };
  }

  // Obtener posts con este tag
  const allPosts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    orderBy: [desc(content.publishedAt)],
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
      contentSeo: true,
    },
  });

  // Filtrar solo posts con este tag
  const tagPosts = allPosts.filter(post =>
    post.contentTags.some(ct => ct.tagId === tag.id)
  );

  const total = tagPosts.length;
  const totalPages = Math.ceil(total / postsPerPage);

  // Aplicar paginación
  const paginatedPosts = tagPosts.slice(offset, offset + postsPerPage);

  // Formatear posts
  const formattedPosts: PostData[] = paginatedPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || undefined,
    body: post.body,
    featureImage: post.featureImage || undefined,
    status: post.status,
    featured: post.featured || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || post.createdAt,
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
    },
    categories: post.contentCategories.map(cc => ({
      id: cc.category.id,
      name: cc.category.name,
      slug: cc.category.slug,
    })),
    tags: post.contentTags.map(ct => ({
      id: ct.tag.id,
      name: ct.tag.name,
      slug: ct.tag.slug,
    })),
  }));

  return { posts: formattedPosts, total, totalPages, tag };
}

/**
 * Busca posts por título o contenido
 */
export async function searchPosts(
  query: string,
  page: number = 1,
  perPage?: number
): Promise<{ posts: PostData[]; total: number; totalPages: number; query: string }> {
  const postsPerPage = perPage || await settingsService.getSetting("posts_per_page", 10);
  const offset = (page - 1) * postsPerPage;

  if (!query || query.trim() === "") {
    return { posts: [], total: 0, totalPages: 0, query: "" };
  }

  const searchQuery = query.toLowerCase().trim();

  // Obtener todos los posts publicados
  const allPosts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    orderBy: [desc(content.publishedAt)],
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
      contentSeo: true,
    },
  });

  // Filtrar posts que coincidan con la búsqueda
  const searchResults = allPosts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(searchQuery);
    const bodyMatch = post.body.toLowerCase().includes(searchQuery);
    const excerptMatch = post.excerpt?.toLowerCase().includes(searchQuery) || false;

    return titleMatch || bodyMatch || excerptMatch;
  });

  const total = searchResults.length;
  const totalPages = Math.ceil(total / postsPerPage);

  // Aplicar paginación
  const paginatedPosts = searchResults.slice(offset, offset + postsPerPage);

  // Formatear posts
  const formattedPosts: PostData[] = paginatedPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || undefined,
    body: post.body,
    featureImage: post.featureImage || undefined,
    status: post.status,
    featured: post.featured || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || post.createdAt,
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
    },
    categories: post.contentCategories.map(cc => ({
      id: cc.category.id,
      name: cc.category.name,
      slug: cc.category.slug,
    })),
    tags: post.contentTags.map(ct => ({
      id: ct.tag.id,
      name: ct.tag.name,
      slug: ct.tag.slug,
    })),
  }));

  return { posts: formattedPosts, total, totalPages, query: searchQuery };
}

// ============= EXPORT ALL HELPERS =============

export const themeHelpers = {
  // Site data
  getSiteData,
  getCustomSettings,

  // Menus
  getMenu,

  // Content
  getRecentPosts,
  getPaginatedPosts,
  getTotalPosts,
  getFeaturedPosts,

  // Categories & Tags
  getCategories,
  getPopularTags,
  getCategoryBySlug,
  getTagBySlug,
  getPostsByCategory,
  getPostsByTag,

  // Search
  searchPosts,

  // Formatting
  formatDate,
  formatTime,
  excerpt,

  // URLs
  imgUrl,
  postUrl,
  blogUrl,
  categoryUrl,
  tagUrl,

  // Pagination
  getPagination,
  getPaginationNumbers,

  // CSS classes
  bodyClass,
  postClass,
};
