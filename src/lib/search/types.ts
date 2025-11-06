/**
 * Advanced Search System Types
 * Full-text search, filtering, and faceting
 */

/**
 * Search configuration
 */
export interface SearchConfig {
  indexName: string;
  fields: string[]; // Fields to index for search
  searchableFields: string[]; // Fields to search in
  filterableFields?: string[];
  sortableFields?: string[];
  rankingRules?: string[];
}

/**
 * Search query
 */
export interface SearchQuery {
  query: string; // Search term
  filters?: SearchFilter[];
  sort?: SortOption[];
  page?: number;
  limit?: number;
  highlightFields?: string[];
  facets?: string[];
}

/**
 * Search filter
 */
export interface SearchFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: any;
}

/**
 * Sort option
 */
export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Search result
 */
export interface SearchResult<T = any> {
  hits: SearchHit<T>[];
  totalHits: number;
  page: number;
  limit: number;
  totalPages: number;
  processingTimeMs: number;
  facets?: Record<string, FacetValue[]>;
}

/**
 * Search hit (individual result)
 */
export interface SearchHit<T = any> {
  id: string | number;
  score: number; // Relevance score
  data: T;
  highlights?: Record<string, string>;
}

/**
 * Facet value
 */
export interface FacetValue {
  value: any;
  count: number;
}

/**
 * Search index entry
 */
export interface SearchIndexEntry {
  id: string | number;
  type: "content" | "category" | "tag" | "user";
  data: Record<string, any>;
  searchableText: string; // Combined searchable fields
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  query: string;
  score: number;
}

/**
 * Search stats
 */
export interface SearchStats {
  totalDocuments: number;
  totalIndexes: number;
  indexSizes: Record<string, number>;
  lastIndexedAt?: Date;
}
