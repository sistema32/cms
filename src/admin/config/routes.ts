/**
 * Admin Panel Routes Configuration
 * Centralized route definitions to avoid hardcoded paths
 */

import { env } from "../../config/env.ts";

/**
 * Route path segments (without base path)
 */
export const ROUTES = {
  // Authentication
  LOGIN: 'login',
  LOGIN_2FA: 'login/verify-2fa',
  LOGOUT: 'logout',

  // Dashboard
  DASHBOARD: '',

  // Content Management
  POSTS: 'posts',
  POSTS_NEW: 'posts/new',
  POSTS_EDIT: (id: number | string) => `posts/edit/${id}`,

  PAGES: 'pages',
  PAGES_NEW: 'pages/new',
  PAGES_EDIT: (id: number | string) => `pages/edit/${id}`,

  CATEGORIES: 'categories',
  TAGS: 'tags',
  COMMENTS: 'comments',

  MEDIA: 'media',
  MEDIA_UPLOAD: 'media/upload',

  // Content (generic)
  CONTENT: 'content',
  CONTENT_NEW: 'content/new',
  CONTENT_EDIT: (id: number | string) => `content/edit/${id}`,

  // Access Control
  USERS: 'users',
  USERS_NEW: 'users/new',
  USERS_EDIT: (id: number | string) => `users/edit/${id}`,

  ROLES: 'roles',
  ROLES_NEW: 'roles/new',
  ROLES_EDIT: (id: number | string) => `roles/edit/${id}`,

  PERMISSIONS: 'permissions',

  // Appearance
  THEMES: 'appearance/themes',
  MENUS: 'appearance/menus',

  // Plugins
  PLUGINS: 'plugins',
  PLUGINS_INSTALLED: 'plugins/installed',
  PLUGINS_AVAILABLE: 'plugins/available',
  PLUGINS_MARKETPLACE: 'plugins/marketplace',

  // Settings
  SETTINGS: 'settings',
  SETTINGS_GENERAL: 'settings?category=general',
  SETTINGS_READING: 'settings?category=reading',
  SETTINGS_WRITING: 'settings?category=writing',
  SETTINGS_DISCUSSION: 'settings?category=discussion',
  SETTINGS_MEDIA: 'settings?category=media',
  SETTINGS_SEO: 'settings?category=seo',
  SETTINGS_ADVANCED: 'settings?category=advanced',

  // Notifications
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Build full admin route path
 * @param route - Route path segment from ROUTES
 * @param basePath - Admin base path (defaults to env.ADMIN_PATH)
 * @returns Full path with base path prepended
 *
 * @example
 * buildAdminRoute(ROUTES.LOGIN) // '/admincp/login'
 * buildAdminRoute(ROUTES.POSTS_EDIT(123)) // '/admincp/posts/edit/123'
 */
export function buildAdminRoute(
  route: string,
  basePath: string = env.ADMIN_PATH
): string {
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;

  if (!cleanRoute) {
    return cleanBase + '/';
  }

  return `${cleanBase}/${cleanRoute}`;
}

/**
 * Common admin routes as full paths (convenience exports)
 */
export const ADMIN_PATHS = {
  LOGIN: buildAdminRoute(ROUTES.LOGIN),
  LOGIN_2FA: buildAdminRoute(ROUTES.LOGIN_2FA),
  DASHBOARD: buildAdminRoute(ROUTES.DASHBOARD),
  POSTS: buildAdminRoute(ROUTES.POSTS),
  PAGES: buildAdminRoute(ROUTES.PAGES),
  USERS: buildAdminRoute(ROUTES.USERS),
  SETTINGS: buildAdminRoute(ROUTES.SETTINGS),
  PLUGINS_INSTALLED: buildAdminRoute(ROUTES.PLUGINS_INSTALLED),
  PLUGINS_MARKETPLACE: buildAdminRoute(ROUTES.PLUGINS_MARKETPLACE),
} as const;

/**
 * Get admin asset path
 * @param assetPath - Path to asset (e.g., 'css/admin-compiled.css')
 * @returns Full asset path
 *
 * @example
 * getAdminAsset('css/admin-compiled.css') // '/admincp/assets/css/admin-compiled.css'
 */
export function getAdminAsset(assetPath: string): string {
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${env.ADMIN_PATH}/assets/${cleanPath}`;
}

export default ROUTES;
