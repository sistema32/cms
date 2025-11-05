import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

interface Plugin {
  id?: number;
  name: string;
  version: string;
  displayName: string;
  description?: string;
  author?: string;
  status: "active" | "inactive";
  isInstalled?: boolean;
}

interface PluginStats {
  total: number;
  active: number;
  inactive: number;
  available: number;
}

interface PluginsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  installedPlugins: Plugin[];
  availablePlugins: string[];
  stats: PluginStats;
  selectedPlugin?: Plugin;
}

export const PluginsPage = (props: PluginsPageProps) => {
  const { user, installedPlugins, availablePlugins, stats, selectedPlugin } =
    props;

  return AdminLayout({
    title: "Plugins",
    activePage: "plugins.all",
    user,
    children: html`
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Plugins
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Instala, activa y configura plugins para extender las
              funcionalidades de LexCMS
            </p>
          </div>
          <button
            onclick="refreshPlugins()"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            Actualizar
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${renderStatCard(
            "Total Instalados",
            stats.total.toString(),
            "text-blue-600",
            "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
          )}
          ${renderStatCard(
            "Activos",
            stats.active.toString(),
            "text-green-600",
            "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          )}
          ${renderStatCard(
            "Inactivos",
            stats.inactive.toString(),
            "text-gray-600",
            "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
          )}
          ${renderStatCard(
            "Disponibles",
            stats.available.toString(),
            "text-purple-600",
            "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
          )}
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8">
            <a
              href="#installed"
              onclick="showTab('installed'); return false;"
              id="tab-installed"
              class="tab-link active border-purple-500 text-purple-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Instalados (${stats.total})
            </a>
            <a
              href="#available"
              onclick="showTab('available'); return false;"
              id="tab-available"
              class="tab-link border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Disponibles (${stats.available})
            </a>
          </nav>
        </div>

        <!-- Installed Plugins Tab -->
        <div id="content-installed" class="tab-content">
          ${installedPlugins.length === 0
            ? html`
                <div
                  class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    ></path>
                  </svg>
                  <h3
                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    No hay plugins instalados
                  </h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Instala plugins desde la pestaña "Disponibles"
                  </p>
                </div>
              `
            : html`
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${installedPlugins.map((plugin) =>
                    renderInstalledPluginCard(plugin),
                  )}
                </div>
              `}
        </div>

        <!-- Available Plugins Tab -->
        <div id="content-available" class="tab-content hidden">
          ${availablePlugins.length === 0
            ? html`
                <div
                  class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <h3
                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Todos los plugins están instalados
                  </h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No hay plugins disponibles para instalar
                  </p>
                </div>
              `
            : html`
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${availablePlugins.map((pluginName) =>
                    renderAvailablePluginCard(pluginName),
                  )}
                </div>
              `}
        </div>
      </div>

      <!-- Settings Modal -->
      <div
        id="settingsModal"
        class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        onclick="if(event.target === this) closeSettingsModal()"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="text-xl font-semibold text-gray-900 dark:text-white"
              id="modalTitle"
            >
              Configuración de Plugin
            </h3>
            <button
              onclick="closeSettingsModal()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <div id="modalContent">
            <!-- Content will be loaded here -->
          </div>
        </div>
      </div>

      <script>
        // Tab switching
        function showTab(tabName) {
          // Hide all tabs
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
          });

          // Remove active class from all tab links
          document.querySelectorAll('.tab-link').forEach(link => {
            link.classList.remove('active', 'border-purple-500', 'text-purple-600');
            link.classList.add('border-transparent', 'text-gray-500');
          });

          // Show selected tab
          document.getElementById('content-' + tabName).classList.remove('hidden');

          // Add active class to selected tab link
          const activeTab = document.getElementById('tab-' + tabName);
          activeTab.classList.add('active', 'border-purple-500', 'text-purple-600');
          activeTab.classList.remove('border-transparent', 'text-gray-500');
        }

        // Plugin actions
        async function activatePlugin(pluginName) {
          if (!confirm('¿Activar el plugin "' + pluginName + '"?')) return;

          try {
            const response = await fetch('/api/plugins/' + pluginName + '/activate', {
              method: 'POST'
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
              method: 'POST'
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
              method: 'DELETE'
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

        async function installPlugin(pluginName, activate = false) {
          const action = activate ? 'instalar y activar' : 'instalar';
          if (!confirm('¿' + action.charAt(0).toUpperCase() + action.slice(1) + ' el plugin "' + pluginName + '"?')) return;

          try {
            const response = await fetch('/api/plugins/' + pluginName + '/install', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ activate })
            });

            if (response.ok) {
              window.location.reload();
            } else {
              const error = await response.json();
              alert('Error: ' + (error.message || 'No se pudo instalar el plugin'));
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        }

        async function openSettings(pluginName) {
          try {
            const response = await fetch('/api/plugins/' + pluginName + '/settings');

            if (response.ok) {
              const settings = await response.json();
              showSettingsModal(pluginName, settings);
            } else {
              alert('No se pudo cargar la configuración del plugin');
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        }

        function showSettingsModal(pluginName, settings) {
          document.getElementById('modalTitle').textContent = 'Configuración: ' + pluginName;

          let html = '<form onsubmit="saveSettings(event, \'' + pluginName + '\')" class="space-y-4">';

          if (Object.keys(settings).length === 0) {
            html += '<p class="text-gray-600 dark:text-gray-400">Este plugin no tiene configuración disponible.</p>';
          } else {
            for (const [key, value] of Object.entries(settings)) {
              html += '<div>';
              html += '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">' + key + '</label>';
              html += '<input type="text" name="' + key + '" value="' + (value || '') + '" ';
              html += 'class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white" />';
              html += '</div>';
            }
          }

          html += '<div class="flex justify-end gap-2 pt-4">';
          html += '<button type="button" onclick="closeSettingsModal()" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>';
          if (Object.keys(settings).length > 0) {
            html += '<button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Guardar</button>';
          }
          html += '</div>';
          html += '</form>';

          document.getElementById('modalContent').innerHTML = html;
          document.getElementById('settingsModal').classList.remove('hidden');
        }

        function closeSettingsModal() {
          document.getElementById('settingsModal').classList.add('hidden');
        }

        async function saveSettings(event, pluginName) {
          event.preventDefault();

          const formData = new FormData(event.target);
          const settings = {};

          for (const [key, value] of formData.entries()) {
            settings[key] = value;
          }

          try {
            const response = await fetch('/api/plugins/' + pluginName + '/settings', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(settings)
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

        function refreshPlugins() {
          window.location.reload();
        }
      </script>
    `,
  });
};

