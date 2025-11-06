/**
 * Content Importer
 * Import content from WordPress XML, JSON, CSV
 */

import { db } from "../../db/db.ts";
import { content, categories, tags, users, contentCategories, contentTags } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import type { ImportOptions, ImportResult, WordPressPost } from "./types.ts";

export class Importer {
  private static instance: Importer;
  private categoryMap = new Map<string, number>();
  private tagMap = new Map<string, number>();

  private constructor() {}

  static getInstance(): Importer {
    if (!Importer.instance) {
      Importer.instance = new Importer();
    }
    return Importer.instance;
  }

  /**
   * Import from WordPress XML
   */
  async importFromWordPress(xmlContent: string, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      itemsProcessed: 0,
      itemsImported: 0,
      itemsSkipped: 0,
      itemsFailed: 0,
      errors: [],
      warnings: [],
      created: {
        content: 0,
        categories: 0,
        tags: 0,
      },
    };

    try {
      // Parse WordPress XML (simplified parser)
      const posts = this.parseWordPressXML(xmlContent);
      result.itemsProcessed = posts.length;

      for (const post of posts) {
        try {
          // Import post
          await this.importWordPressPost(post, options, result);
          result.itemsImported++;
        } catch (error) {
          result.itemsFailed++;
          result.errors.push(`Failed to import "${post.title}": ${error}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`XML parsing failed: ${error}`);
    }

    return result;
  }

  /**
   * Import from JSON
   */
  async importFromJSON(jsonContent: string, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      itemsProcessed: 0,
      itemsImported: 0,
      itemsSkipped: 0,
      itemsFailed: 0,
      errors: [],
      warnings: [],
      created: {},
    };

    try {
      const data = JSON.parse(jsonContent);

      // Import categories first
      if (data.categories && options.createCategories) {
        for (const cat of data.categories) {
          try {
            const [created] = await db.insert(categories).values({
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              parentId: cat.parentId,
            }).returning();
            this.categoryMap.set(cat.slug, created.id);
            result.created.categories = (result.created.categories || 0) + 1;
          } catch (error) {
            // Category might already exist
            const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
            if (existing.length > 0) {
              this.categoryMap.set(cat.slug, existing[0].id);
            }
          }
        }
      }

      // Import tags
      if (data.tags && options.createTags) {
        for (const tag of data.tags) {
          try {
            const [created] = await db.insert(tags).values({
              name: tag.name,
              slug: tag.slug,
            }).returning();
            this.tagMap.set(tag.slug, created.id);
            result.created.tags = (result.created.tags || 0) + 1;
          } catch (error) {
            const existing = await db.select().from(tags).where(eq(tags.slug, tag.slug)).limit(1);
            if (existing.length > 0) {
              this.tagMap.set(tag.slug, existing[0].id);
            }
          }
        }
      }

      // Import content
      if (data.content) {
        result.itemsProcessed = data.content.length;

        for (const item of data.content) {
          try {
            await this.importContentItem(item, options, result);
            result.itemsImported++;
          } catch (error) {
            result.itemsFailed++;
            result.errors.push(`Failed to import "${item.title}": ${error}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`JSON parsing failed: ${error}`);
    }

    return result;
  }

  /**
   * Parse WordPress XML (simplified)
   */
  private parseWordPressXML(xmlContent: string): WordPressPost[] {
    const posts: WordPressPost[] = [];

    // This is a simplified parser
    // In production, would use a proper XML parser
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = xmlContent.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];

      const post: WordPressPost = {
        title: this.extractXmlValue(itemXml, "title"),
        link: this.extractXmlValue(itemXml, "link"),
        pubDate: this.extractXmlValue(itemXml, "pubDate"),
        creator: this.extractXmlValue(itemXml, "dc:creator"),
        content: this.extractCDATA(itemXml, "content:encoded"),
        excerpt: this.extractCDATA(itemXml, "excerpt:encoded"),
        postId: this.extractXmlValue(itemXml, "wp:post_id"),
        postDate: this.extractXmlValue(itemXml, "wp:post_date"),
        postName: this.extractXmlValue(itemXml, "wp:post_name"),
        status: this.extractXmlValue(itemXml, "wp:status"),
        postType: this.extractXmlValue(itemXml, "wp:post_type"),
        categories: this.extractCategories(itemXml),
        tags: this.extractTags(itemXml),
      };

      // Only import posts (not pages, attachments, etc.)
      if (post.postType === "post" || !post.postType) {
        posts.push(post);
      }
    }

