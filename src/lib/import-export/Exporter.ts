/**
 * Content Exporter
 * Export content to JSON, CSV, XML formats
 */

import { db } from "../../config/db.ts";
import { content, categories, tags, users, contentCategories, contentTags } from "../../db/schema.ts";
import { eq, and, gte, lte } from "drizzle-orm";
import type { ExportOptions, ExportResult } from "./types.ts";

export class Exporter {
  private static instance: Exporter;

  private constructor() {}

  static getInstance(): Exporter {
    if (!Exporter.instance) {
      Exporter.instance = new Exporter();
    }
    return Exporter.instance;
  }

  /**
   * Export to JSON
   */
  async exportToJSON(options: ExportOptions): Promise<ExportResult> {
    const data: any = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      generator: "LexCMS",
    };

    let totalItems = 0;

    // Export content
    if (options.includeContent !== false) {
      const contentData = await this.getContentData(options.filters);
      data.content = contentData;
      totalItems += contentData.length;
    }

    // Export categories
    if (options.includeCategories) {
      const categoriesData = await db.select().from(categories);
      data.categories = categoriesData;
      totalItems += categoriesData.length;
    }

    // Export tags
    if (options.includeTags) {
      const tagsData = await db.select().from(tags);
      data.tags = tagsData;
      totalItems += tagsData.length;
    }

