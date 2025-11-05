import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Minimalist Layout - Layout minimalista y limpio
 * Diseño simple, elegante y centrado en el contenido
 */

interface LayoutProps {
  site: SiteData;
  custom: Record<string, any>;
  title?: string;
  description?: string;
  children: any;
  bodyClass?: string;
}

export const Layout = (props: LayoutProps) => {
  const {
    site,
    custom,
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;
  const primaryColor = custom.primary_color || "#000";

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

    <!-- Google Fonts for Minimalist style -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="/themes/minimalist/assets/css/minimalist.css">

    <style>
        :root {
            --primary-color: ${primaryColor};
            --text-color: #1a1a1a;
            --text-light: #666;
            --bg-color: #fff;
            --bg-light: #fafafa;
            --border-color: #e5e5e5;
            --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
            --font-serif: 'Merriweather', Georgia, serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-sans);
            color: var(--text-color);
            line-height: 1.7;
            background: var(--bg-color);
            font-weight: 300;
            letter-spacing: -0.01em;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-serif);
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: -0.02em;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* Minimalist spacing */
        .site-main {
            padding: 80px 0;
        }
    </style>
</head>
<body class="${bodyClass} theme-minimalist">
    ${children}

    <!-- Scripts -->
    <script src="/themes/minimalist/assets/js/minimalist.js"></script>
</body>
</html>`;
};
