import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface TagsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    _count?: { content: number };
  }>;
}

export const TagsPage = (props: TagsPageProps) => {
  const { user, tags } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Tags</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Add Tag Form -->
      <div class="form-card">
        <h3 class="text-lg font-semibold mb-4">Nuevo Tag</h3>
        <form method="POST" action="${adminPath}/tags/create">
          <div class="mb-4">
            <label class="form-label">Nombre *</label>
            <input
              type="text"
              name="name"
              required
              class="form-input"
              placeholder="Nombre del tag"
              onkeyup="generateTagSlug(this.value)"
            />
          </div>

          <div class="mb-4">
            <label class="form-label">Slug *</label>
            <input
              type="text"
              name="slug"
              id="tagSlugInput"
              required
              class="form-input"
              placeholder="tag-slug"
            />
          </div>

          <button type="submit" class="w-full btn-action">
            Agregar Tag
          </button>
        </form>
      </div>

      <!-- Tags List -->
      <div class="lg:col-span-2">
        <div class="table-card">
          <div class="flex flex-wrap gap-3 p-4">
            ${tags.length === 0 ? html`
              <p class="text-center py-8 text-gray-500 dark:text-gray-400 w-full">
                No hay tags creados
              </p>
            ` : tags.map(tag => html`
              <div class="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                <span class="font-medium">${tag.name}</span>
                <span class="text-sm text-purple-600 dark:text-purple-300">(${tag._count?.content || 0})</span>
                <button
                  onclick="editTag(${tag.id}, '${tag.name.replace(/'/g, "\\'")}', '${tag.slug}')"
                  class="text-purple-600 hover:text-purple-800 dark:text-purple-300"
                  title="Editar"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                  </svg>
                </button>
                <button
                  onclick="deleteTag(${tag.id}, '${tag.name.replace(/'/g, "\\'")}')"
                  class="text-red-600 hover:text-red-800 dark:text-red-400"
                  title="Eliminar"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            `)}
          </div>

          <!-- Table View (Alternative) -->
          <table class="admin-table hidden">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Contenidos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${tags.map(tag => html`
                <tr>
                  <td class="font-medium">${tag.name}</td>
                  <td class="text-sm text-gray-500 dark:text-gray-400">/${tag.slug}</td>
                  <td><span class="badge-info">${tag._count?.content || 0}</span></td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        onclick="editTag(${tag.id}, '${tag.name.replace(/'/g, "\\'")}', '${tag.slug}')"
                        class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        title="Editar"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                      </button>
                      <button
                        onclick="deleteTag(${tag.id}, '${tag.name.replace(/'/g, "\\'")}')"
                        class="text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Eliminar"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="hidden modal-backdrop" onclick="closeEditModal(event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">Editar Tag</h3>
          <button onclick="closeEditModal()" class="modal-close">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <form id="editForm" method="POST" class="modal-body">
          <input type="hidden" id="editId" name="id" />

          <div class="mb-4">
            <label class="form-label">Nombre</label>
            <input type="text" id="editName" name="name" required class="form-input" />
          </div>

          <div class="mb-4">
            <label class="form-label">Slug</label>
            <input type="text" id="editSlug" name="slug" required class="form-input" />
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeEditModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-action">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      function generateTagSlug(name) {
        const slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        document.getElementById('tagSlugInput').value = slug;
      }

      function editTag(id, name, slug) {
        document.getElementById('editId').value = id;
        document.getElementById('editName').value = name;
        document.getElementById('editSlug').value = slug;
        document.getElementById('editForm').action = ADMIN_BASE_PATH + '/tags/edit/' + id;
        document.getElementById('editModal').classList.remove('hidden');
      }

      function closeEditModal(event) {
        if (!event || event.target.classList.contains('modal-backdrop') || event.type === 'click') {
          document.getElementById('editModal').classList.add('hidden');
        }
      }

      function deleteTag(id, name) {
        if (confirm(\`¿Estás seguro de eliminar el tag "\${name}"?\`)) {
          fetch(\`\${ADMIN_BASE_PATH}/tags/delete/\${id}\`, { method: 'POST' })
            .then(response => response.ok ? window.location.reload() : alert('Error al eliminar'))
            .catch(() => alert('Error al eliminar'));
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Tags",
    children: content,
    activePage: "content.tags",
    user,
  });
};

export default TagsPage;
