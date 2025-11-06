/**
 * Rate Limiter
 * Advanced rate limiting with flexible rules
 */

import type { RateLimitConfig, RateLimitEntry } from "./types.ts";
import { securityManager } from "./SecurityManager.ts";

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval?: number;

  constructor(private config: RateLimitConfig) {
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   */
  async check(identifier: string): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    const now = Date.now();
    let entry = this.store.get(key);

    // Create new entry if doesn't exist or window has passed
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequestTime: now,
      };
      this.store.set(key, entry);

      return {
        allowed: true,
        resetTime: entry.resetTime,
        remaining: this.config.maxRequests - 1,
      };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.config.maxRequests - entry.count,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    this.store.delete(key);
  }

  /**
   * Get current status for identifier
   */
  getStatus(identifier: string): { count: number; resetTime: number; remaining: number } | null {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
    };
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiters
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 API requests per minute
});
