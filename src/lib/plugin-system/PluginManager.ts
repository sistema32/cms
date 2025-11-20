/**
 * Plugin Manager
 * High-level manager for plugin operations with database persistence
 */

import { db } from '../../config/db.ts';
import { plugins, pluginHooks, type Plugin as PluginDB, type NewPlugin } from '../../db/schema.ts';
import { pluginLoader } from './PluginLoader.ts';
import type { Plugin, InstallOptions } from './types.ts';
import { eq } from 'drizzle-orm';
import { AdminPanelRegistry } from './AdminPanelRegistry.ts';
import { join } from '@std/path';

import { pluginMigrationRunner } from './PluginMigration.ts';

export class PluginManager {
  /**
   * Install a plugin
   */
  async install(pluginName: string, options: InstallOptions = {}): Promise<Plugin> {
    const { activate = false, overwrite = false } = options;

    // Check if already installed
    const existing = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (existing && !overwrite) {
      throw new Error(`Plugin ${pluginName} is already installed`);
    }

    // Load plugin
    const plugin = await pluginLoader.loadPlugin(pluginName);

    // Save to database
    if (existing) {
      // Update existing
      await db
        .update(plugins)
        .set({
          version: plugin.version,
          settings: JSON.stringify(plugin.settings || {}),
          updatedAt: new Date(),
        })
        .where(eq(plugins.id, existing.id))
        .run();

      plugin.id = existing.id;
    } else {
      // Insert new
      const newPlugin: NewPlugin = {
        name: pluginName,
        version: plugin.version,
        isActive: false,
        settings: JSON.stringify(plugin.settings || {}),
      };

      const result = await db.insert(plugins).values(newPlugin).returning().get();
      plugin.id = result.id;
    }

    console.log(`✓ Plugin installed: ${pluginName} v${plugin.version}`);

    // Run migrations on install/update
    try {
      const pluginPath = join(Deno.cwd(), 'plugins', pluginName);
      await pluginMigrationRunner.runMigrations(pluginName, pluginPath);
    } catch (error) {
      console.error(`Failed to run migrations for ${pluginName}:`, error);
      // We don't fail installation, but warn
    }

    // Activate if requested
    if (activate) {
      await this.activate(pluginName);
    }

    return plugin;
  }


  /**
   * Uninstall a plugin
   */
  async uninstall(pluginName: string): Promise<void> {
    const pluginDB = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (!pluginDB) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    // Deactivate first if active
    if (pluginDB.isActive) {
      await this.deactivate(pluginName);
    }

    // Revert migrations
    try {
      const pluginPath = join(Deno.cwd(), 'plugins', pluginName);
      await pluginMigrationRunner.revertMigrations(pluginName, pluginPath);
    } catch (error) {
      console.error(`Failed to revert migrations for ${pluginName}:`, error);
      // We continue uninstalling even if revert fails?
      // Yes, otherwise plugin is stuck
    }

    // Delete from database (cascade will delete hooks)
    await db.delete(plugins).where(eq(plugins.id, pluginDB.id)).run();

    // Unload from memory
    pluginLoader.unloadPlugin(pluginName);

    console.log(`✓ Plugin uninstalled: ${pluginName}`);
  }

