/**
 * Plugin Service
 * Business logic for plugin operations
 */

import { pluginManager, pluginLoader } from '../lib/plugin-system/index.ts';
import type { Plugin as PluginDB } from '../db/schema.ts';
import type { Plugin, ValidationResult } from '../lib/plugin-system/types.ts';

export class PluginService {
  /**
   * Get all installed plugins
   */
  async getAllPlugins(): Promise<PluginDB[]> {
    return await pluginManager.getAll();
  }

  /**
   * Get active plugins
   */
  async getActivePlugins(): Promise<PluginDB[]> {
    return await pluginManager.getActive();
  }

  /**
   * Get available plugins (not installed)
   */
  async getAvailablePlugins(): Promise<string[]> {
    return await pluginManager.discoverAvailable();
  }

  /**
   * Get plugin details
   */
  async getPluginDetails(pluginName: string): Promise<Plugin | null> {
    const pluginDB = await pluginManager.getAll();
    const found = pluginDB.find(p => p.name === pluginName);

    if (!found) {
      return null;
    }

    // Get loaded plugin instance if active
    const plugin = pluginLoader.getPlugin(pluginName);

    return plugin || {
      id: found.id,
      name: found.name,
      version: found.version,
      status: found.isActive ? 'active' : 'inactive',
      manifest: await pluginLoader.loadManifest(pluginName),
      settings: found.settings
        ? (typeof found.settings === 'string' ? JSON.parse(found.settings) : found.settings)
        : {},
      installedAt: new Date(found.installedAt),
      updatedAt: found.updatedAt ? new Date(found.updatedAt) : undefined,
    };
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginName: string, activate: boolean = false): Promise<Plugin> {
    // Validate plugin exists
    const available = await pluginLoader.discoverPlugins();
    if (!available.includes(pluginName)) {
      throw new Error(`Plugin "${pluginName}" not found in plugins directory`);
    }

    // Check if already installed
    if (await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is already installed`);
    }

    // Install
    const plugin = await pluginManager.install(pluginName, { activate });

    return plugin;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    // Check if installed
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    await pluginManager.uninstall(pluginName);
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginName: string): Promise<void> {
    // Check if installed
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    // Check if already active
    if (await pluginManager.isActive(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is already active`);
    }

    await pluginManager.activate(pluginName);
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginName: string): Promise<void> {
    // Check if installed
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    // Check if already inactive - just return instead of throwing error
    if (!await pluginManager.isActive(pluginName)) {
      console.log(`[PluginService] Plugin "${pluginName}" is already inactive, skipping deactivation`);
      return;
    }

    await pluginManager.deactivate(pluginName);
  }

  /**
   * Update plugin settings
   */
  async updatePluginSettings(pluginName: string, settings: Record<string, any>): Promise<void> {
    // Check if installed
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    await pluginManager.updateSettings(pluginName, settings);
  }

  /**
   * Get plugin settings
   */
  async getPluginSettings(pluginName: string): Promise<Record<string, any>> {
    // Check if installed
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    return await pluginManager.getSettings(pluginName);
  }

  /**
   * Validate plugin manifest
   */
  async validatePlugin(pluginName: string): Promise<ValidationResult> {
    try {
      const manifest = await pluginLoader.loadManifest(pluginName);
      return pluginLoader.validateManifest(manifest);
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
        warnings: [],
      };
    }
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats() {
    const stats = await pluginManager.getStats();
    const available = await pluginManager.discoverAvailable();

    return {
      ...stats,
      available: available.length,
    };
  }

  /**
   * Reload a plugin (deactivate and activate)
   */
  async reloadPlugin(pluginName: string): Promise<void> {
    if (!await pluginManager.isInstalled(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not installed`);
    }

    const isActive = await pluginManager.isActive(pluginName);

    if (isActive) {
      await pluginManager.deactivate(pluginName);
      // Unload from memory
      pluginLoader.unloadPlugin(pluginName);
      // Activate again (will load fresh)
      await pluginManager.activate(pluginName);
    }
  }

  /**
   * Get plugin manifest without installing
   */
  async getPluginManifest(pluginName: string) {
    return await pluginLoader.loadManifest(pluginName);
  }

  /**
   * Get plugin asset path
   */
  getPluginAssetPath(pluginName: string, assetPath: string): string | null {
    return pluginLoader.getAssetPath(pluginName, assetPath);
  }
  /**
   * Get plugin worker
   */
  getPluginWorker(pluginName: string) {
    return pluginManager.getWorker(pluginName);
  }
}

export const pluginService = new PluginService();
