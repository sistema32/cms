import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { tryLoadManifest } from "./pluginManifestLoader.ts";
import { registerDiscoveredPlugin } from "./pluginRegistry.ts";
import { addPendingPlugin, isPluginRegistered } from "./pluginPendingApproval.ts";
import { requestedPermissionsFromManifest } from "./pluginManifest.ts";

/**
 * Scans the plugins directory for new plugins.
 * New plugins are added to pending approval instead of auto-registering.
 */
export async function discoverPlugins(): Promise<string[]> {
    const pluginsDir = join(Deno.cwd(), "plugins");
    const foundPlugins: string[] = [];
    try {
        for await (const entry of Deno.readDir(pluginsDir)) {
            if (entry.isDirectory) {
                const manifest = await tryLoadManifest(Deno.cwd(), entry.name);
                if (manifest) {
                    // Check if already registered
                    const alreadyRegistered = await isPluginRegistered(manifest.id);

                    if (alreadyRegistered) {
                        // Update existing plugin if manifest changed
                        await registerDiscoveredPlugin(manifest);
                        foundPlugins.push(manifest.id);
                    } else {
                        // New plugin - add to pending approval
                        const permissions = requestedPermissionsFromManifest(manifest);
                        addPendingPlugin({
                            name: manifest.id,
                            displayName: manifest.name || manifest.id,
                            version: manifest.version || "1.0.0",
                            description: manifest.description || "No description",
                            permissions,
                            capabilities: manifest.capabilities || {},
                            manifestPath: join(pluginsDir, entry.name, "manifest.json"),
                            discoveredAt: new Date()
                        });
                        console.log(`[discovery] New plugin "${manifest.id}" added to pending approval`);
                    }
                } else {
                    console.warn(`[discovery] No valid manifest for: ${entry.name}`);
                }
            }
        }
    } catch (err) {
        // Ignore if plugins dir doesn't exist
        // console.warn("[discovery] Failed to scan plugins dir:", err);
    }
    return foundPlugins;
}
