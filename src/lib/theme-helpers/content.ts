import * as settingsService from "@/services/system/settingsService.ts";
import { db } from "../../config/db.ts";
import { content } from "../../db/schema.ts";
import { and, desc, eq } from "drizzle-orm";
import type { PostData } from "./types.ts";

/**
 * Content Helpers - Functions for managing posts and content
 */

/**
 * Get recent posts
 */
export async function getRecentPosts(limit = 5): Promise<PostData[]> {
    const posts = await db.query.content.findMany({
        where: eq(content.status, "published"),
        orderBy: [desc(content.publishedAt)],
        limit,
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

    return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        body: post.body || undefined,
        featureImage: post.featuredImage?.url || undefined,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
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
}

/**
 * Get paginated posts with sticky posts support
 * Sticky posts appear first (only on page 1)
 */
export async function getPaginatedPosts(
    page: number = 1,
    perPage?: number,
): Promise<{ posts: PostData[]; total: number; totalPages: number }> {
    const postsPerPage = perPage ||
        await settingsService.getSetting("posts_per_page", 10);
    const offset = (page - 1) * postsPerPage;

    // Get total published posts
    const total = await getTotalPosts();

    let allPosts: PostData[] = [];

    // On first page, get sticky posts first
    if (page === 1) {
        // Get sticky posts
        const stickyPosts = await db.query.content.findMany({
            where: and(
                eq(content.status, "published"),
                eq(content.sticky, true),
            ),
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

        const stickyData = stickyPosts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || undefined,
            body: post.body || undefined,
            featureImage: post.featuredImage?.url || undefined,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
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

        allPosts.push(...stickyData);

        // Calculate how many normal posts we need
        const remainingSlots = postsPerPage - stickyData.length;

        if (remainingSlots > 0) {
            // Get normal posts (not sticky)
            const normalPosts = await db.query.content.findMany({
                where: and(
                    eq(content.status, "published"),
                    eq(content.sticky, false),
                ),
                orderBy: [desc(content.publishedAt)],
                limit: remainingSlots,
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

            const normalData = normalPosts.map((post) => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt || undefined,
                body: post.body || undefined,
                featureImage: post.featuredImage?.url || undefined,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
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

            allPosts.push(...normalData);
        }
    } else {
        // On pages > 1, only normal posts with adjusted offset
        const posts = await db.query.content.findMany({
            where: and(
                eq(content.status, "published"),
                eq(content.sticky, false),
            ),
            orderBy: [desc(content.publishedAt)],
            limit: postsPerPage,
            offset: offset,
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

        allPosts = posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || undefined,
            body: post.body || undefined,
            featureImage: post.featuredImage?.url || undefined,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
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
    }

    const totalPages = Math.ceil(total / postsPerPage);

    return { posts: allPosts, total, totalPages };
}

/**
 * Count total published posts
 */
export async function getTotalPosts(): Promise<number> {
    const result = await db.query.content.findMany({
        where: eq(content.status, "published"),
    });
    return result.length;
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(limit = 3): Promise<PostData[]> {
    const posts = await db.query.content.findMany({
        where: and(
            eq(content.status, "published"),
            eq(content.featured, true),
        ),
        orderBy: [desc(content.publishedAt)],
        limit,
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

    // If no featured posts, return recent posts
    if (posts.length === 0) {
        return await getRecentPosts(limit);
    }

    return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        body: post.body || undefined,
        featureImage: post.featuredImage?.url || undefined,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
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
}
