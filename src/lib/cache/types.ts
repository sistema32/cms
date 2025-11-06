/**
 * Cache System Types
 * Defines interfaces and types for the caching system
 */

/**
 * Cache options for set operations
 */
export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Tags for cache invalidation */
  tags?: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  value: T;
  expiresAt?: number;
  tags?: string[];
  createdAt: number;
}

/**
 * Cache interface that all implementations must follow
 */
export interface CacheInterface {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns The cached value or null if not found/expired
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (ttl, tags)
   */
  set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete a specific key from cache
   * @param key Cache key to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys to delete
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Delete all keys matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   */
  deletePattern(pattern: string): Promise<void>;

  /**
   * Delete all keys with a specific tag
   * @param tag Tag to match
   */
  deleteByTag(tag: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Get all keys matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Check if cache is healthy/connected
   */
  isHealthy(): Promise<boolean>;

  /**
   * Close cache connection
   */
  close(): Promise<void>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache type: 'memory' or 'redis' */
  type: "memory" | "redis";
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Redis configuration */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  /** Memory cache configuration */
  memory?: {
    /** Maximum number of entries */
    maxSize?: number;
    /** Check expired entries interval (ms) */
    cleanupInterval?: number;
  };
}

/**
 * Cache key builders for different entities
 */
export const CacheKeys = {
  // Content
  content: (id: number) => `content:${id}`,
  contentBySlug: (slug: string) => `content:slug:${slug}`,
  contentList: (params: string) => `content:list:${params}`,

  // Categories
  category: (id: number) => `category:${id}`,
  categoryBySlug: (slug: string) => `category:slug:${slug}`,
  categoryList: () => `category:list`,

  // Tags
  tag: (id: number) => `tag:${id}`,
  tagBySlug: (slug: string) => `tag:slug:${slug}`,
  tagList: () => `tag:list`,

  // Users
  user: (id: number) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (params: string) => `user:list:${params}`,

  // Settings
  setting: (key: string) => `setting:${key}`,
  settingsList: () => `settings:list`,

  // Plugins
  plugin: (name: string) => `plugin:${name}`,
  pluginList: () => `plugin:list`,
  pluginStats: () => `plugin:stats`,

  // Themes
  theme: (name: string) => `theme:${name}`,
  activeTheme: () => `theme:active`,

  // Menus
  menu: (id: number) => `menu:${id}`,
  menuBySlug: (slug: string) => `menu:slug:${slug}`,
  menuItems: (menuId: number) => `menu:${menuId}:items`,

  // Media
  media: (id: number) => `media:${id}`,
  mediaList: (params: string) => `media:list:${params}`,
} as const;

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  CONTENT: "content",
  CATEGORY: "category",
  TAG: "tag",
  USER: "user",
  SETTING: "setting",
  PLUGIN: "plugin",
  THEME: "theme",
  MENU: "menu",
  MEDIA: "media",
} as const;

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
  PERMANENT: 0, // No expiration (use with caution)
} as const;
