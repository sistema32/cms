/**
 * Widget Registry
 * Central registry for all available widgets
 */

import type { WidgetClass, WidgetRegistrationOptions } from "./types.ts";
import { SearchWidget } from "./SearchWidget.tsx";
import { RecentPostsWidget } from "./RecentPostsWidget.tsx";
import { CustomHtmlWidget } from "./CustomHtmlWidget.tsx";
import { CategoriesWidget } from "./CategoriesWidget.tsx";
import { TagsWidget } from "./TagsWidget.tsx";

/**
 * Widget registry class
 */
class WidgetRegistry {
  private widgets = new Map<string, WidgetClass>();
  private options = new Map<string, WidgetRegistrationOptions>();

  /**
   * Register a widget
   */
  register(widget: WidgetClass, options?: WidgetRegistrationOptions) {
    if (this.widgets.has(widget.id)) {
      console.warn(`Widget "${widget.id}" is already registered. Overwriting.`);
    }

    this.widgets.set(widget.id, widget);
    if (options) {
      this.options.set(widget.id, options);
    }
  }

  /**
   * Unregister a widget
   */
  unregister(widgetId: string): boolean {
    this.options.delete(widgetId);
    return this.widgets.delete(widgetId);
  }

  /**
   * Get a widget by ID
   */
  get(widgetId: string): WidgetClass | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * Get widget options
   */
  getOptions(widgetId: string): WidgetRegistrationOptions | undefined {
    return this.options.get(widgetId);
  }

  /**
   * Check if widget exists
   */
  has(widgetId: string): boolean {
    return this.widgets.has(widgetId);
  }

  /**
   * Get all registered widgets
   */
  getAll(): WidgetClass[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get all widget IDs
   */
  getIds(): string[] {
    return Array.from(this.widgets.keys());
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: string): WidgetClass[] {
    const widgets: WidgetClass[] = [];

    for (const [id, widget] of this.widgets.entries()) {
      const options = this.options.get(id);
      if (options?.category === category) {
        widgets.push(widget);
      }
    }

    return widgets;
  }

  /**
   * Get widget count
   */
  count(): number {
    return this.widgets.size;
  }

  /**
   * Clear all widgets
   */
  clear() {
    this.widgets.clear();
    this.options.clear();
  }
}

// Create singleton registry
export const widgetRegistry = new WidgetRegistry();

/**
 * Register all built-in widgets
 */
export function registerBuiltInWidgets() {
  // Content widgets
  widgetRegistry.register(RecentPostsWidget, {
    category: "content",
    allowMultiple: true,
  });

  widgetRegistry.register(CategoriesWidget, {
    category: "content",
    allowMultiple: true,
  });

  widgetRegistry.register(TagsWidget, {
    category: "content",
    allowMultiple: true,
  });

  // Utility widgets
  widgetRegistry.register(SearchWidget, {
    category: "utility",
    allowMultiple: true,
  });

  widgetRegistry.register(CustomHtmlWidget, {
    category: "custom",
    allowMultiple: true,
  });

  console.log(`✅ Registered ${widgetRegistry.count()} built-in widgets`);
}

/**
 * Helper functions for easy widget access
 */

export function getWidget(widgetId: string): WidgetClass | undefined {
  return widgetRegistry.get(widgetId);
}

export function getAllWidgets(): WidgetClass[] {
  return widgetRegistry.getAll();
}

export function hasWidget(widgetId: string): boolean {
  return widgetRegistry.has(widgetId);
}
