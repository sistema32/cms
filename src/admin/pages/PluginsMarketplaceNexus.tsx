import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

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

interface PluginsMarketplaceNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  plugins: MarketplacePlugin[];
  stats: PluginStats;
  categories: string[];
  installedPluginNames: string[];
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

export const PluginsMarketplaceNexusPage = (props: PluginsMarketplaceNexusPageProps) => {
  const {
    user,
    plugins,
    stats,
    categories,
    installedPluginNames,
    notifications = [],
    unreadNotificationCount = 0,
    userPermissions = [],
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canInstallPlugins = hasPermission("plugins:install") || true; // Default true for now

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

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

      /* ========== FILTERS ========== */
      .filters-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr auto;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .filter-input,
      .filter-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .filter-input:focus,
      .filter-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .filter-checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
        white-space: nowrap;
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
        margin-bottom: 0.75rem;
      }

      .plugin-title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .plugin-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0;
      }

      .verified-icon {
        width: 18px;
        height: 18px;
        color: var(--nexus-primary, #167bff);
      }

      .plugin-meta {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .plugin-rating-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
        font-size: 0.8125rem;
      }

      .rating-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .star-icon {
        width: 14px;
        height: 14px;
        color: var(--nexus-warning, #f5a524);
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
        max-width: 800px;
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
        font-size: 1.5rem;
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

      .detail-section {
        margin-bottom: 1.5rem;
      }

      .detail-section h4 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.75rem 0;
      }

      .detail-section ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .detail-section li {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        margin-bottom: 0.5rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== NO RESULTS ========== */
      .no-results {
        display: none;
        text-align: center;
        padding: 4rem 2rem;
      }

      .no-results.show {
        display: block;
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

        .filters-grid {
          grid-template-columns: 1fr;
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
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <h1 class="page-title-nexus">Marketplace de Plugins</h1>
          <p class="page-subtitle-nexus">Descubre y descarga plugins para extender LexCMS</p>
          <div class="stats-row">
            <span class="stat-item">Total: <span class="stat-value primary">${stats.total}</span></span>
            <span class="stat-item">Activos: <span class="stat-value success">${stats.active}</span></span>
            <span class="stat-item">Inactivos: <span class="stat-value warning">${stats.inactive}</span></span>
            <span class="stat-item">Disponibles: <span class="stat-value secondary">${stats.available}</span></span>
          </div>
        </div>
        <div>
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
      <a href="${adminPath}/plugins/available" class="tab-link">
        Disponibles (${stats.available})
      </a>
      <a href="${adminPath}/plugins/marketplace" class="tab-link active">
        Marketplace
      </a>
    </nav>

    <!-- Filters -->
    ${NexusCard({
      children: html`
        <div class="filters-grid">
          <input
            type="text"
            id="searchInput"
            placeholder="Buscar plugins..."
            class="filter-input"
          />
          <select id="categoryFilter" class="filter-select">
            <option value="">Todas las categorías</option>
            ${categories.map((cat) => html`<option value="${cat}">${cat}</option>`)}
          </select>
          <select id="sortFilter" class="filter-select">
            <option value="downloads">Más descargados</option>
            <option value="rating">Mejor calificados</option>
            <option value="name">Nombre (A-Z)</option>
            <option value="price">Precio</option>
          </select>
          <label class="filter-checkbox-label">
            <input type="checkbox" id="verifiedFilter" style="width: 18px; height: 18px;" />
            <span>Solo verificados</span>
          </label>
        </div>
      `
    })}

    <!-- Plugins Grid -->
    <div id="pluginsGrid" class="plugins-grid">
      ${plugins.map((plugin) => {
        const isInstalled = installedPluginNames.includes(plugin.name);
        return html`
          <div
            class="plugin-card"
            data-name="${plugin.name.toLowerCase()}"
            data-category="${plugin.category}"
            data-downloads="${plugin.downloads}"
            data-rating="${plugin.rating}"
            data-price="${plugin.price}"
            data-verified="${plugin.verified}"
          >
            <div class="plugin-header">
              <div style="flex: 1;">
                <div class="plugin-title-row">
                  <h3 class="plugin-title">${plugin.displayName}</h3>
                  ${plugin.verified ? html`
                    <svg class="verified-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                  ` : ""}
                </div>
                <p class="plugin-meta">v${plugin.version} • ${plugin.author}</p>
                ${NexusBadge({ label: plugin.category, type: "info", soft: true })}
              </div>
              ${isInstalled
                ? NexusBadge({ label: "Instalado", type: "success", soft: true })
                : plugin.price > 0
                  ? NexusBadge({ label: `$${plugin.price}`, type: "warning", soft: true })
                  : NexusBadge({ label: "Gratis", type: "success", soft: true })
              }
            </div>

            <div class="plugin-rating-row">
              <div class="rating-item">
                <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>${plugin.rating.toFixed(1)}</span>
              </div>
              <span style="opacity: 0.6;">${formatNumber(plugin.downloads)} descargas</span>
            </div>

            <p class="plugin-description">${plugin.description}</p>

            <div class="plugin-tags">
              ${plugin.tags.slice(0, 3).map((tag) =>
                NexusBadge({ label: tag, type: "default", soft: true })
              )}
            </div>

            <div class="plugin-actions">
              <button
                data-plugin="${encodeURIComponent(JSON.stringify(plugin))}"
                data-installed="${isInstalled}"
                class="btn-view-details"
                style="flex: 1; padding: 0.5rem 1rem; font-size: 0.875rem; border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); background: transparent; color: var(--nexus-base-content); cursor: pointer; transition: all 0.2s;"
              >
                Ver detalles
              </button>
              ${!isInstalled ? html`
                <button
                  data-plugin-name="${plugin.name}"
                  data-plugin-price="${plugin.price}"
                  class="btn-download"
                  style="flex: 1; padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: var(--nexus-radius-md); background: var(--nexus-primary); color: white; cursor: pointer; transition: all 0.2s;"
                >
                  ${plugin.price > 0 ? "Comprar" : "Descargar"}
                </button>
              ` : html`
                <a
                  href="${adminPath}/plugins/installed"
                  style="flex: 1; padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: var(--nexus-radius-md); background: var(--nexus-base-300); color: var(--nexus-base-content); cursor: pointer; text-align: center; text-decoration: none;"
                >
                  Ver instalados
                </a>
              `}
            </div>
          </div>
        `;
      })}
    </div>

    <!-- No Results -->
    <div id="noResults" class="no-results">
      ${NexusCard({
        children: html`
          <div style="text-align: center; padding: 3rem 2rem;">
            <svg style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.3;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem 0;">No se encontraron plugins</h3>
            <p style="font-size: 0.9375rem; opacity: 0.6;">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        `
      })}
    </div>

    <!-- Plugin Detail Modal -->
    <dialog id="detailModal" class="modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="detailModalTitle" class="modal-title">Detalles del Plugin</h3>
          <button type="button" class="modal-close" onclick="closeDetailModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="detailModalContent" class="modal-content">
          <!-- Content will be loaded here -->
        </div>
      </div>
    </dialog>

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      const ALL_PLUGINS = ${JSON.stringify(plugins)};

      // XSS safe - Filter plugins
      function filterPlugins() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sort = document.getElementById('sortFilter').value;
        const verifiedOnly = document.getElementById('verifiedFilter').checked;

        let filtered = Array.from(document.querySelectorAll('.plugin-card'));
        let visibleCount = 0;

        filtered.forEach(card => {
          const name = card.dataset.name || '';
          const cardCategory = card.dataset.category || '';
          const verified = card.dataset.verified === 'true';

          let show = true;

          if (search && !name.includes(search)) {
            show = false;
          }

          if (category && cardCategory !== category) {
            show = false;
          }

          if (verifiedOnly && !verified) {
            show = false;
          }

          card.style.display = show ? 'block' : 'none';
          if (show) visibleCount++;
        });

        // Sort
        const grid = document.getElementById('pluginsGrid');
        const cards = Array.from(grid.children);

        cards.sort((a, b) => {
          if (sort === 'downloads') {
            return parseInt(b.dataset.downloads) - parseInt(a.dataset.downloads);
          } else if (sort === 'rating') {
            return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
          } else if (sort === 'name') {
            return a.dataset.name.localeCompare(b.dataset.name);
          } else if (sort === 'price') {
            return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
          }
          return 0;
        });

        cards.forEach(card => grid.appendChild(card));

        // Show/hide no results
        const noResults = document.getElementById('noResults');
        if (visibleCount === 0) {
          noResults.classList.add('show');
        } else {
          noResults.classList.remove('show');
        }
      }

      // XSS safe - Download plugin
      async function downloadPlugin(pluginName, price) {
        const action = price > 0 ? 'comprar' : 'descargar';
        if (!confirm('¿' + action.charAt(0).toUpperCase() + action.slice(1) + ' el plugin "' + pluginName + '"?')) return;

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/api/plugins/marketplace/' + pluginName + '/download', {
            method: 'POST'
          });

          if (response.ok) {
            alert('Plugin descargado exitosamente');
            window.location.reload();
          } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo descargar el plugin'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      // XSS safe - Show plugin details using DOM API
      function showPluginDetails(plugin, isInstalled) {
        const modal = document.getElementById('detailModal');
        const title = document.getElementById('detailModalTitle');
        const content = document.getElementById('detailModalContent');

        // XSS safe - textContent
        title.textContent = plugin.displayName;
        content.innerHTML = ''; // Clear previous content

        // Create detail sections using DOM API
        const sections = [
          { title: 'Descripción', content: plugin.description },
          { title: 'Versión', content: plugin.version },
          { title: 'Autor', content: plugin.author },
          { title: 'Licencia', content: plugin.license },
          { title: 'Página web', content: plugin.homepage, isLink: true }
        ];

        sections.forEach(section => {
          const div = document.createElement('div');
          div.className = 'detail-section';

          const h4 = document.createElement('h4');
          h4.textContent = section.title; // XSS safe
          div.appendChild(h4);

          if (section.isLink) {
            const link = document.createElement('a');
            link.href = section.content;
            link.textContent = section.content; // XSS safe
            link.target = '_blank';
            link.style.cssText = 'color: var(--nexus-primary); text-decoration: underline;';
            div.appendChild(link);
          } else {
            const p = document.createElement('p');
            p.textContent = section.content; // XSS safe
            p.style.cssText = 'font-size: 0.875rem; opacity: 0.7; margin: 0;';
            div.appendChild(p);
          }

          content.appendChild(div);
        });

        // Features
        if (plugin.features && plugin.features.length > 0) {
          const featuresDiv = document.createElement('div');
          featuresDiv.className = 'detail-section';

          const h4 = document.createElement('h4');
          h4.textContent = 'Características'; // XSS safe
          featuresDiv.appendChild(h4);

          const ul = document.createElement('ul');
          plugin.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature; // XSS safe
            ul.appendChild(li);
          });
          featuresDiv.appendChild(ul);
          content.appendChild(featuresDiv);
        }

        // Permissions
        if (plugin.permissions && plugin.permissions.length > 0) {
          const permDiv = document.createElement('div');
          permDiv.className = 'detail-section';

          const h4 = document.createElement('h4');
          h4.textContent = 'Permisos requeridos'; // XSS safe
          permDiv.appendChild(h4);

          const ul = document.createElement('ul');
          plugin.permissions.forEach(perm => {
            const li = document.createElement('li');
            li.textContent = perm; // XSS safe
            ul.appendChild(li);
          });
          permDiv.appendChild(ul);
          content.appendChild(permDiv);
        }

        // Actions
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'nexus-btn nexus-btn-outline';
        closeBtn.textContent = 'Cerrar';
        closeBtn.onclick = closeDetailModal;
        actions.appendChild(closeBtn);

        if (!isInstalled) {
          const downloadBtn = document.createElement('button');
          downloadBtn.type = 'button';
          downloadBtn.className = 'nexus-btn nexus-btn-primary';
          downloadBtn.textContent = plugin.price > 0 ? 'Comprar' : 'Descargar';
          downloadBtn.onclick = () => downloadPlugin(plugin.name, plugin.price);
          actions.appendChild(downloadBtn);
        }

        content.appendChild(actions);
        modal.showModal();
      }

      function closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal?.close();
      }

      // XSS safe - Initialize event listeners with DOMContentLoaded
      document.addEventListener('DOMContentLoaded', function() {
        // Filter inputs
        document.getElementById('searchInput')?.addEventListener('input', filterPlugins);
        document.getElementById('categoryFilter')?.addEventListener('change', filterPlugins);
        document.getElementById('sortFilter')?.addEventListener('change', filterPlugins);
        document.getElementById('verifiedFilter')?.addEventListener('change', filterPlugins);

        // View details buttons
        document.addEventListener('click', function(e) {
          const detailBtn = e.target.closest('.btn-view-details');
          if (detailBtn) {
            try {
              const plugin = JSON.parse(decodeURIComponent(detailBtn.dataset.plugin));
              const isInstalled = detailBtn.dataset.installed === 'true';
              showPluginDetails(plugin, isInstalled);
            } catch (err) {
              console.error('Error parsing plugin data:', err);
            }
          }

          // Download buttons
          const downloadBtn = e.target.closest('.btn-download');
          if (downloadBtn) {
            const pluginName = downloadBtn.dataset.pluginName;
            const price = parseFloat(downloadBtn.dataset.pluginPrice);
            downloadPlugin(pluginName, price);
          }
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Marketplace de Plugins",
    children: content,
    activePage: "plugins",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default PluginsMarketplaceNexusPage;
