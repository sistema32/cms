/**
 * TypeScript SDK - Helper Functions
 * Utilities y funciones helper para theme developers
 */

import { html } from "./types.ts";
import type {
  CategoryData,
  HtmlEscapedString,
  MenuItemData,
  PaginationData,
  PostData,
  TagData,
} from "./types.ts";

/**
 * Formatea una fecha
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: "short" | "long" | "relative" = "short",
  locale = "es-ES",
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return getRelativeTime(dateObj, locale);
  }

  const options: Intl.DateTimeFormatOptions = format === "long"
    ? { year: "numeric", month: "long", day: "numeric" }
    : { year: "numeric", month: "short", day: "numeric" };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Obtiene tiempo relativo (ej: "hace 2 horas")
 */
export function getRelativeTime(date: Date, locale = "es-ES"): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (years > 0) return rtf.format(-years, "year");
  if (months > 0) return rtf.format(-months, "month");
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

/**
 * Genera excerpt de un texto
 */
export function generateExcerpt(text: string, length = 150, suffix = "..."): string {
  if (!text) return "";

  // Remover HTML tags
  const plainText = text.replace(/<[^>]*>/g, "");

  if (plainText.length <= length) return plainText;

  return plainText.slice(0, length).trim() + suffix;
}

/**
 * Calcula tiempo de lectura
 */
export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  if (!content) return 0;

  const plainText = content.replace(/<[^>]*>/g, "");
  const words = plainText.trim().split(/\s+/).length;

  return Math.ceil(words / wordsPerMinute);
}

/**
 * Renderiza un menú jerárquico
 */
export function renderMenu(
  items: MenuItemData[],
  className = "",
  maxDepth = 3,
  currentDepth = 0,
): HtmlEscapedString {
  if (!items || items.length === 0 || currentDepth >= maxDepth) {
    return html``;
  }

  return html`
    <ul class="${className} ${currentDepth > 0 ? "submenu" : ""}">
      ${items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const target = item.target || "_self";

        return html`
          <li class="${hasChildren ? "has-children" : ""}">
            <a
              href="${item.url || `/${item.slug}`}"
              target="${target}"
              ${target === "_blank" ? 'rel="noopener noreferrer"' : ""}
            >
              ${item.icon ? html`<span class="menu-icon">${item.icon}</span>` : ""}
              <span>${item.title}</span>
            </a>
            ${hasChildren
              ? renderMenu(item.children!, `${className}-submenu`, maxDepth, currentDepth + 1)
              : ""}
          </li>
        `;
      })}
    </ul>
  `;
}

/**
 * Renderiza paginación
 */
export function renderPagination(
  pagination: PaginationData,
  baseUrl: string,
  options?: {
    showNumbers?: boolean;
    showPrevNext?: boolean;
    maxPages?: number;
    className?: string;
  },
): HtmlEscapedString {
  const {
    showNumbers = true,
    showPrevNext = true,
    maxPages = 7,
    className = "pagination",
  } = options || {};

  if (pagination.totalPages <= 1) {
    return html``;
  }

  const pages = getPaginationPages(pagination.currentPage, pagination.totalPages, maxPages);

  return html`
    <nav class="${className}" aria-label="Pagination">
      <ul class="${className}__list">
        ${showPrevNext && pagination.hasPrev
          ? html`
            <li class="${className}__item">
              <a
                href="${baseUrl}${pagination.prevPage === 1 ? "" : `/page/${pagination.prevPage}`}"
                class="${className}__link ${className}__link--prev"
                aria-label="Previous page"
              >
                <span aria-hidden="true">←</span>
                <span>Anterior</span>
              </a>
            </li>
          `
          : ""}
        ${showNumbers
          ? pages.map((page) => {
            if (page === -1) {
              return html`
                  <li class="${className}__item ${className}__item--ellipsis">
                    <span>…</span>
                  </li>
                `;
            }

            const isCurrent = page === pagination.currentPage;
            const href = page === 1 ? baseUrl : `${baseUrl}/page/${page}`;

            return html`
                <li class="${className}__item">
                  <a
                    href="${href}"
                    class="${className}__link ${isCurrent ? `${className}__link--current` : ""}"
                    aria-label="Page ${page}"
                    ${isCurrent ? 'aria-current="page"' : ""}
                  >
                    ${page}
                  </a>
                </li>
              `;
          })
          : ""}
        ${showPrevNext && pagination.hasNext
          ? html`
            <li class="${className}__item">
              <a
                href="${baseUrl}/page/${pagination.nextPage}"
                class="${className}__link ${className}__link--next"
                aria-label="Next page"
              >
                <span>Siguiente</span>
                <span aria-hidden="true">→</span>
              </a>
            </li>
          `
          : ""}
      </ul>
    </nav>
  `;
}

/**
 * Calcula páginas para mostrar en paginación
 */
