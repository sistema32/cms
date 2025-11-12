/**
 * Redis Cache Implementation
 * Cache implementation using Redis for distributed caching
 */

import { connect, Redis } from "redis";
import type {
  CacheInterface,
  CacheOptions,
  CacheStats,
} from "./types.ts";

export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export class RedisCache implements CacheInterface {
  private client?: Redis;
  private config: RedisCacheConfig;
  private keyPrefix: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };
  private connected = false;

  constructor(config: RedisCacheConfig) {
    this.config = config;
    this.keyPrefix = config.keyPrefix || "lexcms:";
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      this.client = await connect({
        hostname: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
      });
      this.connected = true;
      console.log(
        `[RedisCache] Connected to Redis at ${this.config.host}:${this.config.port}`,
      );
    } catch (error) {
      console.error("[RedisCache] Failed to connect to Redis:", error);
      this.connected = false;
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);

      if (value === null || value === undefined) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("[RedisCache] Error getting key:", error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.client.setex(fullKey, options.ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }

      // Store tags for invalidation
      if (options?.tags) {
        for (const tag of options.tags) {
          const tagKey = this.getTagKey(tag);
          await this.client.sadd(tagKey, fullKey);

          // Set TTL on tag set if main key has TTL
          if (options.ttl) {
            await this.client.expire(tagKey, options.ttl);
          }
        }
      }

      this.stats.sets++;
    } catch (error) {
      console.error("[RedisCache] Error setting key:", error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      await this.client.del(fullKey);
      this.stats.deletes++;
    } catch (error) {
      console.error("[RedisCache] Error deleting key:", error);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!this.client || !this.connected || keys.length === 0) {
      return;
    }

    try {
      const fullKeys = keys.map((k) => this.getFullKey(k));
      await this.client.del(...fullKeys);
      this.stats.deletes += keys.length;
    } catch (error) {
      console.error("[RedisCache] Error deleting multiple keys:", error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.scanKeys(fullPattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        this.stats.deletes += keys.length;
      }
    } catch (error) {
      console.error("[RedisCache] Error deleting pattern:", error);
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const tagKey = this.getTagKey(tag);
      const keys = await this.client.smembers(tagKey);

      if (keys.length > 0) {
        await this.client.del(...keys);
        await this.client.del(tagKey); // Delete the tag set itself
        this.stats.deletes += keys.length;
      }
    } catch (error) {
      console.error("[RedisCache] Error deleting by tag:", error);
    }
  }

  async clear(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      // Delete all keys with our prefix
      const pattern = this.getFullKey("*");
      const keys = await this.scanKeys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        this.stats.deletes += keys.length;
      }

      this.stats.size = 0;
    } catch (error) {
      console.error("[RedisCache] Error clearing cache:", error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const exists = await this.client.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error("[RedisCache] Error checking key existence:", error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    if (this.client && this.connected) {
      try {
        const pattern = this.getFullKey("*");
        const keys = await this.scanKeys(pattern);
        this.stats.size = keys.length;
      } catch (error) {
        console.error("[RedisCache] Error getting stats:", error);
      }
    }

    return { ...this.stats };
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!this.client || !this.connected) {
      return [];
    }

    try {
      const fullPattern = pattern ? this.getFullKey(pattern) : this.getFullKey("*");
      const keys = await this.scanKeys(fullPattern);

      // Remove prefix from keys
      return keys.map((key) => key.replace(this.keyPrefix, ""));
    } catch (error) {
      console.error("[RedisCache] Error getting keys:", error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      console.error("[RedisCache] Health check failed:", error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
        this.connected = false;
        console.log("[RedisCache] Connection closed");
      } catch (error) {
        console.error("[RedisCache] Error closing connection:", error);
      }
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get tag key
   */
  private getTagKey(tag: string): string {
    return `${this.keyPrefix}tag:${tag}`;
  }

  /**
   * Scan keys using SCAN command (better than KEYS for production)
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await this.client.scan(cursor, {
        pattern,
        count: 100,
      });

      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);

    return keys;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}
