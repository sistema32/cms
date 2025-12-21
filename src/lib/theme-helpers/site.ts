import * as settingsService from "@/services/system/settingsService.ts";
import type { SiteData } from "./types.ts";

/**
 * Site Helpers - Functions for site-wide data
 */

/**
 * Get global site data
 */
export async function getSiteData(): Promise<SiteData> {
    return {
        name: await settingsService.getSetting("site_name", "LexCMS"),
        description: await settingsService.getSetting("site_description", ""),
        url: await settingsService.getSetting("site_url", "http://localhost:8000"),
        logo: await settingsService.getSetting("logo_image", null),
        language: await settingsService.getSetting("language", "es"),
        timezone: await settingsService.getSetting("timezone", "UTC"),
    };
}

/**
 * Get custom settings for the active theme
 */
export async function getCustomSettings(
    themeName?: string,
): Promise<Record<string, any>> {
    const activeTheme = themeName ||
        await settingsService.getSetting("active_theme", "default");
    return await settingsService.getThemeCustomSettings(activeTheme);
}
