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
}

export const hookManager = new HookManager();
