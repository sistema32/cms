export interface PluginManifest {
    name: string;
    version: string;
    displayName: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    compatibility?: {
        lexcms?: string;
        deno?: string;
    };
    dependencies?: Record<string, string>;
    permissions: PluginPermission[];
    hooks?: string[];
    settings?: {
        schema?: string;
        component?: string;
    };
    category?: string;
    tags?: string[];
}

export type PluginPermission =
    | 'content:read' | 'content:write' | 'content:delete'
    | 'media:read' | 'media:write' | 'media:delete'
    | 'users:read' | 'users:write'
    | 'settings:read' | 'settings:write'
    | 'network:external'
    | 'database:read' | 'database:write'
    | 'system:shell' | 'system:files'
    | 'admin:menu'; // Added admin:menu

export interface Plugin {
    api: any; // PluginAPI
    onActivate(): Promise<void>;
    onDeactivate(): Promise<void>;
    onSettingsUpdate?(settings: any): Promise<void>;
    onInit?(): Promise<void>;
}

export interface AdminPanelConfig {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    path: string;
    component: (context: any) => Promise<string | any>; // Returns HTML string or Preact component
    requiredPermissions?: PluginPermission[];
    order?: number;
    showInMenu?: boolean;
}

export interface HookCallback {
    (...args: any[]): Promise<any> | any;
}

export interface PluginRoute {
    method: string;
    path: string;
    handler: string; // Handler ID
    pluginName: string;
}
