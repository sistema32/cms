import { PluginLoader } from './PluginLoader.ts';
import { PluginWorker } from './PluginWorker.ts';
import { PluginManifest } from './types.ts';
import { db } from '../../db/index.ts';
import { sql } from 'drizzle-orm';

export class PluginManager {
    private static instance: PluginManager;
    public loader: PluginLoader;
    private workers: Map<string, PluginWorker> = new Map();
    private manifests: Map<string, PluginManifest> = new Map();
    // In-memory state for installed/active plugins (mocking DB for now)
    private installedPlugins: Set<string> = new Set();
    private activePlugins: Set<string> = new Set();
    private settings: Map<string, any> = new Map();

    private constructor() {
        this.loader = new PluginLoader('./plugins');
    }

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    async initialize() {
        console.log('[PluginManager] Initializing...');
        // In a real app, load from DB.
        // For now, we do nothing or auto-activate known plugins.
    }

    async install(pluginName: string, options: { activate: boolean }) {
        console.log(`[PluginManager] Installing ${pluginName}...`);
        const manifest = await this.loader.loadManifest(pluginName);
        this.manifests.set(pluginName, manifest);
        this.installedPlugins.add(pluginName);

        if (options.activate) {
            await this.activate(pluginName);
        }

        return {
            name: pluginName,
            version: manifest.version,
            isActive: this.activePlugins.has(pluginName)
        };
    }

    async uninstall(pluginName: string) {
        if (this.activePlugins.has(pluginName)) {
            await this.deactivate(pluginName);
        }
        this.installedPlugins.delete(pluginName);
        this.manifests.delete(pluginName);
        this.settings.delete(pluginName);
    }

    async activate(pluginName: string) {
        console.log(`[PluginManager] Activating ${pluginName}...`);

        if (this.workers.has(pluginName)) {
            console.warn(`[PluginManager] ${pluginName} is already active`);
            return;
        }

        let manifest = this.manifests.get(pluginName);
        if (!manifest) {
            manifest = await this.loader.loadManifest(pluginName);
            this.manifests.set(pluginName, manifest);
        }

        const worker = new PluginWorker(manifest);
        this.workers.set(pluginName, worker);

        const pluginPath = this.loader.getPluginPath(pluginName);

        // Load and activate in worker
        await worker.load(pluginPath);
        await worker.activate();

        this.activePlugins.add(pluginName);
        this.installedPlugins.add(pluginName); // Ensure it's marked as installed

        console.log(`[PluginManager] ${pluginName} activated`);
    }

    async deactivate(pluginName: string) {
        console.log(`[PluginManager] Deactivating ${pluginName}...`);
        const worker = this.workers.get(pluginName);
        if (worker) {
            await worker.deactivate();
            worker.terminate();
            this.workers.delete(pluginName);
            this.activePlugins.delete(pluginName);
            console.log(`[PluginManager] ${pluginName} deactivated`);
        }
    }

    getWorker(pluginName: string): PluginWorker | undefined {
        return this.workers.get(pluginName);
    }

    async isInstalled(pluginName: string): Promise<boolean> {
        return this.installedPlugins.has(pluginName);
    }

    async isActive(pluginName: string): Promise<boolean> {
        return this.activePlugins.has(pluginName);
    }

    async getAll(): Promise<any[]> {
        const result = [];
        for (const name of this.installedPlugins) {
            const manifest = this.manifests.get(name) || await this.loader.loadManifest(name);
            result.push({
                id: name, // Mock ID
                name,
                version: manifest.version,
                isActive: this.activePlugins.has(name),
                installedAt: new Date(),
                settings: JSON.stringify(this.settings.get(name) || {})
            });
        }
        return result;
    }

    async getActive(): Promise<any[]> {
        const all = await this.getAll();
        return all.filter(p => p.isActive);
    }

    async discoverAvailable(): Promise<string[]> {
        return this.loader.listAvailablePlugins();
    }

    async updateSettings(pluginName: string, settings: any) {
        this.settings.set(pluginName, settings);
        // If active, notify worker?
        // TODO: Implement settings update in worker
    }

    async getSettings(pluginName: string): Promise<any> {
        return this.settings.get(pluginName) || {};
    }

    async getStats() {
        return {
            total: this.installedPlugins.size,
            active: this.activePlugins.size,
            inactive: this.installedPlugins.size - this.activePlugins.size
        };
    }
}

export const pluginManager = PluginManager.getInstance();
