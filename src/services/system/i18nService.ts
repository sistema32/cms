/**
 * Internationalization (i18n) Service
 * Manages translations and locale handling for themes
 */

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  dateFormat?: string;
  timeFormat?: string;
}

/**
 * I18n Service Class
 */
export class I18nService {
  private translations = new Map<string, TranslationData>();
  private currentLocale = "en";
  private currentTheme = "";
  private fallbackLocale = "en";

  /**
   * Supported locales with RTL information
   */
  private readonly localeConfigs: Map<string, LocaleConfig> = new Map([
    ["en", { code: "en", name: "English", nativeName: "English", direction: "ltr" }],
    ["es", { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" }],
    ["fr", { code: "fr", name: "French", nativeName: "Français", direction: "ltr" }],
    ["de", { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" }],
    ["it", { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr" }],
    ["pt", { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr" }],
    ["ar", { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" }],
    ["he", { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl" }],
    ["fa", { code: "fa", name: "Persian", nativeName: "فارسی", direction: "rtl" }],
    ["ur", { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl" }],
    ["ja", { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" }],
    ["zh", { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr" }],
    ["ko", { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr" }],
    ["ru", { code: "ru", name: "Russian", nativeName: "Русский", direction: "ltr" }],
    ["hi", { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr" }],
  ]);

  /**
   * Load translations for a theme and locale
   */
  async loadTranslations(theme: string, locale: string): Promise<boolean> {
    const cacheKey = `${theme}:${locale}`;

    // Check if already loaded
    if (this.translations.has(cacheKey)) {
      return true;
    }

    try {
      const path = `./src/themes/${theme}/locales/${locale}.json`;
      const content = await Deno.readTextFile(path);
      const data = JSON.parse(content);

      this.translations.set(cacheKey, data);
      console.log(`✅ Loaded translations: ${theme}/${locale}`);
      return true;
    } catch (error) {
      // Try fallback locale
      if (locale !== this.fallbackLocale) {
        console.warn(
          `Translation file not found: ${theme}/locales/${locale}.json, trying fallback...`
        );
        return await this.loadTranslations(theme, this.fallbackLocale);
      }

      console.error(`Failed to load translations for ${theme}/${locale}:`, error);
      return false;
    }
  }

  /**
   * Set the current locale
   */
  setLocale(locale: string, theme?: string): void {
    this.currentLocale = locale;
    if (theme) {
      this.currentTheme = theme;
    }
  }

  /**
   * Get the current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Set the current theme
   */
  setTheme(theme: string): void {
    this.currentTheme = theme;
  }

  /**
   * Get translation for a key
   * @param key - Translation key (dot notation supported)
   * @param params - Parameters for interpolation
   * @param locale - Override current locale
   */
  t(key: string, params?: Record<string, any>, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const cacheKey = `${this.currentTheme}:${targetLocale}`;

    // Get translations for current theme and locale
    let translations = this.translations.get(cacheKey);

    // Fallback to default locale if not found
    if (!translations && targetLocale !== this.fallbackLocale) {
      const fallbackKey = `${this.currentTheme}:${this.fallbackLocale}`;
      translations = this.translations.get(fallbackKey);
    }

    if (!translations) {
      console.warn(`No translations loaded for ${cacheKey}`);
      return key;
    }

    // Navigate through nested keys
    const value = this.getNestedValue(translations, key);

    if (value === undefined || value === null) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    if (typeof value !== "string") {
      console.warn(`Translation for ${key} is not a string`);
      return key;
    }

    // Interpolate parameters
    return params ? this.interpolate(value, params) : value;
  }

  /**
   * Get translation with pluralization support
   * @param key - Translation key
   * @param count - Number for pluralization
   * @param params - Additional parameters
   */
  tn(key: string, count: number, params?: Record<string, any>): string {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
    const mergedParams = { ...params, count };
    return this.t(pluralKey, mergedParams);
  }

  /**
   * Check if translation exists
   */
  has(key: string, locale?: string): boolean {
    const targetLocale = locale || this.currentLocale;
    const cacheKey = `${this.currentTheme}:${targetLocale}`;
    const translations = this.translations.get(cacheKey);

    if (!translations) return false;

    return this.getNestedValue(translations, key) !== undefined;
  }

  /**
   * Get all translations for current locale
   */
  getAll(locale?: string): TranslationData {
    const targetLocale = locale || this.currentLocale;
    const cacheKey = `${this.currentTheme}:${targetLocale}`;
    return this.translations.get(cacheKey) || {};
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(locale?: string): boolean {
    const targetLocale = locale || this.currentLocale;
    const config = this.localeConfigs.get(targetLocale);
    return config?.direction === "rtl";
  }

  /**
   * Get locale configuration
   */
  getLocaleConfig(locale?: string): LocaleConfig | undefined {
    const targetLocale = locale || this.currentLocale;
    return this.localeConfigs.get(targetLocale);
  }

  /**
   * Get all available locales
   */
  getAvailableLocales(): LocaleConfig[] {
    return Array.from(this.localeConfigs.values());
  }

  /**
   * Get available locales for a theme
   */
  async getThemeLocales(theme: string): Promise<string[]> {
    try {
      const localesDir = `./src/themes/${theme}/locales`;
      const locales: string[] = [];

      for await (const entry of Deno.readDir(localesDir)) {
        if (entry.isFile && entry.name.endsWith(".json")) {
          const locale = entry.name.replace(".json", "");
          locales.push(locale);
        }
      }

      return locales;
    } catch (error) {
      console.warn(`Could not read locales directory for theme ${theme}`);
      return [];
    }
  }

  /**
   * Set fallback locale
   */
  setFallbackLocale(locale: string): void {
    this.fallbackLocale = locale;
  }

  /**
   * Clear all loaded translations
   */
  clear(): void {
    this.translations.clear();
  }

  /**
   * Clear translations for a specific theme
   */
  clearTheme(theme: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.translations.keys()) {
      if (key.startsWith(`${theme}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.translations.delete(key));
  }

  /**
   * Get value from nested object using dot notation
   * @private
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Interpolate parameters in translation string
   * @private
   */
  private interpolate(str: string, params: Record<string, any>): string {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Get statistics about loaded translations
   */
  getStats(): {
    loadedTranslations: number;
    currentLocale: string;
    currentTheme: string;
    translations: Array<{ key: string; keyCount: number }>;
  } {
    const translations: Array<{ key: string; keyCount: number }> = [];

    for (const [key, value] of this.translations.entries()) {
      translations.push({
        key,
        keyCount: this.countKeys(value),
      });
    }

    return {
      loadedTranslations: this.translations.size,
      currentLocale: this.currentLocale,
      currentTheme: this.currentTheme,
      translations,
    };
  }

  /**
   * Count translation keys recursively
   * @private
   */
  private countKeys(obj: any): number {
    let count = 0;

    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    }

    return count;
  }
}

// Create singleton instance
export const i18nService = new I18nService();

/**
 * Helper functions for easy access
 */

export function t(key: string, params?: Record<string, any>): string {
  return i18nService.t(key, params);
}

export function tn(key: string, count: number, params?: Record<string, any>): string {
  return i18nService.tn(key, count, params);
}

export function setLocale(locale: string, theme?: string): void {
  i18nService.setLocale(locale, theme);
}

export function getLocale(): string {
  return i18nService.getLocale();
}

export function isRTL(locale?: string): boolean {
  return i18nService.isRTL(locale);
}

export function getLocaleConfig(locale?: string): LocaleConfig | undefined {
  return i18nService.getLocaleConfig(locale);
}

export function getAvailableLocales(): LocaleConfig[] {
  return i18nService.getAvailableLocales();
}
