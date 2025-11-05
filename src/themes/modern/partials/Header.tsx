import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Modern Header - Contemporary header with backdrop blur
 */

interface HeaderProps {
  site: SiteData;
  custom: Record<string, any>;
}

export const Header = (props: HeaderProps) => {
  const { site } = props;

  return html`
    <header class="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <a href="/" class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <span class="text-sm font-bold text-white">${site.name.substring(0, 1)}</span>
              </div>
              <span class="text-lg font-bold text-slate-900">${site.name}</span>
            </a>
          </div>

          <!-- Navigation -->
          <nav class="hidden space-x-1 md:flex">
            <a
              href="/"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Home
            </a>
            <a
              href="/blog"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Blog
            </a>
            <a
              href="#features"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#about"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              About
            </a>
          </nav>

          <!-- CTA -->
          <div class="flex items-center gap-4">
            <a
              href="#contact"
              class="hidden rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-purple-500/70 md:inline-flex"
            >
              Get Started
            </a>

            <!-- Mobile menu button -->
            <button
              id="mobile-menu-button"
              type="button"
              class="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
              aria-expanded="false"
            >
              <span class="sr-only">Open menu</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden pb-4 md:hidden">
          <div class="space-y-1">
            <a
              href="/"
              class="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Home
            </a>
            <a
              href="/blog"
              class="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Blog
            </a>
            <a
              href="#features"
              class="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Features
            </a>
            <a
              href="#about"
              class="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-100"
            >
              About
            </a>
            <a
              href="#contact"
              class="block rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-base font-medium text-white"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
};

export default Header;
