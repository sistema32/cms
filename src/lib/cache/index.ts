/**
 * Cache System
 * Main export file for the caching system
 */

// Export types
export type {
  CacheConfig,
  CacheEntry,
  CacheInterface,
  CacheOptions,
  CacheStats,
} from "./types.ts";
export { CacheKeys, CacheTags, CacheTTL } from "./types.ts";

// Export implementations
export { MemoryCache } from "./MemoryCache.ts";
export { RedisCache } from "./RedisCache.ts";

// Export manager
export { CacheManager, cacheManager, getCache } from "./CacheManager.ts";
