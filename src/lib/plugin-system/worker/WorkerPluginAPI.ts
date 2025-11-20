import { RPCClient } from '../rpc/RPCClient.ts';
import type { PluginAPIContext } from '../types.ts';

/**
 * Worker Plugin API
 * Proxies API calls from the worker to the main thread via RPC
 */
export class WorkerPluginAPI {
    private client: RPCClient;

    constructor(client: RPCClient) {
        this.client = client;
    }

    /**
     * Database Query
     */
    async query(sql: string, params?: any[]): Promise<any> {
        return this.client.call('api:database:query', sql, params);
    }

    /**
     * Logger
     */
    log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        this.client.call(`api:logger:${level}`, message, []);
    }

    /**
     * Register an action hook
     */
    addAction(hook: string, callback: (...args: any[]) => void, priority?: number): void {
        this.client.call('api:hooks:register', hook, priority);
        (self as any).registerHookCallback(hook, callback);
    }

    /**
     * Get plugin info
     * Note: This requires the manifest to be available in the worker.
     * We should pass it during initialization.
     */
    getPluginInfo(): any {
        // This is a synchronous method in PluginAPI.
        // We need to have this data available locally.
        // For now, return a placeholder or throw if not initialized.
        return (self as any).PLUGIN_MANIFEST || {};
    }

    /**
     * Add a filter hook
     */
    addFilter(hook: string, callback: (...args: any[]) => any, priority?: number): void {
        this.client.call('api:hooks:registerFilter', hook, priority);
        (self as any).registerHookCallback(hook, callback);
    }

    /**
     * Get a setting
     */
    getSetting(key: string, defaultValue?: any): any {
        const settings = (self as any).PLUGIN_SETTINGS || {};
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * Set a setting
     */
    setSetting(key: string, value: any): void {
        const settings = (self as any).PLUGIN_SETTINGS || {};
        settings[key] = value;
        (self as any).PLUGIN_SETTINGS = settings;
        this.client.call('api:settings:update', key, value);
    }

    /**
     * Get all settings
     */
    getAllSettings(): Record<string, any> {
        return { ...((self as any).PLUGIN_SETTINGS || {}) };
    }

    /**
     * Register an admin panel
     */
    registerAdminPanel(config: any): void {
        // We need to register the component callback locally
        (self as any).registerAdminPanelCallback(config.id, config.component);

        // Send config to main thread (without the component function)
        const { component, ...safeConfig } = config;
        this.client.call('api:admin:registerPanel', safeConfig);
    }

    removeAction(hook: string, callback: any): void {
        // TODO: Implement removeAction
    }

    removeFilter(hook: string, callback: any): void {
        // TODO: Implement removeFilter
    }
}
