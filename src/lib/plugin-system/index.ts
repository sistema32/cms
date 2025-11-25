import { pluginManager } from './PluginManager.ts';
import { hookManager } from './HookManager.ts';
import { adminPanelRegistry } from './AdminPanelRegistry.ts';
import { pluginRouteRegistry } from './PluginRouteRegistry.ts';

export {
    pluginManager,
    hookManager,
    adminPanelRegistry,
    pluginRouteRegistry
};

export const pluginLoader = pluginManager.loader;
