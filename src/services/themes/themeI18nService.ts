import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { themeCacheService } from "./themeCacheService.ts";
import * as settingsService from "../system/settingsService.ts";

/**
 * Service responsible for Theme Internationalization (i18n).
 * Loads locale files from themes and provides translation helpers.
 */
export class ThemeI18nService {
    private static instance: ThemeI18nService;
    private translations: Record<string, Record<string, Record<string, string>>> = {}; // theme -> locale -> key -> value
    private initializedThemes: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): ThemeI18nService {
        if (!ThemeI18nService.instance) {
            ThemeI18nService.instance = new ThemeI18nService();
        }
        return ThemeI18nService.instance;
    }

    /**
     * Load translations for a specific theme and locale
     */
    public async loadTranslations(themeName: string, locale: string): Promise<Record<string, string>> {
        const cacheKey = `i18n:${themeName}:${locale}`;

        // Try memory cache first (via this.translations)
        if (this.translations[themeName]?.[locale]) {
            return this.translations[themeName][locale];
        }

        // Try global cache service
        const cached = themeCacheService.getCachedConfig(cacheKey); // abusing config cache a bit or we add new method
        if (cached) {
            this.setMemoryCache(themeName, locale, cached as unknown as Record<string, string>);
            return cached as unknown as Record<string, string>;
        }

        // Load from file
        const localePath = join(Deno.cwd(), "src", "themes", themeName, "locales", `${locale}.json`);

        try {
            const content = await Deno.readTextFile(localePath);
            const translations = JSON.parse(content);

            this.setMemoryCache(themeName, locale, translations);
            themeCacheService.cacheConfig(cacheKey, translations); // Cache it

            return translations;
        } catch (error) {
            // If specific locale fails, try default (e.g. 'en') if different
            if (locale !== 'en') {
                try {
                    const fallbackPath = join(Deno.cwd(), "src", "themes", themeName, "locales", "en.json");
                    const content = await Deno.readTextFile(fallbackPath);
                    const translations = JSON.parse(content);
                    this.setMemoryCache(themeName, locale, translations);
                    return translations;
                } catch { }
            }

            // Console warning only if it's not a common missing file to avoid noise
            if (locale !== 'es' && locale !== 'en') {
                console.warn(`Locale file not found for theme ${themeName}: ${locale}`);
            }
            return {};
        }
    }

    private setMemoryCache(theme: string, locale: string, data: Record<string, string>) {
        if (!this.translations[theme]) {
            this.translations[theme] = {};
        }
        if (!this.translations[theme][locale]) {
            this.translations[theme][locale] = {};
        }
        this.translations[theme][locale] = data;
    }

    /**
     * Get a translation helper function for a specific theme and locale
     */
    public async getHelper(themeName: string, locale?: string) {
        const siteLocale = locale || await settingsService.getSetting("site_language", "es");
        await this.loadTranslations(themeName, siteLocale);

        return (key: string, params?: Record<string, string | number>) => {
            let text = this.translations[themeName]?.[siteLocale]?.[key] || key;

            if (params) {
                for (const [paramKey, paramValue] of Object.entries(params)) {
                    text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
                }
            }

            return text;
        };
    }
}

export const themeI18nService = ThemeI18nService.getInstance();
