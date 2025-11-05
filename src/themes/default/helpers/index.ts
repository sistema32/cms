import * as settingsService from "../../../services/settingsService.ts";
import { db } from "../../../config/db.ts";
import { content, users, categories, tags } from "../../../db/schema.ts";
import { eq, desc, and } from "drizzle-orm";

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
 * Obtiene un menú por slug
 */
export async function getMenu(slug: string): Promise<MenuItem[]> {
  // TODO: Implementar cuando tengamos el servicio de menús
  // Por ahora retornamos array vacío
  return [];
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
 */
export async function getPaginatedPosts(
  page: number = 1,
  perPage?: number
): Promise<{ posts: PostData[]; total: number; totalPages: number }> {
  const postsPerPage = perPage || await settingsService.getSetting("posts_per_page", 10);
  const offset = (page - 1) * postsPerPage;

  // Obtener total de posts publicados
  const total = await getTotalPosts();

  // Obtener posts de la página actual
  const posts = await db.query.content.findMany({
    where: eq(content.status, "published"),
    orderBy: [desc(content.publishedAt)],
    limit: postsPerPage,
    offset,
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

  const postData = posts.map((post) => ({
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

  const totalPages = Math.ceil(total / postsPerPage);

  return { posts: postData, total, totalPages };
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
 * TODO: Agregar campo 'featured' a la tabla content
 */
export async function getFeaturedPosts(limit = 3): Promise<PostData[]> {
  // Por ahora retorna los posts más recientes
  // Una vez agregado el campo 'featured' filtrar por ese campo
  return await getRecentPosts(limit);
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

  // Formatting
  formatDate,
  formatTime,
  excerpt,

  // URLs
  imgUrl,
  postUrl,
  categoryUrl,
  tagUrl,

  // Pagination
  getPagination,
  getPaginationNumbers,

  // CSS classes
  bodyClass,
  postClass,
};