    return posts;
  }

  /**
   * Import WordPress post
   */
  private async importWordPressPost(
    post: WordPressPost,
    options: ImportOptions,
    result: ImportResult
  ): Promise<void> {
    // Check if already exists
    if (!options.overwriteExisting) {
      const existing = await db.select().from(content).where(eq(content.slug, post.postName || post.title.toLowerCase())).limit(1);
      if (existing.length > 0) {
        result.itemsSkipped++;
        result.warnings.push(`Skipped existing post: ${post.title}`);
        return;
      }
    }

    // Create categories
    const categoryIds: number[] = [];
    if (post.categories && options.createCategories) {
      for (const catName of post.categories) {
        let catId = this.categoryMap.get(catName);
        if (!catId) {
          const [created] = await db.insert(categories).values({
            name: catName,
            slug: this.slugify(catName),
          }).returning();
          catId = created.id;
          this.categoryMap.set(catName, catId);
          result.created.categories = (result.created.categories || 0) + 1;
        }
        categoryIds.push(catId);
      }
    }

    // Create tags
    const tagIds: number[] = [];
    if (post.tags && options.createTags) {
      for (const tagName of post.tags) {
        let tagId = this.tagMap.get(tagName);
        if (!tagId) {
          const [created] = await db.insert(tags).values({
            name: tagName,
            slug: this.slugify(tagName),
          }).returning();
          tagId = created.id;
          this.tagMap.set(tagName, tagId);
          result.created.tags = (result.created.tags || 0) + 1;
        }
        tagIds.push(tagId);
      }
    }

    // Create content
    const [created] = await db.insert(content).values({
      title: post.title,
      slug: post.postName || this.slugify(post.title),
      body: post.content || "",
      excerpt: post.excerpt,
      status: this.mapWordPressStatus(post.status) as any,
      authorId: options.defaultAuthorId || 1,
      contentTypeId: 1, // Default content type
      publishedAt: post.postDate ? new Date(post.postDate) : undefined,
    }).returning();

    result.created.content = (result.created.content || 0) + 1;

    // Link categories
    for (const catId of categoryIds) {
      await db.insert(contentCategories).values({
        contentId: created.id,
        categoryId: catId,
      });
    }

    // Link tags
    for (const tagId of tagIds) {
      await db.insert(contentTags).values({
        contentId: created.id,
        tagId: tagId,
      });
    }
  }

  /**
   * Import content item from JSON
   */
  private async importContentItem(
    item: any,
    options: ImportOptions,
    result: ImportResult
  ): Promise<void> {
    const [created] = await db.insert(content).values({
      title: item.title,
      slug: item.slug,
      body: item.body,
      excerpt: item.excerpt,
      status: options.defaultStatus || item.status || "draft",
      authorId: options.defaultAuthorId || item.authorId || 1,
      contentTypeId: item.contentTypeId || 1,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
    }).returning();

    result.created.content = (result.created.content || 0) + 1;
  }

  /**
   * Extract XML value
   */
  private extractXmlValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  }

  /**
   * Extract CDATA value
   */
  private extractCDATA(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  }

  /**
   * Extract categories from WordPress XML
   */
  private extractCategories(xml: string): string[] {
    const categories: string[] = [];
    const regex = /<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/gi;
    const matches = xml.matchAll(regex);
    for (const match of matches) {
      categories.push(match[1]);
    }
    return categories;
  }

  /**
   * Extract tags from WordPress XML
   */
  private extractTags(xml: string): string[] {
    const tags: string[] = [];
    const regex = /<category domain="post_tag"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/gi;
    const matches = xml.matchAll(regex);
    for (const match of matches) {
      tags.push(match[1]);
    }
    return tags;
  }

  /**
   * Map WordPress status to LexCMS status
   */
  private mapWordPressStatus(status?: string): string {
    const statusMap: Record<string, string> = {
      publish: "published",
      draft: "draft",
      pending: "draft",
      private: "draft",
      future: "scheduled",
    };
    return statusMap[status || "draft"] || "draft";
  }

  /**
   * Create slug from string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const importer = Importer.getInstance();
