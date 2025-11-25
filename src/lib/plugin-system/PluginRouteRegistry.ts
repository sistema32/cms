import { PluginRoute } from './types.ts';

export class PluginRouteRegistry {
    private routes: Map<string, PluginRoute> = new Map();

    register(pluginName: string, method: string, path: string, handlerId: string) {
        const key = `${pluginName}:${method}:${path}`;
        this.routes.set(key, {
            method,
            path,
            handler: handlerId,
            pluginName
        });
        console.log(`[PluginRouteRegistry] Registered ${method} ${path} -> ${handlerId}`);
    }

    matchRoute(pluginName: string, method: string, path: string): PluginRoute | undefined {
        // Try exact match first
        const exactKey = `${pluginName}:${method}:${path}`;
        const exactMatch = this.routes.get(exactKey);
        if (exactMatch) {
            return exactMatch;
        }

        // Try pattern matching for routes with parameters
        for (const route of this.routes.values()) {
            if (route.pluginName !== pluginName || route.method !== method) {
                continue;
            }

            // Convert route pattern to regex
            // /sliders/:id -> /sliders/([^/]+)
            const pattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
            const regex = new RegExp(`^${pattern}$`);

            if (regex.test(path)) {
                return route;
            }
        }

        return undefined;
    }

    getAllRoutes(): PluginRoute[] {
        return Array.from(this.routes.values());
    }

    clear() {
        this.routes.clear();
    }
}

export const pluginRouteRegistry = new PluginRouteRegistry();
