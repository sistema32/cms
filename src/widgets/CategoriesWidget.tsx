/**
 * Categories Widget
 * Displays a list of categories
 */

import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";
import { db } from "../db/index.ts";
import { categories, contentCategories, content, contentTypes } from "../db/schema.ts";
import { eq, and, sql, isNull } from "drizzle-orm";

export const CategoriesWidget: WidgetClass = {
  id: "categories",
  name: "Categories",
  description: "Display a list of categories",
  icon: "📁",

  settingsSchema: {
    showCount: {
      type: "boolean",
      label: "Show Post Count",
      description: "Display the number of posts in each category",
      default: true,
    },
    showHierarchy: {
      type: "boolean",
      label: "Show Hierarchy",
      description: "Display subcategories indented",
      default: true,
    },
    hideEmpty: {
      type: "boolean",
      label: "Hide Empty Categories",
      description: "Don't show categories with no posts",
      default: false,
    },
    limit: {
      type: "number",
      label: "Maximum Categories",
      description: "Maximum number of categories to show (0 = no limit)",
      default: 0,
      min: 0,
      max: 50,
    },
    contentType: {
      type: "select",
      label: "Content Type",
      description: "Which content type's categories to display",
      default: "post",
      options: [
        { value: "post", label: "Posts" },
        { value: "page", label: "Pages" },
      ],
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const showCount = settings.showCount !== false;
    const showHierarchy = settings.showHierarchy !== false;
    const hideEmpty = settings.hideEmpty || false;
    const limit = settings.limit || 0;
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

      // Get categories with post counts
      let query = db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          parentId: categories.parentId,
          count: sql<number>`count(distinct ${contentCategories.contentId})`,
        })
        .from(categories)
        .leftJoin(
          contentCategories,
          eq(categories.id, contentCategories.categoryId)
        )
        .leftJoin(
          content,
          and(
            eq(contentCategories.contentId, content.id),
            eq(content.status, "published")
          )
        )
        .where(
          and(
            eq(categories.contentTypeId, contentTypeData.id),
            isNull(categories.deletedAt)
          )
        )
        .groupBy(categories.id);

      const categoriesData = await query;

      // Filter empty categories if needed
      let filteredCategories = categoriesData;
      if (hideEmpty) {
        filteredCategories = categoriesData.filter((cat) => cat.count > 0);
      }

      // Apply limit
      if (limit > 0) {
        filteredCategories = filteredCategories.slice(0, limit);
      }

      if (filteredCategories.length === 0) {
        return html`<p class="widget-no-content">No categories found</p>`;
      }

      // Build hierarchy if enabled
      const renderCategory = (cat: any, depth = 0) => {
        const indent = showHierarchy ? `style="padding-left: ${depth * 20}px"` : "";

        return html`
          <li class="category-item" ${indent}>
            <a href="/category/${cat.slug}" class="category-link">
              ${cat.name}
              ${showCount ? html`<span class="category-count">(${cat.count})</span>` : ""}
            </a>
          </li>
        `;
      };

      // Organize categories by parent
      const topLevelCategories = filteredCategories.filter(
        (cat) => !cat.parentId
      );
      const childCategories = filteredCategories.filter((cat) => cat.parentId);

      const renderCategoryTree = (parentId: number | null, depth = 0): any => {
        const cats = parentId
          ? childCategories.filter((cat) => cat.parentId === parentId)
          : topLevelCategories;

        return cats.map((cat) => html`
          ${renderCategory(cat, depth)}
          ${showHierarchy ? renderCategoryTree(cat.id, depth + 1) : ""}
        `);
      };

      return html`
        <div class="widget-categories">
          <ul class="categories-list">
            ${showHierarchy
              ? renderCategoryTree(null, 0)
              : filteredCategories.map((cat) => renderCategory(cat, 0))}
          </ul>
        </div>
      `;
    } catch (error) {
      console.error("Error rendering categories widget:", error);
      return html`<p class="widget-error">Error loading categories</p>`;
    }
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (settings.limit) {
      const limit = parseInt(settings.limit);
      if (isNaN(limit) || limit < 0 || limit > 50) {
        errors.push("Limit must be between 0 and 50");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
// @ts-nocheck
