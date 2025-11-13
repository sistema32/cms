import { html, raw } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";
import { ROUTES } from "../config/routes.ts";

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

interface CommentsPageProps {
  user: {
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
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    approved: '<span class="badge badge-success">Aprobado</span>',
    pending: '<span class="badge badge-warning">Pendiente</span>',
    spam: '<span class="badge badge-error">Spam</span>',
    deleted: '<span class="badge badge-ghost">Eliminado</span>',
  };
  return badges[status] || '<span class="badge">Desconocido</span>';
}

export const CommentsPage = (props: CommentsPageProps) => {
  const { user, comments, stats, filter = "all", page = 1, totalPages = 1 } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <style>
      /* Fix modal visibility */
      dialog.modal {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: none;
        align-items: center;
        justify-content: center;
      }

      dialog.modal[open] {
        display: flex !important;
      }

      dialog.modal::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }

      dialog.modal .modal-box {
        position: relative;
        z-index: 1000;
        background: white;
        max-height: 90vh;
        overflow-y: auto;
      }

      .dark dialog.modal .modal-box {
        background: rgb(31, 41, 55);
        color: white;
      }

      .comment-body {
        max-width: 100%;
        word-wrap: break-word;
        white-space: pre-wrap;
      }

      .comment-row:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }

      .dark .comment-row:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    </style>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">Comentarios</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Gestiona y modera los comentarios del sitio</p>
      </div>
      <div class="flex gap-2">
        <a href="${adminPath}/settings?category=discussion" class="btn btn-sm btn-ghost">
          ⚙️ Configuración
        </a>
      </div>
    </div>

    <!-- Quick Info -->
    <div class="alert alert-info mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <div class="font-bold">Sistema de Moderación y Censura</div>
        <div class="text-sm">Los comentarios se filtran automáticamente para detectar spam, enlaces, teléfonos y palabras prohibidas. Ver comentario original vs censurado en detalles.</div>
      </div>
    </div>

    <!-- Stats -->
    ${stats ? html`
      <div class="grid gap-4 mb-6 md:grid-cols-2 xl:grid-cols-5">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-4">
          <div class="flex items-center">
            <div class="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-100 dark:bg-blue-500">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"></path>
              </svg>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${stats.total}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-4">
          <div class="flex items-center">
            <div class="p-3 mr-4 text-green-500 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-500">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Aprobados</p>
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${stats.approved}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-4">
          <div class="flex items-center">
            <div class="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-100 dark:bg-orange-500">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${stats.pending}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-4">
          <div class="flex items-center">
            <div class="p-3 mr-4 text-red-500 bg-red-100 rounded-full dark:text-red-100 dark:bg-red-500">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Spam</p>
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${stats.spam}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs p-4">
          <div class="flex items-center">
            <div class="p-3 mr-4 text-gray-500 bg-gray-100 rounded-full dark:text-gray-100 dark:bg-gray-500">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Eliminados</p>
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${stats.deleted}</p>
            </div>
          </div>
        </div>
      </div>
    ` : ""}

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs mb-6">
      <div class="p-4">
        <div class="flex flex-wrap gap-2">
          <a href="${adminPath}/${ROUTES.COMMENTS}" class="btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}">
            Todos (${stats?.total || 0})
          </a>
          <a href="${adminPath}/${ROUTES.COMMENTS}?filter=pending" class="btn btn-sm ${filter === "pending" ? "btn-primary" : "btn-ghost"}">
            Pendientes (${stats?.pending || 0})
          </a>
          <a href="${adminPath}/${ROUTES.COMMENTS}?filter=approved" class="btn btn-sm ${filter === "approved" ? "btn-primary" : "btn-ghost"}">
            Aprobados (${stats?.approved || 0})
          </a>
          <a href="${adminPath}/${ROUTES.COMMENTS}?filter=spam" class="btn btn-sm ${filter === "spam" ? "btn-primary" : "btn-ghost"}">
            Spam (${stats?.spam || 0})
          </a>
          <a href="${adminPath}/${ROUTES.COMMENTS}?filter=deleted" class="btn btn-sm ${filter === "deleted" ? "btn-primary" : "btn-ghost"}">
            Eliminados (${stats?.deleted || 0})
          </a>
        </div>
      </div>
    </div>

    <!-- Comments Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full whitespace-nowrap">
          <thead>
            <tr class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
              <th class="px-4 py-3">Autor</th>
              <th class="px-4 py-3">Comentario</th>
              <th class="px-4 py-3">Contenido</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
            ${comments.length === 0 ? html`
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay comentarios ${filter !== "all" ? `con estado "${filter}"` : ""}
                </td>
              </tr>
            ` : comments.map(comment => html`
              <tr class="comment-row text-gray-700 dark:text-gray-400">
                <td class="px-4 py-3">
                  <div class="flex flex-col">
                    <p class="font-semibold text-sm">${comment.author.name}</p>
                    <p class="text-xs text-gray-600 dark:text-gray-500">${comment.author.email}</p>
                    ${comment.author.website ? html`
                      <a href="${comment.author.website}" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        ${comment.author.website}
                      </a>
                    ` : ""}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="comment-body text-sm max-w-md">
                    ${comment.bodyCensored.substring(0, 100)}${comment.bodyCensored.length > 100 ? "..." : ""}
                  </div>
                  ${comment.repliesCount && comment.repliesCount > 0 ? html`
                    <span class="text-xs text-gray-500">↳ ${comment.repliesCount} respuesta${comment.repliesCount > 1 ? "s" : ""}</span>
                  ` : ""}
                </td>
                <td class="px-4 py-3 text-sm">
                  ${comment.contentTitle || `ID: ${comment.contentId}`}
                </td>
                <td class="px-4 py-3 text-sm">
                  ${raw(getStatusBadge(comment.status))}
                </td>
                <td class="px-4 py-3 text-xs">
                  ${formatDate(comment.createdAt)}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <button
                      onclick="viewComment(${comment.id})"
                      class="btn btn-xs btn-ghost"
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    ${comment.status === "pending" ? html`
                      <button
                        onclick="moderateComment(${comment.id}, 'approved')"
                        class="btn btn-xs btn-success"
                        title="Aprobar"
                      >
                        ✓
                      </button>
                      <button
                        onclick="moderateComment(${comment.id}, 'spam')"
                        class="btn btn-xs btn-warning"
                        title="Marcar como spam"
                      >
                        ⚠️
                      </button>
                    ` : comment.status === "approved" ? html`
                      <button
                        onclick="moderateComment(${comment.id}, 'spam')"
                        class="btn btn-xs btn-warning"
                        title="Marcar como spam"
                      >
                        ⚠️
                      </button>
                    ` : comment.status === "spam" ? html`
                      <button
                        onclick="moderateComment(${comment.id}, 'approved')"
                        class="btn btn-xs btn-success"
                        title="Aprobar"
                      >
                        ✓
                      </button>
                    ` : ""}
                    <button
                      onclick="deleteComment(${comment.id})"
                      class="btn btn-xs btn-error"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      ${totalPages > 1 ? html`
        <div class="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-700 dark:text-gray-400">
              Página ${page} de ${totalPages}
            </div>
            <div class="flex gap-2">
              ${page > 1 ? html`
                <a href="${adminPath}/${ROUTES.COMMENTS}?filter=${filter}&page=${page - 1}" class="btn btn-sm">Anterior</a>
              ` : ""}
              ${page < totalPages ? html`
                <a href="${adminPath}/${ROUTES.COMMENTS}?filter=${filter}&page=${page + 1}" class="btn btn-sm btn-primary">Siguiente</a>
              ` : ""}
            </div>
          </div>
        </div>
      ` : ""}
    </div>

    <!-- View Comment Modal -->
    <dialog id="viewCommentModal" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Detalles del Comentario</h3>
        <div id="commentDetails" class="space-y-4"></div>
        <div class="modal-action">
          <button type="button" class="btn" onclick="document.getElementById('viewCommentModal').close()">Cerrar</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      async function viewComment(id) {
        try {
          const url = '/api/comments/' + id + '/original';
          const response = await fetch(url, {
            headers: {
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
          });

          if (response.ok) {
            const result = await response.json();
            const comment = result.data || result;

            // Detectar si hubo censura
            const wasCensored = comment.body !== comment.bodyCensored;
            const censorshipBadge = wasCensored
              ? '<span class="badge badge-warning badge-sm ml-2">Censurado</span>'
              : '<span class="badge badge-success badge-sm ml-2">Sin censura</span>';

            const detailsHtml = '<div class="space-y-4">' +
              // Author Info
              '<div class="card bg-base-200"><div class="card-body p-4">' +
              '<h4 class="font-bold text-sm mb-2">👤 Información del Autor</h4>' +
              '<div class="space-y-1 text-sm">' +
              '<div><strong>Nombre:</strong> ' + comment.authorName + '</div>' +
              '<div><strong>Email:</strong> ' + comment.authorEmail + '</div>' +
              (comment.authorWebsite ? '<div><strong>Website:</strong> <a href="' + comment.authorWebsite + '" target="_blank" class="link link-primary">' + comment.authorWebsite + '</a></div>' : '') +
              '<div><strong>IP:</strong> ' + (comment.ipAddress || 'N/A') + '</div>' +
              '<div><strong>User Agent:</strong> <span class="text-xs opacity-70">' + (comment.userAgent || 'N/A') + '</span></div>' +
              '</div></div></div>' +

              // Comment Comparison
              '<div class="card bg-base-200"><div class="card-body p-4">' +
              '<h4 class="font-bold text-sm mb-2">💬 Contenido del Comentario' + censorshipBadge + '</h4>' +
              '<div class="space-y-3">' +
              '<div><strong class="text-sm">Original:</strong><div class="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded border-2 ' + (wasCensored ? 'border-yellow-400' : 'border-green-400') + '">' + comment.body + '</div></div>' +
              (wasCensored ?
                '<div><strong class="text-sm">Versión Pública (Censurado):</strong><div class="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded border-2 border-blue-400">' + comment.bodyCensored + '</div></div>'
                : '') +
              '</div></div></div>' +

              // Meta Info
              '<div class="card bg-base-200"><div class="card-body p-4">' +
              '<h4 class="font-bold text-sm mb-2">ℹ️ Metadata</h4>' +
              '<div class="grid grid-cols-2 gap-2 text-sm">' +
              '<div><strong>Estado:</strong> <span class="badge badge-sm ' +
                (comment.status === 'approved' ? 'badge-success' :
                 comment.status === 'pending' ? 'badge-warning' :
                 comment.status === 'spam' ? 'badge-error' : 'badge-ghost') +
              '">' + comment.status + '</span></div>' +
              '<div><strong>ID:</strong> #' + comment.id + '</div>' +
              '<div><strong>Content ID:</strong> ' + comment.contentId + '</div>' +
              '<div><strong>Parent ID:</strong> ' + (comment.parentId || 'N/A') + '</div>' +
              '<div><strong>Creado:</strong> ' + new Date(comment.createdAt).toLocaleString('es-ES') + '</div>' +
              '<div><strong>Actualizado:</strong> ' + new Date(comment.updatedAt).toLocaleString('es-ES') + '</div>' +
              '</div></div></div>' +
              '</div>';

            document.getElementById('commentDetails').innerHTML = detailsHtml;
            document.getElementById('viewCommentModal').showModal();
          } else {
            alert('Error al cargar el comentario');
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      async function moderateComment(id, status) {
        const actions = {
          'approved': 'aprobar',
          'spam': 'marcar como spam',
          'deleted': 'eliminar'
        };

        if (!confirm('¿Estás seguro de ' + actions[status] + ' este comentario?')) {
          return;
        }

        try {
          const url = '/api/comments/' + id + '/moderate';
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ status: status })
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const error = await response.json();
            alert('Error: ' + (error.error || error.message || 'Error al moderar comentario'));
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      async function deleteComment(id) {
        if (!confirm('¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.')) {
          return;
        }

        try {
          const url = '/api/comments/' + id;
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const error = await response.text();
            alert('Error: ' + error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }
    </script>`)}
  `;

  return AdminLayout({
    user,
    title: "Comentarios",
    children: content,
    activePage: "content.comments",
  });
};
