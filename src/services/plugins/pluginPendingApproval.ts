// @ts-nocheck
/**
 * Pending Plugins Management
 * 
 * This module handles plugins that are discovered but pending approval.
 * Allows administrators to review and approve plugins before they're fully active.
 */

import { db } from "@/config/db.ts";
import { plugins } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

export interface PendingPlugin {
    name: string;
    displayName: string;
    version: string;
    description: string;
    permissions: string[];
    capabilities: any;
    manifestChecksum?: string;
    manifestSignature?: string;
    manifestPath: string;
    discoveredAt: Date;
}

// In-memory storage for pending plugins
const pendingPlugins = new Map<string, PendingPlugin>();

/**
 * Add a plugin to pending approval
 */
export function addPendingPlugin(plugin: PendingPlugin) {
    pendingPlugins.set(plugin.name, plugin);
    console.log(`[pending] Plugin "${plugin.name}" awaiting approval`);
}

/**
 * Get all pending plugins
 */
export function getPendingPlugins(): PendingPlugin[] {
    return Array.from(pendingPlugins.values());
}

/**
 * Get a specific pending plugin
 */
export function getPendingPlugin(name: string): PendingPlugin | undefined {
    return pendingPlugins.get(name);
}

/**
 * Remove from pending (approved or rejected)
 */
export function removePendingPlugin(name: string) {
    pendingPlugins.delete(name);
}

/**
 * Check if plugin is already registered
 */
export async function isPluginRegistered(name: string): Promise<boolean> {
    const existing = await db.select().from(plugins).where(eq(plugins.name, name)).get();
    return !!existing;
}

/**
 * Clear all pending plugins
 */
export function clearPendingPlugins() {
    pendingPlugins.clear();
}
