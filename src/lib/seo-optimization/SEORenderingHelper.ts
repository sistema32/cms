/**
 * SEO Rendering Helper
 * Integrates all SEO optimization utilities into content rendering
 */

import { imageOptimizer } from "./ImageOptimizer.ts";
import { resourceOptimizer } from "./ResourceOptimizer.ts";
import { coreWebVitalsOptimizer } from "./CoreWebVitals.ts";
import { contentOptimizer } from "./ContentOptimizer.ts";
import { advancedSchemaGenerator } from "./AdvancedSchema.ts";
import { urlOptimizer } from "./URLOptimizer.ts";
import { pwaOptimizer } from "./PWAOptimizer.ts";
import { hreflangManager } from "./HreflangManager.ts";

export interface PageSEOConfig {
  baseUrl: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedAt?: Date;
  modifiedAt?: Date;
  keywords?: string[];
  type?: "article" | "website" | "product" | "recipe" | "event";
  breadcrumbs?: Array<{ name: string; url: string }>;
  translations?: Array<{ lang: string; url: string }>;
}

export interface SEOHeadTags {
  canonical: string;
  meta: string;
  schema: string;
  preload: string;
  hreflang: string;
  breadcrumbs: string;
  webVitals: string;
  pwa: string;
}

export class SEORenderingHelper {
  private static instance: SEORenderingHelper;

  static getInstance(): SEORenderingHelper {
    if (!SEORenderingHelper.instance) {
      SEORenderingHelper.instance = new SEORenderingHelper();
    }
    return SEORenderingHelper.instance;
  }

  /**
   * Generate complete SEO head tags for a page
   */
  generateHeadTags(config: PageSEOConfig): SEOHeadTags {
    const canonical = this.generateCanonical(config.baseUrl, config.path);
    const meta = this.generateMetaTags(config);
    const schema = this.generateSchemaMarkup(config);
    const preload = this.generatePreloadTags();
    const hreflang = config.translations ? this.generateHreflang(config) : "";
    const breadcrumbs = config.breadcrumbs ? this.generateBreadcrumbs(config) : "";
    const webVitals = this.generateWebVitalsTracking();
    const pwa = this.generatePWATags(config.baseUrl);

    return {
      canonical,
      meta,
      schema,
      preload,
      hreflang,
      breadcrumbs,
      webVitals,
      pwa,
    };
  }

  /**
   * Generate all head tags as single HTML string
   */
  generateAllHeadTags(config: PageSEOConfig): string {
    const tags = this.generateHeadTags(config);

    return `
<!-- SEO Meta Tags -->
${tags.meta}

<!-- Canonical URL -->
${tags.canonical}

<!-- Hreflang Tags -->
${tags.hreflang}

<!-- Schema.org Structured Data -->
${tags.schema}

<!-- Resource Preloading -->
${tags.preload}

<!-- PWA Tags -->
${tags.pwa}

<!-- Web Vitals Tracking -->
${tags.webVitals}
`.trim();
  }

  /**
   * Generate canonical tag
   */
  private generateCanonical(baseUrl: string, path: string): string {
    const canonicalUrl = urlOptimizer.generateCanonicalURL(baseUrl, path);
    return urlOptimizer.generateCanonicalTag(canonicalUrl);
  }

  /**
   * Generate meta tags
   */
  private generateMetaTags(config: PageSEOConfig): string {
    const tags: string[] = [];

    // Basic meta
    tags.push(`<meta name="description" content="${this.escapeHtml(config.description)}" />`);

    if (config.keywords && config.keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${config.keywords.join(", ")}" />`);
    }

    if (config.author) {
      tags.push(`<meta name="author" content="${this.escapeHtml(config.author)}" />`);
    }

    // Open Graph
    tags.push(`<meta property="og:title" content="${this.escapeHtml(config.title)}" />`);
    tags.push(`<meta property="og:description" content="${this.escapeHtml(config.description)}" />`);
    tags.push(`<meta property="og:url" content="${config.baseUrl}${config.path}" />`);
    tags.push(`<meta property="og:type" content="${config.type === "article" ? "article" : "website"}" />`);

    if (config.image) {
      tags.push(`<meta property="og:image" content="${config.image}" />`);
    }

    if (config.publishedAt && config.type === "article") {
      tags.push(`<meta property="article:published_time" content="${config.publishedAt.toISOString()}" />`);
    }

    if (config.modifiedAt && config.type === "article") {
      tags.push(`<meta property="article:modified_time" content="${config.modifiedAt.toISOString()}" />`);
    }

    // Twitter Card
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(config.title)}" />`);
    tags.push(`<meta name="twitter:description" content="${this.escapeHtml(config.description)}" />`);

    if (config.image) {
      tags.push(`<meta name="twitter:image" content="${config.image}" />`);
    }

