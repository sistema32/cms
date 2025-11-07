/**
 * Search Widget
 * Displays a search form
 */

import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";

export const SearchWidget: WidgetClass = {
  id: "search",
  name: "Search",
  description: "Search form for your site",
  icon: "🔍",

  settingsSchema: {
    placeholder: {
      type: "text",
      label: "Placeholder Text",
      description: "Text shown in the search input",
      default: "Search...",
      placeholder: "Search...",
    },
    buttonText: {
      type: "text",
      label: "Button Text",
      description: "Text shown on the search button",
      default: "Search",
    },
    showIcon: {
      type: "boolean",
      label: "Show Search Icon",
      description: "Display a search icon in the input",
      default: true,
    },
    action: {
      type: "text",
      label: "Search URL",
      description: "URL to submit the search form (default: /search)",
      default: "/search",
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const placeholder = settings.placeholder || "Search...";
    const buttonText = settings.buttonText || "Search";
    const showIcon = settings.showIcon !== false;
    const action = settings.action || "/search";

    return html`
      <div class="widget-search">
        <form action="${action}" method="get" class="search-form">
          <div class="search-input-wrapper">
            ${showIcon ? html`<span class="search-icon" aria-hidden="true">🔍</span>` : ""}
            <input
              type="search"
              name="q"
              class="search-input"
              placeholder="${placeholder}"
              aria-label="Search"
              required
            />
          </div>
          <button type="submit" class="search-button">
            ${buttonText}
          </button>
        </form>
      </div>
    `;
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (settings.action && !/^\//.test(settings.action)) {
      errors.push("Search URL must start with /");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
