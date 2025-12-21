/**
 * Memory Cache Implementation
 * In-memory cache with TTL support and automatic cleanup
 */

import type {
  CacheEntry,
  CacheInterface,
  CacheOptions,
 CacheStats,
} from "./types.ts";
import { env } from "@/config/env.ts";

export class MemoryCache implements CacheInterface {
  private cache = new Map<string, CacheEntry>();
  private tags = new Map<string, Set<string>>(); // tag -> Set of keys
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };
  private cleanupInterval?: number;
  private maxSize: number;

  constructor(maxSize = 10000, cleanupIntervalMs = 60000) {
    this.maxSize = maxSize;

    // Start cleanup interval (production only to avoid leaking timers in tests/dev)
    if (env.DENO_ENV === "production") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, cleanupIntervalMs);

      if (typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(this.cleanupInterval);
      }
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove oldest entry (LRU-like)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        await this.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : undefined,
      tags: options?.tags,
    };

    this.cache.set(key, entry);

    // Index tags
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(key);
      }
    }

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);

    if (entry) {
      // Remove from tag indices
      if (entry.tags) {
        for (const tag of entry.tags) {
          const tagKeys = this.tags.get(tag);
          if (tagKeys) {
            tagKeys.delete(key);
            if (tagKeys.size === 0) {
              this.tags.delete(tag);
            }
          }
        }
      }

      this.cache.delete(key);
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = this.patternToRegex(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    await this.deleteMany(keysToDelete);
  }

  async deleteByTag(tag: string): Promise<void> {
    const keys = this.tags.get(tag);
    if (keys) {
      await this.deleteMany(Array.from(keys));
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tags.clear();
    this.stats.size = 0;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());

    if (!pattern) {
      return allKeys;
    }

    const regex = this.patternToRegex(pattern);
    return allKeys.filter((key) => regex.test(key));
  }

  async isHealthy(): Promise<boolean> {
    return true; // Memory cache is always healthy
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    await this.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      keysToDelete.forEach((key) => this.delete(key));
      console.log(
        `[MemoryCache] Cleaned up ${keysToDelete.length} expired entries`,
      );
    }
  }

  /**
   * Convert wildcard pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special chars except *
      .replace(/\*/g, ".*"); // Convert * to .*
    return new RegExp(`^${escapedPattern}$`);
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}
