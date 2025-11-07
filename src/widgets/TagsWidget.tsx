/**
 * Tags Widget
 * Displays a tag cloud or list
 */

import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";
import { db } from "../db/index.ts";
import { tags, contentTags, content } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";

export const TagsWidget: WidgetClass = {
  id: "tags",
  name: "Tags",
  description: "Display a tag cloud or list",
  icon: "🏷️",

  settingsSchema: {
    displayStyle: {
      type: "select",
      label: "Display Style",
      description: "How to display tags",
      default: "cloud",
      options: [
        { value: "cloud", label: "Tag Cloud" },
        { value: "list", label: "Simple List" },
      ],
    },
    showCount: {
      type: "boolean",
      label: "Show Post Count",
      description: "Display the number of posts for each tag",
      default: true,
    },
    limit: {
      type: "number",
      label: "Maximum Tags",
      description: "Maximum number of tags to show",
      default: 20,
      min: 1,
      max: 100,
    },
    minFontSize: {
      type: "number",
      label: "Minimum Font Size",
      description: "Smallest font size for tag cloud (px)",
      default: 12,
      min: 8,
      max: 24,
    },
    maxFontSize: {
      type: "number",
      label: "Maximum Font Size",
      description: "Largest font size for tag cloud (px)",
      default: 24,
      min: 16,
      max: 48,
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const displayStyle = settings.displayStyle || "cloud";
    const showCount = settings.showCount !== false;
    const limit = settings.limit || 20;
    const minFontSize = settings.minFontSize || 12;
    const maxFontSize = settings.maxFontSize || 24;

    try {
      // Get tags with post counts
      const tagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          count: sql<number>`count(distinct ${contentTags.contentId})`,
        })
        .from(tags)
        .leftJoin(contentTags, eq(tags.id, contentTags.tagId))
        .leftJoin(
          content,
          eq(contentTags.contentId, content.id)
        )
        .where(eq(content.status, "published"))
        .groupBy(tags.id)
        .having(sql`count(distinct ${contentTags.contentId}) > 0`)
        .orderBy(sql`count(distinct ${contentTags.contentId}) desc`)
        .limit(limit);

      if (tagsData.length === 0) {
        return html`<p class="widget-no-content">No tags found</p>`;
      }

      // Calculate font sizes for tag cloud
      if (displayStyle === "cloud") {
        const maxCount = Math.max(...tagsData.map((t) => t.count));
        const minCount = Math.min(...tagsData.map((t) => t.count));
        const countRange = maxCount - minCount || 1;
        const fontRange = maxFontSize - minFontSize;

        return html`
          <div class="widget-tags widget-tag-cloud">
            <div class="tag-cloud">
              ${tagsData.map((tag) => {
                const fontSize =
                  minFontSize +
                  ((tag.count - minCount) / countRange) * fontRange;
                return html`
                  <a
                    href="/tag/${tag.slug}"
                    class="tag-cloud-link"
                    style="font-size: ${fontSize}px"
                    title="${tag.name} (${tag.count} posts)"
                  >
                    ${tag.name}
                  </a>
                `;
              })}
            </div>
          </div>
        `;
      } else {
        // List style
        return html`
          <div class="widget-tags widget-tag-list">
            <ul class="tags-list">
              ${tagsData.map((tag) => html`
                <li class="tag-item">
                  <a href="/tag/${tag.slug}" class="tag-link">
                    ${tag.name}
                    ${showCount
                      ? html`<span class="tag-count">(${tag.count})</span>`
                      : ""}
                  </a>
                </li>
              `)}
            </ul>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error rendering tags widget:", error);
      return html`<p class="widget-error">Error loading tags</p>`;
    }
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (settings.limit) {
      const limit = parseInt(settings.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push("Limit must be between 1 and 100");
      }
    }

    if (settings.minFontSize && settings.maxFontSize) {
      if (settings.minFontSize >= settings.maxFontSize) {
        errors.push("Minimum font size must be less than maximum");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
