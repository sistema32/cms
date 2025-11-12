/**
 * Plugin Loader
 * Loads, validates, and instantiates plugins
 */

import type {
  Plugin,
  PluginClass,
  PluginManifest,
  ValidationResult,
  PluginAPIContext,
} from './types.ts';
import { PluginAPI } from './PluginAPI.ts';
import { hookManager } from './HookManager.ts';
import { existsSync } from '@std/fs';
import { join } from '@std/path';

export class PluginLoader {
  private pluginsDir: string;
  private loadedPlugins: Map<string, Plugin> = new Map();

  constructor(pluginsDir: string = './plugins') {
    // Convert relative path to absolute path
    if (!pluginsDir.startsWith('/')) {
      this.pluginsDir = join(Deno.cwd(), pluginsDir);
    } else {
      this.pluginsDir = pluginsDir;
    }
    console.log(`📁 Plugin directory: ${this.pluginsDir}`);
  }

  /**
   * Load plugin manifest from plugin.json
   */
  async loadManifest(pluginName: string): Promise<PluginManifest> {
    const manifestPath = join(this.pluginsDir, pluginName, 'plugin.json');

    if (!existsSync(manifestPath)) {
      throw new Error(`Plugin manifest not found: ${manifestPath}`);
    }

    const content = await Deno.readTextFile(manifestPath);
    const manifest = JSON.parse(content) as PluginManifest;

    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Invalid plugin manifest:\n${validation.errors.join('\n')}`
      );
    }

    return manifest;
  }

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: Partial<PluginManifest>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.name) errors.push('Missing required field: name');
    if (!manifest.version) errors.push('Missing required field: version');
    if (!manifest.displayName) errors.push('Missing required field: displayName');
    if (!manifest.description) errors.push('Missing required field: description');
    if (!manifest.author) errors.push('Missing required field: author');
    if (!manifest.license) errors.push('Missing required field: license');

    // Version format validation
    if (manifest.version && !this.isValidVersion(manifest.version)) {
      errors.push(`Invalid version format: ${manifest.version}`);
    }

    // Compatibility check
    if (!manifest.compatibility?.lexcms) {
      errors.push('Missing compatibility.lexcms field');
    }

    // Permissions
    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      errors.push('Missing or invalid permissions field');
    }

    // Name validation (must be lowercase, alphanumeric with dashes)
    if (manifest.name && !/^[a-z0-9-]+$/.test(manifest.name)) {
      errors.push(
        'Invalid plugin name. Must be lowercase alphanumeric with dashes only.'
      );
    }

    // Warnings for optional but recommended fields
    if (!manifest.homepage) {
      warnings.push('No homepage URL provided');
    }

    if (!manifest.category) {
      warnings.push('No category specified');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Load and instantiate a plugin
   */
  async loadPlugin(pluginName: string, settings: Record<string, any> = {}): Promise<Plugin> {
    // Check if already loaded
    if (this.loadedPlugins.has(pluginName)) {
      return this.loadedPlugins.get(pluginName)!;
    }

    // Load manifest
    const manifest = await this.loadManifest(pluginName);

    // Load plugin module
    const pluginPath = join(this.pluginsDir, pluginName, 'index.ts');

    if (!existsSync(pluginPath)) {
      throw new Error(`Plugin entry point not found: ${pluginPath}`);
    }

    // Dynamic import - pluginPath is already absolute
    const module = await import(`file://${pluginPath}`);

    // Get plugin class (default export)
    const PluginClass = module.default;

    if (!PluginClass) {
      throw new Error(`Plugin ${pluginName} must export a default class`);
    }

    // Create plugin API context
    const context: PluginAPIContext = {
      pluginName,
      manifest,
      settings,
    };

    // Create plugin API
    const api = new PluginAPI(context);

    // Instantiate plugin
    const instance: PluginClass = new PluginClass(api);

    // Verify plugin implements required methods
    if (typeof instance.onActivate !== 'function') {
      throw new Error(`Plugin ${pluginName} must implement onActivate() method`);
    }

    if (typeof instance.onDeactivate !== 'function') {
      throw new Error(`Plugin ${pluginName} must implement onDeactivate() method`);
    }

    // Create plugin object
    const plugin: Plugin = {
      id: 0, // Will be set from database
      name: pluginName,
      version: manifest.version,
      status: 'inactive',
      manifest,
      settings,
      installedAt: new Date(),
      instance,
    };

    this.loadedPlugins.set(pluginName, plugin);

    return plugin;
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }

    if (plugin.status === 'active') {
      console.warn(`Plugin ${pluginName} is already active`);
      return;
    }

    try {
      // Call plugin's onActivate hook
      await plugin.instance!.onActivate();

      plugin.status = 'active';

      console.log(`✓ Plugin activated: ${pluginName}`);
    } catch (error) {
      plugin.status = 'error';
      console.error(`✗ Failed to activate plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginName: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }

    if (plugin.status === 'inactive') {
      console.warn(`Plugin ${pluginName} is already inactive`);
      return;
    }

    try {
      // Call plugin's onDeactivate hook
      await plugin.instance!.onDeactivate();

      // Remove all hooks registered by this plugin
      hookManager.removePluginHooks(pluginName);

      plugin.status = 'inactive';

      console.log(`✓ Plugin deactivated: ${pluginName}`);
    } catch (error) {
      plugin.status = 'error';
      console.error(`✗ Failed to deactivate plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin from memory
   */
  unloadPlugin(pluginName: string): void {
    const plugin = this.loadedPlugins.get(pluginName);

    if (!plugin) {
      return;
    }

    if (plugin.status === 'active') {
      throw new Error(
        `Cannot unload active plugin ${pluginName}. Deactivate it first.`
      );
    }

    this.loadedPlugins.delete(pluginName);
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginName);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.status === 'active');
  }

  /**
   * Discover available plugins in plugins directory
   */
  async discoverPlugins(): Promise<string[]> {
    const plugins: string[] = [];

    try {
      if (!existsSync(this.pluginsDir)) {
        await Deno.mkdir(this.pluginsDir, { recursive: true });
        return plugins;
      }

      for await (const entry of Deno.readDir(this.pluginsDir)) {
        if (entry.isDirectory) {
          const manifestPath = join(this.pluginsDir, entry.name, 'plugin.json');
          if (existsSync(manifestPath)) {
            plugins.push(entry.name);
          }
        }
      }
    } catch (error) {
      console.error('Error discovering plugins:', error);
    }

    return plugins;
  }

  /**
   * Check version compatibility
   */
  private isValidVersion(version: string): boolean {
    // Basic semver validation
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version);
  }
}

// Singleton instance
export const pluginLoader = new PluginLoader();
