/**
 * Plugin System
 * Main export file for the LexCMS plugin system
 */

// Core classes
export { HookManager, hookManager } from './HookManager.ts';
export { PluginAPI } from './PluginAPI.ts';
export { PluginSecurityManager, PluginSecurityError } from './SecurityManager.ts';
export { PluginLoader, pluginLoader } from './PluginLoader.ts';
export { PluginManager, pluginManager } from './PluginManager.ts';

// Types
export type {
  PluginManifest,
  PluginPermission,
  PluginCategory,
  PluginStatus,
  Plugin,
  PluginClass,
  HookType,
  HookCallback,
  HookRegistration,
  PluginAPIContext,
  PluginDB,
  PluginHookDB,
  ValidationResult,
  InstallOptions,
  MarketplacePlugin,
} from './types.ts';

/**
 * Plugin System Info
 */
export const PLUGIN_SYSTEM_VERSION = '1.0.0';

/**
 * Available Hook Names
 * This is a reference list of all available hooks in the system
 */
export const AVAILABLE_HOOKS = {
  // Content hooks
  'content:beforeCreate': 'Before creating content',
  'content:afterCreate': 'After content is created',
  'content:beforeUpdate': 'Before updating content',
  'content:afterUpdate': 'After content is updated',
  'content:beforeDelete': 'Before deleting content',
  'content:afterDelete': 'After content is deleted',
  'content:beforePublish': 'Before publishing content',
  'content:afterPublish': 'After content is published',
  'content:render': 'Filter content before rendering (filter)',

  // Media hooks
  'media:beforeUpload': 'Before uploading file',
  'media:afterUpload': 'After file is uploaded',
  'media:beforeDelete': 'Before deleting media',
  'media:afterDelete': 'After media is deleted',
  'media:getUrl': 'Get media URL (filter - for CDN)',
  'media:optimize': 'Optimize media file (filter)',

  // User hooks
  'user:beforeLogin': 'Before user login',
  'user:afterLogin': 'After successful login',
  'user:beforeRegister': 'Before user registration',
  'user:afterRegister': 'After user is registered',
  'user:beforeUpdate': 'Before updating user profile',
  'user:afterUpdate': 'After user profile is updated',

  // Comment hooks
  'comment:beforeCreate': 'Before creating comment',
  'comment:afterCreate': 'After comment is created',
  'comment:beforeModerate': 'Before moderating comment',
  'comment:filterSpam': 'Filter spam comments (filter)',

  // Theme hooks
  'theme:beforeRender': 'Before rendering page',
  'theme:afterRender': 'After page is rendered',
  'theme:headScripts': 'Inject scripts in <head> (filter)',
  'theme:footerScripts': 'Inject scripts before </body> (filter)',
  'theme:css': 'Add custom CSS (filter)',
  'theme:helpers': 'Add helper functions to themes (filter)',

  // Admin hooks
  'admin:menu': 'Add items to admin menu (filter)',
  'admin:dashboard': 'Add widgets to dashboard (filter)',
  'admin:routes': 'Add admin routes (filter)',

  // CAPTCHA hooks
  'captcha:verify': 'Verify CAPTCHA token (filter)',
  'captcha:render': 'Render CAPTCHA widget (filter)',

  // SEO hooks
  'seo:metaTags': 'Modify meta tags (filter)',
  'seo:sitemap': 'Add URLs to sitemap (filter)',
  'seo:robots': 'Modify robots.txt (filter)',

  // Email hooks
  'email:beforeSend': 'Before sending email',
  'email:afterSend': 'After email is sent',
  'email:template': 'Modify email template (filter)',

  // Cache hooks
  'cache:get': 'Get from cache (filter)',
  'cache:set': 'Save to cache',
  'cache:invalidate': 'Invalidate cache',

  // Analytics hooks
  'analytics:track': 'Track event',
  'analytics:pageview': 'Track pageview',

  // Search hooks
  'search:query': 'Modify search query (filter)',
  'search:results': 'Modify search results (filter)',
  'search:index': 'Index content for search',
} as const;

/**
 * Plugin Permission Descriptions
 */
export const PERMISSION_DESCRIPTIONS = {
  'content:read': 'Read content from database',
  'content:write': 'Create and modify content',
  'content:delete': 'Delete content',
  'media:read': 'Read media files',
  'media:write': 'Upload media files',
  'media:delete': 'Delete media files',
  'users:read': 'Read user information',
  'users:write': 'Create and modify users',
  'settings:read': 'Read system settings',
  'settings:write': 'Modify system settings',
  'network:external': 'Make HTTP requests to external services',
  'database:read': 'Execute SELECT queries',
  'database:write': 'Execute INSERT/UPDATE/DELETE queries',
  'system:shell': 'Execute shell commands (dangerous)',
  'system:files': 'Access file system',
} as const;
