import type { PluginAPI } from "../../src/lib/plugin-system/PluginAPI.ts";

/**
 * Admin initialization hook
 * This is called lazily when admin panel is accessed
 */

export async function initAdmin(api: PluginAPI) {
    const { registerAdminRoutes } = await import("./routes.ts");
    registerAdminRoutes(api);
    api.log("LexSlider admin routes registered");
}
