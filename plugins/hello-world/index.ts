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

    // Get plugin info using the correct API method
    const info = this.api.getPluginInfo();
    console.log(`   Plugin Name: ${info.name}`);
    console.log(`   Plugin Version: ${info.version}`);

    // Register a hook using addAction (not registerHook)
    this.api.addAction('content:beforeCreate', async (data: any) => {
      console.log('🎣 Hello World Plugin: content:beforeCreate hook triggered');
      console.log(`   Content Title: ${data.title}`);

      // You can modify the data here
      return data;
    }, 10); // priority parameter

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
