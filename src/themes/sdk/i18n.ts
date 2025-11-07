/**
 * i18n SDK
 * Internationalization functions for theme developers
 */

import {
  getAvailableLocales as getAvailableLocalesService,
  getLocale as getLocaleService,
  getLocaleConfig as getLocaleConfigService,
  i18nService,
  isRTL as isRTLService,
  setLocale as setLocaleService,
  t as tService,
  tn as tnService,
} from "../../services/i18nService.ts";

export type {
  LocaleConfig,
  TranslationData,
} from "../../services/i18nService.ts";

/**
 * Translate a key
 *
 * @example
 * ```typescript
 * t('theme.read_more') // "Read More"
 * t('theme.posted_on', { date: '2024-01-01' }) // "Posted on 2024-01-01"
 * ```
 */
export function t(key: string, params?: Record<string, any>): string {
  return tService(key, params);
}

/**
 * Translate with pluralization
 *
 * @example
 * ```typescript
 * tn('theme.comments', 0) // "No comments"
 * tn('theme.comments', 1) // "1 comment"
 * tn('theme.comments', 5) // "5 comments"
 * ```
 */
export function tn(key: string, count: number, params?: Record<string, any>): string {
  return tnService(key, count, params);
}

/**
 * Set the current locale
 *
 * @example
 * ```typescript
 * setLocale('es', 'my-theme')
 * ```
 */
export function setLocale(locale: string, theme?: string): void {
  setLocaleService(locale, theme);
}

/**
 * Get the current locale
 *
 * @example
 * ```typescript
 * const locale = getLocale() // "en"
 * ```
 */
export function getLocale(): string {
  return getLocaleService();
}

/**
 * Check if current or specified locale is RTL
 *
 * @example
 * ```typescript
 * isRTL() // false (for 'en')
 * isRTL('ar') // true
 * ```
 */
export function isRTL(locale?: string): boolean {
  return isRTLService(locale);
}

/**
 * Get locale configuration
 *
 * @example
 * ```typescript
 * const config = getLocaleConfig('ar')
 * // { code: 'ar', name: 'Arabic', direction: 'rtl', ... }
 * ```
 */
export function getLocaleConfig(locale?: string) {
  return getLocaleConfigService(locale);
}

/**
 * Get all available locales
 *
 * @example
 * ```typescript
 * const locales = getAvailableLocales()
 * // [{ code: 'en', name: 'English', ... }, ...]
 * ```
 */
export function getAvailableLocales() {
  return getAvailableLocalesService();
}

/**
 * Get text direction for current locale
 *
 * @example
 * ```typescript
 * getDir() // "ltr" or "rtl"
 * ```
 */
export function getDir(locale?: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}

/**
 * Get lang attribute value for HTML
 *
 * @example
 * ```typescript
 * <html lang="${getLangAttr()}">
 * ```
 */
export function getLangAttr(): string {
  return getLocale();
}

/**
 * Get dir attribute value for HTML
 *
 * @example
 * ```typescript
 * <html dir="${getDirAttr()}">
 * ```
 */
export function getDirAttr(locale?: string): string {
  return getDir(locale);
}

/**
 * Load translations for current theme
 * Should be called during theme initialization
 *
 * @example
 * ```typescript
 * await loadThemeTranslations('my-theme', 'es')
 * ```
 */
export async function loadThemeTranslations(
  theme: string,
  locale: string
): Promise<boolean> {
  return await i18nService.loadTranslations(theme, locale);
}

/**
 * Get available locales for a theme
 *
 * @example
 * ```typescript
 * const locales = await getThemeLocales('my-theme')
 * // ['en', 'es', 'fr']
 * ```
 */
export async function getThemeLocales(theme: string): Promise<string[]> {
  return await i18nService.getThemeLocales(theme);
}

/**
 * Check if a translation key exists
 *
 * @example
 * ```typescript
 * if (hasTranslation('theme.custom_text')) {
 *   return t('theme.custom_text')
 * }
 * ```
 */
export function hasTranslation(key: string, locale?: string): boolean {
  return i18nService.has(key, locale);
}

/**
 * Get all translations for current locale
 *
 * @example
 * ```typescript
 * const allTranslations = getAllTranslations()
 * ```
 */
export function getAllTranslations(locale?: string) {
  return i18nService.getAll(locale);
}

/**
 * Format a date according to locale
 *
 * @example
 * ```typescript
 * formatLocalizedDate(new Date(), 'es') // "1 de enero de 2024"
 * ```
 */
export function formatLocalizedDate(
  date: Date | string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const targetLocale = locale || getLocale();
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(dateObj);
}

/**
 * Format a number according to locale
 *
 * @example
 * ```typescript
 * formatLocalizedNumber(1234.56, 'de') // "1.234,56"
 * ```
 */
export function formatLocalizedNumber(
  number: number,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string {
  const targetLocale = locale || getLocale();
  return new Intl.NumberFormat(targetLocale, options).format(number);
}

/**
 * Format currency according to locale
 *
 * @example
 * ```typescript
 * formatCurrency(99.99, 'USD', 'en') // "$99.99"
 * formatCurrency(99.99, 'EUR', 'de') // "99,99 €"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  const targetLocale = locale || getLocale();
  return new Intl.NumberFormat(targetLocale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Get RTL-aware CSS class
 *
 * @example
 * ```typescript
 * <div class="${getRTLClass('margin-left')}">
 * // Returns 'margin-left' for LTR, 'margin-right' for RTL
 * ```
 */
export function getRTLClass(
  className: string,
  locale?: string
): string {
  if (!isRTL(locale)) return className;

  // Simple RTL class transformations
  return className
    .replace(/left/g, "RIGHT_TEMP")
    .replace(/right/g, "left")
    .replace(/RIGHT_TEMP/g, "right")
    .replace(/start/g, "START_TEMP")
    .replace(/end/g, "start")
    .replace(/START_TEMP/g, "end");
}

/**
 * Helper to apply RTL transformations to CSS values
 *
 * @example
 * ```typescript
 * getRTLValue('margin', '0 10px 0 0') // '0 0 0 10px' for RTL
 * ```
 */
export function getRTLValue(
  property: string,
  value: string,
  locale?: string
): string {
  if (!isRTL(locale)) return value;

  // Handle properties that need RTL flipping
  const rtlProperties = ["margin", "padding", "border-radius"];

  if (rtlProperties.some((prop) => property.includes(prop))) {
    const parts = value.split(" ");
    if (parts.length === 4) {
      // top right bottom left → top left bottom right
      return `${parts[0]} ${parts[3]} ${parts[2]} ${parts[1]}`;
    }
  }

  return value;
}
