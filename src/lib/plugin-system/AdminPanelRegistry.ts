import { AdminPanelConfig } from './types.ts';

/**
 * Admin Page - Individual page within a plugin's admin area
 */
export interface AdminPage {
    pluginName: string;
    path: string;
    renderId: string; // RPC callback ID for rendering
}

/**
 * Admin Menu Item - Menu entry in the admin sidebar
 */
export interface AdminMenuItem {
    pluginName: string;
    id: string;
    label: string;
    icon: string;
    path: string;
    order: number;
}

export class AdminPanelRegistry {
    private panels: Map<string, AdminPanelConfig> = new Map();
    private pages: Map<string, AdminPage> = new Map();
    private menus: Map<string, AdminMenuItem> = new Map();

    /**
     * Register a complete admin panel (legacy support)
     */
    register(config: AdminPanelConfig) {
        this.panels.set(config.id, config);
        console.log(`[AdminPanelRegistry] Registered panel: ${config.id}`);
    }

    /**
     * Register an individual admin page
     */
    registerPage(page: AdminPage) {
        this.pages.set(page.path, page);
        console.log(`[AdminPanelRegistry] Registered page: ${page.path} (${page.pluginName})`);
    }

    /**
     * Register an admin menu item
     */
    registerMenu(menu: AdminMenuItem) {
        this.menus.set(menu.id, menu);
        console.log(`[AdminPanelRegistry] Registered menu: ${menu.id} (${menu.pluginName})`);
    }

    /**
     * Get all panels (legacy)
     */
    getAll(): AdminPanelConfig[] {
        return Array.from(this.panels.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    /**
     * Get panel by ID (legacy)
     */
    get(id: string): AdminPanelConfig | undefined {
        return this.panels.get(id);
    }

    /**
     * Get page by path
     */
    getPage(path: string): AdminPage | undefined {
        return this.pages.get(path);
    }

    /**
     * Get all pages for a plugin
     */
    getPluginPages(pluginName: string): AdminPage[] {
        return Array.from(this.pages.values()).filter(p => p.pluginName === pluginName);
    }

    /**
     * Get all menu items, sorted by order
     */
    getAllMenus(): AdminMenuItem[] {
        return Array.from(this.menus.values()).sort((a, b) => a.order - b.order);
    }

    /**
     * Get menu items for a plugin
     */
    getPluginMenus(pluginName: string): AdminMenuItem[] {
        return Array.from(this.menus.values()).filter(m => m.pluginName === pluginName);
    }

    /**
     * Remove all registrations for a plugin
     */
    removePlugin(pluginName: string) {
        // Remove panels
        const panelsToRemove: string[] = [];
        for (const [id, panel] of this.panels.entries()) {
            if (panel.id.startsWith(pluginName)) {
                panelsToRemove.push(id);
            }
        }
        panelsToRemove.forEach(id => this.panels.delete(id));

        // Remove pages
        const pagesToRemove: string[] = [];
        for (const [path, page] of this.pages.entries()) {
            if (page.pluginName === pluginName) {
                pagesToRemove.push(path);
            }
        }
        pagesToRemove.forEach(path => this.pages.delete(path));

        // Remove menus
        const menusToRemove: string[] = [];
        for (const [id, menu] of this.menus.entries()) {
            if (menu.pluginName === pluginName) {
                menusToRemove.push(id);
            }
        }
        menusToRemove.forEach(id => this.menus.delete(id));

        console.log(`[AdminPanelRegistry] Removed ${panelsToRemove.length} panels, ${pagesToRemove.length} pages, and ${menusToRemove.length} menus for ${pluginName}`);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalPanels: this.panels.size,
            totalPages: this.pages.size,
            totalMenus: this.menus.size
        };
    }
}

export const adminPanelRegistry = new AdminPanelRegistry();
