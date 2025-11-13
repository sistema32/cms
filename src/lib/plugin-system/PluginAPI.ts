/**
 * Plugin API
 * The main API interface that plugins use to interact with LexCMS
 */

import type { HookCallback, PluginAPIContext, PluginPermission, AdminPanelConfig } from './types.ts';
import { hookManager } from './HookManager.ts';
import { PluginSecurityManager } from './SecurityManager.ts';
import { sanitizeHTML } from '../../utils/sanitization.ts';
import { AdminPanelRegistry } from './AdminPanelRegistry.ts';

export class PluginAPI {
  private context: PluginAPIContext;
  private securityManager: PluginSecurityManager;

  constructor(context: PluginAPIContext) {
    this.context = context;
    this.securityManager = new PluginSecurityManager(context.manifest);
  }

  // ==================
  // Hook Management
  // ==================

  /**
   * Register an action hook
   * Actions execute code at specific points without returning values
   */
  addAction(hookName: string, callback: HookCallback, priority: number = 10): void {
    hookManager.addAction(hookName, callback, priority, this.context.pluginName);
  }

  /**
   * Register a filter hook
   * Filters modify and return values
   */
  addFilter(hookName: string, callback: HookCallback, priority: number = 10): void {
    hookManager.addFilter(hookName, callback, priority, this.context.pluginName);
  }

  /**
   * Remove an action hook
   */
  removeAction(hookName: string, callback: HookCallback): void {
    hookManager.removeAction(hookName, callback);
  }

  /**
   * Remove a filter hook
   */
  removeFilter(hookName: string, callback: HookCallback): void {
    hookManager.removeFilter(hookName, callback);
  }

  /**
   * Execute an action hook
   */
  async doAction(hookName: string, ...args: any[]): Promise<void> {
    return hookManager.doAction(hookName, ...args);
  }

  /**
   * Apply filter hooks to a value
   */
  async applyFilters(hookName: string, value: any, ...args: any[]): Promise<any> {
    return hookManager.applyFilters(hookName, value, ...args);
  }

  // ==================
  // Settings
  // ==================

  /**
   * Get a plugin setting value
   */
  getSetting(key: string, defaultValue?: any): any {
    const value = this.context.settings?.[key];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a plugin setting value
   * Note: This updates the in-memory settings. Persistence is handled by PluginManager
   */
  setSetting(key: string, value: any): void {
    if (!this.context.settings) {
      this.context.settings = {};
    }
    this.context.settings[key] = value;
  }

  /**
   * Get all plugin settings
   */
  getAllSettings(): Record<string, any> {
    return { ...this.context.settings };
  }

  // ==================
  // Database Access
  // ==================

  /**
   * Execute a database query
   * Requires appropriate database permissions
   */
  async query(sql: string, params?: any[]): Promise<any> {
    // Validate permissions and sanitize query
    this.securityManager.validateDatabaseQuery(sql);

    // Import DB dynamically to avoid circular dependencies
    const { db } = await import('../../config/db.ts');

    // Execute query
    // Note: This is a simplified version. In production, you'd want to use
    // the actual Drizzle ORM methods instead of raw SQL
    return db.all(sql, params);
  }

  // ==================
  // HTTP Utilities
  // ==================

  /**
   * Make an HTTP request
   * Requires network:external permission
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Validate permissions and URL
    this.securityManager.validateNetworkRequest(url);

    return fetch(url, options);
  }

  // ==================
  // Logging
  // ==================

  /**
   * Log a message
   */
  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[Plugin: ${this.context.pluginName}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  // ==================
  // Cache (Placeholder)
  // ==================

  /**
   * Cache utilities
   * Note: This is a placeholder. Implement actual caching when cache system is available
   */
  cache = {
    async get(key: string): Promise<any> {
      // TODO: Implement when cache system is available
      this.log('Cache system not yet implemented', 'warn');
      return null;
    },

    async set(key: string, value: any, ttl?: number): Promise<void> {
      // TODO: Implement when cache system is available
      this.log('Cache system not yet implemented', 'warn');
    },

    async delete(key: string): Promise<void> {
      // TODO: Implement when cache system is available
      this.log('Cache system not yet implemented', 'warn');
    },
  };

  // ==================
  // Utilities
  // ==================

  /**
   * Utility functions
   */
  utils = {
    /**
     * Sanitize HTML to prevent XSS
     */
    sanitize(html: string): string {
      return sanitizeHTML(html);
    },

    /**
     * Convert string to URL-friendly slug
     */
    slugify(text: string): string {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },

    /**
     * Format date
     */
    formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    /**
     * Generate random ID
     */
    generateId(length: number = 16): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  };

  // ==================
  // Plugin Info
  // ==================

  /**
   * Get plugin information
   */
  getPluginInfo() {
    return {
      name: this.context.pluginName,
      version: this.context.manifest.version,
      displayName: this.context.manifest.displayName,
      author: this.context.manifest.author,
    };
  }

  /**
   * Check if plugin has a specific permission
   */
  hasPermission(permission: PluginPermission): boolean {
    return this.context.manifest.permissions.includes(permission);
  }

  // ==================
  // Admin Panel Registration
  // ==================

  /**
   * Register a custom admin panel
   * The panel will be accessible at /admin/plugins/:pluginName/:panelPath
   */
  registerAdminPanel(config: AdminPanelConfig): void {
    this.log(`Registering admin panel: ${config.id}`, 'info');

    // Validate config
    if (!config.id || !config.title || !config.path || !config.component) {
      throw new Error('Admin panel config must include id, title, path, and component');
    }

    // Normalize path (remove leading/trailing slashes)
    const normalizedPath = config.path.replace(/^\/+|\/+$/g, '');

    // Register panel in the global registry
    AdminPanelRegistry.registerPanel(this.context.pluginName, {
      ...config,
      path: normalizedPath,
      showInMenu: config.showInMenu !== false, // Default to true
      order: config.order ?? 10,
    });

    this.log(`Admin panel registered successfully: /admin/plugins/${this.context.pluginName}/${normalizedPath}`, 'info');
  }

  /**
   * Unregister an admin panel
   */
  unregisterAdminPanel(panelId: string): void {
    AdminPanelRegistry.unregisterPanel(this.context.pluginName, panelId);
    this.log(`Admin panel unregistered: ${panelId}`, 'info');
  }

  /**
   * Unregister all admin panels for this plugin
   */
  unregisterAllAdminPanels(): void {
    AdminPanelRegistry.unregisterAllPanels(this.context.pluginName);
    this.log('All admin panels unregistered', 'info');
  }
}
