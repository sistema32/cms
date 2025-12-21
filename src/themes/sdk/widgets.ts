/**
 * Widget SDK
 * Functions for working with widgets in themes
 */

import { renderWidgetArea } from "@/services/system/widgetService.ts";
import type { WidgetRenderContext } from "../../widgets/types.ts";

// Re-export widget types
export type {
  WidgetClass,
  WidgetData,
  WidgetAreaData,
  WidgetRenderContext,
  SettingDefinition,
  WidgetRegistrationOptions,
} from "../../widgets/types.ts";

/**
 * Render a widget area in a template
 *
 * @example
 * ```typescript
 * export const BlogTemplate = (props) => {
 *   return html`
 *     <main>...</main>
 *     <aside>
 *       ${await renderWidgetArea("sidebar-primary", {
 *         site: props.site,
 *         theme: "my-theme",
 *       })}
 *     </aside>
 *   `;
 * };
 * ```
 */
export { renderWidgetArea };

/**
 * Helper to create widget render context from template props
 */
export function createWidgetContext(
  props: any,
  theme: string
): WidgetRenderContext {
  return {
    site: props.site || {
      name: "Site",
      description: "",
      url: "",
    },
    user: props.user,
    currentUrl: props.currentUrl,
    currentPath: props.currentPath,
    theme,
    locale: props.locale,
  };
}
