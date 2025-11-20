
import { pluginLoader } from './src/lib/plugin-system/PluginLoader.ts';
import { hookManager } from './src/lib/plugin-system/HookManager.ts';

async function test() {
    console.log('🚀 Starting Plugin Worker Test');

    try {
        // Discover plugins
        console.log('🔍 Discovering plugins...');
        const plugins = await pluginLoader.discoverPlugins();
        console.log('Found plugins:', plugins);

        if (!plugins.includes('hello-world')) {
            console.error('❌ hello-world plugin not found');
            return;
        }

        // Load hello-world
        console.log('📦 Loading hello-world...');
        const plugin = await pluginLoader.loadPlugin('hello-world');
        console.log('✅ Loaded:', plugin.name, plugin.version);

        // Activate hello-world
        console.log('▶️ Activating hello-world...');
        await pluginLoader.activatePlugin('hello-world');
        console.log('✅ Activated');

        // Trigger a hook to see if it works
        console.log('🪝 Triggering content:beforeCreate hook...');
        await hookManager.doAction('content:beforeCreate', { title: 'Test Content' });
        console.log('✅ Hook triggered');

        // Deactivate
        console.log('⏹️ Deactivating hello-world...');
        await pluginLoader.deactivatePlugin('hello-world');
        console.log('✅ Deactivated');

        // Unload
        console.log('🗑️ Unloading hello-world...');
        pluginLoader.unloadPlugin('hello-world');
        console.log('✅ Unloaded');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

test();
