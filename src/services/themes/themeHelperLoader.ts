import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { themeI18nService } from "./themeI18nService.ts";
import type {
    CategoryData,
    MenuItem,
    PaginationData,
    PostData,
    SiteData,
    TagData,
    BodyClassContext,
    PostClassData,
} from "@/lib/theme-helpers/types.ts";

/**
 * Theme Helper Loader Service
 * Loads system helpers and merges with theme-specific overrides
 * Caches result for performance
 */

// Complete interface for all theme helpers
export interface ThemeHelpers {
    // Site
    getSiteData: () => Promise<SiteData>;
    getCustomSettings: (themeName?: string) => Promise<Record<string, any>>;

    // Menu
    getMenu: (slug: string) => Promise<MenuItem[]>;

    // Content
    getRecentPosts: (limit?: number) => Promise<PostData[]>;
    getPaginatedPosts: (
        page?: number,
        perPage?: number,
    ) => Promise<{ posts: PostData[]; total: number; totalPages: number }>;
    getTotalPosts: () => Promise<number>;
    getFeaturedPosts: (limit?: number) => Promise<PostData[]>;

    // Taxonomy
    getCategories: (limit?: number) => Promise<CategoryData[]>;
    getPopularTags: (limit?: number) => Promise<TagData[]>;
    getCategoryBySlug: (slug: string) => Promise<CategoryData | null>;
    getTagBySlug: (slug: string) => Promise<TagData | null>;
    getPostsByCategory: (
        categorySlug: string,
        page?: number,
        perPage?: number,
    ) => Promise<{
        posts: PostData[];
        total: number;
        totalPages: number;
        category: CategoryData | null;
    }>;
    getPostsByTag: (
        tagSlug: string,
        page?: number,
        perPage?: number,
    ) => Promise<{
        posts: PostData[];
        total: number;
        totalPages: number;
        tag: TagData | null;
    }>;

    // Search
    searchPosts: (
        query: string,
        page?: number,
        perPage?: number,
    ) => Promise<{
        posts: PostData[];
        total: number;
        totalPages: number;
        query: string;
    }>;

    // Pagination
    getPagination: (
        currentPage: number,
        totalItems: number,
        itemsPerPage?: number,
    ) => Promise<PaginationData>;
    getPaginationNumbers: (
        currentPage: number,
        totalPages: number,
        delta?: number,
    ) => (number | string)[];

    // Formatting
    formatDate: (date: Date, format?: string) => Promise<string>;
    formatTime: (date: Date, format?: string) => Promise<string>;
    excerpt: (content: string, words?: number) => string;

    // URL
    imgUrl: (url: string, size?: string) => string;
    postUrl: (slug: string) => Promise<string>;
    blogUrl: () => Promise<string>;
    categoryUrl: (slug: string) => Promise<string>;
    tagUrl: (slug: string) => Promise<string>;

    // CSS
    bodyClass: (context: BodyClassContext) => string;
    postClass: (post: PostClassData) => string;

    // I18n
    t: (key: string, params?: Record<string, string | number>) => string;
}

// Cache of helpers by theme
const helperCache = new Map<string, ThemeHelpers>();

/**
 * Load and merge helpers for a theme
 * 1. Load system helpers (default)
 * 2. Load theme helpers (overrides)
 * 3. Merge (theme overrides system)
 * 4. Cache result
 */
export async function loadThemeHelpers(
    themeName: string,
): Promise<ThemeHelpers> {
    // Check cache first
    if (helperCache.has(themeName)) {
        console.log(`📦 Using cached helpers for theme "${themeName}"`);
        return helperCache.get(themeName)!;
    }

    console.log(`🔄 Loading helpers for theme "${themeName}"...`);

    // 1. Load system helpers (always available)
    const systemHelpers = await loadSystemHelpers();

    // 2. Try to load theme-specific helpers
    const themeHelpers = await loadThemeSpecificHelpers(themeName);

    // 3. Merge (theme overrides system)
    const t = await themeI18nService.getHelper(themeName);

    const mergedHelpers: ThemeHelpers = {
        ...systemHelpers,
        ...themeHelpers, // Theme overrides win
        t,
    } as ThemeHelpers;

    // 4. Cache for future use
    helperCache.set(themeName, mergedHelpers);

    console.log(`✅ Loaded helpers for theme "${themeName}"`);
    if (Object.keys(themeHelpers).length > 0) {
        console.log(
            `   🎨 Overrides: ${Object.keys(themeHelpers).join(", ")}`,
        );
    } else {
        console.log(`   📚 Using all system helpers (no overrides)`);
    }

    return mergedHelpers;
}

/**
 * Load system helpers (from src/lib/theme-helpers/)
 */
async function loadSystemHelpers(): Promise<Partial<ThemeHelpers>> {
    const helpers: Partial<ThemeHelpers> = {};

    // Import all system helper modules
    const modules = [
        "site",
        "menu",
        "content",
        "taxonomy",
        "search",
        "pagination",
        "formatting",
        "url",
        "css",
    ];

    for (const moduleName of modules) {
        try {
            const module = await import(`@/lib/theme-helpers/${moduleName}.ts`);
            Object.assign(helpers, module);
        } catch (error) {
            console.warn(
                `⚠️  Warning: Could not load system helper module "${moduleName}"`,
            );
            console.error(error);
        }
    }

    return helpers;
}

/**
 * Load theme-specific helper overrides
 */
async function loadThemeSpecificHelpers(
    themeName: string,
): Promise<Partial<ThemeHelpers>> {
    const helpers: Partial<ThemeHelpers> = {};
    const themePath = join(Deno.cwd(), "src", "themes", themeName, "helpers");

    // Check if theme has helpers directory
    try {
        await Deno.stat(themePath);
    } catch {
        // No helpers directory, return empty
        return helpers;
    }

    // Try to load each possible helper module
    const modules = [
        "site",
        "menu",
        "content",
        "taxonomy",
        "search",
        "pagination",
        "formatting",
        "url",
        "css",
    ];

    for (const moduleName of modules) {
        const modulePath = join(themePath, `${moduleName}.ts`);

        try {
            await Deno.stat(modulePath);
            const module = await import(`file://${modulePath}`);
            Object.assign(helpers, module);
            console.log(`   🔧 Found override: ${moduleName}.ts`);
        } catch {
            // Module doesn't exist, skip
            continue;
        }
    }

    return helpers;
}

/**
 * Invalidate helper cache for a theme
 */
export function invalidateHelperCache(themeName: string): void {
    helperCache.delete(themeName);
    console.log(`🗑️  Invalidated helper cache for theme "${themeName}"`);
}

/**
 * Invalidate all helper caches
 */
export function invalidateAllHelperCaches(): void {
    helperCache.clear();
    console.log(`🗑️  Invalidated all helper caches`);
}

/**
 * Get cached themes (for debugging)
 */
export function getCachedThemes(): string[] {
    return Array.from(helperCache.keys());
}

/**
 * Get cache stats (for debugging)
 */
export function getHelperCacheStats() {
    return {
        cachedThemes: getCachedThemes(),
        cacheSize: helperCache.size,
    };
}