function renderStatCard(
  label: string,
  value: string,
  colorClass: string,
  iconPath: string,
) {
  return html`
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            ${label}
          </p>
          <p class="text-3xl font-bold ${colorClass} mt-2">${value}</p>
        </div>
        <div class="${colorClass} opacity-20">
          <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="${iconPath}"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  `;
}

function renderInstalledPluginCard(plugin: Plugin) {
  const isActive = plugin.status === "active";

  return html`
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            ${plugin.displayName}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            v${plugin.version}
            ${plugin.author ? ` • ${plugin.author}` : ""}
          </p>
        </div>
        <span
          class="px-3 py-1 text-xs font-medium rounded-full ${isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}"
        >
          ${isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <!-- Description -->
      ${plugin.description
        ? html`
            <p
              class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2"
            >
              ${plugin.description}
            </p>
          `
        : ""}

      <!-- Actions -->
      <div class="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        ${isActive
          ? html`
              <button
                onclick="deactivatePlugin('${plugin.name}')"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Desactivar
              </button>
            `
          : html`
              <button
                onclick="activatePlugin('${plugin.name}')"
                class="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Activar
              </button>
            `}
        <button
          onclick="openSettings('${plugin.name}')"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Configuración"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </button>
        <button
          onclick="uninstallPlugin('${plugin.name}')"
          class="px-3 py-2 text-sm border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
          title="Desinstalar"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderAvailablePluginCard(pluginName: string) {
  return html`
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            ${pluginName}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No instalado
          </p>
        </div>
        <span
          class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          Disponible
        </span>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onclick="installPlugin('${pluginName}', false)"
          class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Instalar
        </button>
        <button
          onclick="installPlugin('${pluginName}', true)"
          class="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Instalar y Activar
        </button>
      </div>
    </div>
  `;
}
