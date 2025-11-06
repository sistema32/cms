/**
 * Search Engine
 * In-memory full-text search with filtering and faceting
 */

import type {
  SearchQuery,
  SearchResult,
  SearchHit,
  SearchIndexEntry,
  SearchFilter,
  SortOption,
  FacetValue,
} from "./types.ts";

export class SearchEngine {
  private static instance: SearchEngine;
  private indexes = new Map<string, Map<string | number, SearchIndexEntry>>();

  private constructor() {
    // Initialize default indexes
    this.indexes.set("content", new Map());
    this.indexes.set("category", new Map());
    this.indexes.set("tag", new Map());
  }

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * Index a document
   */
  async indexDocument(
    indexName: string,
    id: string | number,
    data: Record<string, any>,
    searchableFields: string[]
  ): Promise<void> {
    if (!this.indexes.has(indexName)) {
      this.indexes.set(indexName, new Map());
    }

    const index = this.indexes.get(indexName)!;

    // Build searchable text from specified fields
    const searchableText = searchableFields
      .map((field) => {
        const value = data[field];
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        if (Array.isArray(value)) return value.join(" ");
        return JSON.stringify(value);
      })
      .join(" ")
      .toLowerCase();

    const entry: SearchIndexEntry = {
      id,
      type: indexName as any,
      data,
      searchableText,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt,
    };

    index.set(id, entry);
  }

  /**
   * Remove document from index
   */
  async removeDocument(indexName: string, id: string | number): Promise<void> {
    const index = this.indexes.get(indexName);
    if (index) {
      index.delete(id);
    }
  }

  /**
   * Clear an entire index
   */
  async clearIndex(indexName: string): Promise<void> {
    this.indexes.set(indexName, new Map());
  }

