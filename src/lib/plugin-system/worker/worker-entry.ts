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
const routeCallbacks: Map<string, Function> = new Map();

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

(self as any).registerRouteCallback = (id: string, callback: Function) => {
    routeCallbacks.set(id, callback);
};

// Initialize API
const api = new WorkerPluginAPI(client);
console.log('[Worker] API initialized');

// Expose API globally so plugin route handlers can access it
(globalThis as any).pluginAPI = api;

// Register RPC Handlers

/**
 * Load Plugin
 */
client.registerHandler('load', async (pluginPath: string, manifest: any, settings: any) => {
    try {
        console.log(`[Worker] Loading plugin from ${pluginPath}`);
        // Store manifest and settings globally for synchronous access
        (self as any).PLUGIN_MANIFEST = manifest;
        (self as any).PLUGIN_SETTINGS = settings;

        // Initialize plugin name in API
        const pluginName = manifest.name;
        api.setPluginName(pluginName);

        const module = await import(pluginPath);
        const PluginClass = module.default;

        if (!PluginClass) {
            throw new Error('Plugin must export a default class');
        }

        pluginInstance = new PluginClass(api); // Pass API to constructor

        if (pluginInstance.onInit) {
            await pluginInstance.onInit();
        }

        return { success: true };
    } catch (error) {
        const err = error as Error;
        console.error(`[Worker] Plugin load error:`, err);
        throw new Error(`Failed to load plugin in worker: ${err.message}`);
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

/**
 * Execute Route Handler
 */
client.registerHandler('api:routes:execute', async (handlerId: string, request: any) => {
    console.log('[Worker] Executing route:', handlerId);

    const callback = routeCallbacks.get(handlerId);

    if (callback) {
        try {
            // Create a NEW request object with API attached
            const enhancedRequest = {
                ...request,
                api: api
            };

            const result = await callback(enhancedRequest);

            // If result is a Response object, serialize it for RPC
            if (result instanceof Response) {
                const body = await result.text();
                const headers: Record<string, string> = {};
                result.headers.forEach((value, key) => {
                    headers[key] = value;
                });

                return {
                    status: result.status,
                    headers,
                    body,
                    _isResponse: true
                };
            }

            return result;
        } catch (error) {
            console.error('[Worker] Route execution error:', error);
            throw error;
        }
    }
    throw new Error(`Route handler not found: ${handlerId}`);
});
