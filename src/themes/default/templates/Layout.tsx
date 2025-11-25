import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import type { SiteData } from "../helpers/index.ts";
import { hookManager } from "../../../lib/plugin-system/HookManager.ts";

/**
 * Layout Base - Template principal que envuelve todas las páginas
 * Inspirado en default.hbs de Ghost y get_header()/get_footer() de WordPress
 */

interface LayoutProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  title?: string;
  description?: string;
  children: any;
  bodyClass?: string;
  seoMetaTags?: string;
}

export const Layout = async (props: LayoutProps) => {
  const {
    site,
    custom,
    activeTheme = "default",
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
    seoMetaTags = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;
  const colorScheme = custom.color_scheme || "Light";
  const typography = custom.typography || "Modern sans-serif";
  const primaryColor = custom.primary_color || "#0066cc";

  const fontFamily = typography === "Elegant serif"
    ? "Georgia, serif"
    : typography === "Monospace"
      ? "monospace"
      : "system-ui, -apple-system, sans-serif";

  const darkModeStyles = colorScheme === "Dark" ? `
    body {
      background-color: #1a1a1a;
      color: #f0f0f0;
    }
  ` : "";

  // Apply filters for head and footer injection
  const injectedHead = await hookManager.applyFilters("theme:head", "");
  const injectedFooter = await hookManager.applyFilters("theme:footer", "");
  const finalBodyClass = await hookManager.applyFilters("theme:bodyClass", `${bodyClass} theme-${colorScheme.toLowerCase()}`);

  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang={site.language}>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          {seoMetaTags ? (
            raw(seoMetaTags)
          ) : (
            <>
              <title>{pageTitle}</title>
              <meta name="description" content={description} />
              <meta name="title" content={pageTitle} />
            </>
          )}

          {/* Theme Colors */}
          <meta name="theme-color" content={primaryColor} />

          {/* Preload Critical Resources */}
          <link rel="preload" href={`/themes/${activeTheme}/assets/css/main.css`} as="style" />

          {/* Styles */}
          <link rel="stylesheet" href={`/themes/${activeTheme}/assets/css/main.css`} />

          <style>
            {raw(`
              :root {
                --primary-color: ${primaryColor};
                --font-family: ${fontFamily};
              }
              body {
                font-family: var(--font-family);
              }
              ${darkModeStyles}
            `)}
          </style>

          {/* Injected Head Content (Plugins) */}
          {injectedHead && raw(injectedHead)}
        </head>
        <body className={finalBodyClass}>
          {children}

          {/* Scripts */}
          <script src={`/themes/${activeTheme}/assets/js/main.js`} defer></script>

          {/* Injected Footer Content (Plugins) */}
          {injectedFooter && raw(injectedFooter)}
        </body>
      </html>
    </>
  );
};

export default Layout;
