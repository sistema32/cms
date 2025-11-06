/**
 * Advanced SEO Routes
 * Sitemap, robots.txt, and SEO management
 */

import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import {
  sitemapGenerator,
  robotsManager,
  structuredDataGenerator,
  seoHelper,
} from "../lib/seo/index.ts";
import { db } from "../db/db.ts";
import { content, users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const seoAdvanced = new Hono();

/**
 * Get main sitemap.xml
 * GET /sitemap.xml
 */
seoAdvanced.get("/sitemap.xml", async (c) => {
  try {
    const xml = await sitemapGenerator.generateSitemap();

    c.header("Content-Type", "application/xml");
    c.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    return c.text(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return c.text("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", 500);
  }
});

/**
 * Get sitemap index (for large sites)
 * GET /sitemap-index.xml
 */
seoAdvanced.get("/sitemap-index.xml", async (c) => {
  try {
    const xml = await sitemapGenerator.generateSitemapIndex();

    c.header("Content-Type", "application/xml");
    c.header("Cache-Control", "public, max-age=3600");
    return c.text(xml);
  } catch (error) {
    console.error("Failed to generate sitemap index:", error);
    return c.text("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></sitemapindex>", 500);
  }
});

/**
 * Get content-specific sitemap
 * GET /sitemap-content.xml
 */
seoAdvanced.get("/sitemap-content.xml", async (c) => {
  try {
    const xml = await sitemapGenerator.generateContentSitemap();

    c.header("Content-Type", "application/xml");
    c.header("Cache-Control", "public, max-age=3600");
    return c.text(xml);
  } catch (error) {
    console.error("Failed to generate content sitemap:", error);
    return c.text("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", 500);
  }
});

/**
 * Get category-specific sitemap
 * GET /sitemap-categories.xml
 */
seoAdvanced.get("/sitemap-categories.xml", async (c) => {
  try {
    const xml = await sitemapGenerator.generateCategorySitemap();

    c.header("Content-Type", "application/xml");
    c.header("Cache-Control", "public, max-age=3600");
    return c.text(xml);
  } catch (error) {
    console.error("Failed to generate category sitemap:", error);
    return c.text("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", 500);
  }
});

/**
 * Get tag-specific sitemap
 * GET /sitemap-tags.xml
 */
seoAdvanced.get("/sitemap-tags.xml", async (c) => {
  try {
    const xml = await sitemapGenerator.generateTagSitemap();

    c.header("Content-Type", "application/xml");
    c.header("Cache-Control", "public, max-age=3600");
    return c.text(xml);
  } catch (error) {
    console.error("Failed to generate tag sitemap:", error);
    return c.text("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", 500);
  }
});

/**
 * Get robots.txt
 * GET /robots.txt
 */
seoAdvanced.get("/robots.txt", (c) => {
  try {
    const txt = robotsManager.generate();

    c.header("Content-Type", "text/plain");
    c.header("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    return c.text(txt);
  } catch (error) {
    console.error("Failed to generate robots.txt:", error);
    return c.text("User-agent: *\nDisallow:", 500);
  }
});

// Admin-only routes for SEO management
const adminRoutes = new Hono();
adminRoutes.use("*", authMiddleware);

/**
 * Configure sitemap settings
 * POST /api/seo/sitemap/config
 */
const sitemapConfigSchema = z.object({
  includeContent: z.boolean().optional(),
  includeCategories: z.boolean().optional(),
  includeTags: z.boolean().optional(),
  includePages: z.boolean().optional(),
  maxUrls: z.number().optional(),
  excludePaths: z.array(z.string()).optional(),
});

adminRoutes.post("/sitemap/config", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = sitemapConfigSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    sitemapGenerator.configure(parsed.data);

    return c.json({
      success: true,
      message: "Sitemap configuration updated",
    });
  } catch (error) {
    console.error("Failed to configure sitemap:", error);
    return c.json(
      {
        success: false,
        error: "Failed to configure sitemap",
      },
      500
    );
  }
});

/**
 * Configure robots.txt
 * POST /api/seo/robots/config
 */
const robotsConfigSchema = z.object({
  userAgents: z.array(
    z.object({
      userAgent: z.string(),
      allow: z.array(z.string()).optional(),
      disallow: z.array(z.string()).optional(),
      crawlDelay: z.number().optional(),
    })
  ).optional(),
  sitemaps: z.array(z.string()).optional(),
});

adminRoutes.post("/robots/config", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = robotsConfigSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    robotsManager.configure(parsed.data);

    return c.json({
      success: true,
      message: "Robots.txt configuration updated",
    });
  } catch (error) {
    console.error("Failed to configure robots.txt:", error);
    return c.json(
      {
        success: false,
        error: "Failed to configure robots.txt",
      },
      500
    );
  }
});

