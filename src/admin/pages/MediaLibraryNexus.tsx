import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface MediaItem {
  id: number;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  type: string;
  width?: number;
  height?: number;
  createdAt: Date;
  uploadedBy?: {
    id: number;
    name?: string;
    email: string;
  };
}

interface MediaLibraryNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  media: MediaItem[];
  limit: number;
  offset: number;
  total?: number;
  pickerMode?: boolean;
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

export const MediaLibraryNexusPage = (props: MediaLibraryNexusPageProps) => {
  const {
    user,
    media,
    limit = 20,
    offset = 0,
    total = 0,
    pickerMode = false,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const content = html`
    <style>
      .page-header-nexus {
        display: flex;
        justify-content: space-between;
        align-items: center;
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

      .filters-container {
        margin-bottom: 1.5rem;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: 200px 1fr auto;
        gap: 1rem;
        align-items: end;
      }

      .filter-select, .filter-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .filter-select:focus, .filter-input:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .view-toggle {
        display: flex;
        gap: 0.5rem;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 0.25rem;
      }

      .view-toggle-btn {
        padding: 0.5rem;
        border: none;
        background: transparent;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.2s;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .view-toggle-btn:hover {
        background: var(--nexus-base-200, #eef0f2);
        opacity: 1;
      }

      .view-toggle-btn.active {
        background: var(--nexus-primary, #167bff);
        color: #fff;
        opacity: 1;
      }

      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .media-item {
        position: relative;
        border-radius: var(--nexus-radius-md, 0.5rem);
        overflow: hidden;
        background: var(--nexus-base-100, #fff);
        border: 2px solid transparent;
        transition: all 0.2s;
        cursor: pointer;
      }

      .media-item:hover {
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 4px 12px rgba(22, 123, 255, 0.15);
      }

      .media-thumbnail {
        width: 100%;
        aspect-ratio: 1;
        background: var(--nexus-base-200, #eef0f2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .media-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-icon {
        width: 48px;
        height: 48px;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.3;
      }

      .media-info {
        padding: 0.75rem;
      }

      .media-filename {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.25rem;
      }

      .media-size {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .media-actions {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .media-item:hover .media-actions {
        opacity: 1;
      }

      .media-action-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        color: var(--nexus-base-content, #1e2328);
      }

      .media-action-btn:hover {
        background: var(--nexus-primary, #167bff);
        color: #fff;
      }

      .media-action-btn.delete:hover {
        background: var(--nexus-error, #f31260);
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 0;
      }

      .pagination-info {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .pagination-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .upload-input {
        display: none;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <h1 class="page-title-nexus">Biblioteca de Medios</h1>
      ${!pickerMode ? html`
        ${NexusButton({
          label: "Subir Archivo",
          type: "primary",
          icon: html`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          `,
          onClick: "triggerUpload()"
        })}
      ` : ''}
    </div>

    <!-- Upload Form (Hidden) -->
    <form id="uploadForm" style="display: none;">
      <input
        type="file"
        id="uploadInput"
        class="upload-input"
        accept="image/*,video/*,audio/*,.pdf"
        multiple
        data-action="upload"
      />
    </form>

    <!-- Filters -->
    ${NexusCard({
      className: "filters-container",
      children: html`
        <div class="filters-grid">
          <select id="typeFilter" class="filter-select" data-filter="type">
            <option value="">Todos los tipos</option>
            <option value="image">Imágenes</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documentos</option>
          </select>
          <input
            type="text"
            id="searchInput"
            class="filter-input"
            placeholder="Buscar por nombre de archivo..."
            data-filter="search"
          />
          <div class="view-toggle">
            <button type="button" class="view-toggle-btn active" data-view="grid" title="Vista de cuadrícula">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button type="button" class="view-toggle-btn" data-view="list" title="Vista de lista">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      `
    })}

    <!-- Media Grid -->
    ${media.length === 0 ? html`
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <h3 style="margin-top: 1rem; font-size: 1.125rem; font-weight: 600;">No hay archivos en la biblioteca</h3>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Sube tu primer archivo para comenzar</p>
      </div>
    ` : html`
      <div class="media-grid" id="mediaGrid">
        ${media.map((item) => html`
          <div class="media-item" data-media-id="${item.id}" data-media-url="${item.url}" data-media-filename="${item.originalFilename}">
            <div class="media-thumbnail">
              ${item.type === "image" ? html`
                <img src="${item.url}" alt="${item.originalFilename}" loading="lazy" />
              ` : item.type === "video" ? html`
                <svg class="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              ` : item.type === "audio" ? html`
                <svg class="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              ` : html`
                <svg class="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
              `}
            </div>
            <div class="media-info">
              <div class="media-filename" title="${item.originalFilename}">${item.originalFilename}</div>
              <div class="media-size">${formatFileSize(item.size)}</div>
            </div>
            ${!pickerMode ? html`
              <div class="media-actions">
                <button
                  type="button"
                  class="media-action-btn"
                  data-action="view"
                  title="Ver detalles"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="media-action-btn delete"
                  data-action="delete"
                  title="Eliminar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          Mostrando ${offset + 1} - ${Math.min(offset + limit, total)} de ${total} archivos
        </div>
        <div class="pagination-buttons">
          ${offset > 0 ? html`
            ${NexusButton({
              label: "Anterior",
              type: "outline",
              size: "sm",
              href: `${adminPath}/media?offset=${Math.max(0, offset - limit)}&limit=${limit}`
            })}
          ` : ''}
          ${offset + media.length < total ? html`
            ${NexusButton({
              label: "Siguiente",
              type: "primary",
              size: "sm",
              href: `${adminPath}/media?offset=${offset + limit}&limit=${limit}`
            })}
          ` : ''}
        </div>
      </div>
    `}

    ${raw(`
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const uploadInput = document.getElementById('uploadInput');
          const mediaGrid = document.getElementById('mediaGrid');

          // XSS safe - Trigger upload
          window.triggerUpload = function() {
            uploadInput?.click();
          };

          // XSS safe - Handle file upload
          if (uploadInput) {
            uploadInput.addEventListener('change', function(event) {
              const files = event.target.files;
              if (!files || files.length === 0) return;

              const formData = new FormData();
              for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
              }

              fetch('${adminPath}/api/media/upload', {
                method: 'POST',
                body: formData,
                headers: {
                  'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
              })
              .then(response => response.json())
              .then(data => {
                window.location.reload();
              })
              .catch(error => {
                console.error('Upload error:', error);
                alert('Error al subir archivos');
              });
            });
          }

          // XSS safe - Filter by type
          const typeFilter = document.querySelector('[data-filter="type"]');
          if (typeFilter) {
            typeFilter.addEventListener('change', function(e) {
              const value = e.target.value;
              const url = new URL(window.location.href);
              if (value) {
                url.searchParams.set('type', value);
              } else {
                url.searchParams.delete('type');
              }
              window.location.href = url.toString();
            });
          }

          // XSS safe - Search
          const searchInput = document.querySelector('[data-filter="search"]');
          if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('keyup', function(e) {
              clearTimeout(searchTimeout);
              searchTimeout = setTimeout(() => {
                const value = e.target.value;
                const url = new URL(window.location.href);
                if (value) {
                  url.searchParams.set('search', value);
                } else {
                  url.searchParams.delete('search');
                }
                window.location.href = url.toString();
              }, 500);
            });
          }

          // XSS safe - View toggle
          const viewToggleBtns = document.querySelectorAll('[data-view]');
          viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
              const view = e.currentTarget.getAttribute('data-view');
              viewToggleBtns.forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');

              // TODO: Implement list view
              if (view === 'list') {
                alert('Vista de lista próximamente');
              }
            });
          });

          // XSS safe - Media item actions
          if (mediaGrid) {
            mediaGrid.addEventListener('click', function(e) {
              const actionBtn = e.target.closest('[data-action]');
              if (!actionBtn) return;

              e.stopPropagation();
              const action = actionBtn.getAttribute('data-action');
              const mediaItem = actionBtn.closest('[data-media-id]');
              const mediaId = mediaItem?.getAttribute('data-media-id');
              const mediaFilename = mediaItem?.getAttribute('data-media-filename');

              if (action === 'delete') {
                // XSS safe - Use textContent for alert
                if (confirm('¿Eliminar ' + mediaFilename + '?')) {
                  fetch('${adminPath}/api/media/' + mediaId, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                  })
                  .then(response => {
                    if (response.ok) {
                      window.location.reload();
                    } else {
                      alert('Error al eliminar archivo');
                    }
                  })
                  .catch(error => {
                    console.error('Delete error:', error);
                    alert('Error al eliminar archivo');
                  });
                }
              } else if (action === 'view') {
                const mediaUrl = mediaItem?.getAttribute('data-media-url');
                window.open(mediaUrl, '_blank');
              }
            });
          }
        });
      </script>
    `)}
  `;

  return AdminLayoutNexus({
    title: "Biblioteca de Medios",
    children: content,
    activePage: "content.media",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default MediaLibraryNexusPage;
