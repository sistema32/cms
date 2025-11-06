/**
 * Hreflang Manager - Phase 6
 * Multi-language URL management and hreflang tags
 */

export interface LanguageAlternate {
  lang: string; // e.g., "en", "es", "fr", "en-US", "x-default"
  url: string;
}

export class HreflangManager {
  private static instance: HreflangManager;

  static getInstance(): HreflangManager {
    if (!HreflangManager.instance) {
      HreflangManager.instance = new HreflangManager();
    }
    return HreflangManager.instance;
  }

  /**
   * Generate hreflang link tags
   */
  generateHreflangTags(alternates: LanguageAlternate[]): string {
    return alternates
      .map((alt) => `<link rel="alternate" hreflang="${alt.lang}" href="${alt.url}" />`)
      .join("\n");
  }

  /**
   * Generate hreflang tags for content with translations
   */
  generateContentHreflang(baseUrl: string, slug: string, translations: Array<{ lang: string; slug: string }>): string {
    const alternates: LanguageAlternate[] = translations.map((trans) => ({
      lang: trans.lang,
      url: `${baseUrl}/${trans.lang}/${trans.slug}`,
    }));

    // Add x-default for primary language
    alternates.push({
      lang: "x-default",
      url: `${baseUrl}/${slug}`,
    });

    return this.generateHreflangTags(alternates);
  }

  /**
   * Detect user language
   */
  detectLanguage(acceptLanguage: string, availableLanguages: string[], defaultLang: string = "en"): string {
    if (!acceptLanguage) return defaultLang;

    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const parts = lang.split(";");
        const code = parts[0].trim().split("-")[0];
        const quality = parts[1] ? parseFloat(parts[1].replace("q=", "")) : 1.0;
        return { code, quality };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (availableLanguages.includes(lang.code)) {
        return lang.code;
      }
    }

    return defaultLang;
  }

  /**
   * Generate language selector HTML
   */
  generateLanguageSelector(currentLang: string, alternatives: LanguageAlternate[], languageNames: Record<string, string>): string {
    const options = alternatives
      .filter((alt) => alt.lang !== "x-default")
      .map((alt) => {
        const name = languageNames[alt.lang] || alt.lang.toUpperCase();
        const selected = alt.lang === currentLang ? ' selected' : '';
        return `<option value="${alt.url}"${selected}>${name}</option>`;
      })
      .join("\n");

    return `
<select id="language-selector" onchange="window.location.href=this.value">
  ${options}
</select>`.trim();
  }
}

export const hreflangManager = HreflangManager.getInstance();
