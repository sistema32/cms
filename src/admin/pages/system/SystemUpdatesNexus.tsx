import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "@/admin/components/nexus/NexusComponents.tsx";

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  isCritical: boolean;
  releaseDate: Date;
  changelog?: string[];
  cveIds?: string[];
  documentation?: string;
  requiresBackup: boolean;
  requiresRestart: boolean;
}

interface SystemNews {
  id: string;
  title: string;
  summary?: string;
  category: string;
  publishDate: Date;
  imageUrl?: string;
  links?: Array<{ text: string; url: string }>;
}

interface UpdateServerConfig {
  enabled: boolean;
  serverUrl?: string;
  apiKey?: string;
  checkInterval?: number;
  autoDownload?: boolean;
  autoInstall?: boolean;
  allowPrerelease?: boolean;
  verifyChecksum?: boolean;
  verifySignature?: boolean;
  requireHttps?: boolean;
  notifyOnUpdate?: boolean;
  notifyEmail?: string;
  autoBackupBeforeUpdate?: boolean;
  keepBackupDays?: number;
}

interface SystemUpdatesNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  currentVersion: string;
  latestVersion: string;
  updates?: SystemUpdate[];
  news?: SystemNews[];
  config?: UpdateServerConfig;
  lastChecked?: Date;
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