function getPaginationPages(current: number, total: number, maxPages: number): number[] {
  const pages: number[] = [];

  if (total <= maxPages) {
    // Mostrar todas las páginas
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Siempre mostrar primera página
  pages.push(1);

  const leftSide = Math.max(2, current - Math.floor((maxPages - 2) / 2));
  const rightSide = Math.min(total - 1, current + Math.floor((maxPages - 2) / 2));

  if (leftSide > 2) {
    pages.push(-1); // Ellipsis
  }

  for (let i = leftSide; i <= rightSide; i++) {
    pages.push(i);
  }

  if (rightSide < total - 1) {
    pages.push(-1); // Ellipsis
  }

  // Siempre mostrar última página
  pages.push(total);

  return pages;
}

/**
 * Renderiza breadcrumbs
 */
export function renderBreadcrumbs(
  items: { title: string; url?: string }[],
  className = "breadcrumbs",
): HtmlEscapedString {
  if (!items || items.length === 0) {
    return html``;
  }

  return html`
    <nav class="${className}" aria-label="Breadcrumb">
      <ol class="${className}__list">
        ${items.map((item, index) => {
          const isLast = index === items.length - 1;

          return html`
            <li class="${className}__item">
              ${isLast || !item.url
                ? html`<span class="${className}__text">${item.title}</span>`
                : html`<a href="${item.url}" class="${className}__link">${item.title}</a>`}
            </li>
          `;
        })}
      </ol>
    </nav>
  `;
}

/**
 * Renderiza lista de categorías
 */
export function renderCategoryList(
  categories: CategoryData[],
  options?: {
    showCount?: boolean;
    className?: string;
    linkClassName?: string;
  },
): HtmlEscapedString {
  const { showCount = false, className = "category-list", linkClassName = "category-link" } =
    options || {};

  if (!categories || categories.length === 0) {
    return html``;
  }

  return html`
    <ul class="${className}">
      ${categories.map((category) =>
        html`
          <li class="${className}__item">
            <a href="/category/${category.slug}" class="${linkClassName}">
              ${category.name}
              ${showCount && category.postCount
                ? html`<span class="count">(${category.postCount})</span>`
                : ""}
            </a>
          </li>
        `
      )}
    </ul>
  `;
}

/**
 * Renderiza lista de tags
 */
export function renderTagList(
  tags: TagData[],
  options?: {
    showCount?: boolean;
    className?: string;
    linkClassName?: string;
  },
): HtmlEscapedString {
  const { showCount = false, className = "tag-list", linkClassName = "tag-link" } = options ||
    {};

  if (!tags || tags.length === 0) {
    return html``;
  }

  return html`
    <ul class="${className}">
      ${tags.map((tag) =>
        html`
          <li class="${className}__item">
            <a href="/tag/${tag.slug}" class="${linkClassName}">
              #${tag.name}
              ${showCount && tag.postCount
                ? html`<span class="count">(${tag.postCount})</span>`
                : ""}
            </a>
          </li>
        `
      )}
    </ul>
  `;
}

/**
 * Genera URL de asset del theme
 */
export function themeAsset(path: string, themeName?: string): string {
  const theme = themeName || ""; // Se debería obtener del contexto
  return `/themes/${theme}/assets/${path}`;
}

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(html: string): string {
  // Implementación básica - en producción usar DOMPurify o similar
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape para atributos HTML
 */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Pluraliza una palabra según count
 */
export function pluralize(word: string, count: number, plural?: string): string {
  if (count === 1) return word;
  return plural || `${word}s`;
}

/**
 * Trunca texto a un número de palabras
 */
export function truncateWords(text: string, words: number, suffix = "..."): string {
  if (!text) return "";

  const wordArray = text.trim().split(/\s+/);

  if (wordArray.length <= words) return text;

  return wordArray.slice(0, words).join(" ") + suffix;
}

/**
 * Convierte slug a title case
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Genera meta tags para SEO
 */
export function renderMetaTags(
  post: PostData,
  siteData: { name: string; description: string; url: string },
): HtmlEscapedString {
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt || "";
  const image = post.seo?.ogImage || post.featuredImage || "";
  const url = post.seo?.canonicalUrl || `${siteData.url}/${post.slug}`;

  return html`
    <title>${title} | ${siteData.name}</title>
    <meta name="description" content="${description}" />
    ${post.seo?.keywords
      ? html`<meta name="keywords" content="${post.seo.keywords}" />`
      : ""}

    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    ${image ? html`<meta property="og:image" content="${image}" />` : ""}
    <meta property="og:site_name" content="${siteData.name}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? html`<meta name="twitter:image" content="${image}" />` : ""}

    <!-- Canonical -->
    <link rel="canonical" href="${url}" />
  `;
}

/**
 * Renderiza schema.org JSON-LD
 */
export function renderSchemaOrg(
  post: PostData,
  siteData: { name: string; url: string },
): HtmlEscapedString {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    image: post.featuredImage || "",
    author: {
      "@type": "Person",
      name: post.author?.name || "Unknown",
    },
    publisher: {
      "@type": "Organization",
      name: siteData.name,
      url: siteData.url,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
  };

  return html`
    <script type="application/ld+json">
      ${JSON.stringify(schema)}
    </script>
  `;
}