/**
 * Get robots.txt current config
 * GET /api/seo/robots/config
 */
adminRoutes.get("/robots/config", (c) => {
  try {
    const config = robotsManager.getConfig();
    return c.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Failed to get robots config:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get robots config",
      },
      500
    );
  }
});

/**
 * Block bad bots in robots.txt
 * POST /api/seo/robots/block-bad-bots
 */
adminRoutes.post("/robots/block-bad-bots", (c) => {
  try {
    robotsManager.blockBadBots();
    return c.json({
      success: true,
      message: "Bad bots blocked in robots.txt",
    });
  } catch (error) {
    console.error("Failed to block bad bots:", error);
    return c.json(
      {
        success: false,
        error: "Failed to block bad bots",
      },
      500
    );
  }
});

/**
 * Audit content SEO
 * POST /api/seo/audit/:contentId
 */
adminRoutes.post("/audit/:contentId", async (c) => {
  try {
    const contentId = parseInt(c.req.param("contentId"));

    if (isNaN(contentId)) {
      return c.json(
        {
          success: false,
          error: "Invalid content ID",
        },
        400
      );
    }

    const contentData = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentData || contentData.length === 0) {
      return c.json(
        {
          success: false,
          error: "Content not found",
        },
        404
      );
    }

    const audit = seoHelper.auditContent(contentData[0]);

    return c.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error("Failed to audit content:", error);
    return c.json(
      {
        success: false,
        error: "Failed to audit content",
      },
      500
    );
  }
});

/**
 * Generate structured data for content
 * GET /api/seo/structured-data/:contentId
 */
adminRoutes.get("/structured-data/:contentId", async (c) => {
  try {
    const contentId = parseInt(c.req.param("contentId"));

    if (isNaN(contentId)) {
      return c.json(
        {
          success: false,
          error: "Invalid content ID",
        },
        400
      );
    }

    const contentData = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentData || contentData.length === 0) {
      return c.json(
        {
          success: false,
          error: "Content not found",
        },
        404
      );
    }

    // Get author
    const authorData = await db
      .select()
      .from(users)
      .where(eq(users.id, contentData[0].authorId))
      .limit(1);

    const author = authorData?.[0]
      ? { name: authorData[0].username }
      : { name: "Unknown" };

    const schema = structuredDataGenerator.generateArticle(
      contentData[0],
      author,
      { name: "LexCMS" } // Should come from settings
    );

    return c.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error("Failed to generate structured data:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate structured data",
      },
      500
    );
  }
});

/**
 * Generate SEO metadata for content
 * GET /api/seo/metadata/:contentId
 */
adminRoutes.get("/metadata/:contentId", async (c) => {
  try {
    const contentId = parseInt(c.req.param("contentId"));

    if (isNaN(contentId)) {
      return c.json(
        {
          success: false,
          error: "Invalid content ID",
        },
        400
      );
    }

    const contentData = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentData || contentData.length === 0) {
      return c.json(
        {
          success: false,
          error: "Content not found",
        },
        404
      );
    }

    // Get author
    const authorData = await db
      .select()
      .from(users)
      .where(eq(users.id, contentData[0].authorId))
      .limit(1);

    const author = authorData?.[0] ? { name: authorData[0].username } : undefined;

    const metadata = seoHelper.generateContentMetadata(contentData[0], author);

    return c.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate metadata",
      },
      500
    );
  }
});

/**
 * Generate slug from title
 * POST /api/seo/generate-slug
 */
const generateSlugSchema = z.object({
  title: z.string().min(1),
});

adminRoutes.post("/generate-slug", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = generateSlugSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    const slug = seoHelper.generateSlug(parsed.data.title);

    return c.json({
      success: true,
      data: { slug },
    });
  } catch (error) {
    console.error("Failed to generate slug:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate slug",
      },
      500
    );
  }
});

// Mount admin routes
seoAdvanced.route("/api/seo", adminRoutes);

export default seoAdvanced;
