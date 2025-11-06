/**
 * Hello World Plugin
 * A simple example plugin for LexCMS
 */

import type { PluginAPI } from '../../src/lib/plugin-system/PluginAPI.ts';

export default class HelloWorldPlugin {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
    console.log('👋 Hello World Plugin constructor called');
  }

  /**
   * Called when plugin is activated
   */
  async onActivate() {
    console.log('✅ Hello World Plugin activated!');
    console.log(`   Plugin Name: ${this.api.getPluginName()}`);
    console.log(`   Plugin Version: ${this.api.getManifest().version}`);

    // Register a hook
    await this.api.registerHook('content:beforeCreate', async (data: any) => {
      console.log('🎣 Hello World Plugin: content:beforeCreate hook triggered');
      console.log(`   Content Title: ${data.title}`);

      // You can modify the data here
      return data;
    });

    console.log('🎣 Registered hook: content:beforeCreate');
  }

  /**
   * Called when plugin is deactivated
   */
  async onDeactivate() {
    console.log('👋 Hello World Plugin deactivated');
  }

  /**
   * Called when settings are updated
   */
  async onSettingsUpdate(settings: Record<string, any>) {
    console.log('⚙️  Hello World Plugin: Settings updated', settings);
  }
}
