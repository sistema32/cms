/**
 * Auto-Moderation Plugin Entry Point
 * Adapts the existing AutoModerationPlugin to the PluginClass interface
 */

import type { PluginClass } from '../../src/lib/plugin-system/types.ts';
import type { PluginAPI } from '../../src/lib/plugin-system/PluginAPI.ts';
import { initAutoModeration, getAutoModeration } from './index.ts';

export default class AutoModerationPluginAdapter implements PluginClass {
    private api: PluginAPI;
    private plugin: any;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    async onActivate(): Promise<void> {
        this.api.log('Activating Auto-Moderation Plugin...', 'info');

        // Load config from settings
        const config = {
            enabled: this.api.getSetting('enabled', true),
            strategy: this.api.getSetting('strategy', 'local-only'),
            // Map other settings as needed
        };

        // Initialize the original plugin
        this.plugin = initAutoModeration(config);

        // Register hooks
        this.api.addFilter('comment:create', async (data: any) => {
            this.api.log('Checking comment for spam...', 'info');
            const result = await this.plugin.checkComment(data);

            if (result.action === 'spam') {
                throw new Error('Comment rejected as spam');
            }

            if (result.action === 'moderate') {
                data.status = 'pending';
            }

            return data;
        });

        this.api.log('Auto-Moderation Plugin activated', 'info');
    }

    async onDeactivate(): Promise<void> {
        this.api.log('Deactivating Auto-Moderation Plugin...', 'info');
        // Cleanup if needed
    }

    async onSettingsUpdate(settings: any): Promise<void> {
        if (this.plugin) {
            this.plugin.updateConfig(settings);
        }
    }
}
