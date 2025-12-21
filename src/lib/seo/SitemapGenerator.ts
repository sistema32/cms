/**
 * Sitemap Generator
 * Generates XML sitemaps for content, categories, tags, and pages
 */

import { db } from "../../config/db.ts";
import { content, categories, tags } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { SitemapConfig, SitemapUrl } from "./types.ts";
import { env } from "../../config/env.ts";

export class SitemapGenerator {
  private static instance: SitemapGenerator;
  private config: SitemapConfig;

  private constructor() {
    this.config = {
      baseUrl: env.BASE_URL,
      includeContent: true,
      includeCategories: true,
      includeTags: true,
      includePages: true,
      maxUrls: 50000, // Google limit
      excludePaths: [`/${env.ADMIN_PATH}`, "/api"],
    };
  }

  static getInstance(): SitemapGenerator {
    if (!SitemapGenerator.instance) {
      SitemapGenerator.instance = new SitemapGenerator();
    }
    return SitemapGenerator.instance;
  }

  /**
   * Configure sitemap generation
   */
  configure(config: Partial<SitemapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate complete sitemap XML
   */
  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // Add homepage
    urls.push({
      loc: this.config.baseUrl,
      changefreq: "daily",
      priority: 1.0,
    });

    // Add content URLs
    if (this.config.includeContent) {
      const contentUrls = await this.getContentUrls();
      urls.push(...contentUrls);
    }

    // Add category URLs
    if (this.config.includeCategories) {
      const categoryUrls = await this.getCategoryUrls();
      urls.push(...categoryUrls);
    }

    // Add tag URLs
    if (this.config.includeTags) {
      const tagUrls = await this.getTagUrls();
      urls.push(...tagUrls);
    }

    // Filter excluded paths
    const filteredUrls = urls.filter(
      (url) => !this.config.excludePaths?.some((path) => url.loc.includes(path))
    );

    // Limit to max URLs
    const limitedUrls = filteredUrls.slice(0, this.config.maxUrls);

    return this.generateXML(limitedUrls);
  }

  /**
   * Get content URLs
   */
  private async getContentUrls(): Promise<SitemapUrl[]> {
    const allContent = await db
      .select()
      .from(content)
      .where(eq(content.status, "published"));

    return allContent.map((item) => {
      const featuredImage = (item as any).featuredImage as string | undefined;
      const url: SitemapUrl = {
        loc: `${this.config.baseUrl}/${item.slug}`,
        lastmod: item.updatedAt?.toISOString() || item.publishedAt?.toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      };

      // Add images if featured image exists
      if (featuredImage) {
        url.images = [
          {
            loc: featuredImage,
            title: item.title,
          },
        ];
      }

      return url;
    });
  }

  /**
   * Get category URLs
   */
  private async getCategoryUrls(): Promise<SitemapUrl[]> {
    const allCategories = await db.select().from(categories);

    return allCategories.map((category) => ({
      loc: `${this.config.baseUrl}/category/${category.slug}`,
      lastmod: category.updatedAt?.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.6,
    }));
  }

  /**
   * Get tag URLs
   */
  private async getTagUrls(): Promise<SitemapUrl[]> {
    const allTags = await db.select().from(tags);

    return allTags.map((tag) => ({
      loc: `${this.config.baseUrl}/tag/${tag.slug}`,
      changefreq: "weekly" as const,
      priority: 0.5,
    }));
  }

  /**
   * Generate sitemap index for large sites
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      {
        loc: `${this.config.baseUrl}/sitemap-content.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/sitemap-categories.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/sitemap-tags.xml`,
        lastmod: new Date().toISOString(),
      },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sitemap of sitemaps) {
      xml += "  <sitemap>\n";
      xml += `    <loc>${this.escapeXml(sitemap.loc)}</loc>\n`;
      if (sitemap.lastmod) {
        xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      }
      xml += "  </sitemap>\n";
    }

    xml += "</sitemapindex>";
    return xml;
  }

  /**
   * Generate content-specific sitemap
   */
  async generateContentSitemap(): Promise<string> {
    const urls = await this.getContentUrls();
    return this.generateXML(urls);
  }

  /**
   * Generate category-specific sitemap
   */
  async generateCategorySitemap(): Promise<string> {
    const urls = await this.getCategoryUrls();
    return this.generateXML(urls);
  }

  /**
   * Generate tag-specific sitemap
   */
  async generateTagSitemap(): Promise<string> {
    const urls = await this.getTagUrls();
    return this.generateXML(urls);
  }

  /**
   * Generate XML from URLs
   */
  private generateXML(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const url of urls) {
      xml += "  <url>\n";
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;

      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      // Add images
      if (url.images && url.images.length > 0) {
        for (const image of url.images) {
          xml += "    <image:image>\n";
          xml += `      <image:loc>${this.escapeXml(image.loc)}</image:loc>\n`;
          if (image.title) {
            xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
          }
          if (image.caption) {
            xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
          }
          xml += "    </image:image>\n";
        }
      }

      xml += "  </url>\n";
    }

    xml += "</urlset>";
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export const sitemapGenerator = SitemapGenerator.getInstance();
