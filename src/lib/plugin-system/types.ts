/**
 * Plugin System Types
 * Type definitions for the LexCMS plugin system
 */

/**
 * Plugin Manifest - Defines plugin metadata and requirements
 */
export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;

  compatibility: {
    lexcms: string; // Semantic version range, e.g., ">=1.0.0"
    deno?: string;
  };

  dependencies?: Record<string, string>;

  permissions: PluginPermission[];

  hooks?: string[];

  settings?: {
    schema?: string; // Path to JSON schema
    component?: string; // Path to settings component
  };

  category?: PluginCategory;
  tags?: string[];
}

/**
 * Plugin Permissions
 */
export type PluginPermission =
  // Content permissions
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  // Media permissions
  | 'media:read'
  | 'media:write'
  | 'media:delete'
  // User permissions
  | 'users:read'
  | 'users:write'
  // Settings permissions
  | 'settings:read'
  | 'settings:write'
  // Network permissions
  | 'network:external'
  // Database permissions
  | 'database:read'
  | 'database:write'
  // System permissions
  | 'system:shell'
  | 'system:files';

/**
 * Plugin Categories
 */
export type PluginCategory =
  | 'cdn'
  | 'analytics'
  | 'seo'
  | 'security'
  | 'social'
  | 'ecommerce'
  | 'ai'
  | 'developer'
  | 'media'
  | 'other';

/**
 * Plugin Status
 */
export type PluginStatus = 'active' | 'inactive' | 'error';

/**
 * Plugin Instance
 */
export interface Plugin {
  id: number;
  name: string;
  version: string;
  status: PluginStatus;
  manifest: PluginManifest;
  settings?: Record<string, any>;
  installedAt: Date;
  updatedAt?: Date;

  // Plugin class instance
  instance?: PluginClass;
}

/**
 * Plugin Class Interface
 * All plugins must implement this interface
 */
export interface PluginClass {
  /**
   * Called when plugin is activated
   */
  onActivate(): Promise<void> | void;

  /**
   * Called when plugin is deactivated
   */
  onDeactivate(): Promise<void> | void;

  /**
   * Called when plugin settings are updated (optional)
   */
  onSettingsUpdate?(settings: Record<string, any>): Promise<void> | void;
}

/**
 * Hook Types
 */
export type HookType = 'action' | 'filter';

/**
 * Hook Callback
 */
export type HookCallback = (...args: any[]) => any | Promise<any>;

/**
 * Hook Registration
 */
export interface HookRegistration {
  hookName: string;
  callback: HookCallback;
  priority: number;
  pluginName: string;
}

/**
 * Plugin API Context
 * Passed to plugin constructor
 */
export interface PluginAPIContext {
  pluginName: string;
  manifest: PluginManifest;
  settings: Record<string, any>;
}

/**
 * Database Models
 */
export interface PluginDB {
  id: number;
  name: string;
  version: string;
  isActive: boolean;
  settings: string | null; // JSON
  installedAt: string;
  updatedAt: string | null;
}

export interface PluginHookDB {
  id: number;
  pluginId: number;
  hookName: string;
  priority: number;
}

/**
 * Plugin Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Plugin Installation Options
 */
export interface InstallOptions {
  activate?: boolean;
  overwrite?: boolean;
}

/**
 * Plugin Marketplace Entry
 */
export interface MarketplacePlugin {
  id: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  description: string;
  downloads: number;
  rating: number;
  verified: boolean;
  categories: PluginCategory[];
  price: 'free' | 'paid';
  homepage: string;
  downloadUrl?: string;
}

/**
 * Admin Panel Configuration
 * Defines a custom admin panel registered by a plugin
 */
export interface AdminPanelConfig {
  /**
   * Unique identifier for the panel (will be prefixed with plugin name)
   */
  id: string;

  /**
   * Display title in navigation
   */
  title: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Icon name (Material Design Icons)
   */
  icon?: string;

  /**
   * Route path (relative to /admin/plugins/:pluginName/)
   */
  path: string;

  /**
   * Required permissions to view this panel
   */
  requiredPermissions?: string[];

  /**
   * Panel content renderer
   * Can be a JSX component or HTML string
   */
  component: AdminPanelComponent;

  /**
   * Optional menu order (lower numbers appear first)
   */
  order?: number;

  /**
   * Whether to show in navigation menu
   */
  showInMenu?: boolean;
}

/**
 * Admin Panel Component
 * Function that returns JSX or HTML for the panel
 */
export type AdminPanelComponent = (context: AdminPanelContext) => any;

/**
 * Context passed to admin panel components
 */
export interface AdminPanelContext {
  /**
   * Current user information
   */
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };

  /**
   * Query parameters from URL
   */
  query: Record<string, string | string[]>;

  /**
   * Plugin API instance for accessing plugin functionality
   */
  pluginAPI: any; // Will be PluginAPI instance

  /**
   * Plugin settings
   */
  settings: Record<string, any>;

  /**
   * Request object
   */
  request?: any;
}
