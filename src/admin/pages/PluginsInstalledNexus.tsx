import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import {
  NexusBadge,
  NexusButton,
  NexusCard,
} from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface Plugin {
  id?: number;
  name: string;
  version: string;
  displayName: string;
  description?: string;
  author?: string;
  category?: string;
  status: "active" | "inactive";
  isInstalled?: boolean;
}

interface PluginStats {
  total: number;
  active: number;
  inactive: number;
  available: number;
}

interface PluginsInstalledNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  plugins: Plugin[];
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

export const PluginsInstalledNexusPage = (
  props: PluginsInstalledNexusPageProps,
) => {
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
  const hasPermission = (permission: string) =>
    userPermissions.includes(permission);
  const canManagePlugins = hasPermission("plugins:manage") || true; // Default true for now

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

    .plugin-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--nexus-base-200, #eef0f2);
    }

    .action-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--nexus-radius-sm, 0.25rem);
      background: transparent;
      border: 1px solid var(--nexus-base-300, #dcdee0);
      color: var(--nexus-base-content, #1e2328);
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: var(--nexus-base-200, #eef0f2);
      border-color: var(--nexus-primary, #167bff);
      color: var(--nexus-primary, #167bff);
    }

    .action-btn.danger:hover {
      border-color: var(--nexus-error, #f31260);
      color: var(--nexus-error, #f31260);
      background: rgba(243, 18, 96, 0.1);
    }

    /* ========== MODAL ========== */
    dialog.modal {
      position: fixed;
      inset: 0;
      z-index: 999;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      border: none;
    }

    dialog.modal[open] {
      display: flex !important;
    }

    .modal-box {
      position: relative;
      width: 90%;
      max-width: 600px;
      background: var(--nexus-base-100, #fff);
      border-radius: var(--nexus-radius-lg, 0.75rem);
      padding: 1.5rem;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--nexus-base-content, #1e2328);
      margin: 0;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--nexus-base-content, #1e2328);
      opacity: 0.5;
      cursor: pointer;
      border-radius: var(--nexus-radius-sm, 0.25rem);
      transition: all 0.2s;
    }

    .modal-close:hover {
      opacity: 1;
      background: var(--nexus-base-200, #eef0f2);
    }

    .modal-content {
      padding: 1rem 0;
    }

    .form-field {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--nexus-base-content, #1e2328);
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: var(--nexus-base-content, #1e2328);
      background: var(--nexus-base-100, #fff);
      border: 1px solid var(--nexus-base-300, #dcdee0);
      border-radius: var(--nexus-radius-md, 0.5rem);
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--nexus-primary, #167bff);
      box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
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

      .modal-box {
        width: 95%;
        padding: 1rem;
      }
    }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div
        style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;"
      >
        <div>
          <h1 class="page-title-nexus">Plugins Instalados</h1>
          <p class="page-subtitle-nexus">Gestiona tus plugins instalados</p>
          <div class="stats-row">
            <span class="stat-item">Total: <span class="stat-value primary"
              >${stats.total}</span></span>
            <span class="stat-item">Activos: <span class="stat-value success"
              >${stats.active}</span></span>
            <span class="stat-item">Inactivos: <span class="stat-value warning"
              >${stats.inactive}</span></span>
            <span class="stat-item">Disponibles: <span class="stat-value secondary"
              >${stats.available}</span></span>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            ${NexusButton({
    label: "Marketplace",
    type: "primary",
    href: `${adminPath}/plugins/marketplace`,
    icon: html`
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              `,
  })} ${NexusButton({
    label: "Actualizar",
    type: "outline",
    onClick: "window.location.reload()",
  })}
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <nav class="tabs-nav">
        <a href="${adminPath}/plugins/installed" class="tab-link active">
          Instalados (${stats.total})
        </a>
        <a href="${adminPath}/plugins/available" class="tab-link">
          Disponibles (${stats.available})
        </a>
        <a href="${adminPath}/plugins/marketplace" class="tab-link">
          Marketplace
        </a>
      </nav>

      <!-- Plugins Grid -->
      ${plugins.length === 0
      ? html`
          ${NexusCard({
        children: html`
              <div class="empty-state">
                <svg
                  class="empty-state-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  >
                  </path>
                </svg>
                <h3 class="empty-state-title">No hay plugins instalados</h3>
                <p class="empty-state-text">Explora el marketplace para encontrar plugins</p>
                ${NexusButton({
          label: "Ver Marketplace",
          type: "primary",
          href: `${adminPath}/plugins/marketplace`,
        })}
              </div>
            `,
      })}
        `
      : html`
          <div class="plugins-grid">
            ${plugins.map((plugin) => {
        const isActive = plugin.status === "active";
        // Debug logging
        console.log(`Plugin ${plugin.name}: status="${plugin.status}", isActive=${isActive}`);

        return html`
                <div class="plugin-card" data-plugin-name="${plugin.name}" data-plugin-status="${plugin.status}">
                  <div class="plugin-header">
                    <div style="flex: 1;">
                      <h3 class="plugin-title">${plugin.displayName}</h3>
                      <p class="plugin-meta">
                        v${plugin.version}${plugin.author
            ? ` • ${plugin.author}`
            : ""}
                      </p>
                      ${plugin.category
            ? html`
                          <div style="margin-top: 0.5rem;">
                            ${NexusBadge({
              label: plugin.category,
              type: "info",
              soft: true,
            })}
                          </div>
                        `
            : ""}
                    </div>
                    ${NexusBadge({
              label: isActive ? "Activo" : "Inactivo",
              type: isActive ? "success" : "default",
              soft: true,
            })}
                  </div>

                  ${plugin.description
            ? html`
                      <p class="plugin-description">${plugin.description}</p>
                    `
            : ""}

                  <div class="plugin-actions">
                    ${isActive
            ? html`
                        <button
                          onclick="deactivatePlugin('${plugin.name}')"
                          class="nexus-btn nexus-btn-outline nexus-btn-sm"
                        >
                          Desactivar
                        </button>
                      `
            : html`
                        <button
                          onclick="activatePlugin('${plugin.name}')"
                          class="nexus-btn nexus-btn-primary nexus-btn-sm"
                        >
                          Activar
                        </button>
                      `}
                    <button
                      data-plugin-name="${plugin.name}"
                      class="action-btn btn-settings"
                      title="Configuración"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6" />
                        <path
                          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                        />
                      </svg>
                    </button>
                    <button
                      data-plugin-name="${plugin.name}"
                      class="action-btn danger btn-uninstall"
                      title="Desinstalar"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              `;
      })}
          </div>
        `}

      <!-- Settings Modal -->
      <dialog id="settingsModal" class="modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="modalTitle" class="modal-title">Configuración de Plugin</h3>
            <button type="button" class="modal-close" onclick="closeSettingsModal()">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div id="modalContent" class="modal-content">
            <!-- Content will be loaded here -->
          </div>
        </div>
      </dialog>

      <script>
      async function activatePlugin(pluginName) {
        if (!confirm('¿Activar el plugin "' + pluginName + '"?')) return;

        try {
          const response = await fetch('/api/plugins/' + pluginName + '/activate', {
            method: 'POST',
            credentials: 'same-origin'
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo activar el plugin'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      async function deactivatePlugin(pluginName) {
        if (!confirm('¿Desactivar el plugin "' + pluginName + '"?')) return;

        try {
          const response = await fetch('/api/plugins/' + pluginName + '/deactivate', {
            method: 'POST',
            credentials: 'same-origin'
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo desactivar el plugin'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      async function uninstallPlugin(pluginName) {
        if (!confirm('¿Desinstalar el plugin "' + pluginName + '"? Esta acción no se puede deshacer.')) return;

        try {
          const response = await fetch('/api/plugins/' + pluginName, {
            method: 'DELETE',
            credentials: 'same-origin'
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo desinstalar el plugin'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      // XSS safe - Settings modal
      async function openSettings(pluginName) {
        try {
          const response = await fetch('/api/plugins/' + pluginName + '/settings', {
            credentials: 'same-origin'
          });

          if (response.ok) {
            const data = await response.json();
            showSettingsModal(pluginName, data.data || {});
          } else {
            alert('No se pudo cargar la configuración del plugin');
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      // XSS safe - Build settings modal using DOM API
      function showSettingsModal(pluginName, settings) {
        const modal = document.getElementById('settingsModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');

        // XSS safe - textContent
        title.textContent = 'Configuración: ' + pluginName;
        content.innerHTML = ''; // Clear previous content

        // Create form
        const form = document.createElement('form');
        form.id = 'settingsForm';
        form.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

        if (Object.keys(settings).length === 0) {
          const emptyMsg = document.createElement('p');
          emptyMsg.style.cssText = 'opacity: 0.6; text-align: center; padding: 2rem;';
          emptyMsg.textContent = 'Este plugin no tiene configuración disponible.'; // XSS safe
          content.appendChild(emptyMsg);
        } else {
          // XSS safe - Create fields using DOM API
          for (const key in settings) {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-field';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = key; // XSS safe

            const input = document.createElement('input');
            input.type = 'text';
            input.name = key;
            input.value = settings[key] || ''; // XSS safe
            input.className = 'form-input';

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            form.appendChild(fieldDiv);
          }

          content.appendChild(form);
        }

        // Create action buttons
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'nexus-btn nexus-btn-outline';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = closeSettingsModal;

        actions.appendChild(cancelBtn);

        if (Object.keys(settings).length > 0) {
          const saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.className = 'nexus-btn nexus-btn-primary';
          saveBtn.textContent = 'Guardar';
          saveBtn.onclick = () => saveSettings(pluginName);
          actions.appendChild(saveBtn);
        }

        content.appendChild(actions);
        modal.showModal();
      }

      function closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal?.close();
      }

      // XSS safe - Save settings
      async function saveSettings(pluginName) {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        const formData = new FormData(form);
        const settings = {};

        // XSS safe - FormData entries
        for (const pair of formData.entries()) {
          settings[pair[0]] = pair[1];
        }

        try {
          const response = await fetch('/api/plugins/' + pluginName + '/settings', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ settings: settings })
          });

          if (response.ok) {
            closeSettingsModal();
            alert('Configuración guardada exitosamente');
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo guardar la configuración'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      // Initialize event listeners
      document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('click', function(e) {
          const settingsBtn = e.target.closest('.btn-settings');
          if (settingsBtn) {
            const pluginName = settingsBtn.dataset.pluginName;
            openSettings(pluginName);
          }

          const uninstallBtn = e.target.closest('.btn-uninstall');
          if (uninstallBtn) {
            const pluginName = uninstallBtn.dataset.pluginName;
            uninstallPlugin(pluginName);
          }
        });
      });
      </script>
    `;

  return AdminLayoutNexus({
    title: "Plugins Instalados",
    children: content,
    activePage: "plugins",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default PluginsInstalledNexusPage;
