import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
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

interface ThemeBrowserNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  themes: ThemeSummary[];
  activeTheme: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

// XSS safe - render screenshot
const renderScreenshot = (screenshots?: ThemeSummary["screenshots"]) => {
  if (!screenshots?.desktop) {
    return html`
      <div class="theme-screenshot-placeholder">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    `;
  }

  return html`
    <img
      src="${screenshots.desktop}"
      alt="Vista previa del theme"
      class="theme-screenshot"
    />
  `;
};

export const ThemeBrowserNexusPage = (props: ThemeBrowserNexusPageProps) => {
  const {
    user,
    themes,
    activeTheme,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const active = themes.find((theme) => theme.isActive);
  const available = themes.filter((theme) => !theme.isActive);

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      /* ========== INFO CARD ========== */
      .info-card {
        background: linear-gradient(135deg, rgba(22, 123, 255, 0.1) 0%, rgba(156, 93, 232, 0.1) 100%);
        border: 1px solid rgba(22, 123, 255, 0.2);
        border-radius: var(--nexus-radius-lg);
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      /* ========== THEME GRID ========== */
      .theme-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      }

      /* ========== THEME CARD ========== */
      .theme-card {
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        overflow: hidden;
        background: var(--nexus-base-100);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        position: relative;
      }

      .theme-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(22, 123, 255, 0.15);
        border-color: var(--nexus-primary);
      }

      .theme-screenshot {
        width: 100%;
        height: 12rem;
        object-fit: cover;
      }

      .theme-screenshot-placeholder {
        width: 100%;
        height: 12rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--nexus-base-200);
        color: var(--nexus-base-content);
        opacity: 0.3;
      }

      .theme-screenshot-placeholder svg {
        width: 4rem;
        height: 4rem;
      }

      .theme-card-body {
        padding: 1.5rem;
      }

      .theme-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .theme-card-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--nexus-base-content);
        margin: 0;
        flex: 1;
      }

      .theme-version {
        font-size: 0.75rem;
        color: var(--nexus-base-content);
        opacity: 0.5;
      }

      .theme-meta {
        font-size: 0.875rem;
        color: var(--nexus-base-content);
        opacity: 0.7;
        margin-bottom: 1rem;
      }

      .theme-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }

      .theme-actions form {
        flex: 1;
      }

      /* ========== EMPTY STATE ========== */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-state svg {
        width: 5rem;
        height: 5rem;
        margin: 0 auto 1rem;
        color: var(--nexus-base-content);
        opacity: 0.3;
      }

      /* ========== CLI HINT ========== */
      .cli-hint {
        margin-top: 2rem;
        padding: 1.5rem;
        border: 2px dashed var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        text-align: center;
      }

      .cli-hint code {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: var(--nexus-base-200);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        font-family: monospace;
        margin-top: 0.75rem;
      }
    </style>

    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Explorador de Themes</h1>
        ${active ? NexusButton({
          label: "Configurar theme activo",
          type: "primary",
          href: `${adminPath}/appearance/themes/settings`
        }) : ""}
      </div>
    </div>

    ${active ? html`
      <div class="info-card">
        <div style="display: flex; align-items: start; gap: 1.5rem; flex-wrap: wrap;">
          ${active.screenshots?.desktop ? html`
            <img
              src="${active.screenshots.desktop}"
              alt="${active.displayName || active.name}"
              style="width: 6rem; height: 4rem; object-fit: cover; border-radius: var(--nexus-radius-md); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
            />
          ` : ""}
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
              <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0;">Theme Activo: ${active.displayName || active.name}</h3>
              ${active.version ? html`<span style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.5;">v${active.version}</span>` : ""}
              ${active.parent ? NexusBadge({ label: `Child de ${active.parent}`, type: "info", soft: true }) : ""}
            </div>
            <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.7;">${active.description || ""}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${NexusButton({
              label: "Configurar",
              type: "outline",
              size: "sm",
              href: `${adminPath}/appearance/themes/settings`
            })}
            ${NexusButton({
              label: "Editar código",
              type: "outline",
              size: "sm",
              href: `${adminPath}/appearance/themes/editor?theme=${active.name}`
            })}
            ${NexusButton({
              label: "Vista previa",
              type: "outline",
              size: "sm",
              href: `${adminPath}/appearance/themes/preview?theme=${active.name}`,
              target: "_blank"
            })}
          </div>
        </div>
      </div>
    ` : ""}

    <div style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">
        ${available.length > 0 ? "Themes Disponibles" : "Todos los Themes"}
      </h2>
      <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.6;">
        Explora y activa diferentes themes para tu sitio
      </p>
    </div>

    ${available.length === 0 && !active ? html`
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
        </svg>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No hay themes instalados</h3>
        <p style="color: var(--nexus-base-content); opacity: 0.6;">
          Usa el generador de themes para crear uno nuevo
        </p>
        <div style="margin-top: 1rem;">
          <code>deno task theme:create</code>
        </div>
      </div>
    ` : html`
      <div class="theme-grid">
        ${available.map((theme) => html`
          <div class="theme-card">
            ${renderScreenshot(theme.screenshots)}

            <div class="theme-card-body">
              <div class="theme-card-header">
                <h3 class="theme-card-title">
                  ${theme.displayName || theme.name}
                </h3>
                ${theme.version ? html`<span class="theme-version">v${theme.version}</span>` : ""}
                ${theme.parent ? NexusBadge({ label: `Child de ${theme.parent}`, type: "info", soft: true }) : ""}
              </div>

              <p class="theme-meta">
                ${theme.description || "Theme disponible para activar."}
              </p>

              ${theme.author?.name ? html`
                <p style="font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.5; margin-bottom: 1rem;">
                  Autor:
                  ${theme.author.url ? html`
                    <a href="${theme.author.url}" style="color: var(--nexus-primary);" target="_blank">
                      ${theme.author.name}
                    </a>
                  ` : theme.author.name}
                </p>
              ` : ""}

              <div class="theme-actions">
                <form method="POST" action="${adminPath}/appearance/themes/activate">
                  <input type="hidden" name="theme" value="${theme.name}" />
                  ${NexusButton({
                    label: "Activar",
                    type: "primary",
                    size: "sm",
                    isSubmit: true,
                    fullWidth: true
                  })}
                </form>
                ${NexusButton({
                  label: "Vista previa",
                  type: "outline",
                  size: "sm",
                  href: `${adminPath}/appearance/themes/preview?theme=${theme.name}`,
                  target: "_blank",
                  fullWidth: true
                })}
              </div>

              <div style="margin-top: 0.5rem;">
                ${NexusButton({
                  label: "Personalizar",
                  type: "ghost",
                  size: "sm",
                  href: `${adminPath}/appearance/themes/customize?theme=${theme.name}`,
                  fullWidth: true
                })}
                ${NexusButton({
                  label: "Editar código",
                  type: "ghost",
                  size: "sm",
                  href: `${adminPath}/appearance/themes/editor?theme=${theme.name}`,
                  fullWidth: true
                })}
              </div>
            </div>
          </div>
        `)}
      </div>
    `}

    <div class="cli-hint">
      <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">¿Necesitas un theme personalizado?</h3>
      <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.6; margin-bottom: 0.75rem;">
        Usa el generador de themes CLI para crear uno nuevo con todas las plantillas necesarias
      </p>
      <code>deno task theme:create</code>
    </div>

    ${raw(`<script>
      // XSS safe - no inline handlers needed for this page
      // All interactions are through standard form submissions and links
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Explorador de Themes",
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemeBrowserNexusPage;
