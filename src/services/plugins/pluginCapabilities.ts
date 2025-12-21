// @ts-nocheck
/**
 * Helper to extract SandboxCapabilities from a PluginManifest
 */
import type { PluginManifest } from "./pluginManifest.ts";
import type { SandboxCapabilities } from "./pluginSandbox.ts";

export function extractCapabilitiesFromManifest(
    manifest: PluginManifest
): SandboxCapabilities {
    const caps = manifest.capabilities || {};

    const dbWrite = caps.db?.includes("write") || false;
    const fsWrite = caps.fs?.includes("write") || false;
    const httpMethods = Array.isArray(caps.http)
        ? caps.http
            .filter((m: unknown) => typeof m === "string")
            .map((m: string) => m.toUpperCase())
        : [];

    return {
        dbRead: caps.db?.includes("read") || dbWrite || false,
        dbWrite,
        fsRead: caps.fs?.includes("read") || fsWrite || false,
        fsWrite,
        httpAllowlist: manifest.httpAllowlist || [],
        httpMethods: httpMethods.length > 0 ? httpMethods : undefined,
    };
}
