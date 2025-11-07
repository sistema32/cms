/**
 * TypeScript SDK - Type Definitions
 * Types y interfaces para theme developers
 */

import { html as honoHtml } from "hono/html";

/**
 * Site data - Información del sitio
 */
export interface SiteData {
  name: string;
  description: string;
  url: string;
  logo?: string;
  favicon?: string;
  language: string;
  timezone: string;
  postsPerPage: number;
}

/**
 * User data - Información del usuario/autor
 */
export interface UserData {
  id: number;
  name: string | null;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  website?: string | null;
  role: string;
  postCount?: number;
}

/**
 * Category data - Información de categorías
 */
export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
  parent?: CategoryData | null;
  children?: CategoryData[];
}

/**
 * Tag data - Información de tags
 */
export interface TagData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

/**
 * Post data - Información de posts
 */
export interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  featuredImage?: string | null;
  status: "published" | "draft" | "scheduled";
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: UserData;
  categories?: CategoryData[];
  tags?: TagData[];
  readingTime?: number;
  viewCount?: number;
  commentCount?: number;
  seo?: PostSeoData;
}

/**
 * SEO data for posts
 */
export interface PostSeoData {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
}

/**
 * Page data - Información de páginas
 */
export interface PageData extends PostData {
  template?: string | null;
  parentId?: number | null;
  order?: number;
}

/**
 * Menu item data - Items de menú
 */
export interface MenuItemData {
  id: number;
  title: string;
  url?: string | null;
  slug?: string | null;
  target?: "_self" | "_blank" | null;
  icon?: string | null;
  order: number;
  children?: MenuItemData[];
}

/**
 * Pagination data - Información de paginación
 */
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
  pages: number[];
}

/**
 * Custom setting definition
 */
export interface CustomSettingDefinition {
  type: "text" | "textarea" | "boolean" | "select" | "color" | "image" | "url" | "number";
  label: string;
  description?: string;
  default?: any;
  options?: string[];
  group?: string;
  visibility?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Base props for all templates
 */
export interface BaseTemplateProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  currentUser?: UserData | null;
}

/**
 * Home template props
 */
export interface HomeTemplateProps extends BaseTemplateProps {
  featuredPosts?: PostData[];
  recentPosts?: PostData[];
  categories?: CategoryData[];
  tags?: TagData[];
}

/**
 * Blog template props
 */
export interface BlogTemplateProps extends BaseTemplateProps {
  posts: PostData[];
  pagination: PaginationData;
  category?: CategoryData;
  tag?: TagData;
  author?: UserData;
}

/**
 * Post template props
 */
export interface PostTemplateProps extends BaseTemplateProps {
  post: PostData;
  relatedPosts?: PostData[];
  prevPost?: PostData | null;
  nextPost?: PostData | null;
}

/**
 * Page template props
 */
export interface PageTemplateProps extends BaseTemplateProps {
  page: PageData;
  children?: PageData[];
}

/**
 * Search template props
 */
export interface SearchTemplateProps extends BaseTemplateProps {
  query: string;
  results: PostData[];
  pagination: PaginationData;
  totalResults: number;
}

/**
 * Archive template props
 */
export interface ArchiveTemplateProps extends BaseTemplateProps {
  posts: PostData[];
  pagination: PaginationData;
  archiveType: "category" | "tag" | "author" | "date";
  archiveTitle: string;
  archiveDescription?: string;
}

/**
 * 404 template props
 */
export interface Error404TemplateProps extends BaseTemplateProps {
  requestedUrl?: string;
  recentPosts?: PostData[];
  categories?: CategoryData[];
}

/**
 * Component props for partials
 */
export interface HeaderProps extends BaseTemplateProps {
  menu?: MenuItemData[];
  logo?: string;
}

export interface FooterProps extends BaseTemplateProps {
  menu?: MenuItemData[];
  socialLinks?: {
    platform: string;
    url: string;
    icon?: string;
  }[];
  copyright?: string;
}

export interface PostCardProps {
  post: PostData;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showImage?: boolean;
  size?: "small" | "medium" | "large";
}

export interface SidebarProps extends BaseTemplateProps {
  widgets?: WidgetData[];
}

export interface WidgetData {
  id: string;
  type: string;
  title?: string;
  content?: any;
  settings?: Record<string, any>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  license: string;
  screenshots?: {
    desktop?: string;
    mobile?: string;
  };
  config: {
    posts_per_page: number;
    image_sizes?: Record<string, { width: number; height?: number }>;
    custom?: Record<string, CustomSettingDefinition>;
  };
  supports?: {
    comments?: boolean;
    customSettings?: boolean;
    widgets?: boolean;
    menus?: string[];
    postFormats?: string[];
    customTemplates?: boolean;
    darkMode?: boolean;
    responsiveDesign?: boolean;
    seo?: boolean;
    rtl?: boolean;
  };
  templates?: Record<string, string>;
  partials?: Record<string, string>;
}

/**
 * Theme hook callback types
 */
export type ActionCallback = (...args: any[]) => void | Promise<void>;
export type FilterCallback<T = any> = (value: T, ...args: any[]) => T | Promise<T>;

/**
 * HTML tagged template from Hono
 */
export const html = honoHtml;
export type HtmlEscapedString = ReturnType<typeof honoHtml>;

/**
 * Template component type
 */
export type TemplateComponent<P = BaseTemplateProps> = (props: P) => HtmlEscapedString;

/**
 * Partial component type
 */
export type PartialComponent<P = any> = (props: P) => HtmlEscapedString;
