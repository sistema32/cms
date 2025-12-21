/**
 * Theme SDK - Hooks and Filters
 * Re-export hooks system for theme developers
 */

export {
  applyFilters,
  AVAILABLE_HOOKS,
  doAction,
  filterPostContent,
  filterThemeSettings,
  hasHook,
  onThemeActivated,
  onThemeSetup,
  registerAction,
  registerFilter,
  removeAllHooks,
  removeHook,
  themeHooks,
} from "@/services/themes/themeHooks.ts";

export type { ActionCallback, FilterCallback } from "./types.ts";
