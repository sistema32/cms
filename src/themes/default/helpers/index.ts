/**
 * Default Theme Helpers
 * Re-exports centralized theme helpers from the system
 * 
 * Themes can override specific helpers by creating their own helper files.
 * For example, to override the menu helper:
 * - Create src/themes/default/helpers/menu.ts
 * - Export your custom getMenu() function
 * - The system will automatically use your override
 */

export * from "../../../lib/theme-helpers/index.ts";