  /**
   * Search documents
   */
  async search<T = any>(
    indexName: string,
    query: SearchQuery
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();
    const index = this.indexes.get(indexName);

    if (!index) {
      return {
        hits: [],
        totalHits: 0,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: 0,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Get all documents
    let documents = Array.from(index.values());

    // Apply search query
    if (query.query && query.query.trim()) {
      documents = this.applySearchQuery(documents, query.query);
    }

    // Apply filters
    if (query.filters && query.filters.length > 0) {
      documents = this.applyFilters(documents, query.filters);
    }

    // Calculate facets if requested
    const facets = query.facets
      ? this.calculateFacets(documents, query.facets)
      : undefined;

    // Apply sorting
    if (query.sort && query.sort.length > 0) {
      documents = this.applySorting(documents, query.sort);
    }

    // Total hits before pagination
    const totalHits = documents.length;

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedDocs = documents.slice(offset, offset + limit);

    // Convert to search hits
    const hits: SearchHit<T>[] = paginatedDocs.map((doc) => ({
      id: doc.id,
      score: doc.score || 1,
      data: doc.data as T,
      highlights: query.highlightFields
        ? this.generateHighlights(doc, query.query, query.highlightFields)
        : undefined,
    }));

    return {
      hits,
      totalHits,
      page,
      limit,
      totalPages: Math.ceil(totalHits / limit),
      processingTimeMs: Date.now() - startTime,
      facets,
    };
  }

  /**
   * Apply search query with scoring
   */
  private applySearchQuery(
    documents: (SearchIndexEntry & { score?: number })[],
    query: string
  ): (SearchIndexEntry & { score?: number })[] {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(Boolean);

    return documents
      .map((doc) => {
        let score = 0;

        // Check if all terms exist in searchable text
        const allTermsMatch = queryTerms.every((term) =>
          doc.searchableText.includes(term)
        );

        if (!allTermsMatch) {
          return null;
        }

        // Calculate relevance score
        for (const term of queryTerms) {
          // Exact phrase match bonus
          if (doc.searchableText.includes(queryLower)) {
            score += 10;
          }

          // Term frequency
          const regex = new RegExp(term, "gi");
          const matches = doc.searchableText.match(regex);
          score += (matches?.length || 0) * 2;

          // Title/name boost (if searchable text starts with term)
          if (doc.searchableText.startsWith(term)) {
            score += 5;
          }
        }

        return { ...doc, score };
      })
      .filter((doc): doc is SearchIndexEntry & { score: number } => doc !== null)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Apply filters
   */
  private applyFilters(
    documents: SearchIndexEntry[],
    filters: SearchFilter[]
  ): SearchIndexEntry[] {
    return documents.filter((doc) => {
      return filters.every((filter) => {
        const value = this.getNestedValue(doc.data, filter.field);

        switch (filter.operator) {
          case "eq":
            return value === filter.value;
          case "ne":
            return value !== filter.value;
          case "gt":
            return value > filter.value;
          case "gte":
            return value >= filter.value;
          case "lt":
            return value < filter.value;
          case "lte":
            return value <= filter.value;
          case "in":
            return Array.isArray(filter.value) && filter.value.includes(value);
          case "contains":
            if (typeof value === "string") {
              return value.toLowerCase().includes(String(filter.value).toLowerCase());
            }
            if (Array.isArray(value)) {
              return value.includes(filter.value);
            }
            return false;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Apply sorting
   */
  private applySorting(
    documents: SearchIndexEntry[],
    sort: SortOption[]
  ): SearchIndexEntry[] {
    return documents.sort((a, b) => {
      for (const sortOption of sort) {
        const aValue = this.getNestedValue(a.data, sortOption.field);
        const bValue = this.getNestedValue(b.data, sortOption.field);

        if (aValue === bValue) continue;

        const comparison = aValue < bValue ? -1 : 1;
        return sortOption.direction === "asc" ? comparison : -comparison;
      }
      return 0;
    });
  }

  /**
   * Calculate facets
   */
  private calculateFacets(
    documents: SearchIndexEntry[],
    facetFields: string[]
  ): Record<string, FacetValue[]> {
    const facets: Record<string, FacetValue[]> = {};

    for (const field of facetFields) {
      const valueCounts = new Map<any, number>();

      for (const doc of documents) {
        const value = this.getNestedValue(doc.data, field);
        if (value !== null && value !== undefined) {
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
      }

      facets[field] = Array.from(valueCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    }

    return facets;
  }

  /**
   * Generate highlights
   */
  private generateHighlights(
    doc: SearchIndexEntry,
    query: string,
    fields: string[]
  ): Record<string, string> {
    if (!query) return {};

    const highlights: Record<string, string> = {};
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    for (const field of fields) {
      const value = this.getNestedValue(doc.data, field);
      if (typeof value !== "string") continue;

      let highlighted = value;
      for (const term of queryTerms) {
        const regex = new RegExp(`(${term})`, "gi");
        highlighted = highlighted.replace(regex, "<mark>$1</mark>");
      }

      highlights[field] = highlighted;
    }

    return highlights;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * Get suggestions based on query
   */
  async getSuggestions(
    indexName: string,
    query: string,
    limit = 5
  ): Promise<string[]> {
    const index = this.indexes.get(indexName);
    if (!index || !query.trim()) return [];

    const queryLower = query.toLowerCase();
    const suggestions = new Set<string>();

    for (const doc of index.values()) {
      // Extract words from searchable text
      const words = doc.searchableText.split(/\s+/);

      for (const word of words) {
        if (word.startsWith(queryLower) && word.length > queryLower.length) {
          suggestions.add(word);
          if (suggestions.size >= limit) break;
        }
      }

      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get index stats
   */
  async getStats(): Promise<{
    totalDocuments: number;
    indexSizes: Record<string, number>;
  }> {
    const indexSizes: Record<string, number> = {};
    let totalDocuments = 0;

    for (const [name, index] of this.indexes.entries()) {
      const size = index.size;
      indexSizes[name] = size;
      totalDocuments += size;
    }

    return {
      totalDocuments,
      indexSizes,
    };
  }

  /**
   * Rebuild index from database
   */
  async rebuildIndex(
    indexName: string,
    documents: Array<{ id: string | number; data: Record<string, any> }>,
    searchableFields: string[]
  ): Promise<void> {
    await this.clearIndex(indexName);

    for (const doc of documents) {
      await this.indexDocument(indexName, doc.id, doc.data, searchableFields);
    }
  }
}

export const searchEngine = SearchEngine.getInstance();