export const SystemUpdatesNexusPage = (props: SystemUpdatesNexusPageProps) => {
  const {
    user,
    currentVersion,
    latestVersion,
    updates = [],
    news = [],
    config,
    lastChecked,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const isUpToDate = currentVersion === latestVersion;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return NexusBadge({ label: "CRÍTICO", type: "error" });
      case "high":
        return NexusBadge({ label: "ALTA", type: "warning" });
      case "medium":
        return NexusBadge({ label: "MEDIA", type: "info", soft: true });
      case "low":
        return NexusBadge({ label: "BAJA", type: "default", soft: true });
      default:
        return NexusBadge({ label: severity.toUpperCase(), type: "default" });
    }
  };

  const content = html`
    <style>
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
        margin: 0;
      }

      .version-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .version-info {
        display: flex;
        gap: 2rem;
        align-items: center;
      }

      .version-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .version-label {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .version-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-weight: 600;
        font-size: 0.875rem;
      }

      .status-indicator.success {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .status-indicator.warning {
        background: rgba(245, 165, 36, 0.1);
        color: var(--nexus-warning, #f5a524);
      }

      .tabs-nav {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid var(--nexus-base-200, #eef0f2);
        margin-bottom: 1.5rem;
      }

      .tab-button {
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
      }

      .tab-button:hover {
        opacity: 1;
        background: rgba(22, 123, 255, 0.05);
      }

      .tab-button.active {
        opacity: 1;
        color: var(--nexus-primary, #167bff);
        border-bottom-color: var(--nexus-primary, #167bff);
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .updates-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .update-item {
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .update-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .update-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.5rem 0;
      }

      .update-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 0.75rem;
      }

      .update-description {
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.8;
        margin-bottom: 1rem;
      }

      .update-badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .changelog-toggle {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .changelog-content {
        display: none;
        margin-top: 0.75rem;
        padding-left: 1.25rem;
      }

      .changelog-content.active {
        display: block;
      }

      .changelog-content ul {
        list-style: disc;
        margin: 0;
        padding-left: 1.25rem;
      }

      .changelog-content li {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        margin-bottom: 0.375rem;
      }

      .news-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .news-card {
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        overflow: hidden;
        transition: all 0.2s;
      }

      .news-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .news-image {
        width: 100%;
        height: 180px;
        object-fit: cover;
      }

      .news-content {
        padding: 1.5rem;
      }

      .news-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.75rem 0;
      }

      .news-summary {
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        margin-bottom: 1rem;
      }

      .news-meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">Actualizaciones del Sistema</h1>
        <p class="page-subtitle-nexus">Gestiona las actualizaciones y noticias del sistema</p>
      </div>
    </div>

    <!-- Version Status -->
    <div class="version-status">
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">Versión Actual</span>
          <span class="version-value">${currentVersion}</span>
        </div>
        <div class="version-item">
          <span class="version-label">Última Versión</span>
          <span class="version-value">${latestVersion}</span>
        </div>
        ${lastChecked ? html`
          <div class="version-item">
            <span class="version-label">Última verificación</span>
            <span class="text-sm text-base-content opacity-70">
              ${new Date(lastChecked).toLocaleString('es-ES')}
            </span>
          </div>
        ` : ''}
      </div>
      <div class="status-indicator ${isUpToDate ? 'success' : 'warning'}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isUpToDate ? html`
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          ` : html`
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          `}
        </svg>
        ${isUpToDate ? 'Sistema Actualizado' : 'Actualizaciones Disponibles'}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="u-flex-gap-md u-mb-lg">
      ${NexusButton({
    label: "Verificar Actualizaciones",
    type: "primary",
    onClick: "checkUpdates()"
  })}
      ${NexusButton({
    label: "Configuración",
    type: "outline",
    onClick: "showConfigTab()"
  })}
    </div>

    <!-- Tabs -->
    <div class="tabs-nav">
      <button type="button" class="tab-button active" data-tab="updates">
        Actualizaciones (${updates.length})
      </button>
      <button type="button" class="tab-button" data-tab="news">
        Noticias (${news.length})
      </button>
      <button type="button" class="tab-button" data-tab="config">
        Configuración
      </button>
    </div>

    <!-- Updates Tab -->
    <div class="tab-content active" data-content="updates">
      ${updates.length === 0 ? html`
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3 class="mt-4 text-lg font-semibold">Sistema Actualizado</h3>
          <p class="mt-2 text-sm">No hay actualizaciones disponibles en este momento</p>
        </div>
      ` : html`
        <div class="updates-list">
          ${updates.map(update => html`
            <div class="update-item" data-update-id="${update.id}">
              <div class="update-header">
                <div class="u-flex-1">
                  <h3 class="update-title">${update.title}</h3>
                  <div class="update-meta">
                    <span>Versión ${update.version}</span>
                    <span>•</span>
                    <span>${update.type}</span>
                    <span>•</span>
                    <span>${new Date(update.releaseDate).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div class="u-flex-gap-sm items-start">
                  ${getSeverityBadge(update.severity)}
                  ${update.isCritical ? html`
                    ${NexusBadge({ label: "CRÍTICO", type: "error" })}
                  ` : ''}
                </div>
              </div>
              <p class="update-description">${update.description}</p>
              ${update.cveIds && update.cveIds.length > 0 ? html`
                <div class="update-badges">
                  <span class="text-xs font-semibold mr-2">CVEs:</span>
                  ${update.cveIds.map(cve => html`
                    <a
                      href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}"
                      target="_blank"
                      style="font-size: 0.8125rem; color: var(--nexus-primary, #167bff); text-decoration: none;"
                    >${cve}</a>
                  `).join(', ')}
                </div>
              ` : ''}
              ${update.requiresBackup || update.requiresRestart ? html`
                <div class="u-flex-gap-md text-xs text-base-content opacity-60 u-mb-md">
                  ${update.requiresBackup ? html`
                    <span>⚠️ Requiere respaldo</span>
                  ` : ''}
                  ${update.requiresRestart ? html`
                    <span>🔄 Requiere reinicio</span>
                  ` : ''}
                </div>
              ` : ''}
              <div class="u-flex-gap-md">
                ${NexusButton({
    label: "Instalar",
    type: "primary",
    size: "sm",
    onClick: `installUpdate('${update.id}')`
  })}
                ${update.documentation ? html`
                  ${NexusButton({
    label: "Documentación",
    type: "outline",
    size: "sm",
    href: update.documentation
  })}
                ` : ''}
              </div>
              ${update.changelog && update.changelog.length > 0 ? html`
                <div class="changelog-toggle">
                  <button
                    type="button"
                    class="notification-action-btn"
                    data-action="toggle-changelog"
                    style="font-size: 0.8125rem; font-weight: 600; color: var(--nexus-primary, #167bff);"
                  >
                    Ver Changelog →
                  </button>
                  <div class="changelog-content" data-changelog="${update.id}">
                    <ul>
                      ${update.changelog.map(item => html`<li>${item}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- News Tab -->
    <div class="tab-content" data-content="news">
      ${news.length === 0 ? html`
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          <h3 class="mt-4 text-lg font-semibold">No hay noticias</h3>
          <p class="mt-2 text-sm">No hay noticias disponibles en este momento</p>
        </div>
      ` : html`
        <div class="news-grid">
          ${news.map(item => html`
            <div class="news-card">
              ${item.imageUrl ? html`
                <img src="${item.imageUrl}" alt="${item.title}" class="news-image" />
              ` : ''}
              <div class="news-content">
                <h3 class="news-title">${item.title}</h3>
                ${item.summary ? html`
                  <p class="news-summary">${item.summary}</p>
                ` : ''}
                <div class="news-meta">
                  ${NexusBadge({
    label: item.category,
    type: item.category === 'security' ? 'error' : 'info',
    soft: true,
    size: 'sm'
  })}
                  <span>${new Date(item.publishDate).toLocaleDateString('es-ES')}</span>
                </div>
                ${item.links && item.links.length > 0 ? html`
                  <div class="mt-4 flex flex-wrap gap-2">
                    ${item.links.map(link => html`
                      <a
                        href="${link.url}"
                        target="_blank"
                        style="font-size: 0.8125rem; font-weight: 600; color: var(--nexus-primary, #167bff); text-decoration: none;"
                      >
                        ${link.text} →
                      </a>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Config Tab -->
    <div class="tab-content" data-content="config">
      ${NexusCard({
    title: "Configuración de Actualizaciones",
    children: html`
          <p class="text-sm text-base-content opacity-70 u-mb-lg">
            Configura cómo y cuándo se deben verificar e instalar las actualizaciones del sistema
          </p>
          <div class="u-flex-col u-gap-md">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" ${config?.enabled ? 'checked' : ''} class="w-4 h-4" />
              <span class="text-sm font-medium">Habilitar sistema de actualizaciones</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" ${config?.autoDownload ? 'checked' : ''} class="w-4 h-4" />
              <span class="text-sm font-medium">Descargar actualizaciones automáticamente</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" ${config?.autoInstall ? 'checked' : ''} class="w-4 h-4" />
              <span class="text-sm font-medium">Instalar actualizaciones automáticamente</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" ${config?.notifyOnUpdate ? 'checked' : ''} class="w-4 h-4" />
              <span class="text-sm font-medium">Notificar sobre actualizaciones</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" ${config?.autoBackupBeforeUpdate ? 'checked' : ''} class="w-4 h-4" />
              <span class="text-sm font-medium">Respaldar automáticamente antes de actualizar</span>
            </label>
          </div>
          <div class="u-mt-xl pt-6 border-t border-base-200 u-flex justify-end gap-3">
            ${NexusButton({
      label: "Restablecer",
      type: "outline"
    })}
            ${NexusButton({
      label: "Guardar Configuración",
      type: "primary"
    })}
          </div>
        `
  })}
    </div>

    ${raw(`
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // XSS safe - Tab switching
          const tabButtons = document.querySelectorAll('[data-tab]');
          const tabContents = document.querySelectorAll('[data-content]');

          tabButtons.forEach(button => {
            button.addEventListener('click', function(e) {
              const tab = e.currentTarget.getAttribute('data-tab');

              // Remove active class from all
              tabButtons.forEach(btn => btn.classList.remove('active'));
              tabContents.forEach(content => content.classList.remove('active'));

              // Add active class to selected
              e.currentTarget.classList.add('active');
              const content = document.querySelector('[data-content="' + tab + '"]');
              content?.classList.add('active');
            });
          });

          // XSS safe - Toggle changelog
          const updatesList = document.querySelector('.updates-list');
          if (updatesList) {
            updatesList.addEventListener('click', function(e) {
              const toggleBtn = e.target.closest('[data-action="toggle-changelog"]');
              if (!toggleBtn) return;

              const updateItem = toggleBtn.closest('.update-item');
              const changelogContent = updateItem?.querySelector('.changelog-content');
              changelogContent?.classList.toggle('active');

              // XSS safe - Update button text
              const textNode = document.createTextNode(
                changelogContent?.classList.contains('active') ? 'Ocultar Changelog ↑' : 'Ver Changelog →'
              );
              toggleBtn.textContent = '';
              toggleBtn.appendChild(textNode);
            });
          }

          // XSS safe - Check updates
          window.checkUpdates = function() {
            alert('Verificando actualizaciones... (funcionalidad en desarrollo)');
          };

          // XSS safe - Install update
          window.installUpdate = function(updateId) {
            if (confirm('¿Instalar esta actualización?')) {
              alert('Instalando actualización ' + updateId + '... (funcionalidad en desarrollo)');
            }
          };

          // XSS safe - Show config tab
          window.showConfigTab = function() {
            const configTab = document.querySelector('[data-tab="config"]');
            configTab?.click();
          };
        });
      </script>
    `)}
  `;

  return AdminLayoutNexus({
    title: "Actualizaciones del Sistema",
    children: content,
    activePage: "system.updates",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default SystemUpdatesNexusPage;
