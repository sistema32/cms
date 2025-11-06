/**
 * URL Structure Optimizer - Phase 3
 * Clean URLs, breadcrumbs, canonical URLs
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface URLStructure {
  original: string;
  optimized: string;
  slug: string;
  path: string[];
  issues: string[];
}

export class URLOptimizer {
  private static instance: URLOptimizer;

  static getInstance(): URLOptimizer {
    if (!URLOptimizer.instance) {
      URLOptimizer.instance = new URLOptimizer();
    }
    return URLOptimizer.instance;
  }

  /**
   * Generate clean, SEO-friendly slug
   */
  generateSlug(text: string, options: {
    lowercase?: boolean;
    separator?: string;
    maxLength?: number;
    removeStopWords?: boolean;
  } = {}): string {
    const {
      lowercase = true,
      separator = "-",
      maxLength = 60,
      removeStopWords = false,
    } = options;

    let slug = text;

    // Convert to lowercase
    if (lowercase) {
      slug = slug.toLowerCase();
    }

    // Remove accents and special characters
    slug = slug
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Remove stop words if requested
    if (removeStopWords) {
      const stopWords = ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with"];
      const words = slug.split(/\s+/);
      slug = words.filter((word) => !stopWords.includes(word.toLowerCase())).join(" ");
    }

    // Replace non-alphanumeric with separator
    slug = slug.replace(/[^a-z0-9]+/g, separator);

    // Remove leading/trailing separators
    slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

    // Remove duplicate separators
    slug = slug.replace(new RegExp(`${separator}+`, "g"), separator);

    // Truncate to max length
    if (slug.length > maxLength) {
      slug = slug.substring(0, maxLength);
      // Cut at last separator to avoid partial words
      const lastSep = slug.lastIndexOf(separator);
      if (lastSep > 0) {
        slug = slug.substring(0, lastSep);
      }
    }

    return slug;
  }

  /**
   * Generate canonical URL
   */
  generateCanonicalURL(baseUrl: string, path: string, params?: Record<string, string>): string {
    // Remove trailing slash from base URL
    const cleanBase = baseUrl.replace(/\/$/, "");

    // Remove leading slash from path
    const cleanPath = path.replace(/^\//, "");

    // Construct URL
    let canonical = `${cleanBase}/${cleanPath}`;

    // Add query params if specified (usually not recommended for canonical)
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      canonical += `?${queryString}`;
    }

    return canonical;
  }

  /**
   * Generate canonical link tag
   */
  generateCanonicalTag(url: string): string {
    return `<link rel="canonical" href="${this.escapeHtml(url)}" />`;
  }

  /**
   * Generate breadcrumb navigation
   */
  generateBreadcrumbs(items: BreadcrumbItem[]): string {
    if (items.length === 0) return "";

    let html = '<nav aria-label="Breadcrumb" class="breadcrumbs">\n';
    html += '  <ol itemscope itemtype="https://schema.org/BreadcrumbList">\n';

    for (const item of items) {
      html += '    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n';
      html += `      <a itemprop="item" href="${this.escapeHtml(item.url)}">\n`;
      html += `        <span itemprop="name">${this.escapeHtml(item.name)}</span>\n`;
      html += '      </a>\n';
      html += `      <meta itemprop="position" content="${item.position}" />\n`;
      html += '    </li>\n';
    }

    html += '  </ol>\n';
    html += '</nav>';

    return html;
  }

  /**
   * Generate breadcrumb Schema.org JSON-LD
   */
  generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item) => ({
        "@type": "ListItem",
        position: item.position,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /**
   * Build breadcrumbs from URL path
   */
  buildBreadcrumbsFromPath(
    baseUrl: string,
    path: string,
    labels?: Record<string, string>
  ): BreadcrumbItem[] {
    const parts = path.split("/").filter((p) => p.length > 0);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home
    breadcrumbs.push({
      name: "Home",
      url: baseUrl,
      position: 1,
    });

    // Build path incrementally
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      currentPath += `/${parts[i]}`;

      // Use custom label if provided, otherwise humanize the slug
      const label = labels?.[parts[i]] || this.humanizeSlug(parts[i]);

      breadcrumbs.push({
        name: label,
        url: `${baseUrl}${currentPath}`,
        position: i + 2,
      });
    }

    return breadcrumbs;
  }

  /**
   * Analyze URL structure and suggest improvements
   */
  analyzeURL(url: string): URLStructure {
    const issues: string[] = [];
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const parts = path.split("/").filter((p) => p.length > 0);

    // Check URL length
    if (url.length > 100) {
      issues.push("URL is too long (> 100 characters)");
    }

    // Check path depth
    if (parts.length > 4) {
      issues.push(`URL path is too deep (${parts.length} levels, recommended max 4)`);
    }

    // Check for uppercase
    if (path !== path.toLowerCase()) {
      issues.push("URL contains uppercase characters");
    }

    // Check for special characters
    if (/[^a-z0-9\-/]/.test(path)) {
      issues.push("URL contains special characters other than hyphens");
    }

    // Check for consecutive hyphens
    if (/--/.test(path)) {
      issues.push("URL contains consecutive hyphens");
    }

    // Check for underscores (hyphens are preferred)
    if (/_/.test(path)) {
      issues.push("URL contains underscores (hyphens are preferred for SEO)");
    }

    // Check for query parameters
    if (urlObj.search) {
      issues.push("URL contains query parameters (may affect SEO)");
    }

    // Check for numbers at start of slug
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d/.test(lastPart)) {
      issues.push("URL slug starts with a number");
    }

    // Generate optimized version
    const optimized = this.optimizeURL(url);

    // Extract slug (last part of path)
    const slug = parts[parts.length - 1] || "";

    return {
      original: url,
      optimized,
      slug,
      path: parts,
      issues,
    };
  }

  /**
   * Optimize URL structure
   */
  optimizeURL(url: string): string {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Convert to lowercase
    let optimized = path.toLowerCase();

    // Replace underscores with hyphens
    optimized = optimized.replace(/_/g, "-");

    // Remove consecutive hyphens
    optimized = optimized.replace(/-+/g, "-");

    // Remove trailing slash (except for root)
    if (optimized.length > 1) {
      optimized = optimized.replace(/\/$/, "");
    }

    // Remove query parameters
    // (in production, might want to preserve some params)

    return `${urlObj.origin}${optimized}`;
  }

  /**
   * Generate URL redirect map for optimization
   */
  generateRedirectMap(oldUrls: string[], newUrls: string[]): Array<{
    from: string;
    to: string;
    type: number;
  }> {
    const redirects: Array<{ from: string; to: string; type: number }> = [];

    for (let i = 0; i < oldUrls.length && i < newUrls.length; i++) {
      if (oldUrls[i] !== newUrls[i]) {
        redirects.push({
          from: oldUrls[i],
          to: newUrls[i],
          type: 301, // Permanent redirect
        });
      }
    }

    return redirects;
  }

  /**
   * Humanize slug for breadcrumb display
   */
  private humanizeSlug(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

  /**
   * Validate URL against best practices
   */
  validateURL(url: string): { valid: boolean; score: number; issues: string[] } {
    const analysis = this.analyzeURL(url);
    const issues = analysis.issues;

    // Calculate score (100 - 10 points per issue, minimum 0)
    const score = Math.max(0, 100 - (issues.length * 10));

    return {
      valid: issues.length === 0,
      score,
      issues,
    };
  }

  /**
   * Generate pagination rel links
   */
  generatePaginationLinks(baseUrl: string, currentPage: number, totalPages: number): string {
    const links: string[] = [];

    // Previous page
    if (currentPage > 1) {
      const prevUrl = currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}`;
      links.push(`<link rel="prev" href="${this.escapeHtml(prevUrl)}" />`);
    }

    // Next page
    if (currentPage < totalPages) {
      const nextUrl = `${baseUrl}?page=${currentPage + 1}`;
      links.push(`<link rel="next" href="${this.escapeHtml(nextUrl)}" />`);
    }

    return links.join("\n");
  }
}

export const urlOptimizer = URLOptimizer.getInstance();
