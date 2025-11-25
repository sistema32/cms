import { Plugin } from '../../src/lib/plugin-system/types.ts';
import { WorkerPluginAPI } from '../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';

export default class LexSliderPlugin implements Plugin {
    private api: WorkerPluginAPI;
    private loaded = false;

    constructor(api: WorkerPluginAPI) {
        this.api = api;
    }

    async onActivate() {
        // Do nothing - will load on first request
    }

    async onDeactivate() {
        // Do nothing
    }

    async onInit() {
        // Load plugin asynchronously without blocking
        this.loadAsync();
    }

    private loadAsync() {
        // Use queueMicrotask to load after init completes
        queueMicrotask(async () => {
            if (this.loaded) return;
            this.loaded = true;

            try {
                const loader = await import("./loader.ts");
                await loader.loadLexSlider(this.api);
            } catch (e: any) {
                console.error("LexSlider load error:", e.message);
            }
        });
    }
}
