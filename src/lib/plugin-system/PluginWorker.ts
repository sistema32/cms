import { RPCServer } from './rpc/RPCServer.ts';
import type { PluginManifest } from './types.ts';
import { PluginAPI } from './PluginAPI.ts';

/**
 * Plugin Worker
 * Manages the worker thread for a single plugin
 */
export class PluginWorker {
    private worker: Worker;
    private rpc: RPCServer;
    private manifest: PluginManifest;
    private api: PluginAPI;

    constructor(manifest: PluginManifest, api: PluginAPI) {
        this.manifest = manifest;
        this.api = api;

        // Create worker with permissions
        // Note: Deno.permissions is not fully granular for workers yet in all versions, 
        // but we can pass specific permissions if we were spawning a process. 
        // For Worker, it inherits permissions or we can restrict (deno: false).
        // For now, we spawn a standard worker.
        this.worker = new Worker(new URL('./worker/worker-entry.ts', import.meta.url).href, {
            type: 'module',
            // deno: { // Future: restrict permissions based on manifest
            //   permissions: {
            //     net: manifest.permissions.includes('network:external'),
            //     read: manifest.permissions.includes('system:files'),
            //   }
            // }
        });

        this.rpc = new RPCServer(this.worker);
        this.registerAPIHandlers();
    }

    /**
     * Register API handlers to be called by the worker
     */
    private registerAPIHandlers() {
        // Database
        this.rpc.registerHandler('api:database:query', (sql: string, params?: any[]) => {
            return this.api.query(sql, params);
        });

        // Logger
        this.rpc.registerHandler('api:logger:info', (msg: string, args: any[]) => this.api.log(msg, 'info'));
        this.rpc.registerHandler('api:logger:warn', (msg: string, args: any[]) => this.api.log(msg, 'warn'));
        this.rpc.registerHandler('api:logger:error', (msg: string, args: any[]) => this.api.log(msg, 'error'));
        this.rpc.registerHandler('api:logger:debug', (msg: string, args: any[]) => this.api.log(msg, 'info'));

        // Hooks
        this.rpc.registerHandler('api:hooks:register', (hook: string, priority?: number) => {
            // Register a proxy callback in the main thread that calls the worker back
            this.api.addAction(hook, async (...args: any[]) => {
                await this.rpc.call('hook:execute', hook, ...args);
            }, priority);
        });

        this.rpc.registerHandler('api:hooks:registerFilter', (hook: string, priority?: number) => {
            this.api.addFilter(hook, async (value: any, ...args: any[]) => {
                return await this.rpc.call('hook:executeFilter', hook, value, ...args);
            }, priority);
        });

        // Admin Panels
        this.rpc.registerHandler('api:admin:registerPanel', (config: any) => {
            // We need to wrap the component to render it via RPC or some other mechanism?
            // Admin panels usually return React/JSX components. Passing them over RPC is impossible.
            // The plugin in the worker cannot return a component function that executes in the main thread.
            // This is a limitation of the worker approach.
            // For now, we might have to limit admin panels to returning HTML strings or data that the main thread can render.
            // Or, the "component" in config is just a placeholder, and the worker handles the rendering request?

            // If the component is a function, we can't pass it.
            // We'll assume the worker sends a config where 'component' is NOT a function but maybe a string ID or we wrap it.

            // Actually, `AnalyticsDashboardPlugin` passes `this.renderAnalyticsPanel.bind(this)`.
            // This function returns `html` string (Hono).
            // So we can proxy the component rendering!

            const proxyConfig = {
                ...config,
                component: async (context: any) => {
                    return await this.rpc.call('admin:renderPanel', config.id, context);
                }
            };

            this.api.registerAdminPanel(proxyConfig);
        });

        // Settings
        this.rpc.registerHandler('api:settings:update', (key: string, value: any) => {
            this.api.setSetting(key, value);
        });
    }

    /**
     * Load the plugin in the worker
     */
    async load(pluginPath: string): Promise<void> {
        const settings = this.api.getAllSettings();
        await this.rpc.call('load', pluginPath, this.manifest, settings);
    }

    /**
     * Activate the plugin
     */
    async activate(): Promise<void> {
        await this.rpc.call('activate');
    }

    /**
     * Deactivate the plugin
     */
    async deactivate(): Promise<void> {
        await this.rpc.call('deactivate');
    }

    /**
     * Terminate the worker
     */
    terminate() {
        this.worker.terminate();
    }
}
