import { pluginManager } from './PluginManager.ts';
import { adminPanelRegistry } from './AdminPanelRegistry.ts';
import { pluginRouteRegistry } from './PluginRouteRegistry.ts';

export {
    pluginManager,
    adminPanelRegistry,
    pluginRouteRegistry
};

export const pluginLoader = pluginManager.loader;
