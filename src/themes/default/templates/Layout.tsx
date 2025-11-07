import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

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
}

export const Layout = (props: LayoutProps) => {
  const {
    site,
    custom,
    activeTheme = "default",
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;
  const colorScheme = custom.color_scheme || "Light";
  const typography = custom.typography || "Modern sans-serif";
  const primaryColor = custom.primary_color || "#0066cc";

  return html`<!DOCTYPE html>
<html lang="${site.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">

    <!-- Primary Meta Tags -->
    <meta name="title" content="${pageTitle}">
    <meta name="description" content="${description}">

    <!-- Theme Colors -->
    <meta name="theme-color" content="${primaryColor}">

    <!-- Styles -->
    <link rel="stylesheet" href="/themes/${activeTheme}/assets/css/${activeTheme}.css">

    <style>
        :root {
            --primary-color: ${primaryColor};
            --font-family: ${typography === "Elegant serif" ? "Georgia, serif" : typography === "Monospace" ? "monospace" : "system-ui, -apple-system, sans-serif"};
        }
        body {
            font-family: var(--font-family);
        }
        ${colorScheme === "Dark" ? `
        body {
            background-color: #1a1a1a;
            color: #f0f0f0;
        }
        ` : ""}
    </style>
</head>
<body class="${bodyClass} theme-${colorScheme.toLowerCase()}">
    ${children}

    <!-- Scripts -->
    <script src="/themes/${activeTheme}/assets/js/${activeTheme}.js"></script>
</body>
</html>`;
};
