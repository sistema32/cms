/**
 * Custom HTML Widget
 * Allows users to add custom HTML content
 */

import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";

export const CustomHtmlWidget: WidgetClass = {
  id: "custom-html",
  name: "Custom HTML",
  description: "Add custom HTML content",
  icon: "⚙️",

  settingsSchema: {
    content: {
      type: "textarea",
      label: "HTML Content",
      description: "Enter your custom HTML (WARNING: Make sure HTML is safe)",
      default: "",
      placeholder: "<p>Your custom HTML here...</p>",
      required: true,
    },
    escapeHtml: {
      type: "boolean",
      label: "Escape HTML",
      description: "Escape HTML for safety (recommended unless you trust the content)",
      default: true,
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const content = settings.content || "";
    const escapeHtml = settings.escapeHtml !== false;

    if (!content) {
      return html`<p class="widget-empty">No content configured</p>`;
    }

    // If escaping is enabled, render as text
    // If escaping is disabled, use html`${content}` which doesn't escape
    if (escapeHtml) {
      return html`<div class="widget-custom-html">${content}</div>`;
    } else {
      // WARNING: This is potentially unsafe - only use with trusted content
      return html`<div class="widget-custom-html" dangerouslySetInnerHTML=${{ __html: content }}></div>`;
    }
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (!settings.content || settings.content.trim() === "") {
      errors.push("Content is required");
    }

    // Basic XSS check if not escaping
    if (!settings.escapeHtml) {
      const content = settings.content.toLowerCase();
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /<iframe/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          errors.push("Content contains potentially unsafe HTML");
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
