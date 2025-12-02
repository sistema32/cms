/**
 * Helper to extract SandboxCapabilities from a PluginManifest
 */
import type { PluginManifest } from "./pluginManifest.ts";
import type { SandboxCapabilities } from "./pluginSandbox.ts";

export function extractCapabilitiesFromManifest(
    manifest: PluginManifest
): SandboxCapabilities {
    const caps = manifest.capabilities || {};

    return {
        dbRead: caps.db?.includes("read") || caps.db?.includes("write") || false,
        fsRead: caps.fs?.includes("read") || caps.fs?.includes("write") || false,
        httpAllowlist: manifest.httpAllowlist || [],
    };
}
