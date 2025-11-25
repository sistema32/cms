import { PluginManifest } from './types.ts';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export class PluginLoader {
    private pluginsDir: string;

    constructor(pluginsDir: string) {
        this.pluginsDir = pluginsDir;
    }

    async loadManifest(pluginName: string): Promise<PluginManifest> {
        const manifestPath = join(this.pluginsDir, pluginName, 'plugin.json');
        try {
            const content = await Deno.readTextFile(manifestPath);
            const manifest = JSON.parse(content);

            // Basic validation
            if (!manifest.name || !manifest.version) {
                throw new Error('Invalid manifest: missing name or version');
            }

            if (manifest.name !== pluginName) {
                throw new Error(`Manifest name mismatch: expected ${pluginName}, got ${manifest.name}`);
            }

            return manifest as PluginManifest;
        } catch (error) {
            throw new Error(`Failed to load manifest for ${pluginName}: ${(error as Error).message}`);
        }
    }

    async listAvailablePlugins(): Promise<string[]> {
        const plugins: string[] = [];
        try {
            for await (const entry of Deno.readDir(this.pluginsDir)) {
                if (entry.isDirectory) {
                    // Check if plugin.json exists
                    try {
                        await Deno.stat(join(this.pluginsDir, entry.name, 'plugin.json'));
                        plugins.push(entry.name);
                    } catch {
                        // Not a plugin
                    }
                }
            }
        } catch (error) {
            console.error('Error listing plugins:', error);
        }
        return plugins;
    }

    // Alias for compatibility
    async discoverPlugins(): Promise<string[]> {
        return this.listAvailablePlugins();
    }

    getPluginPath(pluginName: string): string {
        const modPath = join(this.pluginsDir, pluginName, 'mod.ts');
        const indexPath = join(this.pluginsDir, pluginName, 'index.ts');

        try {
            Deno.statSync(modPath);
            return `file://${join(Deno.cwd(), modPath)}`;
        } catch {
            return `file://${join(Deno.cwd(), indexPath)}`;
        }
    }

    getAssetPath(pluginName: string, assetPath: string): string | null {
        // Prevent path traversal
        if (assetPath.includes('..')) {
            return null;
        }
        const fullPath = join(this.pluginsDir, pluginName, 'assets', assetPath);
        // Verify existence
        try {
            Deno.statSync(fullPath);
            return fullPath;
        } catch {
            return null;
        }
    }

    validateManifest(manifest: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!manifest.name) errors.push('Missing name');
        if (!manifest.version) errors.push('Missing version');
        if (!manifest.displayName) errors.push('Missing displayName');
        if (!manifest.permissions) warnings.push('Missing permissions (defaulting to none)');

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    unloadPlugin(pluginName: string) {
        // Since we use workers, we don't really "unload" from memory in the host
        // But we could clear any caches here if we had them.
    }

    // Placeholder for getPlugin if needed by service (service expects instance?)
    // The service seems to expect an object with manifest etc.
    getPlugin(pluginName: string) {
        return null; // We don't hold instances in loader anymore
    }
}
