/**
 * Public REST API Routes
 * Public v1 API for content, categories, tags with API key authentication
 */

import { Hono } from "hono";
import { apiAuthMiddleware } from "../middlewares/apiAuthMiddleware.ts";
import { API_PERMISSIONS } from "../lib/api/types.ts";
import { db } from "../config/db.ts";
import { content, categories, tags, contentCategories, contentTags } from "../db/schema.ts";
import { eq, and, like, or, desc } from "drizzle-orm";

const publicAPI = new Hono();

// Apply API authentication to all routes
publicAPI.use("*", apiAuthMiddleware());

/**
 * List content
 * GET /api/v1/content
 */
publicAPI.get("/content", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const status = c.req.query("status") || "published";
    const categorySlug = c.req.query("category");
    const tagSlug = c.req.query("tag");
    const search = c.req.query("search");

    let query = db.select().from(content).where(eq(content.status, status));

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          like(content.title, `%${search}%`),
          like(content.body, `%${search}%`)
        )!
      );
    }

    // Get content
    const results = await query
      .orderBy(desc(content.publishedAt))
      .limit(limit)
      .offset(offset);

    // Filter by category if requested
    let filteredResults = results;
    if (categorySlug) {
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (category.length > 0) {
        const contentIds = (
          await db
            .select({ contentId: contentCategories.contentId })
            .from(contentCategories)
            .where(eq(contentCategories.categoryId, category[0].id))
        ).map((r) => r.contentId);

        filteredResults = results.filter((c) => contentIds.includes(c.id));
      }
    }

    // Filter by tag if requested
    if (tagSlug) {
      const tag = await db
        .select()
        .from(tags)
        .where(eq(tags.slug, tagSlug))
        .limit(1);

      if (tag.length > 0) {
        const contentIds = (
          await db
            .select({ contentId: contentTags.contentId })
            .from(contentTags)
            .where(eq(contentTags.tagId, tag[0].id))
        ).map((r) => r.contentId);

        filteredResults = filteredResults.filter((c) => contentIds.includes(c.id));
      }
    }

    // Count total for pagination
    const totalQuery = db.select().from(content).where(eq(content.status, status));
    const total = (await totalQuery).length;

    return c.json({
      success: true,
      data: {
        content: filteredResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to list content:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list content",
      },
      500
    );
  }
});

/**
 * Get content by slug
 * GET /api/v1/content/:slug
 */
publicAPI.get("/content/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const result = await db
      .select()
      .from(content)
      .where(and(eq(content.slug, slug), eq(content.status, "published")))
      .limit(1);

    if (!result || result.length === 0) {
      return c.json(
        {
          success: false,
          error: "Content not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Failed to get content:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get content",
      },
      500
    );
  }
});

/**
 * List categories
 * GET /api/v1/categories
 */
publicAPI.get("/categories", async (c) => {
  try {
    const allCategories = await db.select().from(categories);

    return c.json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    console.error("Failed to list categories:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list categories",
      },
      500
    );
  }
});

/**
 * Get category by slug
 * GET /api/v1/categories/:slug
 */
publicAPI.get("/categories/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!result || result.length === 0) {
      return c.json(
        {
          success: false,
          error: "Category not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Failed to get category:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get category",
      },
      500
    );
  }
});

/**
 * List tags
 * GET /api/v1/tags
 */
publicAPI.get("/tags", async (c) => {
  try {
    const allTags = await db.select().from(tags);

    return c.json({
      success: true,
      data: allTags,
    });
  } catch (error) {
    console.error("Failed to list tags:", error);
    return c.json(
      {
        success: false,
        error: "Failed to list tags",
      },
      500
    );
  }
});

/**
 * Get tag by slug
 * GET /api/v1/tags/:slug
 */
publicAPI.get("/tags/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);

    if (!result || result.length === 0) {
      return c.json(
        {
          success: false,
          error: "Tag not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Failed to get tag:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get tag",
      },
      500
    );
  }
});

export default publicAPI;
