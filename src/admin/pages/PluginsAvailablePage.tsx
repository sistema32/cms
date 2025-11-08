import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

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

interface PluginsAvailablePageProps {
  user: {
    name: string | null;
    email: string;
  };
  plugins: PluginManifest[];
  stats: PluginStats;
}

export const PluginsAvailablePage = (props: PluginsAvailablePageProps) => {
  const { user, plugins, stats } = props;

  return AdminLayout({
    title: "Plugins Disponibles",
    activePage: "plugins.available",
    user,
    children: html`
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Plugins Disponibles
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Plugins encontrados en tu directorio pero no instalados
            </p>
          </div>
          <div class="flex gap-2">
            <a
              href="/admincp/plugins/marketplace"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              Marketplace
            </a>
            <button
              onclick="window.location.reload()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
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
        </div>

        <!-- Stats Cards -->
        ${renderStatsCards(stats)}

        <!-- Tabs Navigation -->
        ${renderTabs("available", stats)}

        <!-- Plugins Grid -->
        ${plugins.length === 0
          ? renderEmptyState()
          : html`
              <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                ${plugins.map((plugin) => renderPluginCard(plugin))}
              </div>
            `}
      </div>

      <script>
        ${pluginActionsScript}
      </script>
    `,
  });
};

function renderStatsCards(stats: PluginStats) {
  return html`
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
  `;
}

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

function renderTabs(currentTab: string, stats: PluginStats) {
  return html`
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <a
          href="/admincp/plugins/installed"
          class="${currentTab === "installed"
            ? "border-purple-500 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Instalados (${stats.total})
        </a>
        <a
          href="/admincp/plugins/available"
          class="${currentTab === "available"
            ? "border-purple-500 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Disponibles (${stats.available})
        </a>
        <a
          href="/admincp/plugins/marketplace"
          class="${currentTab === "marketplace"
            ? "border-purple-500 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Marketplace
        </a>
      </nav>
    </div>
  `;
}

function renderEmptyState() {
  return html`
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
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Todos los plugins están instalados
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        No hay plugins disponibles para instalar
      </p>
      <div class="mt-6">
        <a
          href="/admincp/plugins/marketplace"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          Explorar Marketplace
        </a>
      </div>
    </div>
  `;
}

function renderPluginCard(plugin: PluginManifest) {
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
          ${plugin.category
            ? html`
                <span
                  class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  ${plugin.category}
                </span>
              `
            : ""}
        </div>
        <span
          class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          Disponible
        </span>
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        ${plugin.description}
      </p>

      <!-- Tags -->
      ${plugin.tags && plugin.tags.length > 0
        ? html`
            <div class="flex flex-wrap gap-1 mb-4">
              ${plugin.tags.slice(0, 3).map(
                (tag) => html`
                  <span
                    class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  >
                    ${tag}
                  </span>
                `,
              )}
            </div>
          `
        : ""}

      <!-- Actions -->
      <div
        class="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <button
          onclick="installPlugin('${plugin.name}', false)"
          class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Instalar
        </button>
        <button
          onclick="installPlugin('${plugin.name}', true)"
          class="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Instalar y Activar
        </button>
      </div>
    </div>
  `;
}

const pluginActionsScript = `
async function installPlugin(pluginName, activate) {
  const action = activate ? 'instalar y activar' : 'instalar';
  const actionCap = action.charAt(0).toUpperCase() + action.slice(1);
  if (!confirm(actionCap + ' el plugin "' + pluginName + '"?')) return;

  try {
    const response = await fetch('/api/plugins/' + pluginName + '/install', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activate: activate })
    });

    if (response.ok) {
      window.location.href = '/admincp/plugins/installed';
    } else {
      const error = await response.json();
      alert('Error: ' + (error.message || 'No se pudo instalar el plugin'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
`;
