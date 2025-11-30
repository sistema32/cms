import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { tryLoadManifest } from "./pluginManifestLoader.ts";
import { registerDiscoveredPlugin } from "./pluginRegistry.ts";

/**
 * Scans the plugins directory for new plugins and registers them.
 */
export async function discoverPlugins() {
    const pluginsDir = join(Deno.cwd(), "plugins");
    try {
        for await (const entry of Deno.readDir(pluginsDir)) {
            if (entry.isDirectory) {
                console.log(`[discovery] Checking directory: ${entry.name}`);
                const manifest = await tryLoadManifest(Deno.cwd(), entry.name);
                if (manifest) {
                    console.log(`[discovery] Found manifest for: ${entry.name}`);
                    await registerDiscoveredPlugin(manifest);
                } else {
                    console.warn(`[discovery] No valid manifest for: ${entry.name}`);
                }
            }
        }
    } catch (err) {
        // Ignore if plugins dir doesn't exist
        // console.warn("[discovery] Failed to scan plugins dir:", err);
    }
}