    // Export users
    if (options.includeUsers) {
      const usersData = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        createdAt: users.createdAt,
      }).from(users);
      data.users = usersData;
      totalItems += usersData.length;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const filename = `lexcms-export-${Date.now()}.json`;
    const path = `./exports/${filename}`;

    // In production, would write to file system
    // await Deno.writeTextFile(path, jsonString);

    return {
      format: "json",
      filename,
      path,
      size: jsonString.length,
      itemCount: {
        content: data.content?.length || 0,
        categories: data.categories?.length || 0,
        tags: data.tags?.length || 0,
        users: data.users?.length || 0,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Export to CSV
   */
  async exportToCSV(options: ExportOptions): Promise<ExportResult> {
    const contentData = await this.getContentData(options.filters);

    // CSV headers
    const headers = [
      "ID",
      "Title",
      "Slug",
      "Status",
      "Author",
      "Published Date",
      "Categories",
      "Tags",
      "Views",
      "Created At",
    ];

    const rows = [headers.join(",")];

    for (const item of contentData) {
      const row = [
        item.id,
        `"${this.escapeCsv(item.title)}"`,
        item.slug,
        item.status,
        item.authorId,
        item.publishedAt || "",
        `"${item.categories?.join(", ") || ""}"`,
        `"${item.tags?.join(", ") || ""}"`,
        item.views || 0,
        item.createdAt,
      ];
      rows.push(row.join(","));
    }

    const csvString = rows.join("\n");
    const filename = `lexcms-export-${Date.now()}.csv`;
    const path = `./exports/${filename}`;

    return {
      format: "csv",
      filename,
      path,
      size: csvString.length,
      itemCount: {
        content: contentData.length,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Export to WordPress XML format
   */
  async exportToWordPress(options: ExportOptions): Promise<ExportResult> {
    const contentData = await this.getContentData(options.filters);
    const categoriesData = options.includeCategories ? await db.select().from(categories) : [];
    const tagsData = options.includeTags ? await db.select().from(tags) : [];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0"\n';
    xml += '  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"\n';
    xml += '  xmlns:content="http://purl.org/rss/1.0/modules/content/"\n';
    xml += '  xmlns:wfw="http://wellformedweb.org/CommentAPI/"\n';
    xml += '  xmlns:dc="http://purl.org/dc/elements/1.1/"\n';
    xml += '  xmlns:wp="http://wordpress.org/export/1.2/">\n';
    xml += '  <channel>\n';
    xml += '    <title>LexCMS Export</title>\n';
    xml += '    <link>https://example.com</link>\n';
    xml += '    <description>LexCMS Content Export</description>\n';
    xml += '    <generator>LexCMS</generator>\n';
    xml += `    <language>en</language>\n`;

    // Export categories
    for (const category of categoriesData) {
      xml += '    <wp:category>\n';
      xml += `      <wp:term_id>${category.id}</wp:term_id>\n`;
      xml += `      <wp:category_nicename>${this.escapeXml(category.slug)}</wp:category_nicename>\n`;
      xml += `      <wp:cat_name><![CDATA[${category.name}]]></wp:cat_name>\n`;
      xml += '    </wp:category>\n';
    }

    // Export tags
    for (const tag of tagsData) {
      xml += '    <wp:tag>\n';
      xml += `      <wp:term_id>${tag.id}</wp:term_id>\n`;
      xml += `      <wp:tag_slug>${this.escapeXml(tag.slug)}</wp:tag_slug>\n`;
      xml += `      <wp:tag_name><![CDATA[${tag.name}]]></wp:tag_name>\n`;
      xml += '    </wp:tag>\n';
    }

    // Export content
    for (const item of contentData) {
      xml += '    <item>\n';
      xml += `      <title>${this.escapeXml(item.title)}</title>\n`;
      xml += `      <link>https://example.com/${item.slug}</link>\n`;
      xml += `      <pubDate>${item.publishedAt || item.createdAt}</pubDate>\n`;
      xml += `      <dc:creator><![CDATA[${item.authorId}]]></dc:creator>\n`;
      xml += `      <description></description>\n`;
      xml += `      <content:encoded><![CDATA[${item.body || ""}]]></content:encoded>\n`;
      xml += `      <excerpt:encoded><![CDATA[${item.excerpt || ""}]]></excerpt:encoded>\n`;
      xml += `      <wp:post_id>${item.id}</wp:post_id>\n`;
      xml += `      <wp:post_date>${item.createdAt}</wp:post_date>\n`;
      xml += `      <wp:post_name>${this.escapeXml(item.slug)}</wp:post_name>\n`;
      xml += `      <wp:status>${item.status}</wp:status>\n`;
      xml += `      <wp:post_type>post</wp:post_type>\n`;

      // Categories
      if (item.categories) {
        for (const cat of item.categories) {
          xml += `      <category domain="category" nicename="${this.escapeXml(cat)}"><![CDATA[${cat}]]></category>\n`;
        }
      }

      // Tags
      if (item.tags) {
        for (const tag of item.tags) {
          xml += `      <category domain="post_tag" nicename="${this.escapeXml(tag)}"><![CDATA[${tag}]]></category>\n`;
        }
      }

      xml += '    </item>\n';
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    const filename = `lexcms-wordpress-export-${Date.now()}.xml`;
    const path = `./exports/${filename}`;

    return {
      format: "wordpress",
      filename,
      path,
      size: xml.length,
      itemCount: {
        content: contentData.length,
        categories: categoriesData.length,
        tags: tagsData.length,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Get content data with relationships
   */
  private async getContentData(filters?: any): Promise<any[]> {
    let query = db.select().from(content);

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      // Filter by status
    }

    if (filters?.dateFrom) {
      query = query.where(gte(content.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      query = query.where(lte(content.createdAt, filters.dateTo));
    }

    if (filters?.authorId) {
      query = query.where(eq(content.authorId, filters.authorId));
    }

    const contentData = await query;

    // Enrich with relationships
    for (const item of contentData) {
      // Get categories
      const itemCategories = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(contentCategories)
        .innerJoin(categories, eq(contentCategories.categoryId, categories.id))
        .where(eq(contentCategories.contentId, item.id));

      (item as any).categories = itemCategories.map((c) => c.name);

      // Get tags
      const itemTags = await db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(contentTags)
        .innerJoin(tags, eq(contentTags.tagId, tags.id))
        .where(eq(contentTags.contentId, item.id));

      (item as any).tags = itemTags.map((t) => t.name);
    }

    return contentData;
  }

  /**
   * Escape CSV value
   */
  private escapeCsv(value: string): string {
    return value.replace(/"/g, '""');
  }

  /**
   * Escape XML value
   */
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export const exporter = Exporter.getInstance();
