import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import type { Content } from "../../db/schema.ts";
import { env } from "../../config/env.ts";

interface ContentListProps {
  user: {
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
}

export const ContentListPage = (props: ContentListProps) => {
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
  } = props;

  const columnCount = 5 + (showContentType ? 1 : 0);

  const content = html`
    <div class="page-header">
      <h1 class="page-title">${title}</h1>
      <div class="page-actions">
        <a href="${createPath}" class="btn-action">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            >
            </path>
          </svg>
          ${createLabel}
        </a>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex gap-4">
      <div class="flex-1">
        <input
          type="text"
          id="searchInput"
          placeholder="Buscar contenido..."
          class="form-input"
          onkeyup="filterContent()"
        />
      </div>
      <div>
        <select
          class="form-input"
          onchange="window.location.href='${basePath}?status=' + this.value"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
      </div>
    </div>

    <!-- Content Table -->
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Título</th>
            ${showContentType
              ? html`
                <th>Tipo</th>
              `
              : html`

              `}
            <th>Autor</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="contentTableBody">
          ${contents.length === 0
            ? html`
              <tr>
                <td
                  colspan="${columnCount}"
                  class="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  No hay contenido para mostrar
                </td>
              </tr>
            `
            : contents.map((item) =>
              html`
                <tr>
                  <td>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      ${item.title}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      /${item.slug}
                    </div>
                  </td>
                  ${showContentType
                    ? html`
                      <td>
                        <span class="badge-info">${item.contentType.name}</span>
                      </td>
                    `
                    : html`

                    `}
                  <td>
                    <div class="flex items-center">
                      <img
                        class="table-avatar"
                        src="https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.author.name || item.author.email,
                        )}"
                        alt="${item.author.name}"
                      />
                      <span class="ml-2">${item.author.name ||
                        item.author.email}</span>
                    </div>
                  </td>
                  <td>
                    ${item.status === "published"
                      ? html`
                        <span class="badge-success">Publicado</span>
                      `
                      : ""} ${item.status === "draft"
                      ? html`
                        <span class="badge-warning">Borrador</span>
                      `
                      : ""} ${item.status === "archived"
                      ? html`
                        <span class="badge-secondary">Archivado</span>
                      `
                      : ""}
                  </td>
                  <td class="text-sm text-gray-500 dark:text-gray-400">
                    ${new Date(item.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <a
                        href="${basePath}/edit/${item.id}"
                        class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        title="Editar"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                          >
                          </path>
                        </svg>
                      </a>
                      <a
                        href="/${item.slug}"
                        target="_blank"
                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        title="Ver"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                          <path
                            fill-rule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                      <button
                        onclick="deleteContent(${item.id}, '${item.title
                          .replace(/'/g, "\\'")}')"
                        class="text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Eliminar"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `
            )}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    ${totalPages > 1
      ? html`
        <div class="mt-6 flex justify-center">
          <nav class="flex gap-2">
            ${currentPage > 1
              ? html`
                <a href="${basePath}?page=${currentPage -
                  1}" class="btn-secondary">Anterior</a>
              `
              : ""} ${Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) =>
                  html`
                    <a
                      href="${basePath}?page=${page}"
                      class="${page === currentPage
                        ? "btn-action"
                        : "btn-secondary"}"
                    >
                      ${page}
                    </a>
                  `,
              )} ${currentPage < totalPages
              ? html`
                <a href="${basePath}?page=${currentPage +
                  1}" class="btn-secondary">Siguiente</a>
              `
              : ""}
          </nav>
        </div>
      `
      : ""}

    <script>
    const basePath = '${basePath}';
    function filterContent() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('contentTableBody');
      const rows = tbody.getElementsByTagName('tr');

      for (let i = 0; i < rows.length; i++) {
        const titleCell = rows[i].getElementsByTagName('td')[0];
        if (titleCell) {
          const txtValue = titleCell.textContent || titleCell.innerText;
          rows[i].style.display = txtValue.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
        }
      }
    }

    function deleteContent(id, title) {
      if (confirm('¿Estás seguro de eliminar "' + title + '"?')) {
        fetch(basePath + '/delete/' + id, {
          method: 'POST',
        })
          .then(response => {
            if (response.ok) {
              window.location.reload();
            } else {
              alert('Error al eliminar el contenido');
            }
          })
          .catch(() => alert('Error al eliminar el contenido'));
        }
      }
    </script>
  `;

  return AdminLayout({
    title,
    children: content,
    activePage,
    user,
  });
};

export default ContentListPage;
