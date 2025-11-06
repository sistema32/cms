import { html } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

/**
 * Corporate Footer - Premium footer with multiple columns
 */

interface FooterProps {
  site: SiteData;
  custom: Record<string, any>;
  blogUrl?: string;
}

export const Footer = (props: FooterProps) => {
  const { site, custom, blogUrl = "/blog" } = props;

  const currentYear = new Date().getFullYear();
  const logoText = custom.logo_text || site.name || "LX";

  return html`
    <footer class="bg-slate-950/90 border-t border-white/10">
      <div class="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-4">
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-primary-50 shadow-aurora">
              ${logoText.substring(0, 2).toUpperCase()}
            </span>
            <p class="text-sm text-slate-300">
              ${site.description || "Profesionales al servicio de la innovación"}
            </p>
            <div class="text-xs text-slate-500">
              © ${currentYear} ${site.name}. Todos los derechos reservados.
            </div>
          </div>

          <div class="space-y-3 text-sm text-slate-300">
            <h3 class="text-xs uppercase tracking-[0.35em] text-slate-400">Navegación</h3>
            <a href="/" class="block transition hover:text-white">Inicio</a>
            <a href="${blogUrl}" class="block transition hover:text-white">Blog</a>
            <a href="#servicios" class="block transition hover:text-white">Servicios</a>
            <a href="#contacto" class="block transition hover:text-white">Contacto</a>
          </div>

          <div class="space-y-3 text-sm text-slate-300">
            <h3 class="text-xs uppercase tracking-[0.35em] text-slate-400">Legal</h3>
            <a href="/privacy" class="block transition hover:text-white">Privacidad</a>
            <a href="/terms" class="block transition hover:text-white">Términos</a>
            <a href="/cookies" class="block transition hover:text-white">Cookies</a>
          </div>

          <div class="space-y-3 text-sm text-slate-300">
            <h3 class="text-xs uppercase tracking-[0.35em] text-slate-400">Social</h3>
            <a href="#" class="block transition hover:text-white" target="_blank" rel="noopener">LinkedIn</a>
            <a href="#" class="block transition hover:text-white" target="_blank" rel="noopener">Twitter</a>
            <a href="#" class="block transition hover:text-white">Newsletter</a>
          </div>
        </div>

        <div class="mt-12 border-t border-white/10 pt-6 text-[11px] text-slate-500">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Construido con LexCMS</p>
            <p>Diseño por ${site.name}</p>
          </div>
        </div>
      </div>
    </footer>

    <style>
      body.light-mode footer {
        background: rgba(250, 252, 255, 0.96);
        border-top-color: rgba(148, 163, 184, 0.28);
      }

      body.light-mode footer .text-white {
        color: #0f172a !important;
      }

      body.light-mode footer .text-slate-300 {
        color: #334155 !important;
      }

      body.light-mode footer .text-slate-400,
      body.light-mode footer .text-slate-500 {
        color: #64748b !important;
      }
    </style>
  `;
};

export default Footer;
