/**
 * Cache Manager
 * Manages cache selection and initialization based on environment
 */

import type { CacheConfig, CacheInterface } from "./types.ts";
import { MemoryCache } from "./MemoryCache.ts";
import { RedisCache } from "./RedisCache.ts";
import { env } from "../../config/env.ts";

export class CacheManager {
  private static instance: CacheManager;
  private cache?: CacheInterface;
  private cacheType: "memory" | "redis" = "memory";

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize cache based on environment and configuration
   */
  async initialize(): Promise<void> {
    const isDevelopment = env.DENO_ENV === "development";
    const redisEnabled = env.REDIS_ENABLED === "true";

    console.log("\n💾 Initializing Cache System...");
    console.log(`Environment: ${env.DENO_ENV}`);
    console.log(`Redis Enabled: ${redisEnabled}`);

    // In development mode, always use memory cache
    if (isDevelopment) {
      console.log(
        "🔧 Development mode detected - Using MemoryCache (Redis disabled)",
      );
      this.cache = new MemoryCache(
        parseInt(env.CACHE_MEMORY_MAX_SIZE || "10000"),
        parseInt(env.CACHE_MEMORY_CLEANUP_INTERVAL || "60000"),
      );
      this.cacheType = "memory";
      console.log("✅ MemoryCache initialized");
      return;
    }

    // In production, try Redis if enabled, fallback to memory
    if (redisEnabled) {
      try {
        console.log("🔌 Attempting to connect to Redis...");

        const redisCache = new RedisCache({
          host: env.REDIS_HOST || "localhost",
          port: parseInt(env.REDIS_PORT || "6379"),
          password: env.REDIS_PASSWORD,
          db: parseInt(env.REDIS_DB || "0"),
          keyPrefix: env.REDIS_KEY_PREFIX || "lexcms:",
        });

        await redisCache.connect();

        // Test connection
        const isHealthy = await redisCache.isHealthy();
        if (isHealthy) {
          this.cache = redisCache;
          this.cacheType = "redis";
          console.log(
            `✅ RedisCache initialized at ${env.REDIS_HOST}:${env.REDIS_PORT}`,
          );
          return;
        } else {
          console.warn("⚠️ Redis connection unhealthy, falling back to memory");
          await redisCache.close();
        }
      } catch (error) {
        console.error("❌ Failed to initialize Redis:", error);
        console.log("↩️ Falling back to MemoryCache");
      }
    }

    // Fallback to memory cache
    console.log("📝 Using MemoryCache");
    this.cache = new MemoryCache(
      parseInt(env.CACHE_MEMORY_MAX_SIZE || "10000"),
      parseInt(env.CACHE_MEMORY_CLEANUP_INTERVAL || "60000"),
    );
    this.cacheType = "memory";
    console.log("✅ MemoryCache initialized");
  }

  /**
   * Get the active cache instance
   */
  getCache(): CacheInterface {
    if (!this.cache) {
      throw new Error(
        "Cache not initialized. Call initialize() first.",
      );
    }
    return this.cache;
  }

  /**
   * Get cache type
   */
  getCacheType(): "memory" | "redis" {
    return this.cacheType;
  }

  /**
   * Check if cache is ready
   */
  isReady(): boolean {
    return this.cache !== undefined;
  }

  /**
   * Reinitialize cache (useful for switching cache types)
   */
  async reinitialize(): Promise<void> {
    if (this.cache) {
      await this.cache.close();
      this.cache = undefined;
    }
    await this.initialize();
  }

  /**
   * Close cache connection
   */
  async close(): Promise<void> {
    if (this.cache) {
      await this.cache.close();
      this.cache = undefined;
      console.log("Cache connection closed");
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

/**
 * Get cache instance (shorthand)
 */
export function getCache(): CacheInterface {
  return cacheManager.getCache();
}
