import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Magazine Layout - Layout estilo revista/periódico
 * Diseño profesional con tipografía llamativa y estructura de columnas
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
    activeTheme = "magazine",
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
    seoMetaTags = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;
  const primaryColor = custom.primary_color || "#c41e3a"; // Red magazine style

  return html`<!DOCTYPE html>
<html lang="${site.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    ${seoMetaTags ? html([seoMetaTags]) : html`
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">
    <meta name="title" content="${pageTitle}">
    `}

    <!-- Theme Colors -->
    <meta name="theme-color" content="${primaryColor}">

    <!-- Preload Critical Resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="/themes/${activeTheme}/assets/css/${activeTheme}.css" as="style">

    <!-- Google Fonts for Magazine style -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="/themes/${activeTheme}/assets/css/${activeTheme}.css">

    <style>
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: #1a1a1a;
            --text-color: #333;
            --border-color: #e0e0e0;
            --font-serif: 'Playfair Display', Georgia, serif;
            --font-body: 'Lora', Georgia, serif;
            --font-sans: 'Inter', system-ui, sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-body);
            color: var(--text-color);
            line-height: 1.6;
            background: #fff;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-serif);
            font-weight: 900;
            line-height: 1.2;
        }

        .container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Magazine-specific header bar */
        .magazine-topbar {
            background: var(--secondary-color);
            color: #fff;
            padding: 8px 0;
            font-family: var(--font-sans);
            font-size: 13px;
            border-bottom: 3px solid var(--primary-color);
        }

        .magazine-topbar .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</head>
<body class="${bodyClass} theme-magazine">
    <!-- Magazine Top Bar -->
    <div class="magazine-topbar">
        <div class="container">
            <div class="topbar-left">
                <span>📰 ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="topbar-right">
                <span>Edición Digital</span>
            </div>
        </div>
    </div>

    ${children}

    <!-- Scripts -->
    <script src="/themes/${activeTheme}/assets/js/${activeTheme}.js" defer></script>
</body>
</html>`;
};
