import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Modern Footer - Contemporary footer design
 */

interface FooterProps {
  site: SiteData;
  custom: Record<string, any>;
}

export const Footer = (props: FooterProps) => {
  const { site } = props;
  const currentYear = new Date().getFullYear();

  return html`
    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <!-- Main Footer Content -->
        <div class="grid grid-cols-1 gap-12 md:grid-cols-4">
          <!-- Brand -->
          <div class="md:col-span-1">
            <div class="flex items-center gap-2">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <span class="text-base font-bold text-white">${site.name.substring(0, 1)}</span>
              </div>
              <span class="text-lg font-bold text-slate-900">${site.name}</span>
            </div>
            <p class="mt-4 text-sm text-slate-600">
              ${site.description || "Building the future, one line of code at a time."}
            </p>
          </div>

          <!-- Product -->
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-900">Product</h3>
            <ul class="mt-4 space-y-3">
              <li>
                <a href="#features" class="text-sm text-slate-600 transition hover:text-slate-900">Features</a>
              </li>
              <li>
                <a href="/blog" class="text-sm text-slate-600 transition hover:text-slate-900">Blog</a>
              </li>
              <li>
                <a href="#pricing" class="text-sm text-slate-600 transition hover:text-slate-900">Pricing</a>
              </li>
              <li>
                <a href="#docs" class="text-sm text-slate-600 transition hover:text-slate-900">Documentation</a>
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-900">Company</h3>
            <ul class="mt-4 space-y-3">
              <li>
                <a href="#about" class="text-sm text-slate-600 transition hover:text-slate-900">About</a>
              </li>
              <li>
                <a href="#team" class="text-sm text-slate-600 transition hover:text-slate-900">Team</a>
              </li>
              <li>
                <a href="#careers" class="text-sm text-slate-600 transition hover:text-slate-900">Careers</a>
              </li>
              <li>
                <a href="#contact" class="text-sm text-slate-600 transition hover:text-slate-900">Contact</a>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-900">Legal</h3>
            <ul class="mt-4 space-y-3">
              <li>
                <a href="/privacy" class="text-sm text-slate-600 transition hover:text-slate-900">Privacy</a>
              </li>
              <li>
                <a href="/terms" class="text-sm text-slate-600 transition hover:text-slate-900">Terms</a>
              </li>
              <li>
                <a href="/cookies" class="text-sm text-slate-600 transition hover:text-slate-900">Cookies</a>
              </li>
              <li>
                <a href="/licenses" class="text-sm text-slate-600 transition hover:text-slate-900">Licenses</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p class="text-sm text-slate-600">
            © ${currentYear} ${site.name}. All rights reserved.
          </p>

          <!-- Social Links -->
          <div class="flex items-center gap-4">
            <a
              href="#"
              class="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Twitter"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="#"
              class="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="GitHub"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </a>
            <a
              href="#"
              class="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="LinkedIn"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;
};

export default Footer;
