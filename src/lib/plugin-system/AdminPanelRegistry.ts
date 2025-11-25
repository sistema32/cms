import { AdminPanelConfig } from './types.ts';

export class AdminPanelRegistry {
    private panels: Map<string, AdminPanelConfig> = new Map();

    register(config: AdminPanelConfig) {
        this.panels.set(config.id, config);
        console.log(`[AdminPanelRegistry] Registered panel: ${config.id}`);
    }

    getAll(): AdminPanelConfig[] {
        return Array.from(this.panels.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    get(id: string): AdminPanelConfig | undefined {
        return this.panels.get(id);
    }
}

export const adminPanelRegistry = new AdminPanelRegistry();
