/**
 * Hook Manager
 * Manages action and filter hooks for the plugin system
 */

import type { HookCallback, HookRegistration, HookType } from './types.ts';

export class HookManager {
  private hooks: Map<string, HookRegistration[]> = new Map();

  /**
   * Add an action hook
   * Actions execute code at specific points without modifying data
   */
  addAction(
    hookName: string,
    callback: HookCallback,
    priority: number = 10,
    pluginName: string = 'core'
  ): void {
    this.addHook('action', hookName, callback, priority, pluginName);
  }

  /**
   * Add a filter hook
   * Filters modify data before it's used
   */
  addFilter(
    hookName: string,
    callback: HookCallback,
    priority: number = 10,
    pluginName: string = 'core'
  ): void {
    this.addHook('filter', hookName, callback, priority, pluginName);
  }

  /**
   * Remove an action hook
   */
  removeAction(hookName: string, callback: HookCallback): void {
    this.removeHook(hookName, callback);
  }

  /**
   * Remove a filter hook
   */
  removeFilter(hookName: string, callback: HookCallback): void {
    this.removeHook(hookName, callback);
  }

  /**
   * Execute action hooks
   * Runs all callbacks registered for this action
   */
  async doAction(hookName: string, ...args: any[]): Promise<void> {
    const hooks = this.getHooks(hookName);

    for (const hook of hooks) {
      try {
        await hook.callback(...args);
      } catch (error) {
        console.error(
          `Error in action hook "${hookName}" from plugin "${hook.pluginName}":`,
          error
        );
        // Continue executing other hooks even if one fails
      }
    }
  }

  /**
   * Apply filter hooks
   * Passes value through all registered filters
   */
  async applyFilters(hookName: string, value: any, ...args: any[]): Promise<any> {
    const hooks = this.getHooks(hookName);
    let filteredValue = value;

    for (const hook of hooks) {
      try {
        const result = await hook.callback(filteredValue, ...args);
        // Only update value if callback returned something
        if (result !== undefined) {
          filteredValue = result;
        }
      } catch (error) {
        console.error(
          `Error in filter hook "${hookName}" from plugin "${hook.pluginName}":`,
          error
        );
        // Continue with current value if filter fails
      }
    }

    return filteredValue;
  }

  /**
   * Check if a hook has any registered callbacks
   */
  hasHook(hookName: string): boolean {
    const hooks = this.hooks.get(hookName);
    return hooks !== undefined && hooks.length > 0;
  }

  /**
   * Get all hooks registered for a specific hook name
   */
  getHooks(hookName: string): HookRegistration[] {
    return this.hooks.get(hookName) || [];
  }

  /**
   * Get all registered hook names
   */
  getAllHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get hook count for a specific plugin
   */
  getPluginHookCount(pluginName: string): number {
    let count = 0;
    for (const hooks of this.hooks.values()) {
      count += hooks.filter(h => h.pluginName === pluginName).length;
    }
    return count;
  }

  /**
   * Remove all hooks from a specific plugin
   */
  removePluginHooks(pluginName: string): void {
    for (const [hookName, hooks] of this.hooks.entries()) {
      const filtered = hooks.filter(h => h.pluginName !== pluginName);
      if (filtered.length === 0) {
        this.hooks.delete(hookName);
      } else {
        this.hooks.set(hookName, filtered);
      }
    }
  }

  /**
   * Clear all hooks
   */
  clearAll(): void {
    this.hooks.clear();
  }

  /**
   * Get statistics about registered hooks
   */
  getStats() {
    const stats = {
      totalHooks: 0,
      hookNames: 0,
      byPlugin: new Map<string, number>(),
    };

    stats.hookNames = this.hooks.size;

    for (const hooks of this.hooks.values()) {
      stats.totalHooks += hooks.length;

      for (const hook of hooks) {
        const count = stats.byPlugin.get(hook.pluginName) || 0;
        stats.byPlugin.set(hook.pluginName, count + 1);
      }
    }

    return stats;
  }

  // Private methods

  private addHook(
    type: HookType,
    hookName: string,
    callback: HookCallback,
    priority: number,
    pluginName: string
  ): void {
    const registration: HookRegistration = {
      hookName,
      callback,
      priority,
      pluginName,
    };

    const existing = this.hooks.get(hookName) || [];
    existing.push(registration);

    // Sort by priority (lower number = higher priority, executed first)
    existing.sort((a, b) => a.priority - b.priority);

    this.hooks.set(hookName, existing);
  }

  private removeHook(hookName: string, callback: HookCallback): void {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return;

    const filtered = hooks.filter(h => h.callback !== callback);

    if (filtered.length === 0) {
      this.hooks.delete(hookName);
    } else {
      this.hooks.set(hookName, filtered);
    }
  }
}

// Singleton instance
export const hookManager = new HookManager();
