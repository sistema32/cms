import * as settingsService from "../../services/settingsService.ts";

/**
 * URL Helpers - Functions for generating URLs
 */

/**
 * Generate responsive image URL
 */
export function imgUrl(url: string, size?: string): string {
    if (!url) return "";

    // If no size specified, return original URL
    if (!size) return url;

    // TODO: Implement URL generation for different sizes
    // For now return original URL
    return url;
}

/**
 * Generate URL for a post
 */
export async function postUrl(slug: string): Promise<string> {
    const siteUrl = await settingsService.getSetting("site_url", "");
    const permalinkStructure = await settingsService.getSetting(
        "permalink_structure",
        "/:slug/",
    );

    return `${siteUrl}${permalinkStructure.replace(":slug", slug)}`;
}

/**
 * Generate URL for the blog
 */
export async function blogUrl(): Promise<string> {
    const blogBase = await settingsService.getSetting("blog_base", "blog");
    return `/${blogBase}`;
}

/**
 * Generate URL for a category
 */
export async function categoryUrl(slug: string): Promise<string> {
    const siteUrl = await settingsService.getSetting("site_url", "");
    const categoryBase = await settingsService.getSetting(
        "category_base",
        "category",
    );

    return `${siteUrl}/${categoryBase}/${slug}`;
}

/**
 * Generate URL for a tag
 */
export async function tagUrl(slug: string): Promise<string> {
    const siteUrl = await settingsService.getSetting("site_url", "");
    const tagBase = await settingsService.getSetting("tag_base", "tag");

    return `${siteUrl}/${tagBase}/${slug}`;
}
