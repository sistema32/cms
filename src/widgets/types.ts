/**
 * Widget Types
 * Defines interfaces and types for the widget system
 */

import type { HtmlEscapedString } from "hono/utils/html";

/**
 * Setting definition for widget configuration
 */
export interface SettingDefinition {
  type: "text" | "number" | "boolean" | "color" | "select" | "textarea" | "image";
  label: string;
  description?: string;
  default?: unknown;
  options?: Array<{ value: string; label: string }>; // For select type
  min?: number; // For number type
  max?: number; // For number type
  placeholder?: string;
  required?: boolean;
}

/**
 * Widget class interface
 * All widgets must implement this interface
 */
export interface WidgetClass {
  /** Unique widget identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description of what this widget does */
  description: string;

  /** Icon (emoji or icon name) */
  icon?: string;

  /** Settings schema for this widget */
  settingsSchema: Record<string, SettingDefinition>;

  /**
   * Render the widget
   * @param settings - Widget settings (validated against settingsSchema)
   * @param context - Rendering context (site data, user, etc.)
   */
  render(settings: Record<string, unknown>, context: WidgetRenderContext): Promise<HtmlEscapedString>;

  /**
   * Optional: Validate settings before saving
   * @param settings - Settings to validate
   * @returns Validation result
   */
  validate?(settings: Record<string, unknown>): Promise<{ valid: boolean; errors?: string[] }>;
}

/**
 * Widget render context
 * Data available to widgets during rendering
 */
export interface WidgetRenderContext {
  site: {
    name: string;
    description: string;
    url: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  currentUrl?: string;
  currentPath?: string;
  theme: string;
  locale?: string;
}

/**
 * Widget data from database
 */
export interface WidgetData {
  id: number;
  areaId?: number;
  type: string;
  title?: string;
  settings: Record<string, unknown>;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Widget area data
 */
export interface WidgetAreaData {
  id: number;
  slug: string;
  name: string;
  description?: string;
  theme: string;
  isActive: boolean;
  widgets?: WidgetData[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Widget registration options
 */
export interface WidgetRegistrationOptions {
  /** Override default widget class properties */
  override?: Partial<WidgetClass>;

  /** Widget category for grouping in admin */
  category?: "content" | "media" | "social" | "utility" | "custom";

  /** Whether widget supports multiple instances */
  allowMultiple?: boolean;

  /** Minimum theme version required */
  requiresTheme?: string;
}
