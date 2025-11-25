import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { pluginResourceMonitor } from "../../src/lib/plugin-system/PluginResourceMonitor.ts";

Deno.test("PluginResourceMonitor - Tracking & Limits", async (t) => {
    const pluginName = "test-plugin-monitor";

    await t.step("starts monitoring", () => {
        pluginResourceMonitor.startMonitoring(pluginName);
        const usage = pluginResourceMonitor.getCurrentUsage(pluginName);
        // Initially null until first snapshot
        assertEquals(usage, null);
    });

    await t.step("records snapshot", () => {
        pluginResourceMonitor.recordSnapshot(pluginName, {
            memoryUsage: 1024 * 1024 * 100, // 100MB
            cpuTime: 50,
            operations: {
                database: 5,
                network: 2,
                file: 1,
                hooks: 0
            }
        });

        const usage = pluginResourceMonitor.getCurrentUsage(pluginName);
        assertExists(usage);
        assertEquals(usage?.memoryUsage, 1024 * 1024 * 100);
    });

    await t.step("detects violations", () => {
        // Force a violation (limit is 256MB by default)
        pluginResourceMonitor.recordSnapshot(pluginName, {
            memoryUsage: 1024 * 1024 * 300, // 300MB
            cpuTime: 100,
            operations: {
                database: 10,
                network: 5,
                file: 2,
                hooks: 0
            }
        });

        const violations = pluginResourceMonitor.getViolations(pluginName);
        assertEquals(violations.length > 0, true);
        assertEquals(violations[0].limit, 'memory');
    });

    await t.step("cleanup", () => {
        pluginResourceMonitor.stopMonitoring(pluginName);
        pluginResourceMonitor.reset(pluginName);
    });
});
