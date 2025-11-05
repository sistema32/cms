import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Base Footer - Simple footer
 */

interface FooterProps {
  site: SiteData;
  custom: Record<string, any>;
}

export const Footer = (props: FooterProps) => {
  const { site } = props;
  const currentYear = new Date().getFullYear();

  return html`
    <footer class="border-t border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <!-- About -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900">${site.name}</h3>
            <p class="mt-4 text-sm text-gray-600">
              ${site.description || "A clean and simple theme for your content."}
            </p>
          </div>

          <!-- Links -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Links</h3>
            <ul class="mt-4 space-y-2">
              <li>
                <a href="/" class="text-sm text-gray-600 hover:text-gray-900">Home</a>
              </li>
              <li>
                <a href="/blog" class="text-sm text-gray-600 hover:text-gray-900">Blog</a>
              </li>
              <li>
                <a href="#about" class="text-sm text-gray-600 hover:text-gray-900">About</a>
              </li>
              <li>
                <a href="#contact" class="text-sm text-gray-600 hover:text-gray-900">Contact</a>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Legal</h3>
            <ul class="mt-4 space-y-2">
              <li>
                <a href="/privacy" class="text-sm text-gray-600 hover:text-gray-900">Privacy</a>
              </li>
              <li>
                <a href="/terms" class="text-sm text-gray-600 hover:text-gray-900">Terms</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 border-t border-gray-200 pt-8">
          <p class="text-sm text-gray-500">
            © ${currentYear} ${site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `;
};

export default Footer;
