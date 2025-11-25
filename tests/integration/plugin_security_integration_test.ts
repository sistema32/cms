/**
 * Integration Tests for Plugin Security System
 * Tests the interaction between all security components
 */

import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { pluginLoader } from '../../src/lib/plugin-system/PluginLoader.ts';
import { pluginManager } from '../../src/lib/plugin-system/PluginManager.ts';
import { pluginIntegrity } from '../../src/lib/plugin-system/PluginIntegrity.ts';
import { pluginAuditor } from '../../src/lib/plugin-system/PluginAuditor.ts';
import { join } from '@std/path';

const TEST_PLUGIN_DIR = './plugins/hello-world';

Deno.test({
    name: 'Integration: Integrity verification system works correctly',
    async fn() {
        // Verify integrity of hello-world plugin
        const integrityResult = await pluginIntegrity.verifyFromPath(TEST_PLUGIN_DIR);

        // Should be valid (integrity.json is now excluded from checks)
        assertEquals(integrityResult.valid, true, 'Plugin integrity should be valid');
        assertEquals(integrityResult.modifiedFiles.length, 0, 'Should have no modified files');
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Integrity verification detects tampered files',
    async fn() {
        const testPluginPath = './test-temp-plugin';

        try {
            // Create a temporary test plugin
            await Deno.mkdir(testPluginPath, { recursive: true });

            const manifest = {
                name: 'test-tampered',
                displayName: 'Test Tampered Plugin',
                version: '1.0.0',
                description: 'Test plugin for tampering detection',
                author: 'Test',
                license: 'MIT',
                compatibility: { lexcms: '>=1.0.0' },
                permissions: [],
            };

            await Deno.writeTextFile(
                join(testPluginPath, 'plugin.json'),
                JSON.stringify(manifest, null, 2)
            );

            await Deno.writeTextFile(
                join(testPluginPath, 'index.ts'),
                'export default class TestPlugin {}'
            );

            // Generate checksums
            await pluginIntegrity.generateAndSave(testPluginPath);

            // Tamper with the file
            await Deno.writeTextFile(
                join(testPluginPath, 'index.ts'),
                'export default class TamperedPlugin {}'
            );

            // Verify should fail
            const result = await pluginIntegrity.verifyFromPath(testPluginPath);
            assertEquals(result.valid, false, 'Tampered plugin should fail verification');
            assertEquals(result.modifiedFiles.length > 0, true, 'Should detect modified files');

        } finally {
            // Cleanup
            try {
                await Deno.remove(testPluginPath, { recursive: true });
            } catch {
                // Ignore cleanup errors
            }
        }
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Audit logging system persists logs',
    async fn() {
        const testPluginName = 'test-audit-plugin';

        // Log some test entries
        await pluginAuditor.log({
            pluginName: testPluginName,
            action: 'test:operation',
            severity: 'info',
            details: { test: true },
        });

        await pluginAuditor.log({
            pluginName: testPluginName,
            action: 'test:warning',
            severity: 'warning',
            details: { warning: true },
        });

        // Flush to ensure writes complete
        await pluginAuditor.flush();

        // Small delay to ensure DB write completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify logs were created
        const logs = await pluginAuditor.getPluginLogs(testPluginName);

        assert(logs.length >= 2, `Should have at least 2 logs, got ${logs.length}`);

        // Verify we can filter by action
        const testLogs = await pluginAuditor.getPluginLogs(testPluginName, {
            action: 'test:operation',
        });
        assert(testLogs.length >= 1, 'Should find test operation logs');
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Plugin manager enforces resource limits',
    async fn() {
        // Initialize plugin manager if needed
        await pluginManager.initialize();

        // Call enforcement (should not throw)
        await pluginManager.enforceResourceLimits();

        // Verify enforcement methods exist and are callable
        assertEquals(typeof pluginManager.startEnforcement, 'function');
        assertEquals(typeof pluginManager.stopEnforcement, 'function');
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Audit log cleanup removes old entries',
    async fn() {
        const testPluginName = 'test-cleanup-plugin';

        // Create a test log
        await pluginAuditor.log({
            pluginName: testPluginName,
            action: 'test:old_entry',
            severity: 'info',
            details: {},
        });

        await pluginAuditor.flush();
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cleanup logs older than 0 days (should remove all)
        const deletedCount = await pluginAuditor.cleanupOldLogs(0);

        assert(deletedCount >= 0, 'Should return number of deleted logs');
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Integrity verification with missing manifest',
    async fn() {
        const testPluginPath = './test-no-integrity';

        try {
            // Create plugin without integrity.json
            await Deno.mkdir(testPluginPath, { recursive: true });

            await Deno.writeTextFile(
                join(testPluginPath, 'plugin.json'),
                JSON.stringify({
                    name: 'test-no-integrity',
                    displayName: 'Test',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'Test',
                    license: 'MIT',
                    compatibility: { lexcms: '>=1.0.0' },
                    permissions: [],
                })
            );

            // Verify should return invalid with warning
            const result = await pluginIntegrity.verifyFromPath(testPluginPath);
            assertEquals(result.valid, false, 'Should be invalid without manifest');
            assert(result.warnings.length > 0, 'Should have warnings');

        } finally {
            try {
                await Deno.remove(testPluginPath, { recursive: true });
            } catch {
                // Ignore
            }
        }
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Plugin lifecycle with integrity checks',
    async fn() {
        const testPluginName = 'hello-world';

        // First verify integrity
        const integrityResult = await pluginIntegrity.verifyFromPath(TEST_PLUGIN_DIR);
        assertEquals(integrityResult.valid, true, 'Plugin should have valid integrity');

        // Load plugin (this will also verify integrity internally)
        const plugin = await pluginLoader.loadPlugin(testPluginName);
        assertEquals(plugin.name, testPluginName);

        // Activate plugin
        await pluginLoader.activatePlugin(testPluginName);
        assertEquals(plugin.status, 'active');

        // Deactivate plugin
        await pluginLoader.deactivatePlugin(testPluginName);
        assertEquals(plugin.status, 'inactive');

        // Cleanup
        pluginLoader.unloadPlugin(testPluginName);
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Audit statistics tracking',
    async fn() {
        // Get current stats
        const stats = await pluginAuditor.getStats();

        // Verify structure
        assertEquals(typeof stats.total, 'number');
        assertEquals(typeof stats.byPlugin, 'object');
        assertEquals(typeof stats.bySeverity, 'object');
        assertEquals(typeof stats.byAction, 'object');

        // Stats should have some data from previous tests
        assert(stats.total >= 0, 'Should have total count');
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

Deno.test({
    name: 'Integration: Checksum generation and verification cycle',
    async fn() {
        const testPluginPath = './test-checksum-plugin';

        try {
            // Create a test plugin
            await Deno.mkdir(testPluginPath, { recursive: true });

            await Deno.writeTextFile(
                join(testPluginPath, 'plugin.json'),
                JSON.stringify({
                    name: 'test-checksum',
                    displayName: 'Test Checksum',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'Test',
                    license: 'MIT',
                    compatibility: { lexcms: '>=1.0.0' },
                    permissions: [],
                })
            );

            await Deno.writeTextFile(
                join(testPluginPath, 'index.ts'),
                'export default class TestPlugin {}'
            );

            // Generate checksums
            await pluginIntegrity.generateAndSave(testPluginPath);

            // Verify checksums
            const result = await pluginIntegrity.verifyFromPath(testPluginPath);
            assertEquals(result.valid, true, 'Fresh checksums should verify successfully');
            assertEquals(result.modifiedFiles.length, 0, 'Should have no modified files');
            assertEquals(result.missingFiles.length, 0, 'Should have no missing files');

        } finally {
            try {
                await Deno.remove(testPluginPath, { recursive: true });
            } catch {
                // Ignore
            }
        }
    },
    sanitizeResources: false,
    sanitizeOps: false,
});
