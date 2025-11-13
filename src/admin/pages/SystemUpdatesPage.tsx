import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import type { NotificationItem } from "../components/NotificationPanel.tsx";
import type {
  SystemUpdate,
  SystemNews,
  UpdateServerConfig,
  UpdateHistoryEntry,
} from "../../lib/system-updates/types.ts";

/**
 * Escapes HTML entities
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SystemUpdatesPageProps {
  user?: {
    name: string;
    email: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
  currentVersion: string;
  latestVersion: string;
  updates?: SystemUpdate[];
  news?: SystemNews[];
  config?: UpdateServerConfig;
  history?: UpdateHistoryEntry[];
  lastChecked?: Date;
}

export const SystemUpdatesPage = (props: SystemUpdatesPageProps) => {
  const {
    user,
    notifications = [],
    unreadNotificationCount = 0,
    currentVersion,
    latestVersion,
    updates = [],
    news = [],
    config,
    history = [],
    lastChecked,
  } = props;

  const hasUpdates = updates.length > 0;
  const isUpToDate = currentVersion === latestVersion;

  const content = html`
    <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">
          Actualizaciones del Sistema
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gestiona las actualizaciones y noticias desde el servidor central
        </p>
      </div>

      <!-- Version Status Card -->
      <div class="grid grid-cols-12 gap-6 mb-8">
        <div class="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Estado del Sistema</h2>
              <div class="flex items-center space-x-4">
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">Versión Actual:</span>
                  <span class="ml-2 text-lg font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(currentVersion)}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">Última Versión:</span>
                  <span class="ml-2 text-lg font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(latestVersion)}</span>
                </div>
              </div>
            </div>
            <div>
              ${isUpToDate
                ? html`
                  <div class="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                    </svg>
                    <span class="font-semibold">Sistema Actualizado</span>
                  </div>
                `
                : html`
                  <div class="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13,14H11V9H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                    </svg>
                    <span class="font-semibold">Actualizaciones Disponibles</span>
                  </div>
                `
              }
            </div>
          </div>

          ${lastChecked
            ? html`
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Última verificación: ${new Date(lastChecked).toLocaleString('es')}
              </p>
            `
            : ''
          }

          <div class="mt-4 flex space-x-3">
            <button
              onclick="checkForUpdates()"
              class="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
            >
              Verificar Actualizaciones
            </button>
            <button
              onclick="openSettings()"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
            >
              Configuración
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8">
            <button
              onclick="switchTab('updates')"
              id="tab-updates"
              class="tab-button active border-b-2 border-violet-500 py-4 px-1 text-sm font-medium text-violet-600 dark:text-violet-400"
            >
              Actualizaciones (${updates.length})
            </button>
            <button
              onclick="switchTab('news')"
              id="tab-news"
              class="tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Noticias (${news.length})
            </button>
            <button
              onclick="switchTab('history')"
              id="tab-history"
              class="tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Historial (${history.length})
            </button>
            <button
              onclick="switchTab('config')"
              id="tab-config"
              class="tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Configuración
            </button>
          </nav>
        </div>
      </div>

      <!-- Updates Tab -->
      <div id="content-updates" class="tab-content">
        ${updates.length > 0
          ? html`
            <div class="space-y-4">
              ${updates.map((update) => {
                const safeTitle = escapeHtml(update.title);
                const safeDescription = escapeHtml(update.description);
                const safeVersion = escapeHtml(update.version);

                return html`
                  <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${safeTitle}</h3>
                          <span class="px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            update.severity === 'critical'
                              ? 'bg-red-500/20 text-red-700'
                              : update.severity === 'high'
                              ? 'bg-orange-500/20 text-orange-700'
                              : update.severity === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-700'
                              : 'bg-blue-500/20 text-blue-700'
                          }">
                            ${update.severity.toUpperCase()}
                          </span>
                          ${update.isCritical
                            ? html`
                              <span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-600 text-white">
                                CRÍTICO
                              </span>
                            `
                            : ''
                          }
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Versión: ${safeVersion} | Tipo: ${update.type} | ${new Date(update.releaseDate).toLocaleDateString('es')}
                        </p>
                        <p class="text-gray-700 dark:text-gray-300 mb-3">${safeDescription}</p>

                        ${update.cveIds && update.cveIds.length > 0
                          ? html`
                            <div class="mb-3">
                              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">CVEs: </span>
                              ${update.cveIds.map((cve) => html`
                                <a
                                  href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}"
                                  target="_blank"
                                  class="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 mr-2"
                                >${escapeHtml(cve)}</a>
                              `).join('')}
                            </div>
                          `
                          : ''
                        }

                        ${update.changelog && update.changelog.length > 0
                          ? html`
                            <div class="mt-3">
                              <button
                                onclick="toggleChangelog('${update.id}')"
                                class="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 font-medium"
                              >
                                Ver Changelog →
                              </button>
                              <div id="changelog-${update.id}" class="hidden mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  ${update.changelog.map((item) => html`<li>• ${escapeHtml(item)}</li>`).join('')}
                                </ul>
                              </div>
                            </div>
                          `
                          : ''
                        }
                      </div>

                      <div class="flex flex-col space-y-2 ml-4">
                        <button
                          onclick="installUpdate('${update.id}')"
                          class="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Instalar
                        </button>
                        ${update.documentation
                          ? html`
                            <a
                              href="${update.documentation}"
                              target="_blank"
                              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium text-sm text-center transition-colors"
                            >
                              Documentación
                            </a>
                          `
                          : ''
                        }
                      </div>
                    </div>

                    ${update.requiresBackup || update.requiresRestart
                      ? html`
                        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            ${update.requiresBackup
                              ? html`
                                <div class="flex items-center">
                                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9A2,2 0 0,1 6,7H9V9H6V21H18V9H15V7H18A2,2 0 0,1 20,9V21A2,2 0 0,1 18,23Z"/>
                                  </svg>
                                  Requiere respaldo
                                </div>
                              `
                              : ''
                            }
                            ${update.requiresRestart
                              ? html`
                                <div class="flex items-center">
                                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12,4C14.1,4.1 15.9,5.1 17.2,6.6L15,8.8H22V2L19.8,4.2C18.1,2.3 15.7,1 13,1C8.4,1 4.6,4.4 4.1,8.9L6.2,9.1C6.6,5.6 9.6,3 13.1,3M12,20C9.9,19.9 8.1,18.9 6.8,17.4L9,15.2H2V22L4.2,19.8C5.9,21.7 8.3,23 11,23C15.6,23 19.4,19.6 19.9,15.1L17.8,14.9C17.4,18.4 14.4,21 10.9,21"/>
                                  </svg>
                                  Requiere reinicio
                                </div>
                              `
                              : ''
                            }
                          </div>
                        </div>
                      `
                      : ''
                    }
                  </div>
                `;
              }).join('')}
            </div>
          `
          : html`
            <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Sistema Actualizado
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                No hay actualizaciones disponibles en este momento
              </p>
            </div>
          `
        }
      </div>

      <!-- News Tab -->
      <div id="content-news" class="tab-content hidden">
        ${news.length > 0
          ? html`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${news.map((item) => {
                const safeTitle = escapeHtml(item.title);
                const safeSummary = item.summary ? escapeHtml(item.summary) : '';

                return html`
                  <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
                    ${item.imageUrl
                      ? html`
                        <img src="${item.imageUrl}" alt="${safeTitle}" class="w-full h-48 object-cover" />
                      `
                      : ''
                    }
                    <div class="p-6">
                      <div class="flex items-center space-x-2 mb-3">
                        <span class="px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          item.category === 'security'
                            ? 'bg-red-500/20 text-red-700'
                            : item.category === 'announcement'
                            ? 'bg-blue-500/20 text-blue-700'
                            : 'bg-gray-500/20 text-gray-700'
                        }">
                          ${item.category}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          ${new Date(item.publishDate).toLocaleDateString('es')}
                        </span>
                      </div>

                      <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">${safeTitle}</h3>
                      ${safeSummary
                        ? html`<p class="text-gray-600 dark:text-gray-400 mb-4">${safeSummary}</p>`
                        : ''
                      }

                      ${item.links && item.links.length > 0
                        ? html`
                          <div class="flex flex-wrap gap-2 mt-4">
                            ${item.links.map((link) => html`
                              <a
                                href="${link.url}"
                                target="_blank"
                                class="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 font-medium"
                              >
                                ${escapeHtml(link.text)} →
                              </a>
                            `).join('')}
                          </div>
                        `
                        : ''
                      }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `
          : html`
            <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-12 text-center">
              <p class="text-gray-600 dark:text-gray-400">No hay noticias disponibles</p>
            </div>
          `
        }
      </div>

      <!-- History Tab -->
      <div id="content-history" class="tab-content hidden">
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
          <p class="p-8 text-center text-gray-600 dark:text-gray-400">
            Historial de actualizaciones (próximamente)
          </p>
        </div>
      </div>

      <!-- Config Tab -->
      <div id="content-config" class="tab-content hidden">
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">
            Configuración de Actualizaciones
          </h3>

          <form onsubmit="saveConfig(event)" class="space-y-6">
            <!-- General Settings -->
            <div>
              <h4 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">General</h4>
              <div class="space-y-4">
                <label class="flex items-center">
                  <input type="checkbox" ${config?.enabled ? 'checked' : ''} name="enabled" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitar sistema de actualizaciones</span>
                </label>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL del Servidor
                  </label>
                  <input
                    type="url"
                    name="serverUrl"
                    value="${config?.serverUrl || ''}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://updates.example.com/api/v1"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key (opcional)
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    value="${config?.apiKey || ''}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="your-api-key"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intervalo de Verificación (minutos)
                  </label>
                  <input
                    type="number"
                    name="checkInterval"
                    value="${config?.checkInterval || 360}"
                    min="30"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <!-- Automation -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">Automatización</h4>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input type="checkbox" ${config?.autoDownload ? 'checked' : ''} name="autoDownload" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Descargar actualizaciones automáticamente</span>
                </label>

                <label class="flex items-center">
                  <input type="checkbox" ${config?.autoInstall ? 'checked' : ''} name="autoInstall" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Instalar actualizaciones automáticamente</span>
                </label>

                <label class="flex items-center">
                  <input type="checkbox" ${config?.allowPrerelease ? 'checked' : ''} name="allowPrerelease" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Permitir versiones pre-release</span>
                </label>
              </div>
            </div>

            <!-- Security -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">Seguridad</h4>
              <div class="space-y-3">
                <label class="flex items-center">
                  <input type="checkbox" ${config?.verifyChecksum ? 'checked' : ''} name="verifyChecksum" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Verificar checksum de descargas</span>
                </label>

                <label class="flex items-center">
                  <input type="checkbox" ${config?.verifySignature ? 'checked' : ''} name="verifySignature" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Verificar firma digital</span>
                </label>

                <label class="flex items-center">
                  <input type="checkbox" ${config?.requireHttps ? 'checked' : ''} name="requireHttps" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Requerir HTTPS</span>
                </label>
              </div>
            </div>

            <!-- Notifications -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">Notificaciones</h4>
              <div class="space-y-4">
                <label class="flex items-center">
                  <input type="checkbox" ${config?.notifyOnUpdate ? 'checked' : ''} name="notifyOnUpdate" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Notificar sobre actualizaciones</span>
                </label>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email para notificaciones
                  </label>
                  <input
                    type="email"
                    name="notifyEmail"
                    value="${config?.notifyEmail || ''}"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
            </div>

            <!-- Backup -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-4">Respaldos</h4>
              <div class="space-y-4">
                <label class="flex items-center">
                  <input type="checkbox" ${config?.autoBackupBeforeUpdate ? 'checked' : ''} name="autoBackupBeforeUpdate" class="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Respaldar automáticamente antes de actualizar</span>
                </label>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mantener respaldos por (días)
                  </label>
                  <input
                    type="number"
                    name="keepBackupDays"
                    value="${config?.keepBackupDays || 30}"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-6 flex space-x-3">
              <button
                type="submit"
                class="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
              >
                Guardar Configuración
              </button>
              <button
                type="button"
                onclick="resetConfig()"
                class="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
              >
                Restablecer Valores
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      // Tab switching
      function switchTab(tab) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(el => {
          el.classList.remove('active', 'border-violet-500', 'text-violet-600', 'dark:text-violet-400');
          el.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        });

        // Show selected tab content
        document.getElementById('content-' + tab).classList.remove('hidden');

        // Add active class to selected tab
        const activeTab = document.getElementById('tab-' + tab);
        activeTab.classList.add('active', 'border-violet-500', 'text-violet-600', 'dark:text-violet-400');
        activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
      }

      // Toggle changelog
      function toggleChangelog(updateId) {
        const changelog = document.getElementById('changelog-' + updateId);
        changelog.classList.toggle('hidden');
      }

      // Check for updates
      async function checkForUpdates() {
        alert('Verificando actualizaciones... (funcionalidad en desarrollo)');
      }

      // Install update
      async function installUpdate(updateId) {
        if (confirm('¿Está seguro de que desea instalar esta actualización?')) {
          alert('Instalando actualización ' + updateId + '... (funcionalidad en desarrollo)');
        }
      }

      // Save configuration
      async function saveConfig(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        alert('Guardando configuración... (funcionalidad en desarrollo)');
      }

      // Reset configuration
      function resetConfig() {
        if (confirm('¿Está seguro de que desea restablecer la configuración a los valores por defecto?')) {
          location.reload();
        }
      }

      // Open settings
      function openSettings() {
        switchTab('config');
      }
    </script>
  `;

  return AdminLayout({
    title: "Actualizaciones del Sistema",
    children: content,
    activePage: "system.updates",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default SystemUpdatesPage;
