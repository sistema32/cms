/**
 * CacheService - Simple in-memory cache for rendered slider HTML
 * Reduces database queries and rendering overhead for frequently accessed sliders
 */

export interface CacheEntry {
    html: string;
    generatedAt: number;
    sliderId: number;
    hash: string;
}

export interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

export class CacheService {
    private cache = new Map<string, CacheEntry>();
    private ttlMs: number;
    private maxSize: number;
    private hits = 0;
    private misses = 0;

    constructor(options?: { ttlMs?: number; maxSize?: number }) {
        this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
        this.maxSize = options?.maxSize ?? MAX_CACHE_SIZE;
    }

    /**
     * Generate a simple hash from slider data for cache invalidation
     */
    private generateHash(data: unknown): string {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    /**
     * Get cache key for a slider
     */
    private getKey(sliderId: number | string): string {
        return `slider:${sliderId}`;
    }

    /**
     * Get cached HTML for a slider
     */
    get(sliderId: number | string): string | null {
        const key = this.getKey(sliderId);
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() - entry.generatedAt > this.ttlMs) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.html;
    }

    /**
     * Store rendered HTML in cache
     */
    set(sliderId: number | string, html: string, sliderData?: unknown): void {
        const key = this.getKey(sliderId);
        const numId = typeof sliderId === 'string' ? parseInt(sliderId, 10) : sliderId;

        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            html,
            generatedAt: Date.now(),
            sliderId: numId,
            hash: this.generateHash(sliderData)
        });
    }

    /**
     * Invalidate cache for a specific slider
     */
    invalidate(sliderId: number | string): boolean {
        const key = this.getKey(sliderId);
        return this.cache.delete(key);
    }

    /**
     * Invalidate all cached slider HTML
     */
    invalidateAll(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0
        };
    }

    /**
     * Check if slider HTML is cached and valid
     */
    has(sliderId: number | string): boolean {
        const key = this.getKey(sliderId);
        const entry = this.cache.get(key);

        if (!entry) return false;
        if (Date.now() - entry.generatedAt > this.ttlMs) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get or generate cached HTML
     * If cache miss, calls the generator function and stores result
     */
    async getOrGenerate(
        sliderId: number | string,
        generator: () => Promise<string>,
        sliderData?: unknown
    ): Promise<string> {
        const cached = this.get(sliderId);
        if (cached !== null) {
            return cached;
        }

        const html = await generator();
        this.set(sliderId, html, sliderData);
        return html;
    }
}

// Singleton instance for plugin-wide use
export const sliderCache = new CacheService();
