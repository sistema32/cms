
import { pluginManager } from './src/lib/plugin-system/index.ts';
import { pluginRouteRegistry } from './src/lib/plugin-system/PluginRouteRegistry.ts';

async function test() {
    console.log('🧪 Testing Plugin System Rebuild...');

    const pluginName = 'lexslider';

    try {
        // 1. Install
        console.log(`\n1. Installing ${pluginName}...`);
        await pluginManager.install(pluginName, { activate: false });
        console.log('✅ Installed');

        // 2. Activate
        console.log(`\n2. Activating ${pluginName}...`);
        await pluginManager.activate(pluginName);
        console.log('✅ Activated');

        // 3. Check Routes
        console.log('\n3. Checking Routes...');
        // Wait a bit for worker to register routes
        await new Promise(r => setTimeout(r, 1000));

        const routes = pluginRouteRegistry.getAllRoutes();
        console.log(`Found ${routes.length} routes registered.`);
        if (routes.length === 0) {
            console.error('❌ No routes registered!');
            Deno.exit(1);
        }

        const createRoute = routes.find(r => r.method === 'POST' && r.path === '/sliders');
        if (!createRoute) {
            console.error('❌ Create slider route not found!');
            Deno.exit(1);
        }
        console.log('✅ Create slider route found:', createRoute.handler);

        // 4. Execute Route
        console.log('\n4. Executing Route (Create Slider)...');
        const worker = pluginManager.getWorker(pluginName);
        if (!worker) {
            console.error('❌ Worker not found!');
            Deno.exit(1);
        }

        const request = {
            method: 'POST',
            path: '/api/plugins/lexslider/sliders',
            body: {
                name: 'Test Slider',
                alias: 'test-slider',
                config: { width: 100, height: 100 }
            }
        };

        const response = await worker.executeRoute(createRoute.handler, request);
        console.log('Response:', response);

        if (response.status === 201) {
            const body = JSON.parse(response.body);
            if (body.id) {
                console.log('✅ Slider created with ID:', body.id);
            } else {
                console.error('❌ Slider created but no ID returned:', body);
            }
        } else {
            console.error('❌ Failed to create slider:', response);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        console.log('\nCleaning up...');
        await pluginManager.deactivate(pluginName);
        Deno.exit(0);
    }
}

test();
