/**
 * Advanced SEO System Types
 * Sitemap, structured data, and SEO optimization
 */

/**
 * Sitemap URL entry
 */
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number; // 0.0 to 1.0
  images?: {
    loc: string;
    title?: string;
    caption?: string;
  }[];
}

/**
 * Sitemap configuration
 */
export interface SitemapConfig {
  baseUrl: string;
  includeContent?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
  includePages?: boolean;
  maxUrls?: number;
  excludePaths?: string[];
}

/**
 * Robots.txt configuration
 */
export interface RobotsConfig {
  userAgents: {
    userAgent: string;
    allow?: string[];
    disallow?: string[];
    crawlDelay?: number;
  }[];
  sitemaps?: string[];
}

/**
 * Schema.org structured data types
 */
export type SchemaType =
  | "Article"
  | "NewsArticle"
  | "BlogPosting"
  | "WebPage"
  | "Organization"
  | "Person"
  | "BreadcrumbList"
  | "ImageObject"
  | "VideoObject";

/**
 * Article structured data
 */
export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article" | "NewsArticle" | "BlogPosting";
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": "Person" | "Organization";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

/**
 * Organization structured data
 */
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[]; // Social media profiles
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email?: string;
    telephone?: string;
  }[];
}

/**
 * Breadcrumb structured data
 */
export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}

/**
 * Open Graph meta tags
 */
export interface OpenGraphData {
  title: string;
  type: "website" | "article" | "profile" | "video.other";
  url: string;
  image?: string;
  description?: string;
  siteName?: string;
  locale?: string;
  // Article-specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

/**
 * Twitter Card meta tags
 */
export interface TwitterCardData {
  card: "summary" | "summary_large_image" | "app" | "player";
  site?: string; // @username
  creator?: string; // @username
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

/**
 * Complete SEO metadata
 */
export interface SEOMetadata {
  // Basic SEO
  title: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string; // "index,follow" | "noindex,nofollow"

  // Structured data
  schema?: ArticleSchema | OrganizationSchema | BreadcrumbSchema | Record<string, any>;

  // Social media
  openGraph?: OpenGraphData;
  twitterCard?: TwitterCardData;

  // Additional
  alternates?: {
    hreflang: string;
    href: string;
  }[];
}

/**
 * SEO audit result
 */
export interface SEOAuditResult {
  contentId: number;
  score: number; // 0-100
  issues: {
    severity: "error" | "warning" | "info";
    message: string;
    field?: string;
  }[];
  recommendations: string[];
  checkedAt: Date;
}
