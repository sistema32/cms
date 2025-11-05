import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Corporate Header - Glassmorphism navigation with theme toggle
 */

interface HeaderProps {
  site: SiteData;
  custom: Record<string, any>;
}

export const Header = (props: HeaderProps) => {
  const { site, custom } = props;

  const logoText = custom.logo_text || site.name || "LX";
  const tagline = custom.header_tagline || "Professional Services";

  return html`
    <div class="site-nav sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <nav class="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <a href="/" class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-primary-50 shadow-aurora">
            ${logoText.substring(0, 2).toUpperCase()}
          </span>
          <span class="hidden flex-col leading-tight sm:flex">
            <span class="text-sm uppercase tracking-[0.3em] text-slate-300">${site.name}</span>
            <span class="text-lg font-semibold text-white">${tagline}</span>
          </span>
        </a>

        <div class="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex" id="primaryNav">
          <a class="relative nav-indicator transition hover:text-white" href="/">Inicio</a>
          <a class="relative nav-indicator transition hover:text-white" href="/blog">Blog</a>
          <a class="relative nav-indicator transition hover:text-white" href="#servicios">Servicios</a>
          <a class="relative nav-indicator transition hover:text-white" href="#contacto">Contacto</a>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="modeToggle"
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 shadow-aurora transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
            aria-label="Cambiar tema"
          >
            <svg id="modeIcon" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 3a1 1 0 0 1 1 1v1.26a7 7 0 0 1 6.74 6.74H21a1 1 0 1 1 0 2h-1.26a7 7 0 0 1-6.74 6.74V21a1 1 0 1 1-2 0v-1.26a7 7 0 0 1-6.74-6.74H3a1 1 0 1 1 0-2h1.26a7 7 0 0 1 6.74-6.74V4a1 1 0 0 1 1-1Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <a
            href="#contacto"
            class="hidden rounded-full border border-primary-400/60 bg-primary-500/20 px-5 py-2 text-sm font-semibold text-primary-100 shadow-aurora transition hover:bg-primary-500/30 md:inline-flex"
          >
            Contáctanos
          </a>

          <button
            id="mobileMenuToggle"
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 shadow-aurora transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 md:hidden"
            aria-expanded="false"
            aria-controls="mobileMenu"
          >
            <span class="sr-only">Abrir menú</span>
            <svg class="h-5 w-5" data-icon="menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="4" y1="6" x2="20" y2="6" stroke-linecap="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke-linecap="round" />
              <line x1="4" y1="18" x2="20" y2="18" stroke-linecap="round" />
            </svg>
            <svg class="hidden h-5 w-5" data-icon="close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
              <line x1="6" y1="18" x2="18" y2="6" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      <!-- Mobile Menu -->
      <div
        id="mobileMenu"
        class="mobile-menu hidden border-t border-white/10 bg-slate-950/95 px-4 pb-6 pt-4 sm:px-6 text-sm text-slate-200 shadow-aurora md:hidden"
      >
        <nav class="flex flex-col gap-3 font-medium">
          <a class="rounded-full px-4 py-2 transition hover:bg-white/10" href="/">Inicio</a>
          <a class="rounded-full px-4 py-2 transition hover:bg-white/10" href="/blog">Blog</a>
          <a class="rounded-full px-4 py-2 transition hover:bg-white/10" href="#servicios">Servicios</a>
          <a class="rounded-full px-4 py-2 transition hover:bg-white/10" href="#contacto">Contacto</a>
          <a class="rounded-full border border-primary-400/60 bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-100 transition hover:bg-primary-500/30" href="#contacto">Contáctanos</a>
        </nav>
      </div>
    </div>

    <style>
      .nav-indicator::before {
        content: "";
        position: absolute;
        inset-inline: 0;
        bottom: -8px;
        height: 2px;
        background: linear-gradient(
          90deg,
          rgba(var(--aurora-secondary), 0.4),
          rgba(var(--aurora-primary), 0.6)
        );
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 0.4s ease;
      }

      .nav-indicator:hover::before {
        transform: scaleX(1);
      }

      body.light-mode .site-nav {
        background: rgba(255, 255, 255, 0.95);
        border-bottom-color: rgba(148, 163, 184, 0.32);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
      }

      body.light-mode .mobile-menu {
        background: rgba(255, 255, 255, 0.95);
        border-top-color: rgba(148, 163, 184, 0.28);
        color: #0f172a;
      }
    </style>
  `;
};

export default Header;
