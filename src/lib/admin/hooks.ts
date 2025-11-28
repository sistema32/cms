import { applyFilters, doAction } from "../hooks/index.ts";

/**
 * Admin Hooks Helper
 * Provides utilities for injecting plugin content into admin pages
 */

/**
 * Get injected content for admin head
 * Allows plugins to add scripts, styles, etc. to admin pages
 */
export async function getAdminHeadContent(): Promise<string> {
    try {
        return await applyFilters("admin:head", "");
    } catch (error) {
        console.error("Error in admin:head hook:", error);
        return "";
    }
}

/**
 * Get injected content for admin footer
 * Allows plugins to add scripts at the end of admin pages
 */
export async function getAdminFooterContent(): Promise<string> {
    try {
        return await applyFilters("admin:footer", "");
    } catch (error) {
        console.error("Error in admin:footer hook:", error);
        return "";
    }
}

/**
 * Trigger admin:enqueueScripts action
 * Allows plugins to register scripts/styles for admin pages
 */
export async function triggerAdminEnqueueScripts(): Promise<void> {
    try {
        await doAction("admin:enqueueScripts");
    } catch (error) {
        console.error("Error in admin:enqueueScripts hook:", error);
    }
}
