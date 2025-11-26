import { db } from '../../db/index.ts';
import { plugins } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { PluginLoader } from './PluginLoader.ts';
import { PluginWorker } from './PluginWorker.ts';
import { PluginInfo } from './types.ts';
import { hookManager } from './HookManager.ts';
import { join } from 'node:path';

export class PluginManager {
    private static instance: PluginManager;
    public loader: PluginLoader;
    private plugins: Map<string, PluginInfo> = new Map();
    private activePlugins: Map<string, PluginWorker> = new Map();

    private constructor() {
        this.loader = new PluginLoader(join(Deno.cwd(), 'plugins'));
        // Set hookManager reference to enable RPC execution
        hookManager.setPluginManager(this);
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

            // Remove all hooks registered by this plugin
            hookManager.removePluginHooks(name);

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
        const total = this.plugins.size;
        const active = this.activePlugins.size;
        const inactive = total - active;

        return {
            total,
            active,
            inactive
        };
    }

    async isInstalled(name: string): Promise<boolean> {
        const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
        return !!dbPlugin;
    }

    async isActive(name: string) {
        return this.activePlugins.has(name);
    }

    async getActive() {
        const activePlugins: any[] = [];
        for (const [name, worker] of this.activePlugins.entries()) {
            const plugin = this.plugins.get(name);
            if (plugin) {
                // We need to return PluginDB structure or similar, but PluginService expects PluginDB
                // Let's fetch from DB to be sure
                const dbPlugin = await db.select().from(plugins).where(eq(plugins.name, name)).get();
                if (dbPlugin) {
                    activePlugins.push(dbPlugin);
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
