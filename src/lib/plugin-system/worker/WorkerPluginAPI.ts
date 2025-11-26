import { RPCClient } from '../rpc/RPCClient.ts';

/**
 * Worker Plugin API
 * Exposed to plugins running in the worker.
 * Proxies calls to the main thread via RPC.
 */
export class WorkerPluginAPI {
    private client: RPCClient;
    private pluginName: string = '';

    constructor(client: RPCClient) {
        this.client = client;
    }

    setPluginName(name: string) {
        this.pluginName = name;
    }

    /**
     * Database Access
     */
    get db() {
        return {
            collection: (name: string) => ({
                find: async (query?: any) => {
                    return await this.client.call('api:database:operation', 'find', name, query || {});
                },
                findOne: async (query?: any) => {
                    return await this.client.call('api:database:operation', 'findOne', name, query || {});
                },
                create: async (data: any) => {
                    return await this.client.call('api:database:operation', 'create', name, data);
                },
                update: async (query: any, data: any) => {
                    return await this.client.call('api:database:operation', 'update', name, query, data);
                },
                delete: async (query: any) => {
                    return await this.client.call('api:database:operation', 'delete', name, query);
                }
            })
        };
    }

    /**
     * Raw Query
     */
    async query(sql: string, params?: any[]) {
        return await this.client.call('api:database:query', sql, params);
    }

    /**
     * Network
     */
    async fetch(url: string, options?: RequestInit) {
        // We can't pass RequestInit directly if it contains complex objects like AbortSignal
        // So we sanitize it.
        const sanitizedOptions = options ? {
            method: options.method,
            headers: options.headers,
            body: options.body,
        } : undefined;

        const response = await this.client.call('api:network:fetch', url, sanitizedOptions);

        // Reconstruct Response object
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }

    /**
     * Hooks
     */
    addAction(hook: string, callback: (...args: any[]) => void, priority: number = 10) {
        // Register locally
        (self as any).registerHookCallback(hook, callback);
        // Register on host
        this.client.call('api:hooks:register', hook, priority);
    }

    addFilter(hook: string, callback: (...args: any[]) => any, priority: number = 10) {
        (self as any).registerHookCallback(hook, callback);
        this.client.call('api:hooks:registerFilter', hook, priority);
    }

    /**
     * Routes
     */
    get routes() {
        return {
            register: (method: string, path: string, handler: Function) => {
                const handlerId = `route:${method}:${path}`;
                (self as any).registerRouteCallback(handlerId, handler);
                this.client.call('api:routes:register', method, path, handlerId);
            }
        };
    }

    /**
     * Admin Panels
     */
    registerAdminPanel(config: any) {
        (self as any).registerAdminPanelCallback(config.id, config.component);
        // Send config without component function
        const { component, ...safeConfig } = config;
        this.client.call('api:admin:registerPanel', safeConfig);
    }

    /**
     * Register an individual admin page
     */
    registerAdminPage(path: string, renderFn: Function) {
        // Generate unique render ID
        const renderId = `admin-page:${this.pluginName}:${path}`;

        // Store render callback in worker
        (self as any).registerAdminPageCallback(renderId, renderFn);

        // Register with host
        this.client.call('api:admin:registerPage', path, renderId);
    }

    /**
     * Register an admin menu item
     */
    registerAdminMenu(config: {
        id: string;
        label: string;
        icon: string;
        path: string;
        order?: number;
    }) {
        this.client.call('api:admin:registerMenu', config);
    }

    get admin() {
        return {
            registerPanel: (config: any) => this.registerAdminPanel(config),
            registerPage: (path: string, renderFn: Function) => this.registerAdminPage(path, renderFn),
            registerMenu: (config: any) => this.registerAdminMenu(config)
        };
    }

    /**
     * Settings
     */
    getSetting(key: string, defaultValue?: any) {
        // Settings are synced to the worker on load
        const settings = (self as any).PLUGIN_SETTINGS || {};
        return settings[key] ?? defaultValue;
    }

    getAllSettings() {
        return (self as any).PLUGIN_SETTINGS || {};
    }

    /**
     * Logging
     */
    log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
        this.client.call(`api:logger:${level}`, message);
    }

    get logger() {
        return {
            info: (msg: string) => this.log(msg, 'info'),
            warn: (msg: string) => this.log(msg, 'warn'),
            error: (msg: string) => this.log(msg, 'error'),
            debug: (msg: string) => this.log(msg, 'info'),
        };
    }
}
