/**
 * Resource Optimization Service
 * Critical CSS, preload, minification
 */

export interface CriticalResource {
  type: "style" | "script" | "font" | "image";
  url: string;
  as?: string;
  crossorigin?: "anonymous" | "use-credentials";
}

export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private criticalResources: CriticalResource[] = [];

  private constructor() {}

  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  /**
   * Register critical resource for preload
   */
  registerCriticalResource(resource: CriticalResource): void {
    this.criticalResources.push(resource);
  }

  /**
   * Generate preload link tags
   */
  generatePreloadTags(): string {
    return this.criticalResources
      .map((resource) => {
        const crossorigin = resource.crossorigin
          ? ` crossorigin="${resource.crossorigin}"`
          : "";
        const as = resource.as ? ` as="${resource.as}"` : "";

        return `<link rel="preload" href="${resource.url}"${as}${crossorigin}>`;
      })
      .join("\n");
  }

  /**
   * Generate DNS prefetch tags
   */
  generateDNSPrefetch(domains: string[]): string {
    return domains
      .map((domain) => `<link rel="dns-prefetch" href="${domain}">`)
      .join("\n");
  }

  /**
   * Generate preconnect tags
   */
  generatePreconnect(domains: string[]): string {
    return domains
      .map(
        (domain) =>
          `<link rel="preconnect" href="${domain}" crossorigin="anonymous">`
      )
      .join("\n");
  }

  /**
   * Extract and inline critical CSS
   */
  extractCriticalCSS(fullCSS: string, aboveFoldHTML: string): string {
    // Simplified implementation
    // In production, would use critical-css library or similar
    const criticalSelectors = [
      "body",
      "header",
      "nav",
      "main",
      "h1",
      "h2",
      "p",
      ".hero",
      ".above-fold",
    ];

    const lines = fullCSS.split("\n");
    const critical: string[] = [];

    let inCriticalBlock = false;
    let currentBlock = "";

    for (const line of lines) {
      if (criticalSelectors.some((sel) => line.includes(sel))) {
        inCriticalBlock = true;
      }

      if (inCriticalBlock) {
        currentBlock += line + "\n";

        if (line.includes("}")) {
          critical.push(currentBlock);
          currentBlock = "";
          inCriticalBlock = false;
        }
      }
    }

    return critical.join("\n");
  }

  /**
   * Generate critical CSS inline style tag
   */
  generateCriticalCSSTag(css: string): string {
    // Minify CSS (basic implementation)
    const minified = css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove space around punctuation
      .trim();

    return `<style id="critical-css">${minified}</style>`;
  }

  /**
   * Generate async CSS loading script
   */
  generateAsyncCSSLoader(cssUrls: string[]): string {
    const urls = cssUrls.map((url) => `'${url}'`).join(", ");

    return `
<script>
(function() {
  const cssUrls = [${urls}];
  const loadCSS = (url) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.media = 'print';
    link.onload = function() { this.media = 'all'; };
    document.head.appendChild(link);
  };
  cssUrls.forEach(loadCSS);
})();
</script>`.trim();
  }

  /**
   * Generate resource hints HTML
   */
  generateResourceHints(): string {
    const hints: string[] = [];

    // DNS Prefetch for common domains
    hints.push(
      this.generateDNSPrefetch([
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
      ])
    );

    // Preconnect for critical domains
    hints.push(
      this.generatePreconnect([
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ])
    );

    // Preload critical resources
    hints.push(this.generatePreloadTags());

    return hints.join("\n");
  }

  /**
   * Minify JavaScript (basic)
   */
  minifyJS(code: string): string {
    return (
      code
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "")
        // Collapse whitespace
        .replace(/\s+/g, " ")
        // Remove space around operators
        .replace(/\s*([=+\-*/<>!&|])\s*/g, "$1")
        .trim()
    );
  }

  /**
   * Minify CSS (basic)
   */
  minifyCSS(code: string): string {
    return (
      code
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        // Collapse whitespace
        .replace(/\s+/g, " ")
        // Remove space around punctuation
        .replace(/\s*([{}:;,])\s*/g, "$1")
        // Remove last semicolon
        .replace(/;}/g, "}")
        .trim()
    );
  }

  /**
   * Generate service worker registration
   */
  generateServiceWorkerRegistration(): string {
    return `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}
</script>`.trim();
  }

  /**
   * Generate defer/async script tag
   */
  generateScriptTag(
    src: string,
    options: {
      async?: boolean;
      defer?: boolean;
      module?: boolean;
      integrity?: string;
      crossorigin?: string;
    } = {}
  ): string {
    const attrs: string[] = [];

    if (options.async) attrs.push("async");
    if (options.defer) attrs.push("defer");
    if (options.module) attrs.push('type="module"');
    if (options.integrity) attrs.push(`integrity="${options.integrity}"`);
    if (options.crossorigin) attrs.push(`crossorigin="${options.crossorigin}"`);

    const attrsStr = attrs.length > 0 ? " " + attrs.join(" ") : "";

    return `<script src="${src}"${attrsStr}></script>`;
  }
}

export const resourceOptimizer = ResourceOptimizer.getInstance();
