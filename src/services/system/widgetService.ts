// @ts-nocheck
/**
 * Widget Service
 * Manages widget areas and widgets
 */

import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import { db } from "@/db/index.ts";
import { widgetAreas, widgets } from "@/db/schema.ts";
import type {
  WidgetArea,
  Widget,
  NewWidgetArea,
  NewWidget,
} from "@/db/schema.ts";
import { eq, and, asc, desc } from "drizzle-orm";
import {
  getWidget,
  widgetRegistry,
  registerBuiltInWidgets,
} from "../widgets/registry.ts";
import type {
  WidgetData,
  WidgetAreaData,
  WidgetRenderContext,
} from "../widgets/types.ts";

// Initialize built-in widgets on first import
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    registerBuiltInWidgets();
    initialized = true;
  }
}

/**
 * Create a widget area
 */
export async function createWidgetArea(
  data: Omit<NewWidgetArea, "createdAt" | "updatedAt">
): Promise<number> {
  const [result] = await db
    .insert(widgetAreas)
    .values({
      ...data,
    })
    .returning({ id: widgetAreas.id });

  return result.id;
}

/**
 * Get widget area by slug
 */
export async function getWidgetAreaBySlug(
  slug: string
): Promise<WidgetAreaData | null> {
  const [area] = await db
    .select()
    .from(widgetAreas)
    .where(eq(widgetAreas.slug, slug))
    .limit(1);

  if (!area) return null;

  // Get widgets for this area
  const areaWidgets = await getWidgetsByAreaId(area.id);

  return {
    ...area,
    widgets: areaWidgets,
  };
}

/**
 * Get widget area by ID
 */
export async function getWidgetAreaById(
  id: number
): Promise<WidgetAreaData | null> {
  const [area] = await db
    .select()
    .from(widgetAreas)
    .where(eq(widgetAreas.id, id))
    .limit(1);

  if (!area) return null;

  // Get widgets for this area
  const areaWidgets = await getWidgetsByAreaId(area.id);

  return {
    ...area,
    widgets: areaWidgets,
  };
}

/**
 * Get all widget areas for a theme
 */
export async function getWidgetAreasByTheme(
  theme: string
): Promise<WidgetAreaData[]> {
  const areas = await db
    .select()
    .from(widgetAreas)
    .where(eq(widgetAreas.theme, theme));

  // Get widgets for each area
  const areasWithWidgets = await Promise.all(
    areas.map(async (area) => ({
      ...area,
      widgets: await getWidgetsByAreaId(area.id),
    }))
  );

  return areasWithWidgets;
}

/**
 * Update widget area
 */
export async function updateWidgetArea(
  id: number,
  data: Partial<WidgetArea>
): Promise<void> {
  await db.update(widgetAreas).set(data).where(eq(widgetAreas.id, id));
}

/**
 * Delete widget area
 */
export async function deleteWidgetArea(id: number): Promise<void> {
  await db.delete(widgetAreas).where(eq(widgetAreas.id, id));
}

/**
 * Create a widget
 */
export async function createWidget(
  data: Omit<NewWidget, "createdAt" | "updatedAt">
): Promise<number> {
  ensureInitialized();

  // Validate widget type
  if (!widgetRegistry.has(data.type)) {
    throw new Error(`Unknown widget type: ${data.type}`);
  }

  // Validate settings
  const widgetClass = getWidget(data.type);
  if (widgetClass?.validate && data.settings) {
    const validation = await widgetClass.validate(
      typeof data.settings === "string"
        ? JSON.parse(data.settings)
        : data.settings
    );
    if (!validation.valid) {
      throw new Error(
        `Widget validation failed: ${validation.errors?.join(", ")}`
      );
    }
  }

  const [result] = await db
    .insert(widgets)
    .values({
      ...data,
      settings: typeof data.settings === "string"
        ? data.settings
        : JSON.stringify(data.settings || {}),
    })
    .returning({ id: widgets.id });

  return result.id;
}

/**
 * Get widget by ID
 */
export async function getWidgetById(id: number): Promise<WidgetData | null> {
  const [widget] = await db
    .select()
    .from(widgets)
    .where(eq(widgets.id, id))
    .limit(1);

  if (!widget) return null;

  return {
    ...widget,
    settings: widget.settings ? JSON.parse(widget.settings) : {},
  };
}

/**
 * Get widgets by area ID
 */
export async function getWidgetsByAreaId(areaId: number): Promise<WidgetData[]> {
  const widgetsList = await db
    .select()
    .from(widgets)
    .where(
      and(
        eq(widgets.areaId, areaId),
        eq(widgets.isActive, true)
      )
    )
    .orderBy(asc(widgets.order));

  return widgetsList.map((w) => ({
    ...w,
    settings: w.settings ? JSON.parse(w.settings) : {},
  }));
}