  /**
   * Activate a plugin
   */
  async activate(pluginName: string): Promise<void> {
    const pluginDB = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (!pluginDB) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    if (pluginDB.isActive) {
      console.warn(`Plugin ${pluginName} is already active`);
      return;
    }

    // Load if not loaded
    let plugin = pluginLoader.getPlugin(pluginName);
    if (!plugin) {
      const settings = pluginDB.settings ? JSON.parse(pluginDB.settings) : {};
      plugin = await pluginLoader.loadPlugin(pluginName, settings);
      plugin.id = pluginDB.id;
    }

    // Check dependencies
    if (plugin.manifest.dependencies) {
      const missingDeps: string[] = [];
      const inactiveDeps: string[] = [];

      for (const [depName, versionRange] of Object.entries(plugin.manifest.dependencies)) {
        const isInstalled = await this.isInstalled(depName);
        if (!isInstalled) {
          missingDeps.push(depName);
          continue;
        }

        const isActive = await this.isActive(depName);
        if (!isActive) {
          inactiveDeps.push(depName);
        }
      }

      if (missingDeps.length > 0) {
        throw new Error(`Cannot activate ${pluginName}: Missing dependencies: ${missingDeps.join(', ')}`);
      }

      if (inactiveDeps.length > 0) {
        throw new Error(`Cannot activate ${pluginName}: Inactive dependencies: ${inactiveDeps.join(', ')}`);
      }
    }

    // Activate
    await pluginLoader.activatePlugin(pluginName);

    // Update database
    await db
      .update(plugins)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(plugins.id, pluginDB.id))
      .run();
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginName: string): Promise<void> {
    const pluginDB = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (!pluginDB) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    if (!pluginDB.isActive) {
      console.warn(`Plugin ${pluginName} is already inactive`);
      return;
    }

    // Deactivate
    await pluginLoader.deactivatePlugin(pluginName);

    // Unregister all admin panels for this plugin
    AdminPanelRegistry.unregisterAllPanels(pluginName);

    // Update database
    await db
      .update(plugins)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(plugins.id, pluginDB.id))
      .run();
  }

  /**
   * Update plugin settings
   */
  async updateSettings(pluginName: string, settings: Record<string, any>): Promise<void> {
    const pluginDB = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (!pluginDB) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    // Update database
    await db
      .update(plugins)
      .set({
        settings: JSON.stringify(settings),
        updatedAt: new Date(),
      })
      .where(eq(plugins.id, pluginDB.id))
      .run();

    // Update in-memory plugin
    const plugin = pluginLoader.getPlugin(pluginName);
    if (plugin) {
      plugin.settings = settings;

      // Call plugin's onSettingsUpdate if it exists
      if (plugin.instance && typeof plugin.instance.onSettingsUpdate === 'function') {
        await plugin.instance.onSettingsUpdate(settings);
      }
    }

    console.log(`✓ Plugin settings updated: ${pluginName}`);
  }

  /**
   * Get plugin settings
   */
  async getSettings(pluginName: string): Promise<Record<string, any>> {
    const pluginDB = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();

    if (!pluginDB) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    return pluginDB.settings ? JSON.parse(pluginDB.settings) : {};
  }

  /**
   * Get all installed plugins from database
   */
  async getAll(): Promise<PluginDB[]> {
    return await db.select().from(plugins).all();
  }

  /**
   * Get active plugins from database
   */
  async getActive(): Promise<PluginDB[]> {
    return await db.select().from(plugins).where(eq(plugins.isActive, true)).all();
  }

  /**
   * Check if a plugin is installed
   */
  async isInstalled(pluginName: string): Promise<boolean> {
    const plugin = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();
    return plugin !== undefined;
  }

  /**
   * Check if a plugin is active
   */
  async isActive(pluginName: string): Promise<boolean> {
    const plugin = await db.select().from(plugins).where(eq(plugins.name, pluginName)).get();
    return plugin?.isActive ?? false;
  }

  /**
   * Initialize plugin system
   * Load and activate all active plugins from database
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing plugin system...');

    const activePlugins = await this.getActive();

    for (const pluginDB of activePlugins) {
      try {
        const settings = pluginDB.settings ? JSON.parse(pluginDB.settings) : {};
        const plugin = await pluginLoader.loadPlugin(pluginDB.name, settings);
        plugin.id = pluginDB.id;

        await pluginLoader.activatePlugin(pluginDB.name);

        console.log(`  ✓ Loaded: ${pluginDB.name} v${pluginDB.version}`);
      } catch (error) {
        console.error(`  ✗ Failed to load plugin ${pluginDB.name}:`, error);

        // Mark as error in database
        await db
          .update(plugins)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(plugins.id, pluginDB.id))
          .run();
      }
    }

    console.log('✓ Plugin system initialized');
  }

  /**
   * Discover available plugins (not installed)
   */
  async discoverAvailable(): Promise<string[]> {
    const allPlugins = await pluginLoader.discoverPlugins();
    const installedPlugins = await this.getAll();
    const installedNames = new Set(installedPlugins.map(p => p.name));

    return allPlugins.filter(name => !installedNames.has(name));
  }

  /**
   * Get plugin statistics
   */
  async getStats() {
    const all = await this.getAll();
    const active = all.filter(p => p.isActive);

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
    };
  }
}

// Singleton instance
export const pluginManager = new PluginManager();
