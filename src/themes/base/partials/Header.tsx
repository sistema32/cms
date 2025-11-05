import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Base Header - Simple header with navigation
 */

interface HeaderProps {
  site: SiteData;
  custom: Record<string, any>;
}

export const Header = (props: HeaderProps) => {
  const { site } = props;

  return html`
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900">
              ${site.name}
            </a>
          </div>

          <!-- Navigation -->
          <nav class="hidden space-x-8 md:flex">
            <a href="/" class="text-sm font-medium text-gray-700 hover:text-gray-900">
              Home
            </a>
            <a href="/blog" class="text-sm font-medium text-gray-700 hover:text-gray-900">
              Blog
            </a>
            <a href="#about" class="text-sm font-medium text-gray-700 hover:text-gray-900">
              About
            </a>
            <a href="#contact" class="text-sm font-medium text-gray-700 hover:text-gray-900">
              Contact
            </a>
          </nav>

          <!-- Mobile menu button -->
          <button
            id="mobile-menu-button"
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            aria-expanded="false"
          >
            <span class="sr-only">Open menu</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden pb-4 md:hidden">
          <div class="space-y-1">
            <a href="/" class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Home
            </a>
            <a href="/blog" class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Blog
            </a>
            <a href="#about" class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              About
            </a>
            <a href="#contact" class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">
              Contact
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
};

export default Header;