/**
 * Get widgets by area slug
 */
export async function getWidgetsByAreaSlug(
  slug: string
): Promise<WidgetData[]> {
  const area = await getWidgetAreaBySlug(slug);
  if (!area) return [];

  return area.widgets || [];
}

/**
 * Update widget
 */
export async function updateWidget(
  id: number,
  data: Partial<Widget>
): Promise<void> {
  const updateData = { ...data };

  // Convert settings to JSON string if it's an object
  if (updateData.settings && typeof updateData.settings !== "string") {
    updateData.settings = JSON.stringify(updateData.settings);
  }

  await db.update(widgets).set(updateData).where(eq(widgets.id, id));
}

/**
 * Delete widget
 */
export async function deleteWidget(id: number): Promise<void> {
  await db.delete(widgets).where(eq(widgets.id, id));
}

/**
 * Reorder widgets in an area
 */
export async function reorderWidgets(
  areaId: number,
  widgetIds: number[]
): Promise<void> {
  // Update order for each widget
  for (let i = 0; i < widgetIds.length; i++) {
    await db
      .update(widgets)
      .set({ order: i })
      .where(
        and(eq(widgets.id, widgetIds[i]), eq(widgets.areaId, areaId))
      );
  }
}

/**
 * Render a single widget
 */
export async function renderWidget(
  widget: WidgetData,
  context: WidgetRenderContext
): Promise<HtmlEscapedString> {
  ensureInitialized();

  const widgetClass = getWidget(widget.type);

  if (!widgetClass) {
    console.error(`Widget type "${widget.type}" not found`);
    return html`<div class="widget-error">Widget type not found: ${widget.type}</div>`;
  }

  try {
    const content = await widgetClass.render(widget.settings, context);
    return content;
  } catch (error) {
    console.error(`Error rendering widget "${widget.type}":`, error);
    return html`<div class="widget-error">Error rendering widget</div>`;
  }
}

/**
 * Render a widget area
 */
export async function renderWidgetArea(
  areaSlug: string,
  context: WidgetRenderContext
): Promise<HtmlEscapedString> {
  ensureInitialized();

  const area = await getWidgetAreaBySlug(areaSlug);

  if (!area) {
    console.warn(`Widget area "${areaSlug}" not found`);
    return html``;
  }

  if (!area.isActive) {
    return html``;
  }

  const areaWidgets = area.widgets || [];

  if (areaWidgets.length === 0) {
    return html``;
  }

  // Render all widgets
  const renderedWidgets = await Promise.all(
    areaWidgets.map(async (widget) => {
      const content = await renderWidget(widget, context);

      return html`
        <div class="widget widget--${widget.type}" data-widget-id="${widget.id}">
          ${widget.title
            ? html`<h3 class="widget-title">${widget.title}</h3>`
            : ""}
          <div class="widget-content">
            ${content}
          </div>
        </div>
      `;
    })
  );

  return html`
    <div class="widget-area widget-area--${areaSlug}" data-area-id="${area.id}">
      ${renderedWidgets}
    </div>
  `;
}

/**
 * Register widget areas from theme config
 */
export async function registerThemeWidgetAreas(
  theme: string,
  areas: Array<{ id: string; name: string; description?: string }>
): Promise<void> {
  for (const area of areas) {
    // Check if area already exists
    const existing = await getWidgetAreaBySlug(area.id);

    if (!existing) {
      await createWidgetArea({
        slug: area.id,
        name: area.name,
        description: area.description,
        theme,
        isActive: true,
      });
    } else {
      // Update existing area
      await updateWidgetArea(existing.id, {
        name: area.name,
        description: area.description,
      });
    }
  }
}

/**
 * Get available widget types
 */
export function getAvailableWidgetTypes() {
  ensureInitialized();

  return widgetRegistry.getAll().map((widget) => ({
    id: widget.id,
    name: widget.name,
    description: widget.description,
    icon: widget.icon,
    settingsSchema: widget.settingsSchema,
  }));
}

/**
 * Validate widget settings
 */
export async function validateWidgetSettings(
  type: string,
  settings: any
): Promise<{ valid: boolean; errors?: string[] }> {
  ensureInitialized();

  const widgetClass = getWidget(type);

  if (!widgetClass) {
    return {
      valid: false,
      errors: [`Unknown widget type: ${type}`],
    };
  }

  if (!widgetClass.validate) {
    return { valid: true };
  }

  return await widgetClass.validate(settings);
}
// @ts-nocheck
