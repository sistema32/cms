import * as settingsService from "../../services/settingsService.ts";
import { db } from "../../config/db.ts";
import { categories, content, tags } from "../../db/schema.ts";
import { and, desc, eq } from "drizzle-orm";
import type { CategoryData, TagData, PostData } from "./types.ts";

/**
 * Taxonomy Helpers - Functions for categories and tags
 */

/**
 * Get all categories with post count
 */
export async function getCategories(limit?: number): Promise<CategoryData[]> {
    const allCategories = await db.query.categories.findMany({
        orderBy: [desc(categories.name)],
    });

    // Count posts per category
    const categoriesWithCount = await Promise.all(
        allCategories.map(async (cat) => {
            const posts = await db.query.content.findMany({
                where: eq(content.status, "published"),
                with: {
                    contentCategories: {
                        where: (contentCategories, { eq }) =>
                            eq(contentCategories.categoryId, cat.id),
                    },
                },
            });

            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description || undefined,
                count: posts.filter((p) => p.contentCategories.length > 0).length,
            };
        }),
    );

    // Filter categories with posts and sort by post count
    const categoriesWithPosts = categoriesWithCount
        .filter((cat) => cat.count && cat.count > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0));

    if (limit) {
        return categoriesWithPosts.slice(0, limit);
    }

    return categoriesWithPosts;
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit = 10): Promise<TagData[]> {
    const allTags = await db.query.tags.findMany({
        orderBy: [desc(tags.name)],
    });

    // Count posts per tag
    const tagsWithCount = await Promise.all(
        allTags.map(async (tag) => {
            const posts = await db.query.content.findMany({
                where: eq(content.status, "published"),
                with: {
                    contentTags: {
                        where: (contentTags, { eq }) => eq(contentTags.tagId, tag.id),
                    },
                },
            });

            return {
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                count: posts.filter((p) => p.contentTags.length > 0).length,
            };
        }),
    );

    // Filter tags with posts and sort by count
    const tagsWithPosts = tagsWithCount
        .filter((tag) => tag.count && tag.count > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0));

    return tagsWithPosts.slice(0, limit);
}

/**
 * Get a category by slug
 */
export async function getCategoryBySlug(
    slug: string,
): Promise<CategoryData | null> {
    const category = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
    });

    if (!category) {
        return null;
    }

    // Count posts in this category
    const posts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        with: {
            contentCategories: {
                where: (contentCategories, { eq }) =>
                    eq(contentCategories.categoryId, category.id),
            },
        },
    });

    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        count: posts.filter((p) => p.contentCategories.length > 0).length,
    };
}

/**
 * Get a tag by slug
 */
export async function getTagBySlug(slug: string): Promise<TagData | null> {
    const tag = await db.query.tags.findFirst({
        where: eq(tags.slug, slug),
    });

    if (!tag) {
        return null;
    }

    // Count posts with this tag
    const posts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        with: {
            contentTags: {
                where: (contentTags, { eq }) => eq(contentTags.tagId, tag.id),
            },
        },
    });

    return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: posts.filter((p) => p.contentTags.length > 0).length,
    };
}

/**
 * Get posts from a specific category with pagination
 */
export async function getPostsByCategory(
    categorySlug: string,
    page: number = 1,
    perPage?: number,
): Promise<{
    posts: PostData[];
    total: number;
    totalPages: number;
    category: CategoryData | null;
}> {
    const postsPerPage = perPage ||
        await settingsService.getSetting("posts_per_page", 10);
    const offset = (page - 1) * postsPerPage;

    // Get category
    const category = await getCategoryBySlug(categorySlug);

    if (!category) {
        return { posts: [], total: 0, totalPages: 0, category: null };
    }

    // Get posts from this category
    const allPosts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        orderBy: [desc(content.publishedAt)],
        with: {
            author: true,
            contentCategories: {
                with: {
                    category: true,
                },
            },
            contentTags: {
                with: {
                    tag: true,
                },
            },
            featuredImage: true,
            seo: true,
        },
    });

    // Filter only posts from this category
    const categoryPosts = allPosts.filter((post) =>
        post.contentCategories.some((cc) => cc.categoryId === category.id)
    );

    const total = categoryPosts.length;
    const totalPages = Math.ceil(total / postsPerPage);

    // Apply pagination
    const paginatedPosts = categoryPosts.slice(offset, offset + postsPerPage);

    // Format posts
    const formattedPosts: PostData[] = paginatedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        body: post.body,
        featureImage: post.featuredImage?.url || undefined,
        status: post.status,
        featured: post.featured || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishedAt: post.publishedAt || post.createdAt,
        author: {
            id: post.author.id,
            name: post.author.name || post.author.email,
            email: post.author.email,
        },
        categories: post.contentCategories.map((cc) => ({
            id: cc.category.id,
            name: cc.category.name,
            slug: cc.category.slug,
        })),
        tags: post.contentTags.map((ct) => ({
            id: ct.tag.id,
            name: ct.tag.name,
            slug: ct.tag.slug,
        })),
    }));

    return { posts: formattedPosts, total, totalPages, category };
}

/**
 * Get posts from a specific tag with pagination
 */
export async function getPostsByTag(
    tagSlug: string,
    page: number = 1,
    perPage?: number,
): Promise<{
    posts: PostData[];
    total: number;
    totalPages: number;
    tag: TagData | null;
}> {
    const postsPerPage = perPage ||
        await settingsService.getSetting("posts_per_page", 10);
    const offset = (page - 1) * postsPerPage;

    // Get tag
    const tag = await getTagBySlug(tagSlug);

    if (!tag) {
        return { posts: [], total: 0, totalPages: 0, tag: null };
    }

    // Get posts with this tag
    const allPosts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        orderBy: [desc(content.publishedAt)],
        with: {
            author: true,
            contentCategories: {
                with: {
                    category: true,
                },
            },
            contentTags: {
                with: {
                    tag: true,
                },
            },
            featuredImage: true,
            seo: true,
        },
    });

    // Filter only posts with this tag
    const tagPosts = allPosts.filter((post) =>
        post.contentTags.some((ct) => ct.tagId === tag.id)
    );

    const total = tagPosts.length;
    const totalPages = Math.ceil(total / postsPerPage);

    // Apply pagination
    const paginatedPosts = tagPosts.slice(offset, offset + postsPerPage);

    // Format posts
    const formattedPosts: PostData[] = paginatedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        body: post.body,
        featureImage: post.featuredImage?.url || undefined,
        status: post.status,
        featured: post.featured || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishedAt: post.publishedAt || post.createdAt,
        author: {
            id: post.author.id,
            name: post.author.name || post.author.email,
            email: post.author.email,
        },
        categories: post.contentCategories.map((cc) => ({
            id: cc.category.id,
            name: cc.category.name,
            slug: cc.category.slug,
        })),
        tags: post.contentTags.map((ct) => ({
            id: ct.tag.id,
            name: ct.tag.name,
            slug: ct.tag.slug,
        })),
    }));

    return { posts: formattedPosts, total, totalPages, tag };
}
