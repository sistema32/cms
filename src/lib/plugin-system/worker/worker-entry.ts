import { RPCClient } from '../rpc/RPCClient.ts';
import { WorkerPluginAPI } from './WorkerPluginAPI.ts';

// Initialize RPC Client
const client = new RPCClient(self.postMessage.bind(self));

// Handle incoming messages
self.onmessage = (e) => client.handleMessage(e.data);

// State
let pluginInstance: any;
const hookCallbacks: Map<string, Array<(...args: any[]) => void>> = new Map();
const adminPanelCallbacks: Map<string, Function> = new Map();

// Helper to register hooks (used by WorkerPluginAPI)
(self as any).registerHookCallback = (hook: string, callback: (...args: any[]) => void) => {
    if (!hookCallbacks.has(hook)) {
        hookCallbacks.set(hook, []);
    }
    hookCallbacks.get(hook)!.push(callback);
};

(self as any).registerAdminPanelCallback = (id: string, callback: Function) => {
    adminPanelCallbacks.set(id, callback);
};

// Initialize API
const api = new WorkerPluginAPI(client);

// Register RPC Handlers

/**
 * Load Plugin
 */
client.registerHandler('load', async (pluginPath: string, manifest: any, settings: any) => {
    try {
        // Store manifest and settings globally for synchronous access
        (self as any).PLUGIN_MANIFEST = manifest;
        (self as any).PLUGIN_SETTINGS = settings;

        const module = await import(pluginPath);
        const PluginClass = module.default;
        pluginInstance = new PluginClass(api); // Pass API to constructor
        return { success: true };
    } catch (error) {
        throw new Error(`Failed to load plugin in worker: ${(error as Error).message}`);
    }
});

/**
 * Activate Plugin
 */
client.registerHandler('activate', async () => {
    if (pluginInstance && pluginInstance.onActivate) {
        await pluginInstance.onActivate();
    }
});

/**
 * Deactivate Plugin
 */
client.registerHandler('deactivate', async () => {
    if (pluginInstance && pluginInstance.onDeactivate) {
        await pluginInstance.onDeactivate();
    }
});

/**
 * Execute Hook
 * Called by main thread when a hook is triggered
 */
client.registerHandler('hook:execute', async (hook: string, ...args: any[]) => {
    const callbacks = hookCallbacks.get(hook);
    if (callbacks) {
        for (const callback of callbacks) {
            await callback(...args);
        }
    }
});

/**
 * Execute Filter
 */
client.registerHandler('hook:executeFilter', async (hook: string, value: any, ...args: any[]) => {
    const callbacks = hookCallbacks.get(hook);
    let result = value;
    if (callbacks) {
        for (const callback of callbacks) {
            result = await callback(result, ...args);
        }
    }
    return result;
});

/**
 * Render Admin Panel
 */
client.registerHandler('admin:renderPanel', async (panelId: string, context: any) => {
    const callback = adminPanelCallbacks.get(panelId);
    if (callback) {
        return await callback(context);
    }
    return null;
});
