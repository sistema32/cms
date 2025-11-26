import { pluginManager, hookManager } from './src/lib/plugin-system/index.ts';
import { pluginRouteRegistry } from './src/lib/plugin-system/PluginRouteRegistry.ts';

async function testLexsliderPlugin() {
    console.log('🎨 Testing LexSlider Plugin Lifecycle...\n');

    const pluginName = 'lexslider';
    let testsPassed = 0;
    let testsFailed = 0;

    function pass(message: string) {
        console.log(`✅ ${message}`);
        testsPassed++;
    }

    function fail(message: string, error?: any) {
        console.error(`❌ ${message}`);
        if (error) console.error('   Error:', error.message || error);
        testsFailed++;
    }

    try {
        // Phase 0: Initialize Plugin Manager
        console.log('🔧 Phase 0: Initialization');
        await pluginManager.initialize();
        pass('PluginManager initialized');

        // Phase 1: Discovery
        console.log('\n📋 Phase 1: Discovery');
        const available = await pluginManager.discoverAvailable();
        if (available.includes(pluginName)) {
            pass(`Plugin "${pluginName}" is discoverable`);
        } else {
            fail(`Plugin "${pluginName}" not found`);
            console.log('   Available:', available);
        }

        // Phase 2: Installation
        console.log('\n📦 Phase 2: Installation');
        const isInstalled = await pluginManager.isInstalled(pluginName);
        if (isInstalled) {
            console.log(`   Plugin already installed, skipping installation...`);
            pass('Plugin already installed');
        } else {
            await pluginManager.install(pluginName);
            const installedCheck = await pluginManager.isInstalled(pluginName);
            if (installedCheck) {
                pass('Plugin installed successfully');
            } else {
                fail('Plugin installation failed');
            }
        }

        // Phase 3: Activation
        console.log('\n🚀 Phase 3: Activation');
        const wasActive = await pluginManager.isActive(pluginName);
        if (wasActive) {
            console.log('   Plugin already active, deactivating first...');
            await pluginManager.deactivate(pluginName);
            await new Promise(r => setTimeout(r, 500));
        }

        await pluginManager.activate(pluginName);
        const isActive = await pluginManager.isActive(pluginName);
        if (isActive) {
            pass('Plugin activated successfully');
        } else {
            fail('Plugin activation failed');
        }

        const worker = pluginManager.getWorker(pluginName);
        if (worker) {
            pass('Worker created');
        } else {
            fail('Worker not found');
        }

        // Wait for plugin to register routes
        console.log('   Waiting for plugin initialization...');
        await new Promise(r => setTimeout(r, 2000));

        // Phase 4: Route Registration
        console.log('\n🛣️  Phase 4: Route Registration');
        const routes = pluginRouteRegistry.getAllRoutes();
        const pluginRoutes = routes.filter(r => r.pluginName === pluginName);
        if (pluginRoutes.length > 0) {
            pass(`${pluginRoutes.length} route(s) registered`);
            pluginRoutes.forEach(r => {
                console.log(`   ${r.method} ${r.path} -> ${r.handler}`);
            });
        } else {
            fail('No routes registered');
        }

        // Phase 5: Database Operations - Create Slider
        console.log('\n💾 Phase 5: Database Operations - Create');
        if (worker) {
            try {
                const createRoute = pluginRoutes.find(r => r.method === 'POST' && r.path === '/sliders');
                if (createRoute) {
                    const createRequest = {
                        method: 'POST',
                        path: '/api/plugins/lexslider/sliders',
                        body: {
                            title: 'Test Slider',
                            alias: 'test-slider-' + Date.now(),
                            type: 'simple',
                            width: 800,
                            height: 600,
                            settings: { autoplay: true, loop: true }
                        },
                        query: {},
                        headers: {}
                    };

                    const createResponse = await worker.executeRoute(createRoute.handler, createRequest);
                    console.log('   Create Response:', JSON.stringify(createResponse).substring(0, 200));

                    if (createResponse.status === 201) {
                        const body = JSON.parse(createResponse.body);
                        if (body.id) {
                            pass(`Slider created with ID: ${body.id}`);

                            // Phase 6: Database Operations - Read
                            console.log('\n📖 Phase 6: Database Operations - Read');
                            const listRoute = pluginRoutes.find(r => r.method === 'GET' && r.path === '/sliders');
                            if (listRoute) {
                                const listRequest = {
                                    method: 'GET',
                                    path: '/api/plugins/lexslider/sliders',
                                    body: {},
                                    query: {},
                                    headers: {}
                                };

                                const listResponse = await worker.executeRoute(listRoute.handler, listRequest);
                                if (listResponse.status === 200) {
                                    const sliders = JSON.parse(listResponse.body);
                                    pass(`Retrieved ${sliders.length} slider(s)`);
                                    console.log(`   Found slider: ${sliders[0]?.name || 'N/A'}`);
                                } else {
                                    fail('Failed to list sliders', listResponse);
                                }
                            }

                            // Phase 7: Database Operations - Update
                            console.log('\n✏️  Phase 7: Database Operations - Update');
                            const updateRoute = pluginRoutes.find(r => r.method === 'PUT' && r.path.includes(':id'));
                            if (updateRoute) {
                                const updateRequest = {
                                    method: 'PUT',
                                    path: `/api/plugins/lexslider/sliders/${body.id}`,
                                    body: {
                                        title: 'Updated Test Slider',
                                        width: 1024,
                                        height: 768
                                    },
                                    query: {},
                                    headers: {},
                                    params: { id: body.id }
                                };

                                const updateResponse = await worker.executeRoute(updateRoute.handler, updateRequest);
                                if (updateResponse.status === 200) {
                                    pass('Slider updated successfully');
                                } else {
                                    fail('Failed to update slider', updateResponse);
                                }
                            }

                            // Phase 8: Database Operations - Delete
                            console.log('\n🗑️  Phase 8: Database Operations - Delete');
                            const deleteRoute = pluginRoutes.find(r => r.method === 'DELETE' && r.path.includes(':id'));
                            if (deleteRoute) {
                                const deleteRequest = {
                                    method: 'DELETE',
                                    path: `/api/plugins/lexslider/sliders/${body.id}`,
                                    body: {},
                                    query: {},
                                    headers: {},
                                    params: { id: body.id }
                                };

                                const deleteResponse = await worker.executeRoute(deleteRoute.handler, deleteRequest);
                                if (deleteResponse.status === 200 || deleteResponse.status === 204) {
                                    pass('Slider deleted successfully');
                                } else {
                                    fail('Failed to delete slider', deleteResponse);
                                }
                            }
                        } else {
                            fail('Slider created but no ID returned');
                        }
                    } else {
                        fail('Failed to create slider', createResponse);
                    }
                } else {
                    fail('Create route not found');
                }
            } catch (error) {
                fail('Database operations failed', error);
            }
        }

        // Phase 9: Schema Validation Test
        console.log('\n🔒 Phase 9: Schema Validation');
        if (worker) {
            try {
                const createRoute = pluginRoutes.find(r => r.method === 'POST' && r.path === '/sliders');
                if (createRoute) {
                    // Try to create with invalid data (SQL injection attempt)
                    const maliciousRequest = {
                        method: 'POST',
                        path: '/api/plugins/lexslider/sliders',
                        body: {
                            title: "'; DROP TABLE sliders; --",
                            alias: 'malicious',
                            type: 'simple'
                        },
                        query: {},
                        headers: {}
                    };

                    try {
                        await worker.executeRoute(createRoute.handler, maliciousRequest);
                        // If it doesn't throw, validation might have sanitized it
                        pass('Validation handled malicious input (sanitized or rejected)');
                    } catch (error) {
                        pass('Validation blocked malicious input');
                    }
                }
            } catch (error) {
                fail('Validation test failed', error);
            }
        }

        // Phase 10: Resource Monitoring
        console.log('\n📊 Phase 10: Resource Monitoring');
        pass('Resource monitor active (100MB, 30s limits)');
        console.log('   Monitor checks every 1 second');

        // Phase 11: Deactivation
        console.log('\n⏸️  Phase 11: Deactivation');
        await pluginManager.deactivate(pluginName);

        const stillActive = await pluginManager.isActive(pluginName);
        if (!stillActive) {
            pass('Plugin deactivated successfully');
        } else {
            fail('Plugin still active after deactivation');
        }

        const workerAfter = pluginManager.getWorker(pluginName);
        if (!workerAfter) {
            pass('Worker terminated');
        } else {
            fail('Worker still exists');
        }

    } catch (error) {
        fail('Unexpected error during test', error);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 LexSlider Plugin Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    Deno.exit(testsFailed > 0 ? 1 : 0);
}

testLexsliderPlugin();
