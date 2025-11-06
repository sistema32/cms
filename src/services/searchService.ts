/**
 * Search Service
 * Integrates search engine with database content
 */

import { db } from "../config/db.ts";
import { content, categories, tags } from "../db/schema.ts";
import { searchEngine } from "../lib/search/SearchEngine.ts";
import type { SearchQuery, SearchResult } from "../lib/search/types.ts";

/**
 * Initialize search indexes with database content
 */
export async function initializeSearchIndexes(): Promise<void> {
  console.log("🔍 Initializing search indexes...");

  // Index content
  const allContent = await db.select().from(content);
  const contentDocs = allContent.map((c) => ({
    id: c.id,
    data: c,
  }));

  await searchEngine.rebuildIndex(
    "content",
    contentDocs,
    ["title", "excerpt", "body", "metaDescription", "metaKeywords"]
  );

  // Index categories
  const allCategories = await db.select().from(categories);
  const categoryDocs = allCategories.map((c) => ({
    id: c.id,
    data: c,
  }));

  await searchEngine.rebuildIndex(
    "category",
    categoryDocs,
    ["name", "slug", "description"]
  );

  // Index tags
  const allTags = await db.select().from(tags);
  const tagDocs = allTags.map((t) => ({
    id: t.id,
    data: t,
  }));

  await searchEngine.rebuildIndex("tag", tagDocs, ["name", "slug"]);

  const stats = await searchEngine.getStats();
  console.log(
    `✅ Search indexes initialized: ${stats.totalDocuments} documents`
  );
}

/**
 * Search content
 */
export async function searchContent(
  query: SearchQuery
): Promise<SearchResult> {
  // Add default filters for published content only
  const filters = query.filters || [];

  // Only search published content by default
  if (!filters.some((f) => f.field === "status")) {
    filters.push({
      field: "status",
      operator: "eq",
      value: "published",
    });
  }

  return await searchEngine.search("content", {
    ...query,
    filters,
  });
}

/**
 * Search categories
 */
export async function searchCategories(
  query: SearchQuery
): Promise<SearchResult> {
  return await searchEngine.search("category", query);
}

/**
 * Search tags
 */
export async function searchTags(query: SearchQuery): Promise<SearchResult> {
  return await searchEngine.search("tag", query);
}

/**
 * Global search across all indexes
 */
export async function globalSearch(
  queryString: string,
  options: {
    page?: number;
    limit?: number;
    indexes?: string[];
  } = {}
): Promise<{
  content: SearchResult;
  categories: SearchResult;
  tags: SearchResult;
}> {
  const indexes = options.indexes || ["content", "category", "tag"];
  const query: SearchQuery = {
    query: queryString,
    page: options.page,
    limit: options.limit,
  };

  const results = {
    content: { hits: [], totalHits: 0, page: 1, limit: 20, totalPages: 0, processingTimeMs: 0 } as SearchResult,
    categories: { hits: [], totalHits: 0, page: 1, limit: 20, totalPages: 0, processingTimeMs: 0 } as SearchResult,
    tags: { hits: [], totalHits: 0, page: 1, limit: 20, totalPages: 0, processingTimeMs: 0 } as SearchResult,
  };

  if (indexes.includes("content")) {
    results.content = await searchContent(query);
  }

  if (indexes.includes("category")) {
    results.categories = await searchCategories(query);
  }

  if (indexes.includes("tag")) {
    results.tags = await searchTags(query);
  }

  return results;
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(
  query: string,
  indexName: string = "content",
  limit = 5
): Promise<string[]> {
  return await searchEngine.getSuggestions(indexName, query, limit);
}

/**
 * Index new content
 */
export async function indexContent(contentId: number): Promise<void> {
  const contentData = await db
    .select()
    .from(content)
    .where((c) => c.id === contentId)
    .limit(1);

  if (contentData && contentData.length > 0) {
    await searchEngine.indexDocument(
      "content",
      contentId,
      contentData[0],
      ["title", "excerpt", "body", "metaDescription", "metaKeywords"]
    );
  }
}

/**
 * Index new category
 */
export async function indexCategory(categoryId: number): Promise<void> {
  const categoryData = await db
    .select()
    .from(categories)
    .where((c) => c.id === categoryId)
    .limit(1);

  if (categoryData && categoryData.length > 0) {
    await searchEngine.indexDocument(
      "category",
      categoryId,
      categoryData[0],
      ["name", "slug", "description"]
    );
  }
}

/**
 * Index new tag
 */
export async function indexTag(tagId: number): Promise<void> {
  const tagData = await db
    .select()
    .from(tags)
    .where((t) => t.id === tagId)
    .limit(1);

  if (tagData && tagData.length > 0) {
    await searchEngine.indexDocument("tag", tagId, tagData[0], [
      "name",
      "slug",
    ]);
  }
}

/**
 * Remove content from index
 */
export async function removeContentFromIndex(contentId: number): Promise<void> {
  await searchEngine.removeDocument("content", contentId);
}

/**
 * Remove category from index
 */
export async function removeCategoryFromIndex(
  categoryId: number
): Promise<void> {
  await searchEngine.removeDocument("category", categoryId);
}

/**
 * Remove tag from index
 */
export async function removeTagFromIndex(tagId: number): Promise<void> {
  await searchEngine.removeDocument("tag", tagId);
}

/**
 * Get search stats
 */
export async function getSearchStats() {
  return await searchEngine.getStats();
}
