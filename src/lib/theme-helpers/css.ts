import type { BodyClassContext, PostClassData } from "./types.ts";

/**
 * CSS Helpers - Functions for generating CSS classes
 */

/**
 * Generate CSS classes for body tag based on context (WordPress-style)
 */
export function bodyClass(context: BodyClassContext): string {
    const classes: string[] = [];

    if (context.isHome) classes.push("home");
    if (context.isPost) classes.push("post", `post-${context.slug}`);
    if (context.isPage) classes.push("page", `page-${context.slug}`);
    if (context.isCategory) classes.push("category", `category-${context.slug}`);
    if (context.isTag) classes.push("tag", `tag-${context.slug}`);
    if (context.isAuthor) classes.push("author");
    if (context.isSearch) classes.push("search");
    if (context.isError) classes.push("error");

    return classes.join(" ");
}

/**
 * Generate CSS classes for a post (WordPress-style)
 */
export function postClass(post: PostClassData): string {
    const classes: string[] = ["post"];

    classes.push(`post-${post.id}`);
    classes.push(`post-${post.slug}`);
    classes.push(`status-${post.status}`);

    if (post.featured) {
        classes.push("featured");
    }

    return classes.join(" ");
}
