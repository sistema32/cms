import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface CommentAuthor {
  id?: number;
  name: string;
  email: string;
  website?: string;
}

interface CommentItem {
  id: number;
  contentId: number;
  contentTitle?: string;
  contentSlug?: string;
  parentId?: number;
  author: CommentAuthor;
  body: string;
  bodyCensored: string;
  status: "approved" | "spam" | "deleted" | "pending";
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  repliesCount?: number;
}

interface CommentsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  comments: CommentItem[];
  stats?: {
    total: number;
    approved: number;
    pending: number;
    spam: number;
    deleted: number;
  };
  filter?: string;
  page?: number;
  totalPages?: number;
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

export const CommentsNexusPage = (props: CommentsNexusPageProps) => {
  const {
    user,
    comments,
    stats,
    filter = "all",
    page = 1,
    totalPages = 1,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return NexusBadge({ label: "Aprobado", type: "success", soft: true });
      case "pending":
        return NexusBadge({ label: "Pendiente", type: "warning", soft: true });
      case "spam":
        return NexusBadge({ label: "Spam", type: "error", soft: true });
      case "deleted":
        return NexusBadge({ label: "Eliminado", type: "default", soft: true });
      default:
        return NexusBadge({ label: "Desconocido", type: "default", soft: true });
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .stat-label {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
      }

      .stat-value.success { color: var(--nexus-success, #0bbf58); }
      .stat-value.warning { color: var(--nexus-warning, #f5a524); }
      .stat-value.error { color: var(--nexus-error, #f31260); }
      .stat-value.info { color: var(--nexus-info, #14b4ff); }

      .filters-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .filter-pill {
        padding: 0.5rem 1rem;
        border-radius: var(--nexus-radius-full, 9999px);
        background: var(--nexus-base-200, #eef0f2);
        border: 1px solid transparent;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content, #1e2328);
        text-decoration: none;
        transition: all 0.2s;
      }

      .filter-pill:hover {
        background: rgba(22, 123, 255, 0.08);
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .filter-pill.active {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
        color: #fff;
      }

      .comments-table {
        width: 100%;
        border-collapse: collapse;
      }

      .comments-table thead {
        background: var(--nexus-base-200, #eef0f2);
      }

      .comments-table th {
        padding: 0.875rem 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        text-align: left;
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .comments-table tbody tr {
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
        transition: background 0.15s;
      }

      .comments-table tbody tr:hover {
        background: rgba(22, 123, 255, 0.03);
      }

      .comments-table td {
        padding: 1rem;
        color: var(--nexus-base-content, #1e2328);
        font-size: 0.875rem;
      }

      .comment-author {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .comment-email {
        font-size: 0.75rem;
        opacity: 0.6;
      }

      .comment-body {
        max-width: 400px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .comment-actions {
        display: flex;
        gap: 0.25rem;
      }

      .comment-action-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .comment-action-btn:hover {
        background: var(--nexus-base-200, #eef0f2);
        opacity: 1;
      }

      .comment-action-btn.success:hover {
        background: var(--nexus-success, #0bbf58);
        color: #fff;
      }

      .comment-action-btn.error:hover {
        background: var(--nexus-error, #f31260);
        color: #fff;
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
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">Comentarios</h1>
        <p class="page-subtitle-nexus">Gestiona y modera los comentarios del sitio</p>
      </div>
    </div>

    <!-- Stats -->
    ${stats ? html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total</div>
          <div class="stat-value info">${stats.total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Aprobados</div>
          <div class="stat-value success">${stats.approved}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pendientes</div>
          <div class="stat-value warning">${stats.pending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Spam</div>
          <div class="stat-value error">${stats.spam}</div>
        </div>
      </div>
    ` : ''}

    <!-- Filters -->
    <div class="filters-nav">
      <a href="${adminPath}/comments" class="filter-pill ${filter === "all" ? "active" : ""}">
        Todos (${stats?.total || 0})
      </a>
      <a href="${adminPath}/comments?filter=pending" class="filter-pill ${filter === "pending" ? "active" : ""}">
        Pendientes (${stats?.pending || 0})
      </a>
      <a href="${adminPath}/comments?filter=approved" class="filter-pill ${filter === "approved" ? "active" : ""}">
        Aprobados (${stats?.approved || 0})
      </a>
      <a href="${adminPath}/comments?filter=spam" class="filter-pill ${filter === "spam" ? "active" : ""}">
        Spam (${stats?.spam || 0})
      </a>
    </div>

    <!-- Comments Table -->
    ${NexusCard({
      noPadding: true,
      children: comments.length === 0 ? html`
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h3 style="margin-top: 1rem; font-size: 1.125rem; font-weight: 600;">No hay comentarios</h3>
          <p style="margin-top: 0.5rem; font-size: 0.875rem;">
            ${filter !== "all" ? `No hay comentarios con estado "${filter}"` : "Aún no hay comentarios"}
          </p>
        </div>
      ` : html`
        <table class="comments-table">
          <thead>
            <tr>
              <th>Autor</th>
              <th>Comentario</th>
              <th>Contenido</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${comments.map(comment => html`
              <tr data-comment-id="${comment.id}">
                <td>
                  <div class="comment-author">${comment.author.name}</div>
                  <div class="comment-email">${comment.author.email}</div>
                </td>
                <td>
                  <div class="comment-body">${comment.bodyCensored}</div>
                  ${comment.repliesCount && comment.repliesCount > 0 ? html`
                    <div style="margin-top: 0.25rem; font-size: 0.75rem; opacity: 0.6;">
                      ${comment.repliesCount} respuesta${comment.repliesCount > 1 ? "s" : ""}
                    </div>
                  ` : ''}
                </td>
                <td>${comment.contentTitle || `ID: ${comment.contentId}`}</td>
                <td>${getStatusBadge(comment.status)}</td>
                <td style="font-size: 0.75rem;">${formatDate(comment.createdAt)}</td>
                <td>
                  <div class="comment-actions">
                    <button
                      type="button"
                      class="comment-action-btn"
                      data-action="view"
                      title="Ver detalles"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    ${comment.status === "pending" || comment.status === "spam" ? html`
                      <button
                        type="button"
                        class="comment-action-btn success"
                        data-action="approve"
                        title="Aprobar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${comment.status === "pending" || comment.status === "approved" ? html`
                      <button
                        type="button"
                        class="comment-action-btn error"
                        data-action="spam"
                        title="Marcar como spam"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </button>
                    ` : ''}
                    <button
                      type="button"
                      class="comment-action-btn error"
                      data-action="delete"
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    })}

    <!-- Pagination -->
    ${totalPages > 1 ? html`
      <div class="pagination">
        <div style="font-size: 0.875rem; opacity: 0.7;">
          Página ${page} de ${totalPages}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          ${page > 1 ? html`
            ${NexusButton({
              label: "Anterior",
              type: "outline",
              size: "sm",
              href: `${adminPath}/comments?filter=${filter}&page=${page - 1}`
            })}
          ` : ''}
          ${page < totalPages ? html`
            ${NexusButton({
              label: "Siguiente",
              type: "primary",
              size: "sm",
              href: `${adminPath}/comments?filter=${filter}&page=${page + 1}`
            })}
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${raw(`
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const commentsTable = document.querySelector('.comments-table');
          if (!commentsTable) return;

          // XSS safe - Handle comment actions
          commentsTable.addEventListener('click', function(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.getAttribute('data-action');
            const row = actionBtn.closest('[data-comment-id]');
            const commentId = row?.getAttribute('data-comment-id');

            if (!commentId) return;

            if (action === 'view') {
              // XSS safe - View comment details
              fetch('/api/comments/' + commentId + '/original', {
                headers: {
                  'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
              })
              .then(response => response.json())
              .then(data => {
                alert('Comentario #' + commentId + '\\n\\n' + data.body);
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar comentario');
              });
            } else if (action === 'approve') {
              // XSS safe - Approve comment
              if (confirm('¿Aprobar este comentario?')) {
                moderateComment(commentId, 'approved');
              }
            } else if (action === 'spam') {
              // XSS safe - Mark as spam
              if (confirm('¿Marcar este comentario como spam?')) {
                moderateComment(commentId, 'spam');
              }
            } else if (action === 'delete') {
              // XSS safe - Delete comment
              if (confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) {
                deleteComment(commentId);
              }
            }
          });

          // XSS safe - Moderate comment
          function moderateComment(id, status) {
            fetch('/api/comments/' + id + '/moderate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
              },
              body: JSON.stringify({ status: status })
            })
            .then(response => {
              if (response.ok) {
                window.location.reload();
              } else {
                alert('Error al moderar comentario');
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert('Error al moderar comentario');
            });
          }

          // XSS safe - Delete comment
          function deleteComment(id) {
            fetch('/api/comments/' + id, {
              method: 'DELETE',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
              }
            })
            .then(response => {
              if (response.ok) {
                window.location.reload();
              } else {
                alert('Error al eliminar comentario');
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert('Error al eliminar comentario');
            });
          }
        });
      </script>
    `)}
  `;

  return AdminLayoutNexus({
    title: "Comentarios",
    children: content,
    activePage: "content.comments",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default CommentsNexusPage;
