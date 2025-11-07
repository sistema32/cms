/**
 * LexCMS Theme SDK
 * Complete SDK for theme developers
 *
 * @example
 * ```typescript
 * import {
 *   html,
 *   type HomeTemplateProps,
 *   formatDate,
 *   renderPagination,
 * } from "@lexcms/theme-sdk";
 *
 * export const HomeTemplate = (props: HomeTemplateProps) => {
 *   const { site, custom, featuredPosts } = props;
 *
 *   return html`
 *     <h1>${site.name}</h1>
 *     ${featuredPosts?.map(post => html`
 *       <article>
 *         <h2>${post.title}</h2>
 *         <time>${formatDate(post.publishedAt)}</time>
 *       </article>
 *     `)}
 *   `;
 * };
 * ```
 */

// Export all types
export type {
  ActionCallback,
  ArchiveTemplateProps,
  BaseTemplateProps,
  BlogTemplateProps,
  CategoryData,
  CustomSettingDefinition,
  Error404TemplateProps,
  FilterCallback,
  FooterProps,
  HeaderProps,
  HomeTemplateProps,
  HtmlEscapedString,
  MenuItemData,
  PageData,
  PageTemplateProps,
  PaginationData,
  PartialComponent,
  PostCardProps,
  PostData,
  PostSeoData,
  PostTemplateProps,
  SearchTemplateProps,
  SidebarProps,
  SiteData,
  TagData,
  TemplateComponent,
  ThemeConfig,
  UserData,
  WidgetData,
} from "./types.ts";

// Export html tagged template
export { html } from "./types.ts";

// Export all helpers
export {
  calculateReadingTime,
  escapeAttr,
  formatDate,
  generateExcerpt,
  getRelativeTime,
  pluralize,
  renderBreadcrumbs,
  renderCategoryList,
  renderMenu,
  renderMetaTags,
  renderPagination,
  renderSchemaOrg,
  renderTagList,
  sanitizeHtml,
  slugToTitle,
  themeAsset,
  truncateWords,
} from "./helpers.ts";

// Export hooks system (cuando esté implementado)
// export { registerAction, doAction, registerFilter, applyFilters } from "./hooks.ts";

/**
 * SDK version
 */
export const SDK_VERSION = "1.0.0";

/**
 * SDK info
 */
export const SDK_INFO = {
  name: "LexCMS Theme SDK",
  version: SDK_VERSION,
  description: "Complete SDK for LexCMS theme development",
  author: "LexCMS Team",
  license: "MIT",
};
