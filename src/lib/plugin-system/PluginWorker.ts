import { RPCServer } from './rpc/RPCServer.ts';
import { PluginInfo, PluginManifest } from './types.ts';
import { HostAPI } from './HostAPI.ts';
import { ResourceMonitor, ResourceLimits } from './ResourceMonitor.ts';
import { join } from 'node:path';

export class PluginWorker {
    private worker: Worker;
    private rpc: RPCServer;
    private manifest: PluginManifest;
    private api: HostAPI;
    private resourceMonitor: ResourceMonitor;

    constructor(manifest: PluginInfo) {
        this.manifest = manifest;
        this.api = new HostAPI(manifest.name);

        // Build permissions
        const permissions: Deno.PermissionOptions = {
            read: true, // Always allow read (code loading)
            hrtime: false,
            prompt: false,
        };

        if (manifest.permissions) {
            if (manifest.permissions.includes('network:external')) {
                permissions.net = true; // TODO: Can be more specific if manifest allows
            }
            if (manifest.permissions.includes('system:files')) {
                permissions.write = true; // TODO: Restrict to plugin dir?
            }
            if (manifest.permissions.includes('system:shell')) {
                permissions.run = true;
            }
            // system:env not directly mapped to boolean in strict types sometimes, but 'env' is valid
            if (manifest.permissions.includes('system:env')) {
                permissions.env = true;
            }
        }

        // Initialize Worker
        this.worker = new Worker(
            new URL('./worker/worker-entry.ts', import.meta.url).href,
            {
                type: 'module',
                deno: {
                    permissions
                }
            } as any
        );

        this.rpc = new RPCServer(this.worker);
        this.registerHandlers();

        // Initialize resource monitoring
        const limits: ResourceLimits = {
            maxMemoryMB: 100, // 100MB limit
            maxCpuTimeMs: 30000, // 30 seconds
            checkIntervalMs: 1000 // Check every second
        };

        this.resourceMonitor = new ResourceMonitor(limits);
        this.resourceMonitor.start(() => {
            console.error(`[PluginWorker] Resource limit exceeded for ${manifest.name}, terminating...`);
            this.terminate();
        });
    }

    private registerHandlers() {
        // Database
        this.rpc.registerHandler('api:database:query', async (sql: string, params?: any[]) => {
            return await this.api.query(sql, params);
        });

        this.rpc.registerHandler('api:database:operation', async (operation: string, collection: string, ...args: any[]) => {
            return await this.api.handleDatabaseOperation(operation, collection, ...args);
        });

        // Network
        this.rpc.registerHandler('api:network:fetch', async (url: string, options?: any) => {
            const response = await this.api.fetch(url, options);
            const body = await response.text();
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            return {
                status: response.status,
                statusText: response.statusText,
                headers,
                body
            };
        });

        // Logger
        this.rpc.registerHandler('api:logger:info', (msg: string) => this.api.log(msg, 'info'));
        this.rpc.registerHandler('api:logger:warn', (msg: string) => this.api.log(msg, 'warn'));
        this.rpc.registerHandler('api:logger:error', (msg: string) => this.api.log(msg, 'error'));

        // Routes
        this.rpc.registerHandler('api:routes:register', (method: string, path: string, handlerId: string) => {
            this.api.registerRoute(method, path, handlerId);
        });

        // Admin
        this.rpc.registerHandler('api:admin:registerPanel', (config: any) => {
            this.api.registerAdminPanel(config);
        });

        // Hooks
        this.rpc.registerHandler('api:hooks:registerAction', (hook: string, callbackId: string, priority: number) => {
            this.api.registerAction(hook, callbackId, priority);
        });

        this.rpc.registerHandler('api:hooks:registerFilter', (hook: string, callbackId: string, priority: number) => {
            this.api.registerFilter(hook, callbackId, priority);
        });

        // Resource monitoring - receive memory reports from worker
        this.rpc.registerHandler('resource:memory', (data: { heapUsed: number; heapTotal: number }) => {
            this.resourceMonitor.updateMemoryUsage(data.heapUsed, data.heapTotal);
        });
    }

    async load(pluginPath: string) {
        await this.rpc.call('load', pluginPath, this.manifest, {});
    }

    async activate() {
        await this.rpc.call('activate');
    }

    async deactivate() {
        await this.rpc.call('deactivate');
    }

    async executeRoute(handlerId: string, request: any) {
        return await this.rpc.call('api:routes:execute', handlerId, request);
    }

    terminate() {
        this.resourceMonitor.stop();
        this.worker.terminate();
    }
}
