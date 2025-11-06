/**
 * Search Routes
 * Advanced search with filtering, faceting, and suggestions
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  searchContent,
  searchCategories,
  searchTags,
  globalSearch,
  getSearchSuggestions,
  getSearchStats,
  initializeSearchIndexes,
} from "../services/searchService.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const search = new Hono();

/**
 * Search content
 * GET /api/search/content
 */
search.get("/content", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const status = c.req.query("status");
    const category = c.req.query("category");
    const tag = c.req.query("tag");
    const sortBy = c.req.query("sortBy");
    const sortDir = c.req.query("sortDir") as "asc" | "desc" | undefined;
    const facets = c.req.query("facets")?.split(",");
    const highlight = c.req.query("highlight")?.split(",");

    // Build filters
    const filters: any[] = [];

    if (status) {
      filters.push({ field: "status", operator: "eq", value: status });
    }

    if (category) {
      filters.push({
        field: "categoryId",
        operator: "eq",
        value: parseInt(category),
      });
    }

    if (tag) {
      filters.push({ field: "tagId", operator: "eq", value: parseInt(tag) });
    }

    // Build sort
    const sort =
      sortBy && sortDir ? [{ field: sortBy, direction: sortDir }] : undefined;

    const results = await searchContent({
      query,
      page,
      limit,
      filters,
      sort,
      facets,
      highlightFields: highlight,
    });

    return c.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json(
      {
        success: false,
        error: "Search failed",
      },
      500
    );
  }
});

/**
 * Search categories
 * GET /api/search/categories
 */
search.get("/categories", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");

    const results = await searchCategories({
      query,
      page,
      limit,
    });

    return c.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json(
      {
        success: false,
        error: "Search failed",
      },
      500
    );
  }
});

/**
 * Search tags
 * GET /api/search/tags
 */
search.get("/tags", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");

    const results = await searchTags({
      query,
      page,
      limit,
    });

    return c.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json(
      {
        success: false,
        error: "Search failed",
      },
      500
    );
  }
});

/**
 * Global search across all indexes
 * GET /api/search/global
 */
search.get("/global", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const indexes = c.req.query("indexes")?.split(",");

    const results = await globalSearch(query, {
      page,
      limit,
      indexes,
    });

    return c.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return c.json(
      {
        success: false,
        error: "Search failed",
      },
      500
    );
  }
});

/**
 * Get search suggestions (autocomplete)
 * GET /api/search/suggestions
 */
search.get("/suggestions", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const index = c.req.query("index") || "content";
    const limit = parseInt(c.req.query("limit") || "5");

    const suggestions = await getSearchSuggestions(query, index, limit);

    return c.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get suggestions",
      },
      500
    );
  }
});

/**
 * Get search statistics (admin only)
 * GET /api/search/stats
 */
search.get("/stats", authMiddleware, async (c) => {
  try {
    const stats = await getSearchStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get stats",
      },
      500
    );
  }
});

/**
 * Rebuild search indexes (admin only)
 * POST /api/search/rebuild
 */
search.post("/rebuild", authMiddleware, async (c) => {
  try {
    await initializeSearchIndexes();

    return c.json({
      success: true,
      message: "Search indexes rebuilt successfully",
    });
  } catch (error) {
    console.error("Rebuild error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to rebuild indexes",
      },
      500
    );
  }
});

export default search;
