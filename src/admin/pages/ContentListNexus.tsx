import { html } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusInput, NexusBadge, NexusTable, NexusPagination } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface ContentListNexusProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  contents: Array<{
    id: number;
    title: string;
    slug: string;
    status: string;
    contentType: { name: string };
    author: { name: string; email: string };
    createdAt: Date;
  }>;
  totalPages: number;
  currentPage: number;
  title?: string;
  createPath?: string;
  createLabel?: string;
  basePath?: string;
  showContentType?: boolean;
  activePage?: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
  // Props para la barra de depuración
  request?: Request;
  response?: Response;
  startTime?: number;
}

export const ContentListNexusPage = (props: ContentListNexusProps) => {
  const adminPath = env.ADMIN_PATH;
  const {
    user,
    contents,
    totalPages,
    currentPage,
    title = "Gestión de Contenido",
    createPath = `${adminPath}/content/new`,
    createLabel = "Nuevo Contenido",
    basePath = `${adminPath}/content`,
    showContentType = true,
    activePage = "content",
    notifications = [],
    unreadNotificationCount = 0,
    request,
    response,
    startTime,
  } = props;

  // Helper function for status badge type
  const getStatusBadgeType = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "published": return "success";
      case "draft": return "warning";
      case "archived": return "error";
      default: return "default";
    }
  };

  // Helper function for status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "published": return "Publicado";
      case "draft": return "Borrador";
      case "archived": return "Archivado";
      default: return status;
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Build table rows
  const tableRows = contents.map((item) => html`
    <tr>
      <td>
        <div class="content-title-cell">
          <span class="content-title">${item.title}</span>
          <span class="content-slug">/${item.slug}</span>
        </div>
      </td>
      ${showContentType ? html`
        <td>
          ${NexusBadge({ label: item.contentType.name, type: "info", soft: true })}
        </td>
      ` : ''}
      <td>
        <div class="author-cell">
          <img
            class="author-avatar"
            src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.author.name || item.author.email)}&background=167bff&color=fff&size=32"
            alt="${item.author.name}"
          />
          <span class="author-name">${item.author.name || item.author.email}</span>
        </div>
      </td>
      <td>
        ${NexusBadge({
          label: getStatusLabel(item.status),
          type: getStatusBadgeType(item.status),
          soft: true
        })}
      </td>
      <td class="date-cell">${formatDate(item.createdAt)}</td>
      <td>
        <div class="actions-cell">
          <a href="${basePath}/${item.id}/edit" class="action-btn" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </a>
          <button
            onclick="if(confirm('¿Estás seguro de eliminar este contenido?')) { fetch('${basePath}/${item.id}', {method: 'DELETE'}).then(() => window.location.reload()); }"
            class="action-btn action-btn-danger"
            title="Eliminar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0.5rem 0 0 0;
      }

      /* ========== FILTERS ========== */
      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .filter-search {
        flex: 1;
        min-width: 250px;
      }

      .filter-select {
        width: 100%;
        max-width: 200px;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .filter-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      /* ========== TABLE CUSTOMIZATIONS ========== */
      .content-title-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .content-title {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .content-slug {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        font-family: 'Courier New', monospace;
      }

      .author-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .author-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .author-name {
        font-weight: 500;
      }

      .date-cell {
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .actions-cell {
        display: flex;
        gap: 0.5rem;
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

      .action-btn-danger:hover {
        border-color: var(--nexus-error, #f31260);
        color: var(--nexus-error, #f31260);
        background: rgba(243, 18, 96, 0.1);
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .filters-bar {
          flex-direction: column;
        }

        .filter-search,
        .filter-select {
          width: 100%;
          max-width: none;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">${title}</h1>
        <p class="page-subtitle-nexus">Gestiona y organiza tu contenido</p>
      </div>
      ${NexusButton({
        label: createLabel,
        href: createPath,
        type: "primary",
        icon: html`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        `
      })}
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-search">
        ${NexusInput({
          name: "search",
          type: "text",
          placeholder: "Buscar contenido...",
          icon: html`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          `
        })}
      </div>
      <select
        class="filter-select"
        onchange="window.location.href='${basePath}?status=' + this.value"
      >
        <option value="">Todos los estados</option>
        <option value="draft">Borrador</option>
        <option value="published">Publicado</option>
        <option value="archived">Archivado</option>
      </select>
    </div>

    <!-- Content Table -->
    ${NexusCard({
      children: html`
        ${NexusTable({
          columns: [
            { key: 'title', label: 'Título' },
            ...(showContentType ? [{ key: 'type', label: 'Tipo', width: '120px' }] : []),
            { key: 'author', label: 'Autor', width: '200px' },
            { key: 'status', label: 'Estado', width: '120px' },
            { key: 'date', label: 'Fecha', width: '140px' },
            { key: 'actions', label: 'Acciones', width: '100px' }
          ],
          rows: tableRows,
          emptyMessage: "No hay contenido para mostrar"
        })}

        ${NexusPagination({
          currentPage,
          totalPages,
          baseUrl: basePath
        })}
      `,
      noPadding: true
    })}

    <script>
      // Simple search filter
      const searchInput = document.querySelector('input[name="search"]');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const rows = document.querySelectorAll('.nexus-table tbody tr');

          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
          });
        });
      }
    </script>
  `;

  return AdminLayoutNexus({
    title,
    children: content,
    activePage,
    user,
    notifications,
    unreadNotificationCount,
    request,
    response,
    startTime,
  });
};

export default ContentListNexusPage;
