import { pluginManager } from '../src/lib/plugins/core/PluginManager.ts';
import { db } from '../src/db/index.ts';
import { plugins } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Starting Plugin System Verification...");

    try {
        // 1. Initialize Plugin Manager
        await pluginManager.init();
        console.log("Plugin Manager initialized.");

        // 2. Check available plugins
        const available = await pluginManager.discoverAvailable();
        console.log("Available plugins:", available);

        if (!available.includes('lexslider') && !await pluginManager.isInstalled('lexslider')) {
            console.error("LexSlider plugin not found!");
            Deno.exit(1);
        }

        // 3. Install LexSlider if not installed
        if (!await pluginManager.isInstalled('lexslider')) {
            console.log("Installing LexSlider...");
            await pluginManager.install('lexslider', { activate: true });
        } else {
            console.log("LexSlider already installed.");
            if (!await pluginManager.isActive('lexslider')) {
                console.log("Activating LexSlider...");
                await pluginManager.activatePlugin('lexslider');
            }
        }

        // 4. Verify Status
        const isActive = await pluginManager.isActive('lexslider');
        console.log("LexSlider Active:", isActive);

        if (!isActive) {
            throw new Error("Failed to activate LexSlider");
        }

        // 5. Test RPC (Optional - requires mocking request)
        // We can check if worker is running
        const worker = pluginManager.getWorker('lexslider');
        if (!worker) {
            throw new Error("Worker not found for LexSlider");
        }
        console.log("Worker is running.");

        console.log("Verification Successful!");
        Deno.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error);
        Deno.exit(1);
    }
}

main();
