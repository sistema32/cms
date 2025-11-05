import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Modern Layout - Contemporary design inspired by tiptap.dev and astro.build
 * Features gradients, animations, and modern aesthetics
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
  const accentColor = custom.accent_color || "#6366f1";

  return html`<!DOCTYPE html>
<html lang="${site.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom Styles -->
    <link rel="stylesheet" href="/themes/modern/assets/css/modern.css">

    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              display: ['Space Grotesk', 'Inter', 'sans-serif'],
            },
            colors: {
              accent: {
                50: '#f5f3ff',
                100: '#ede9fe',
                200: '#ddd6fe',
                300: '#c4b5fd',
                400: '#a78bfa',
                500: '${accentColor}',
                600: '#7c3aed',
                700: '#6d28d9',
                800: '#5b21b6',
                900: '#4c1d95',
              },
            },
            animation: {
              'fade-in': 'fadeIn 0.6s ease-in-out',
              'slide-up': 'slideUp 0.6s ease-out',
              'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              slideUp: {
                '0%': { transform: 'translateY(20px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              },
              glow: {
                '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
                '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
              },
            },
          },
        },
      };
    </script>

    <style>
      body {
        font-family: Inter, system-ui, sans-serif;
      }

      .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .gradient-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    </style>
</head>
<body class="${bodyClass} bg-slate-50 text-slate-900 antialiased">
    <!-- Background Gradients -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div class="absolute top-20 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    ${children}

    <!-- Scripts -->
    <script src="/themes/modern/assets/js/modern.js"></script>
</body>
</html>`;
};
