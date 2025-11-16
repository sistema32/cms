import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface PluginManifest {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  category?: string;
  tags?: string[];
}

interface PluginStats {
  total: number;
  active: number;
  inactive: number;
  available: number;
}

interface PluginsAvailableNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  plugins: PluginManifest[];
  stats: PluginStats;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
  userPermissions?: string[];
}

export const PluginsAvailableNexusPage = (props: PluginsAvailableNexusPageProps) => {
  const {
    user,
    plugins,
    stats,
    notifications = [],
    unreadNotificationCount = 0,
    userPermissions = [],
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canInstallPlugins = hasPermission("plugins:install") || true; // Default true for now

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
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0 0 0.75rem 0;
      }

      .stats-row {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-value {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        opacity: 1;
      }

      .stat-value.primary {
        color: var(--nexus-primary, #167bff);
      }

      .stat-value.success {
        color: var(--nexus-success, #17c964);
      }

      .stat-value.warning {
        color: var(--nexus-warning, #f5a524);
      }

      .stat-value.secondary {
        color: var(--nexus-secondary, #9c5de8);
      }

      /* ========== TABS NAVIGATION ========== */
      .tabs-nav {
        display: flex;
        gap: 1rem;
        border-bottom: 2px solid var(--nexus-base-200, #eef0f2);
        margin-bottom: 2rem;
      }

      .tab-link {
        padding: 0.75rem 1.25rem;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        text-decoration: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
      }

      .tab-link:hover {
        opacity: 0.8;
      }

      .tab-link.active {
        opacity: 1;
        color: var(--nexus-primary, #167bff);
        border-bottom-color: var(--nexus-primary, #167bff);
      }

      /* ========== PLUGINS GRID ========== */
      .plugins-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .plugin-card {
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        transition: all 0.2s;
      }

      .plugin-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: var(--nexus-base-300, #dcdee0);
      }

      .plugin-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .plugin-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.25rem 0;
      }

      .plugin-meta {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .plugin-description {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        margin-bottom: 1rem;
        line-height: 1.5;
      }

      .plugin-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .plugin-actions {
        display: flex;
        gap: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== EMPTY STATE ========== */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-state-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        opacity: 0.3;
      }

      .empty-state-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.5rem 0;
      }

      .empty-state-text {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 1.5rem;
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .stats-row {
          flex-direction: column;
          gap: 0.5rem;
        }

        .plugins-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <h1 class="page-title-nexus">Plugins Disponibles</h1>
          <p class="page-subtitle-nexus">Plugins encontrados en tu directorio pero no instalados</p>
          <div class="stats-row">
            <span class="stat-item">Total: <span class="stat-value primary">${stats.total}</span></span>
            <span class="stat-item">Activos: <span class="stat-value success">${stats.active}</span></span>
            <span class="stat-item">Inactivos: <span class="stat-value warning">${stats.inactive}</span></span>
            <span class="stat-item">Disponibles: <span class="stat-value secondary">${stats.available}</span></span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          ${NexusButton({
            label: "Marketplace",
            type: "primary",
            href: `${adminPath}/plugins/marketplace`,
            icon: html`
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            `
          })}
          ${NexusButton({
            label: "Actualizar",
            type: "outline",
            onclick: "window.location.reload()"
          })}
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <nav class="tabs-nav">
      <a href="${adminPath}/plugins/installed" class="tab-link">
        Instalados (${stats.total})
      </a>
      <a href="${adminPath}/plugins/available" class="tab-link active">
        Disponibles (${stats.available})
      </a>
      <a href="${adminPath}/plugins/marketplace" class="tab-link">
        Marketplace
      </a>
    </nav>

    <!-- Plugins Grid -->
    ${plugins.length === 0 ? html`
      ${NexusCard({
        children: html`
          <div class="empty-state">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="empty-state-title">Todos los plugins están instalados</h3>
            <p class="empty-state-text">No hay plugins disponibles para instalar</p>
            ${NexusButton({
              label: "Explorar Marketplace",
              type: "primary",
              href: `${adminPath}/plugins/marketplace`
            })}
          </div>
        `
      })}
    ` : html`
      <div class="plugins-grid">
        ${plugins.map((plugin) => html`
          <div class="plugin-card">
            <div class="plugin-header">
              <div style="flex: 1;">
                <h3 class="plugin-title">${plugin.displayName}</h3>
                <p class="plugin-meta">
                  v${plugin.version}${plugin.author ? ` • ${plugin.author}` : ""}
                </p>
                ${plugin.category ? html`
                  <div style="margin-top: 0.5rem;">
                    ${NexusBadge({ label: plugin.category, type: "info", soft: true })}
                  </div>
                ` : ""}
              </div>
              ${NexusBadge({ label: "Disponible", type: "secondary", soft: true })}
            </div>

            <p class="plugin-description">${plugin.description}</p>

            ${plugin.tags && plugin.tags.length > 0 ? html`
              <div class="plugin-tags">
                ${plugin.tags.slice(0, 3).map((tag) =>
                  NexusBadge({ label: tag, type: "default", soft: true })
                )}
              </div>
            ` : ""}

            <div class="plugin-actions">
              ${NexusButton({
                label: "Instalar",
                type: "outline",
                size: "sm",
                onclick: `handleInstall('${plugin.name}', false)`
              })}
              ${NexusButton({
                label: "Instalar y Activar",
                type: "primary",
                size: "sm",
                onclick: `handleInstall('${plugin.name}', true)`
              })}
            </div>
          </div>
        `)}
      </div>
    `}

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // XSS safe - Install handler
      async function handleInstall(pluginName, activate) {
        const action = activate ? 'instalar y activar' : 'instalar';
        const actionCap = action.charAt(0).toUpperCase() + action.slice(1);

        if (!confirm(actionCap + ' el plugin "' + pluginName + '"?')) return;

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/api/plugins/' + pluginName + '/install', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activate: activate })
          });

          if (response.ok) {
            window.location.href = ADMIN_BASE_PATH + '/plugins/installed';
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo instalar el plugin'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Plugins Disponibles",
    children: content,
    activePage: "plugins",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default PluginsAvailableNexusPage;
