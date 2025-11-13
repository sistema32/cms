import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

export interface ThemeSummary {
  name: string;
  displayName?: string;
  version?: string;
  description?: string;
  author?: {
    name?: string;
    url?: string;
  };
  screenshots?: {
    desktop?: string;
    mobile?: string;
  };
  isActive: boolean;
  parent?: string;
}

interface ThemeBrowserPageProps {
  user: {
    name: string | null;
    email: string;
  };
  themes: ThemeSummary[];
  activeTheme: string;
}

const renderScreenshot = (screenshots?: ThemeSummary["screenshots"]) => {
  if (!screenshots?.desktop) {
    return html`
      <div class="h-48 rounded-t-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    `;
  }

  return html`
    <img
      src="${screenshots.desktop}"
      alt="Vista previa del theme"
      class="h-48 w-full object-cover rounded-t-xl"
    />
  `;
};

export const ThemeBrowserPage = (props: ThemeBrowserPageProps) => {
  const { user, themes, activeTheme } = props;

  const active = themes.find((theme) => theme.isActive);
  const available = themes.filter((theme) => !theme.isActive);

  const content = html`
    <style>
      .theme-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      }

      .theme-card {
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
        transition: all 0.3s ease;
        position: relative;
      }

      .theme-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(79, 70, 229, 0.2);
      }

      .dark .theme-card {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
      }

      .theme-card.active {
        border-color: rgba(124, 58, 237, 0.5);
        box-shadow: 0 8px 32px rgba(124, 58, 237, 0.25);
      }

      .theme-card__body {
        padding: 1.5rem;
      }

      .theme-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.375rem 0.875rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(16, 185, 129, 0.95);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      }

      .theme-badge-child {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.7rem;
        background: rgba(59, 130, 246, 0.14);
        color: rgba(37, 99, 235, 0.95);
      }

      .dark .theme-badge-child {
        background: rgba(59, 130, 246, 0.22);
        color: rgba(147, 197, 253, 0.92);
      }

      .theme-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .info-card {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
        border: 1px solid rgba(124, 58, 237, 0.2);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .dark .info-card {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
        border-color: rgba(124, 58, 237, 0.3);
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Explorador de Themes</h1>
      <div class="page-actions">
        ${active
          ? html`
            <a href="${env.ADMIN_PATH}/appearance/themes/settings" class="btn-action">
              Configurar theme activo
            </a>
          `
          : ""}
        <a href="${env.ADMIN_PATH}/appearance/menus" class="btn-secondary">
          Gestionar menús
        </a>
      </div>
    </div>

    ${active
      ? html`
        <div class="info-card">
          <div class="flex items-start gap-4">
            ${active.screenshots?.desktop
              ? html`
                <img
                  src="${active.screenshots.desktop}"
                  alt="${active.displayName || active.name}"
                  class="w-24 h-16 object-cover rounded-lg shadow-md"
                />
              `
              : ""}
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-lg font-bold">Theme Activo: ${active.displayName || active.name}</h3>
                ${active.version ? html`<span class="text-sm text-gray-500">v${active.version}</span>` : ""}
                ${active.parent
                  ? html`
                    <span class="theme-badge-child">
                      Child de ${active.parent}
                    </span>
                  `
                  : ""}
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-300">${active.description || ""}</p>
            </div>
            <div class="flex gap-2">
              <a
                href="${env.ADMIN_PATH}/appearance/themes/settings"
                class="btn-secondary btn-sm"
              >
                Configurar
              </a>
              <a
                href="${env.ADMIN_PATH}/appearance/themes/editor?theme=${active.name}"
                class="btn-secondary btn-sm"
              >
                Editar código
              </a>
              <a
                href="${env.ADMIN_PATH}/appearance/themes/preview?theme=${active.name}"
                class="btn-secondary btn-sm"
                target="_blank"
              >
                Vista previa
              </a>
            </div>
          </div>
        </div>
      `
      : ""}

    <div class="mb-4">
      <h2 class="text-xl font-semibold">
        ${available.length > 0 ? "Themes Disponibles" : "Todos los Themes"}
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Explora y activa diferentes themes para tu sitio
      </p>
    </div>

    ${available.length === 0 && !active
      ? html`
        <div class="text-center py-12">
          <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">No hay themes instalados</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Usa el generador de themes para crear uno nuevo
          </p>
          <div class="mt-4">
            <code class="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm">
              deno task theme:create
            </code>
          </div>
        </div>
      `
      : html`
        <div class="theme-grid">
          ${available.map((theme) => html`
            <div class="theme-card">
              ${renderScreenshot(theme.screenshots)}

              ${theme.isActive
                ? html`
                  <span class="theme-badge">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Activo
                  </span>
                `
                : ""}

              <div class="theme-card__body">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 class="text-lg font-semibold">
                      ${theme.displayName || theme.name}
                    </h3>
                    ${theme.version
                      ? html`<span class="text-xs text-gray-500">v${theme.version}</span>`
                      : ""}
                  </div>
                  ${theme.parent
                    ? html`
                      <span class="theme-badge-child">
                        Child de ${theme.parent}
                      </span>
                    `
                    : ""}
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  ${theme.description || "Theme disponible para activar."}
                </p>

                ${theme.author?.name
                  ? html`
                    <p class="text-xs text-gray-500 mb-3">
                      Autor:
                      ${theme.author.url
                        ? html`
                          <a
                            href="${theme.author.url}"
                            class="text-purple-600 dark:text-purple-400 hover:underline"
                            target="_blank"
                          >
                            ${theme.author.name}
                          </a>
                        `
                        : theme.author.name}
                    </p>
                  `
                  : ""}

                <div class="theme-actions">
                  <form method="POST" action="${env.ADMIN_PATH}/appearance/themes/activate" class="flex-1">
                    <input type="hidden" name="theme" value="${theme.name}" />
                    <button type="submit" class="btn-action btn-sm w-full">
                      Activar
                    </button>
                  </form>
                  <a
                    href="${env.ADMIN_PATH}/appearance/themes/preview?theme=${theme.name}"
                    class="btn-secondary btn-sm"
                    target="_blank"
                    title="Vista previa"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </a>
                </div>

                <div class="flex gap-2 mt-2">
                  <a
                    href="${env.ADMIN_PATH}/appearance/themes/customize?theme=${theme.name}"
                    class="btn-ghost btn-sm flex-1 text-center"
                  >
                    Personalizar
                  </a>
                  <a
                    href="${env.ADMIN_PATH}/appearance/themes/editor?theme=${theme.name}"
                    class="btn-ghost btn-sm flex-1 text-center"
                  >
                    Editar código
                  </a>
                </div>
              </div>
            </div>
          `)}
        </div>
      `}

    <div class="mt-8 p-6 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-center">
      <h3 class="text-lg font-semibold mb-2">¿Necesitas un theme personalizado?</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Usa el generador de themes CLI para crear uno nuevo con todas las plantillas necesarias
      </p>
      <code class="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm inline-block">
        deno task theme:create
      </code>
    </div>
  `;

  return AdminLayout({
    title: "Explorador de Themes",
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

export default ThemeBrowserPage;
