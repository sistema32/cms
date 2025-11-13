import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Base Layout - Clean and minimal layout for development
 * Perfect starting point for custom themes
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

export const Layout = (props: LayoutProps) => {
  const {
    site,
    custom,
    activeTheme = "base",
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
    seoMetaTags = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;

  return html`<!DOCTYPE html>
<html lang="${site.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    ${seoMetaTags ? html([seoMetaTags]) : html`
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">
    `}

    <!-- Preload Critical Resources -->
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
    <link rel="preload" href="/themes/${activeTheme}/assets/css/${activeTheme}.css" as="style">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com" defer></script>

    <!-- Custom Styles -->
    <link rel="stylesheet" href="/themes/${activeTheme}/assets/css/${activeTheme}.css">

    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
            },
          },
        },
      };
    </script>
</head>
<body class="${bodyClass} bg-white text-gray-900">
    ${children}

    <!-- Scripts -->
    <script src="/themes/${activeTheme}/assets/js/${activeTheme}.js" defer></script>
</body>
</html>`;
};
