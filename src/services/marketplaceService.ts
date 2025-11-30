/**
 * Marketplace Service
 * Handles interactions with the plugin marketplace
 */

import { join } from '@std/path';
export interface MarketplacePlugin {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    author?: string;
    category?: string;
    tags?: string[];
    homepage?: string;
    sourceUrl?: string;
}


export class MarketplaceService {
    private dataPath: string;

    constructor() {
        this.dataPath = join(Deno.cwd(), 'src/data/marketplace-plugins.json');
    }

    /**
     * Get all marketplace plugins
     */
    async getPlugins(): Promise<MarketplacePlugin[]> {
        try {
            const content = await Deno.readTextFile(this.dataPath);
            const data = JSON.parse(content);
            return data.plugins || [];
        } catch (error) {
            console.error('Failed to load marketplace plugins:', error);
            return [];
        }
    }

    /**
     * Get a specific plugin by ID
     */
    async getPlugin(id: string): Promise<MarketplacePlugin | null> {
        const plugins = await this.getPlugins();
        return plugins.find(p => p.id === id) || null;
    }

    /**
     * Search plugins
     */
    async searchPlugins(query: string): Promise<MarketplacePlugin[]> {
        const plugins = await this.getPlugins();
        const lowerQuery = query.toLowerCase();

        return plugins.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.displayName.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Install a plugin from the marketplace
     */
    async installPlugin(id: string): Promise<boolean> {
        const plugin = await this.getPlugin(id);
        if (!plugin) {
            throw new Error(`Plugin ${id} not found in marketplace`);
        }

        if (!plugin.sourceUrl) {
            throw new Error(`Plugin ${id} has no source URL`);
        }

        const { installPluginFromUrl } = await import("./pluginInstaller.ts");
        return await installPluginFromUrl(id, plugin.sourceUrl);
    }
}

export const marketplaceService = new MarketplaceService();
