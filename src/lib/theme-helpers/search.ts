import * as settingsService from "../../services/settingsService.ts";
import { db } from "../../config/db.ts";
import { content } from "../../db/schema.ts";
import { desc, eq } from "drizzle-orm";
import type { PostData } from "./types.ts";

/**
 * Search Helpers - Functions for searching content
 */

/**
 * Search posts by title or content
 */
export async function searchPosts(
    query: string,
    page: number = 1,
    perPage?: number,
): Promise<{
    posts: PostData[];
    total: number;
    totalPages: number;
    query: string;
}> {
    const postsPerPage = perPage ||
        await settingsService.getSetting("posts_per_page", 10);
    const offset = (page - 1) * postsPerPage;

    if (!query || query.trim() === "") {
        return { posts: [], total: 0, totalPages: 0, query: "" };
    }

    const searchQuery = query.toLowerCase().trim();

    // Get all published posts
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

    // Filter posts that match the search
    const searchResults = allPosts.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(searchQuery);
        const bodyMatch = post.body?.toLowerCase().includes(searchQuery) || false;
        const excerptMatch = post.excerpt?.toLowerCase().includes(searchQuery) ||
            false;

        return titleMatch || bodyMatch || excerptMatch;
    });

    const total = searchResults.length;
    const totalPages = Math.ceil(total / postsPerPage);

    // Apply pagination
    const paginatedPosts = searchResults.slice(offset, offset + postsPerPage);

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

    return { posts: formattedPosts, total, totalPages, query: searchQuery };
}
