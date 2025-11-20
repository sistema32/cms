/**
 * Admin Panel Registry
 * Centralized registry for managing custom admin panels registered by plugins
 */

import type { AdminPanelConfig } from './types.ts';
import { env } from '../../config/env.ts';

interface RegisteredPanel extends AdminPanelConfig {
  pluginName: string;
  fullPath: string; // Full route path: /admin/plugins/:pluginName/:path
}

class AdminPanelRegistryClass {
  private panels: Map<string, RegisteredPanel[]> = new Map();

  /**
   * Register a new admin panel for a plugin
   */
  registerPanel(pluginName: string, config: AdminPanelConfig): void {
    const fullPath = `${env.ADMIN_PATH}/plugins/${pluginName}/${config.path}`;

    const panel: RegisteredPanel = {
      ...config,
      pluginName,
      fullPath,
    };

    if (!this.panels.has(pluginName)) {
      this.panels.set(pluginName, []);
    }

    const pluginPanels = this.panels.get(pluginName)!;

    // Check for duplicate panel IDs
    const existingPanel = pluginPanels.find((p) => p.id === config.id);
    if (existingPanel) {
      console.warn(`[AdminPanelRegistry] Panel with ID "${config.id}" already exists for plugin "${pluginName}". Replacing...`);
      this.unregisterPanel(pluginName, config.id);
    }

    pluginPanels.push(panel);

    console.log(`[AdminPanelRegistry] Registered panel: ${fullPath}`);
  }

  /**
   * Unregister a specific panel
   */
  unregisterPanel(pluginName: string, panelId: string): void {
    const pluginPanels = this.panels.get(pluginName);
    if (!pluginPanels) return;

    const index = pluginPanels.findIndex((p) => p.id === panelId);
    if (index !== -1) {
      const panel = pluginPanels[index];
      pluginPanels.splice(index, 1);
      console.log(`[AdminPanelRegistry] Unregistered panel: ${panel.fullPath}`);
    }

    // Clean up empty plugin entries
    if (pluginPanels.length === 0) {
      this.panels.delete(pluginName);
    }
  }

  /**
   * Unregister all panels for a plugin
   */
  unregisterAllPanels(pluginName: string): void {
    const count = this.panels.get(pluginName)?.length || 0;
    this.panels.delete(pluginName);
    console.log(`[AdminPanelRegistry] Unregistered ${count} panel(s) for plugin "${pluginName}"`);
  }

  /**
   * Get all panels for a specific plugin
   */
  getPanelsForPlugin(pluginName: string): RegisteredPanel[] {
    return this.panels.get(pluginName) || [];
  }

  /**
   * Get a specific panel by plugin and panel ID
   */
  getPanel(pluginName: string, panelId: string): RegisteredPanel | undefined {
    const pluginPanels = this.panels.get(pluginName);
    return pluginPanels?.find((p) => p.id === panelId);
  }

  /**
   * Get a panel by full path
   */
  getPanelByPath(path: string): RegisteredPanel | undefined {
    for (const pluginPanels of this.panels.values()) {
      const panel = pluginPanels.find((p) => p.fullPath === path);
      if (panel) return panel;
    }
    return undefined;
  }

  /**
   * Get all registered panels across all plugins
   */
  getAllPanels(): RegisteredPanel[] {
    const allPanels: RegisteredPanel[] = [];
    for (const pluginPanels of this.panels.values()) {
      allPanels.push(...pluginPanels);
    }
    // Sort by order
    return allPanels.sort((a, b) => (a.order ?? 10) - (b.order ?? 10));
  }

  /**
   * Get panels grouped by plugin
   */
  getPanelsByPlugin(): Map<string, RegisteredPanel[]> {
    return new Map(this.panels);
  }

  /**
   * Check if a panel exists
   */
  hasPanel(pluginName: string, panelId: string): boolean {
    return this.getPanel(pluginName, panelId) !== undefined;
  }

  /**
   * Get count of registered panels
   */
  getPanelCount(): number {
    let count = 0;
    for (const pluginPanels of this.panels.values()) {
      count += pluginPanels.length;
    }
    return count;
  }

  /**
   * Clear all registered panels (for testing)
   */
  clear(): void {
    this.panels.clear();
    console.log('[AdminPanelRegistry] All panels cleared');
  }
}

// Export singleton instance
export const AdminPanelRegistry = new AdminPanelRegistryClass();
