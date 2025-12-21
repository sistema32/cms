/**
 * SEO Helper
 * Utilities for generating SEO metadata, Open Graph, Twitter Cards
 */

import type {
  SEOMetadata,
  OpenGraphData,
  TwitterCardData,
  SEOAuditResult,
} from "./types.ts";
import type { Content } from "../../db/schema.ts";
import { env } from "../../config/env.ts";

type ContentWithSeo = Content & {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  featuredImage?: string | null;
};

export class SEOHelper {
  private static instance: SEOHelper;

  private constructor() {}

  static getInstance(): SEOHelper {
    if (!SEOHelper.instance) {
      SEOHelper.instance = new SEOHelper();
    }
    return SEOHelper.instance;
  }

  /**
   * Generate complete SEO metadata for content
   */
  generateContentMetadata(
    content: ContentWithSeo,
    author?: { name: string }
  ): SEOMetadata {
    const url = `${env.BASE_URL}/${content.slug}`;
    const title = content.metaTitle || content.title;
    const description = content.metaDescription || content.excerpt || "";
    const keywords = content.metaKeywords?.split(",").map((k: string) => k.trim()) || [];
    const image = content.featuredImage || undefined;

    return {
      title,
      description,
      keywords,
      canonical: url,
      robots: content.status === "published" ? "index,follow" : "noindex,nofollow",
      openGraph: {
        title,
        type: "article",
        url,
        image,
        description,
        siteName: "LexCMS", // Should come from settings
        locale: "en_US",
        publishedTime: content.publishedAt?.toISOString(),
        modifiedTime: content.updatedAt?.toISOString(),
        author: author?.name,
      },
      twitterCard: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        image,
        imageAlt: content.title,
      },
    };
  }

  /**
   * Generate Open Graph meta tags HTML
   */
  generateOpenGraphTags(data: OpenGraphData): string {
    const tags: string[] = [];

    tags.push(`<meta property="og:title" content="${this.escapeHtml(data.title)}" />`);
    tags.push(`<meta property="og:type" content="${data.type}" />`);
    tags.push(`<meta property="og:url" content="${data.url}" />`);

    if (data.image) {
      tags.push(`<meta property="og:image" content="${data.image}" />`);
    }

    if (data.description) {
      tags.push(`<meta property="og:description" content="${this.escapeHtml(data.description)}" />`);
    }

    if (data.siteName) {
      tags.push(`<meta property="og:site_name" content="${this.escapeHtml(data.siteName)}" />`);
    }

    if (data.locale) {
      tags.push(`<meta property="og:locale" content="${data.locale}" />`);
    }

    // Article-specific tags
    if (data.type === "article") {
      if (data.publishedTime) {
        tags.push(`<meta property="article:published_time" content="${data.publishedTime}" />`);
      }
      if (data.modifiedTime) {
        tags.push(`<meta property="article:modified_time" content="${data.modifiedTime}" />`);
      }
      if (data.author) {
        tags.push(`<meta property="article:author" content="${this.escapeHtml(data.author)}" />`);
      }
      if (data.section) {
        tags.push(`<meta property="article:section" content="${this.escapeHtml(data.section)}" />`);
      }
      if (data.tags && data.tags.length > 0) {
        for (const tag of data.tags) {
          tags.push(`<meta property="article:tag" content="${this.escapeHtml(tag)}" />`);
        }
      }
    }

    return tags.join("\n");
  }

  /**
   * Generate Twitter Card meta tags HTML
   */
  generateTwitterCardTags(data: TwitterCardData): string {
    const tags: string[] = [];

    tags.push(`<meta name="twitter:card" content="${data.card}" />`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(data.title)}" />`);

    if (data.site) {
      tags.push(`<meta name="twitter:site" content="${data.site}" />`);
    }

    if (data.creator) {
      tags.push(`<meta name="twitter:creator" content="${data.creator}" />`);
    }

    if (data.description) {
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(data.description)}" />`);
    }

    if (data.image) {
      tags.push(`<meta name="twitter:image" content="${data.image}" />`);
    }

    if (data.imageAlt) {
      tags.push(`<meta name="twitter:image:alt" content="${this.escapeHtml(data.imageAlt)}" />`);
    }

    return tags.join("\n");
  }

  /**
   * Generate basic SEO meta tags HTML
   */
  generateBasicMetaTags(metadata: SEOMetadata): string {
    const tags: string[] = [];

    tags.push(`<title>${this.escapeHtml(metadata.title)}</title>`);

    if (metadata.description) {
      tags.push(`<meta name="description" content="${this.escapeHtml(metadata.description)}" />`);
    }

    if (metadata.keywords && metadata.keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${this.escapeHtml(metadata.keywords.join(", "))}" />`);
    }

    if (metadata.canonical) {
      tags.push(`<link rel="canonical" href="${metadata.canonical}" />`);
    }

    if (metadata.robots) {
      tags.push(`<meta name="robots" content="${metadata.robots}" />`);
    }

    // Alternate languages
    if (metadata.alternates && metadata.alternates.length > 0) {
      for (const alt of metadata.alternates) {
        tags.push(`<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`);
      }
    }

    return tags.join("\n");
  }

  /**
   * Generate all meta tags at once
   */
  generateAllMetaTags(metadata: SEOMetadata): string {
    const tags: string[] = [];

    // Basic SEO tags
    tags.push(this.generateBasicMetaTags(metadata));

    // Open Graph tags
    if (metadata.openGraph) {
      tags.push(this.generateOpenGraphTags(metadata.openGraph));
    }

    // Twitter Card tags
    if (metadata.twitterCard) {
      tags.push(this.generateTwitterCardTags(metadata.twitterCard));
    }

    // Structured data
    if (metadata.schema) {
      const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(metadata.schema, null, 2)}\n</script>`;
      tags.push(scriptTag);
    }

    return tags.join("\n");
  }

  /**
   * Audit content SEO
   */
  auditContent(content: ContentWithSeo): SEOAuditResult {
    const issues: SEOAuditResult["issues"] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Title checks
    if (!content.title) {
      issues.push({
        severity: "error",
        message: "Content must have a title",
        field: "title",
      });
      score -= 20;
    } else {
      if (content.title.length < 30) {
        issues.push({
          severity: "warning",
          message: "Title is too short (< 30 characters). Aim for 30-60 characters.",
          field: "title",
        });
        score -= 5;
      }
      if (content.title.length > 60) {
        issues.push({
          severity: "warning",
          message: "Title is too long (> 60 characters). May be truncated in search results.",
          field: "title",
        });
        score -= 5;
      }
    }

    // Meta description checks
    if (!content.metaDescription && !content.excerpt) {
      issues.push({
        severity: "error",
        message: "Content should have a meta description or excerpt",
        field: "metaDescription",
      });
      score -= 15;
    } else {
      const description = content.metaDescription || content.excerpt || "";
      if (description.length < 120) {
        issues.push({
          severity: "warning",
          message: "Description is too short (< 120 characters). Aim for 120-160 characters.",
          field: "metaDescription",
        });
        score -= 5;
      }
      if (description.length > 160) {
        issues.push({
          severity: "info",
          message: "Description is longer than 160 characters. May be truncated in search results.",
          field: "metaDescription",
        });
        score -= 2;
      }
    }

    // Slug checks
    if (!content.slug) {
      issues.push({
        severity: "error",
        message: "Content must have a URL slug",
        field: "slug",
      });
      score -= 10;
    } else {
      if (content.slug.length > 50) {
        issues.push({
          severity: "warning",
          message: "URL slug is very long. Shorter URLs are better for SEO.",
          field: "slug",
        });
        score -= 3;
      }
      if (!/^[a-z0-9-]+$/.test(content.slug)) {
        issues.push({
          severity: "warning",
          message: "URL slug should only contain lowercase letters, numbers, and hyphens",
          field: "slug",
        });
        score -= 3;
      }
    }

    // Featured image check
    if (!content.featuredImage) {
      issues.push({
        severity: "info",
        message: "Adding a featured image improves social media sharing",
        field: "featuredImage",
      });
      recommendations.push("Add a featured image for better social media appearance");
      score -= 5;
    }

    // Keywords check
    if (!content.metaKeywords) {
      issues.push({
        severity: "info",
        message: "Consider adding meta keywords for better categorization",
        field: "metaKeywords",
      });
      recommendations.push("Add relevant keywords to help with content categorization");
    }

    // Content length check (if body exists)
    if (content.body) {
      const wordCount = content.body.split(/\s+/).length;
      if (wordCount < 300) {
        issues.push({
          severity: "warning",
          message: "Content is short (< 300 words). Longer content often ranks better.",
          field: "body",
        });
        recommendations.push("Expand content to at least 300-500 words for better SEO");
        score -= 10;
      }
    }

    // Status check
    if (content.status !== "published") {
      issues.push({
        severity: "info",
        message: "Content is not published yet",
        field: "status",
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      contentId: content.id,
      score,
      issues,
      recommendations,
      checkedAt: new Date(),
    };
  }

  /**
   * Generate SEO-friendly slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export const seoHelper = SEOHelper.getInstance();
