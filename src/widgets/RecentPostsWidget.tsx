/**
 * Recent Posts Widget
 * Displays a list of recent posts
 */

import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";
import { db } from "../db/index.ts";
import { content, contentTypes } from "../db/schema.ts";
import { eq, desc, and } from "drizzle-orm";

export const RecentPostsWidget: WidgetClass = {
  id: "recent-posts",
  name: "Recent Posts",
  description: "Display a list of recent posts",
  icon: "📝",

  settingsSchema: {
    limit: {
      type: "number",
      label: "Number of Posts",
      description: "How many posts to show",
      default: 5,
      min: 1,
      max: 20,
    },
    showExcerpt: {
      type: "boolean",
      label: "Show Excerpt",
      description: "Display post excerpt",
      default: false,
    },
    showDate: {
      type: "boolean",
      label: "Show Date",
      description: "Display publication date",
      default: true,
    },
    showAuthor: {
      type: "boolean",
      label: "Show Author",
      description: "Display post author",
      default: false,
    },
    showThumbnail: {
      type: "boolean",
      label: "Show Thumbnail",
      description: "Display featured image thumbnail",
      default: false,
    },
    contentType: {
      type: "select",
      label: "Content Type",
      description: "Which content type to display",
      default: "post",
      options: [
        { value: "post", label: "Posts" },
        { value: "page", label: "Pages" },
      ],
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const limit = settings.limit || 5;
    const showExcerpt = settings.showExcerpt || false;
    const showDate = settings.showDate !== false;
    const showAuthor = settings.showAuthor || false;
    const showThumbnail = settings.showThumbnail || false;
    const contentTypeSlug = settings.contentType || "post";

    try {
      // Get content type
      const [contentTypeData] = await db
        .select()
        .from(contentTypes)
        .where(eq(contentTypes.slug, contentTypeSlug))
        .limit(1);

      if (!contentTypeData) {
        return html`<p class="widget-error">Content type not found</p>`;
      }

      // Get recent posts
      const posts = await db
        .select({
          id: content.id,
          title: content.title,
          slug: content.slug,
          excerpt: content.excerpt,
          publishedAt: content.publishedAt,
        })
        .from(content)
        .where(
          and(
            eq(content.contentTypeId, contentTypeData.id),
            eq(content.status, "published")
          )
        )
        .orderBy(desc(content.publishedAt))
        .limit(limit);

      if (posts.length === 0) {
        return html`<p class="widget-no-content">No posts found</p>`;
      }

      return html`
        <div class="widget-recent-posts">
          <ul class="recent-posts-list">
            ${posts.map((post) => html`
              <li class="recent-post-item">
                <article>
                  <h3 class="recent-post-title">
                    <a href="/${contentTypeSlug}/${post.slug}">${post.title}</a>
                  </h3>
                  ${showDate && post.publishedAt
                    ? html`
                      <time class="recent-post-date" datetime="${post.publishedAt.toISOString()}">
                        ${post.publishedAt.toLocaleDateString()}
                      </time>
                    `
                    : ""}
                  ${showExcerpt && post.excerpt
                    ? html`<p class="recent-post-excerpt">${post.excerpt}</p>`
                    : ""}
                </article>
              </li>
            `)}
          </ul>
        </div>
      `;
    } catch (error) {
      console.error("Error rendering recent posts widget:", error);
      return html`<p class="widget-error">Error loading posts</p>`;
    }
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (settings.limit) {
      const limit = parseInt(settings.limit);
      if (isNaN(limit) || limit < 1 || limit > 20) {
        errors.push("Limit must be between 1 and 20");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
// @ts-nocheck
