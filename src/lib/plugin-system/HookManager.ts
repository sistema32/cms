import { HookCallback } from './types.ts';

export class HookManager {
    private actions: Map<string, { callback: string, priority: number, pluginName: string }[]> = new Map();
    private filters: Map<string, { callback: string, priority: number, pluginName: string }[]> = new Map();
    private pluginManager?: any; // Set after initialization to avoid circular dependency

    /**
     * Set the plugin manager reference for RPC execution
     */
    setPluginManager(manager: any) {
        this.pluginManager = manager;
    }

    /**
     * Register an action hook
     */
    registerAction(hook: string, callbackId: string, priority: number, pluginName: string) {
        if (!this.actions.has(hook)) {
            this.actions.set(hook, []);
        }
        this.actions.get(hook)!.push({ callback: callbackId, priority, pluginName });
        this.actions.get(hook)!.sort((a, b) => a.priority - b.priority);
        console.log(`[HookManager] Registered action ${hook} -> ${callbackId} (${pluginName})`);
    }

    /**
     * Register a filter hook
     */
    registerFilter(hook: string, callbackId: string, priority: number, pluginName: string) {
        if (!this.filters.has(hook)) {
            this.filters.set(hook, []);
        }
        this.filters.get(hook)!.push({ callback: callbackId, priority, pluginName });
        this.filters.get(hook)!.sort((a, b) => a.priority - b.priority);
        console.log(`[HookManager] Registered filter ${hook} -> ${callbackId} (${pluginName})`);
    }

    /**
     * Get all registered actions for a hook
     */
    getActions(hook: string) {
        return this.actions.get(hook) || [];
    }

    /**
     * Get all registered filters for a hook
     */
    getFilters(hook: string) {
        return this.filters.get(hook) || [];
    }

    /**
     * Execute all registered actions for a hook
     * Actions don't modify data, they just perform side effects
     */
    async doAction(hook: string, ...args: any[]) {
        const actions = this.getActions(hook);

        if (actions.length === 0) {
            return;
        }

        console.log(`[HookManager] Executing ${actions.length} action(s) for hook: ${hook}`);

        for (const action of actions) {
            try {
                if (!this.pluginManager) {
                    console.warn(`[HookManager] PluginManager not set, skipping action ${action.callback}`);
                    continue;
                }

                const worker = this.pluginManager.getWorker(action.pluginName);

                if (!worker) {
                    console.warn(`[HookManager] Worker not found for plugin ${action.pluginName}`);
                    continue;
                }

                await worker.executeRoute(action.callback, {
                    type: 'action',
                    hook,
                    args
                });

                console.log(`[HookManager] Executed action ${hook} -> ${action.callback} (${action.pluginName})`);
            } catch (e) {
                console.error(`[HookManager] Error executing action ${hook} -> ${action.callback}:`, e);
            }
        }
    }

    /**
     * Apply all registered filters for a hook
     * Filters modify and return the value, creating a chain
     */
    async applyFilters(hook: string, value: any, ...args: any[]): Promise<any> {
        const filters = this.getFilters(hook);

        if (filters.length === 0) {
            return value;
        }

        console.log(`[HookManager] Applying ${filters.length} filter(s) for hook: ${hook}`);

        let result = value;

        for (const filter of filters) {
            try {
                if (!this.pluginManager) {
                    console.warn(`[HookManager] PluginManager not set, skipping filter ${filter.callback}`);
                    continue;
                }

                const worker = this.pluginManager.getWorker(filter.pluginName);

                if (!worker) {
                    console.warn(`[HookManager] Worker not found for plugin ${filter.pluginName}`);
                    continue;
                }

                const response = await worker.executeRoute(filter.callback, {
                    type: 'filter',
                    hook,
                    value: result,
                    args
                });

                // Filter should return { value: modifiedValue }
                if (response && response.value !== undefined) {
                    result = response.value;
                    console.log(`[HookManager] Applied filter ${hook} -> ${filter.callback} (${filter.pluginName})`);
                } else {
                    console.warn(`[HookManager] Filter ${filter.callback} did not return a value, keeping original`);
                }
            } catch (e) {
                console.error(`[HookManager] Error applying filter ${hook} -> ${filter.callback}:`, e);
                // On error, keep the current value and continue
            }
        }

        return result;
    }

    /**
     * Remove all hooks for a specific plugin
     */
    removePluginHooks(pluginName: string) {
        // Remove actions
        for (const [hook, actions] of this.actions.entries()) {
            const filtered = actions.filter(a => a.pluginName !== pluginName);
            if (filtered.length === 0) {
                this.actions.delete(hook);
            } else {
                this.actions.set(hook, filtered);
            }
        }

        // Remove filters
        for (const [hook, filters] of this.filters.entries()) {
            const filtered = filters.filter(f => f.pluginName !== pluginName);
            if (filtered.length === 0) {
                this.filters.delete(hook);
            } else {
                this.filters.set(hook, filtered);
            }
        }

        console.log(`[HookManager] Removed all hooks for plugin: ${pluginName}`);
    }
}

export const hookManager = new HookManager();
