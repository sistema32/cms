/**
 * API Routes Configuration
 * Centralized API route definitions to avoid hardcoded paths
 */

/**
 * API route path segments
 */
export const API_ROUTES = {
  // Base API path
  BASE: '/api',

  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    VERIFY_2FA: '/api/auth/verify-2fa',
  },

  // Content
  CONTENT: {
    BASE: '/api/content',
    BY_ID: (id: number | string) => `/api/content/${id}`,
    BY_SLUG: (slug: string) => `/api/content/slug/${slug}`,
  },

  // Categories
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: number | string) => `/api/categories/${id}`,
  },

  // Tags
  TAGS: {
    BASE: '/api/tags',
    BY_ID: (id: number | string) => `/api/tags/${id}`,
  },

  // Comments
  COMMENTS: {
    BASE: '/api/comments',
    BY_ID: (id: number | string) => `/api/comments/${id}`,
    BY_CONTENT: (contentId: number | string) => `/api/comments/content/${contentId}`,
    ORIGINAL: (id: number | string) => `/api/comments/${id}/original`,
    MODERATE: (id: number | string) => `/api/comments/${id}/moderate`,
    STATS: (contentId: number | string) => `/api/comments/stats/${contentId}`,
  },

  // Media
  MEDIA: {
    BASE: '/api/media',
    BY_ID: (id: number | string) => `/api/media/${id}`,
    UPLOAD: '/api/media/upload',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: number | string) => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
  },

  // Roles
  ROLES: {
    BASE: '/api/roles',
    BY_ID: (id: number | string) => `/api/roles/${id}`,
  },

  // Permissions
  PERMISSIONS: {
    BASE: '/api/permissions',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id: number | string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },

  // Plugins
  PLUGINS: {
    BASE: '/api/plugins',
    BY_ID: (id: string) => `/api/plugins/${id}`,
    INSTALL: '/api/plugins/install',
    UNINSTALL: (id: string) => `/api/plugins/${id}/uninstall`,
    ACTIVATE: (id: string) => `/api/plugins/${id}/activate`,
    DEACTIVATE: (id: string) => `/api/plugins/${id}/deactivate`,
  },

  // Backups
  BACKUPS: {
    BASE: '/api/backups',
    BY_ID: (id: number | string) => `/api/backups/${id}`,
    CREATE: '/api/backups/create',
    RESTORE: (id: number | string) => `/api/backups/${id}/restore`,
    AUTO_CONFIG: '/api/backups/auto-config',
  },
} as const;

export default API_ROUTES;
