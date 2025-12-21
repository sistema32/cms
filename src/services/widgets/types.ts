import type { HtmlEscapedString } from "hono/utils/html";

export interface WidgetRenderContext {
  area: string;
  theme?: string;
  userId?: number;
}

export interface WidgetData {
  id: number;
  type: string;
  title?: string | null;
  settings?: Record<string, unknown>;
  order?: number | null;
}

export interface WidgetAreaData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  theme?: string | null;
  widgets?: WidgetData[];
}

export interface WidgetClass {
  type: string;
  render(context: WidgetRenderContext): Promise<HtmlEscapedString> | HtmlEscapedString;
}
