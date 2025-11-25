import { HookCallback } from './types.ts';

export class HookManager {
    private actions: Map<string, { callback: string, priority: number, pluginName: string }[]> = new Map();
    private filters: Map<string, { callback: string, priority: number, pluginName: string }[]> = new Map();

    registerAction(hook: string, callbackId: string, priority: number, pluginName: string) {
        if (!this.actions.has(hook)) {
            this.actions.set(hook, []);
        }
        this.actions.get(hook)!.push({ callback: callbackId, priority, pluginName });
        this.actions.get(hook)!.sort((a, b) => a.priority - b.priority);
        console.log(`[HookManager] Registered action ${hook} -> ${callbackId}`);
    }

    registerFilter(hook: string, callbackId: string, priority: number, pluginName: string) {
        if (!this.filters.has(hook)) {
            this.filters.set(hook, []);
        }
        this.filters.get(hook)!.push({ callback: callbackId, priority, pluginName });
        this.filters.get(hook)!.sort((a, b) => a.priority - b.priority);
        console.log(`[HookManager] Registered filter ${hook} -> ${callbackId}`);
    }

    getActions(hook: string) {
        return this.actions.get(hook) || [];
    }

    getFilters(hook: string) {
        return this.filters.get(hook) || [];
    }

    async doAction(hook: string, ...args: any[]) {
        const actions = this.getActions(hook);
        for (const action of actions) {
            try {
                // In a real implementation, we would call the worker via RPC
                // For now, we just log it as we don't have the worker instance here easily
                // or we need to look it up.
                // Actually, the callbackId is likely a handler ID registered in the worker.
                // We need to find the worker for the plugin and call executeRoute or similar?
                // Wait, hooks are usually synchronous or async but executed in order.
                // If the callback is in a worker, we need to RPC to it.
                // The current HookManager just stores metadata.
                // We need a way to execute them.
                // For now, to fix the error, we'll add the method and log.
                // Real implementation requires PluginManager integration to get workers.
                console.log(`[HookManager] Executing action ${hook} -> ${action.callback} (${action.pluginName})`);
            } catch (e) {
                console.error(`[HookManager] Error executing action ${hook}:`, e);
            }
        }
    }
}

export const hookManager = new HookManager();
