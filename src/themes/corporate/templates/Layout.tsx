import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Corporate Layout - Premium glassmorphism design with aurora effects
 * Inspired by modern B2B and legal services websites
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
    activeTheme = "corporate",
    title = site.name,
    description = site.description,
    children,
    bodyClass = "",
    seoMetaTags = "",
  } = props;

  const pageTitle = title ? `${title} - ${site.name}` : site.name;
  const primaryColor = custom.primary_color || "#2d6aff";
  const secondaryColor = custom.secondary_color || "#40ebd0";

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
    <meta name="color-scheme" content="dark light">

    <!-- Preload Critical Resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
    <link rel="preload" href="/themes/${activeTheme}/assets/css/${activeTheme}.css" as="style">

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Tailwind CDN for development -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography" defer></script>

    <!-- Styles -->
    <link rel="stylesheet" href="/themes/${activeTheme}/assets/css/${activeTheme}.css">

    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            fontFamily: {
              sans: ["Inter", "system-ui", "sans-serif"],
              display: ["Outfit", "Inter", "sans-serif"],
            },
            colors: {
              primary: {
                50: "#f1f5ff",
                100: "#dbe6ff",
                200: "#b0c7ff",
                300: "#85a8ff",
                400: "#5989ff",
                500: "${primaryColor}",
                600: "#1f50db",
                700: "#153ab2",
                800: "#0d257a",
                900: "#081647",
              },
              secondary: {
                50: "#f0fdfa",
                100: "#ccfbf1",
                200: "#99f6e4",
                300: "#5eead4",
                400: "${secondaryColor}",
                500: "#14b8a6",
                600: "#0d9488",
                700: "#0f766e",
                800: "#115e59",
                900: "#134e4a",
              },
            },
            boxShadow: {
              aurora: "0 30px 80px -20px rgba(93, 127, 255, 0.35)",
              "aurora-lg": "0 40px 100px -30px rgba(93, 127, 255, 0.45)",
            },
            backdropBlur: {
              xs: "2px",
            },
          },
        },
      };
    </script>

    <style>
      :root {
        --aurora-primary: 93, 127, 255;
        --aurora-secondary: 64, 235, 208;
        --surface-glass: rgba(15, 23, 42, 0.65);
        color-scheme: dark light;
      }

      body {
        background:
          radial-gradient(circle at top left, rgba(var(--aurora-primary), 0.12), transparent 45%),
          radial-gradient(circle at right, rgba(var(--aurora-secondary), 0.12), transparent 40%),
          #020617;
        min-height: 100vh;
        font-family: Inter, system-ui, sans-serif;
      }

      body.light-mode {
        background:
          radial-gradient(circle at 15% 20%, rgba(var(--aurora-primary), 0.15), transparent 45%),
          radial-gradient(circle at 85% 25%, rgba(var(--aurora-secondary), 0.2), transparent 55%),
          #f1f5f9;
        color: #0f172a;
      }

      body.light-mode .glass-panel {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.9));
        border-color: rgba(148, 163, 184, 0.3);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      }

      body.light-mode .text-white,
      body.light-mode .text-slate-100,
      body.light-mode .text-slate-200 {
        color: #0f172a !important;
      }

      body.light-mode .text-slate-300,
      body.light-mode .text-slate-400 {
        color: #334155 !important;
      }

      body.light-mode .bg-slate-950,
      body.light-mode .bg-slate-950\/60,
      body.light-mode .bg-slate-950\/70,
      body.light-mode .bg-slate-950\/80,
      body.light-mode .bg-slate-950\/90,
      body.light-mode .bg-slate-950\/95 {
        background-color: rgba(250, 252, 255, 0.96) !important;
      }

      body.light-mode .border-white\/10 {
        border-color: rgba(148, 163, 184, 0.28) !important;
      }

      .aurora-wrapper {
        position: fixed;
        inset: 0;
        pointer-events: none;
        mix-blend-mode: screen;
        opacity: 0.65;
        z-index: -1;
      }

      body.light-mode .aurora-wrapper {
        mix-blend-mode: normal;
        opacity: 0.4;
      }

      .aurora-gradient {
        width: 120vw;
        height: 120vh;
        background: conic-gradient(
          from 45deg,
          rgba(var(--aurora-primary), 0.15),
          rgba(var(--aurora-secondary), 0.1),
          rgba(var(--aurora-primary), 0.25)
        );
        filter: blur(120px);
        transform-origin: center;
        animation: auroraDrift 18s ease-in-out infinite alternate;
      }

      @keyframes auroraDrift {
        0% {
          transform: translate3d(-10%, -5%, 0) scale(1.05) rotate(0deg);
        }
        50% {
          transform: translate3d(5%, 2%, 0) scale(1.2) rotate(15deg);
        }
        100% {
          transform: translate3d(-4%, 6%, 0) scale(1.05) rotate(-12deg);
        }
      }

      .glass-panel {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.45));
        border: 1px solid rgba(148, 163, 184, 0.12);
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(16px);
      }

      .scroll-reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.9s ease, transform 0.9s ease;
      }

      .scroll-reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      @media (prefers-reduced-motion: reduce) {
        .aurora-gradient {
          animation: none;
        }
        .scroll-reveal {
          transition: none !important;
        }
      }
    </style>
</head>
<body class="${bodyClass} theme-corporate light-mode">
    <!-- Aurora Background -->
    <div class="aurora-wrapper" aria-hidden="true">
      <div id="aurora-gradient" class="aurora-gradient"></div>
    </div>

    ${children}

    <!-- Scripts -->
    <script src="/themes/${activeTheme}/assets/js/${activeTheme}.js" defer></script>
</body>
</html>`;
};