    return tags.join("\n");
  }

  /**
   * Generate Schema.org markup
   */
  private generateSchemaMarkup(config: PageSEOConfig): string {
    let schema: any;

    switch (config.type) {
      case "article":
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: config.title,
          description: config.description,
          image: config.image,
          author: config.author ? {
            "@type": "Person",
            name: config.author,
          } : undefined,
          datePublished: config.publishedAt?.toISOString(),
          dateModified: config.modifiedAt?.toISOString(),
        };
        break;

      default:
        schema = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: config.title,
          description: config.description,
          url: `${config.baseUrl}${config.path}`,
        };
    }

    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }

  /**
   * Generate preload tags
   */
  private generatePreloadTags(): string {
    const preloads = resourceOptimizer.generatePreloadTags([
      { url: "/themes/default/css/style.css", as: "style" },
      { url: "/themes/default/js/main.js", as: "script" },
    ]);

    const prefetch = resourceOptimizer.generateDNSPrefetch([
      "https://fonts.googleapis.com",
      "https://unpkg.com",
    ]);

    return `${preloads}\n${prefetch}`;
  }

  /**
   * Generate hreflang tags
   */
  private generateHreflang(config: PageSEOConfig): string {
    if (!config.translations || config.translations.length === 0) {
      return "";
    }

    const alternates = config.translations.map((t) => ({
      lang: t.lang,
      url: t.url,
    }));

    return hreflangManager.generateHreflangTags(alternates);
  }

  /**
   * Generate breadcrumbs
   */
  private generateBreadcrumbs(config: PageSEOConfig): string {
    if (!config.breadcrumbs || config.breadcrumbs.length === 0) {
      return "";
    }

    const items = config.breadcrumbs.map((b, i) => ({
      name: b.name,
      url: b.url,
      position: i + 1,
    }));

    const schema = urlOptimizer.generateBreadcrumbSchema(items);
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }

  /**
   * Generate Web Vitals tracking
   */
  private generateWebVitalsTracking(): string {
    return coreWebVitalsOptimizer.generateTrackingScript();
  }

  /**
   * Generate PWA tags
   */
  private generatePWATags(baseUrl: string): string {
    const tags: string[] = [];

    tags.push(pwaOptimizer.generateManifestLink("/manifest.json"));
    tags.push(pwaOptimizer.generateThemeColorTags("#667eea"));
    tags.push(pwaOptimizer.generateAppleTouchIcons([
      { size: 180, url: "/icons/apple-touch-icon-180.png" },
    ]));

    return tags.join("\n");
  }

  /**
   * Optimize images in HTML content
   */
  optimizeImages(html: string, lazy = true): string {
    // Simple regex to find img tags
    const imgRegex = /<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/gi;

    return html.replace(imgRegex, (match, before, src, after) => {
      // Extract alt text if present
      const altMatch = match.match(/alt="([^"]+)"/i);
      const alt = altMatch ? altMatch[1] : "";

      // Generate optimized picture element
      const picture = imageOptimizer.generatePictureElement(src, alt, {
        lazy,
        priority: false,
      });

      return picture;
    });
  }

  /**
   * Extract and inline critical CSS
   */
  async inlineCriticalCSS(html: string, fullCSS: string): Promise<string> {
    const criticalCSS = resourceOptimizer.extractCriticalCSS(fullCSS, html);

    // Inject critical CSS in head
    const styleTag = `<style id="critical-css">\n${criticalCSS}\n</style>`;
    return html.replace("</head>", `${styleTag}\n</head>`);
  }

  /**
   * Generate async CSS loading for non-critical CSS
   */
  generateAsyncCSS(cssUrls: string[]): string {
    return resourceOptimizer.generateAsyncCSSLoader(cssUrls);
  }

  /**
   * Add CLS prevention classes
   */
  addCLSPrevention(): string {
    return coreWebVitalsOptimizer.generateCLSPreventionCSS();
  }

  /**
   * Generate skeleton screen
   */
  generateSkeleton(type: "card" | "list"): string {
    return coreWebVitalsOptimizer.generateSkeletonScreen(type);
  }

  /**
   * Analyze content for SEO
   */
  analyzeContent(title: string, description: string, body: string, keywords?: string[]) {
    return contentOptimizer.analyzeContent(title, description, body, keywords);
  }

  /**
   * Get SEO suggestions for content
   */
  getSuggestions(title: string, description: string, body: string, keywords?: string[]) {
    return contentOptimizer.generateSuggestions(title, description, body, keywords);
  }

  /**
   * Generate complete page with SEO optimization
   */
  generateOptimizedPage(config: {
    title: string;
    description: string;
    content: string;
    seoConfig: PageSEOConfig;
  }): string {
    const headTags = this.generateAllHeadTags(config.seoConfig);
    const clsCSS = this.addCLSPrevention();
    const optimizedContent = this.optimizeImages(config.content, true);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(config.title)}</title>

  ${headTags}

  <style>
  ${clsCSS}
  </style>
</head>
<body>
  ${optimizedContent}
</body>
</html>`;
  }

  /**
   * Escape HTML for safe output
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

export const seoRenderingHelper = SEORenderingHelper.getInstance();
