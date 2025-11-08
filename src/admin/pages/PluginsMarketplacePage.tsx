import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

interface MarketplacePlugin {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  license: string;
  homepage: string;
  downloads: number;
  rating: number;
  verified: boolean;
  price: number;
  thumbnail?: string;
  screenshots?: string[];
  compatibility: {
    lexcms: string;
  };
  permissions: string[];
  features: string[];
}

interface PluginStats {
  total: number;
  active: number;
  inactive: number;
  available: number;
}

interface PluginsMarketplacePageProps {
  user: {
    name: string | null;
    email: string;
  };
  plugins: MarketplacePlugin[];
  stats: PluginStats;
  categories: string[];
  installedPluginNames: string[];
}

export const PluginsMarketplacePage = (
  props: PluginsMarketplacePageProps,
) => {
  const { user, plugins, stats, categories, installedPluginNames } = props;

  return AdminLayout({
    title: "Marketplace de Plugins",
    activePage: "plugins.marketplace",
    user,
    children: html`
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Marketplace de Plugins
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Descubre y descarga plugins para extender LexCMS
            </p>
          </div>
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

        <!-- Stats Cards -->
        ${renderStatsCards(stats)}

        <!-- Tabs Navigation -->
        ${renderTabs("marketplace", stats)}

        <!-- Filters and Search -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <input
                type="text"
                id="searchInput"
                placeholder="Buscar plugins..."
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                oninput="filterPlugins()"
              />
            </div>

            <!-- Category Filter -->
            <div class="w-full md:w-64">
              <select
                id="categoryFilter"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                onchange="filterPlugins()"
              >
                <option value="">Todas las categorías</option>
                ${categories.map(
                  (cat) => html`<option value="${cat}">${cat}</option>`,
                )}
              </select>
            </div>

            <!-- Sort -->
            <div class="w-full md:w-48">
              <select
                id="sortFilter"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                onchange="filterPlugins()"
              >
                <option value="downloads">Más descargados</option>
                <option value="rating">Mejor calificados</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="price">Precio</option>
              </select>
            </div>

            <!-- Verified Only -->
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="verifiedFilter"
                  class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                  onchange="filterPlugins()"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Solo verificados
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Plugins Grid -->
        <div id="pluginsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${plugins.map((plugin) =>
            renderPluginCard(plugin, installedPluginNames),
          )}
        </div>

        <!-- No Results -->
        <div id="noResults" class="hidden text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No se encontraron plugins
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      </div>

      <!-- Plugin Detail Modal -->
      ${renderDetailModal()}

      <script>
        // Store all plugins data
        window.allPlugins = ${JSON.stringify(plugins)};
        window.installedNames = ${JSON.stringify(installedPluginNames)};
      </script>
      <script src="/admin/plugins-marketplace.js"></script>
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

function renderPluginCard(
  plugin: MarketplacePlugin,
  installedPluginNames: string[],
) {
  const isInstalled = installedPluginNames.includes(plugin.name);

  return html`
    <div
      class="plugin-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
      data-name="${plugin.name.toLowerCase()}"
      data-category="${plugin.category}"
      data-downloads="${plugin.downloads}"
      data-rating="${plugin.rating}"
      data-price="${plugin.price}"
      data-verified="${plugin.verified}"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              ${plugin.displayName}
            </h3>
            ${plugin.verified
              ? html`
                  <svg
                    class="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    title="Plugin verificado"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                `
              : ""}
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            v${plugin.version} • ${plugin.author}
          </p>
          <span
            class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            ${plugin.category}
          </span>
        </div>
        ${isInstalled
          ? html`
              <span
                class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Instalado
              </span>
            `
          : plugin.price > 0
            ? html`
                <span
                  class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  $${plugin.price}
                </span>
              `
            : html`
                <span
                  class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  Gratis
                </span>
              `}
      </div>

      <!-- Rating and Downloads -->
      <div class="flex items-center gap-4 mb-3">
        <div class="flex items-center">
          <svg
            class="w-4 h-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            ></path>
          </svg>
          <span class="ml-1 text-sm text-gray-600 dark:text-gray-400">
            ${plugin.rating.toFixed(1)}
          </span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          ${formatNumber(plugin.downloads)} descargas
        </div>
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        ${plugin.description}
      </p>

      <!-- Tags -->
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

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          onclick='showPluginDetails(${JSON.stringify(plugin)}, ${isInstalled})'
          class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Ver detalles
        </button>
        ${!isInstalled
          ? html`
              <button
                onclick="downloadPlugin('${plugin.name}', ${plugin.price})"
                class="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                ${plugin.price > 0 ? "Comprar" : "Descargar"}
              </button>
            `
          : html`
              <a
                href="/admincp/plugins/installed"
                class="flex-1 px-3 py-2 text-sm text-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Ver instalados
              </a>
            `}
      </div>
    </div>
  `;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function renderDetailModal() {
  return html`
    <div
      id="detailModal"
      class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onclick="if(event.target === this) closeDetailModal()"
    >
      <div
        class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white dark:bg-gray-800 mb-10"
      >
        <div class="flex justify-between items-center mb-4">
          <h3
            class="text-2xl font-bold text-gray-900 dark:text-white"
            id="detailModalTitle"
          ></h3>
          <button
            onclick="closeDetailModal()"
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
        <div id="detailModalContent">
          <!-- Content will be loaded here -->
        </div>
      </div>
    </div>
  `;
}

