import { db } from '../../db/index.ts';
import { plugins } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { PluginLoader } from './PluginLoader.ts';
import { PluginWorker } from './PluginWorker.ts';
import { PluginInfo } from './types.ts';
import { join } from 'node:path';

export class PluginManager {
    private static instance: PluginManager;
    public loader: PluginLoader;
    private plugins: Map<string, PluginInfo> = new Map();
    private activePlugins: Map<string, PluginWorker> = new Map();

    private constructor() {
        this.loader = new PluginLoader(join(Deno.cwd(), 'plugins'));
    }

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    async initialize() {
        console.log('[PluginManager] Initializing...');

        // 1. Load plugins from disk to get manifests
        const availablePlugins = await this.loader.discoverPlugins();

        // 2. Sync with DB
        const dbPlugins = await db.select().from(plugins);

        for (const pName of availablePlugins) {
            try {
                const plugin = await this.loader.loadPlugin(pName);
                this.plugins.set(plugin.name, plugin);

                // Check if in DB
                const dbPlugin = dbPlugins.find(dp => dp.name === plugin.name);
                if (!dbPlugin) {
                    console.log(`[PluginManager] Found plugin on disk: ${plugin.name}`);
                } else {
                    // It's in DB, check if active
                    if (dbPlugin.isActive) {
                        await this.activate(plugin.name);
                    }
                }
            } catch (e) {
                console.error(`[PluginManager] Failed to load plugin ${pName}:`, e);
            }
        }

        console.log(`[PluginManager] Initialized with ${this.plugins.size} plugins.`);
    }

    async install(pluginPath: string) {
        // In a real scenario, this would unzip a file or git clone
        // For now, we assume it's already in plugins/ folder and we just register it
        // pluginPath here is likely just the name if we are installing from local
        const plugin = await this.loader.loadPlugin(pluginPath);

        // Check if already installed in DB
        const existing = await db.select().from(plugins).where(eq(plugins.name, plugin.name)).get();

        if (!existing) {
            await db.insert(plugins).values({
                name: plugin.name,
                version: plugin.version,
                isActive: false,
                settings: JSON.stringify({})
            });
            console.log(`[PluginManager] Plugin ${plugin.name} installed (registered in DB).`);
        }

        this.plugins.set(plugin.name, plugin);
        return plugin;
    }

    async uninstall(name: string) {
        if (this.activePlugins.has(name)) {
            await this.deactivate(name);
        }

        await db.delete(plugins).where(eq(plugins.name, name));
        this.plugins.delete(name);
        console.log(`[PluginManager] Plugin ${name} uninstalled.`);
    }

    async activate(name: string) {
        if (this.activePlugins.has(name)) {
            return; // Already active
        }

        // Load plugin info from database
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        if (!dbPlugin) {
            throw new Error(`Plugin ${name} not found in database`);
        }

        // Load plugin manifest from disk
        const plugin = await this.loader.loadPlugin(name);

        console.log(`[PluginManager] Activating ${name}...`);

        try {
            const worker = new PluginWorker(plugin);
            await worker.load(plugin.entryPoint);
            this.activePlugins.set(name, worker);

            // Update DB
            await db.update(plugins)
                .set({ isActive: true })
                .where(eq(plugins.name, name));

            console.log(`[PluginManager] ${name} activated`);
        } catch (error) {
            console.error(`[PluginManager] Failed to activate ${name}:`, error);
            throw error;
        }
    }

    async deactivate(name: string) {
        const worker = this.activePlugins.get(name);

        // Verify plugin exists in database
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        if (!dbPlugin) {
            throw new Error(`Plugin ${name} not found in database`);
        }

        // If worker exists, terminate it and clean up
        if (worker) {
            console.log(`[PluginManager] Deactivating ${name}...`);
            worker.terminate();
            this.activePlugins.delete(name);

            // Remove all admin panel registrations
            const { adminPanelRegistry } = await import('./AdminPanelRegistry.ts');
            adminPanelRegistry.removePlugin(name);
        } else {
            console.log(`[PluginManager] Plugin ${name} has no active worker, updating DB only`);
        }

        // ALWAYS update DB to ensure consistency
        await db.update(plugins)
            .set({ isActive: false })
            .where(eq(plugins.name, name));

        console.log(`[PluginManager] ${name} deactivated`);
    }

    getPlugin(name: string) {
        return this.plugins.get(name);
    }

    getWorker(name: string) {
        return this.activePlugins.get(name);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }

    // Alias for backward compatibility - returns DB records
    async getAll() {
        return await db.select().from(plugins);
    }

    async discoverAvailable() {
        return await this.loader.discoverPlugins();
    }

    async getStats() {
        // DB is the source of truth
        const dbPlugins = await db.select().from(plugins);
        const total = dbPlugins.length;
        const active = dbPlugins.filter(p => p.isActive).length;
        const inactive = total - active;

        return { total, active, inactive };
    }

    async isInstalled(name: string): Promise<boolean> {
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        return !!dbPlugin;
    }

    async isActive(name: string) {
        // DB is authoritative for status
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        return !!dbPlugin?.isActive;
    }

    async getActive() {
        // Pull active list from DB and align workers to match
        const dbPlugins = await db.select().from(plugins);
        const activePlugins = dbPlugins.filter(p => p.isActive);

        // Start workers for DB-active plugins that are not running
        for (const plugin of activePlugins) {
            if (!this.activePlugins.has(plugin.name)) {
                try {
                    await this.activate(plugin.name);
                } catch (error) {
                    console.error(`[PluginManager] Failed to start worker for active plugin ${plugin.name}:`, error);
                }
            }
        }

        // Stop stray workers not marked active in DB
        for (const name of Array.from(this.activePlugins.keys())) {
            const isActiveInDb = activePlugins.some(p => p.name === name);
            if (!isActiveInDb) {
                try {
                    await this.deactivate(name);
                } catch (error) {
                    console.error(`[PluginManager] Failed to stop worker for inactive plugin ${name}:`, error);
                }
            }
        }

        return activePlugins;
    }

    async getSettings(name: string) {
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        if (!dbPlugin || !dbPlugin.settings) {
            return {};
        }
        return JSON.parse(dbPlugin.settings);
    }

    async updateSettings(name: string, settings: any) {
        await db.update(plugins)
            .set({ settings: JSON.stringify(settings) })
            .where(eq(plugins.name, name));

        // If active, we might need to notify the worker?
        // For now, we just update DB.
    }

    /**
     * Get active worker for a plugin
     */
    getWorker(name: string) {
        return this.activePlugins.get(name);
    }
}

export const pluginManager = PluginManager.getInstance();
