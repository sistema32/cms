import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface CategoriesPageProps {
  user: {
    name: string | null;
    email: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    _count?: { content: number };
  }>;
}

export const CategoriesPage = (props: CategoriesPageProps) => {
  const { user, categories } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Categorías</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Add Category Form -->
      <div class="form-card">
        <h3 class="text-lg font-semibold mb-4">Nueva Categoría</h3>
        <form method="POST" action="${adminPath}/categories/create">
          <div class="mb-4">
            <label class="form-label">Nombre *</label>
            <input
              type="text"
              name="name"
              required
              class="form-input"
              placeholder="Nombre de la categoría"
              onkeyup="generateCategorySlug(this.value)"
            />
          </div>

          <div class="mb-4">
            <label class="form-label">Slug *</label>
            <input
              type="text"
              name="slug"
              id="categorySlugInput"
              required
              class="form-input"
              placeholder="categoria-slug"
            />
          </div>

          <div class="mb-4">
            <label class="form-label">Descripción</label>
            <textarea
              name="description"
              rows="3"
              class="form-input"
              placeholder="Descripción opcional..."
            ></textarea>
          </div>

          <button type="submit" class="w-full btn-action">
            Agregar Categoría
          </button>
        </form>
      </div>

      <!-- Categories List -->
      <div class="lg:col-span-2">
        <div class="table-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Contenidos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${categories.length === 0 ? html`
                <tr>
                  <td colspan="4" class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay categorías creadas
                  </td>
                </tr>
              ` : categories.map(cat => html`
                <tr>
                  <td>
                    <div class="font-medium">${cat.name}</div>
                    ${cat.description ? html`
                      <div class="text-sm text-gray-500 dark:text-gray-400">${cat.description}</div>
                    ` : ''}
                  </td>
                  <td class="text-sm text-gray-500 dark:text-gray-400">
                    /${cat.slug}
                  </td>
                  <td>
                    <span class="badge-info">${cat._count?.content || 0}</span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        onclick="editCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}', '${cat.slug}', '${(cat.description || '').replace(/'/g, "\\'")}')"
                        class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        title="Editar"
                      >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                      </button>
                      <button
                        onclick="deleteCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')"
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
          <h3 class="modal-title">Editar Categoría</h3>
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

          <div class="mb-4">
            <label class="form-label">Descripción</label>
            <textarea id="editDescription" name="description" rows="3" class="form-input"></textarea>
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
      function generateCategorySlug(name) {
        const slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        document.getElementById('categorySlugInput').value = slug;
      }

      function editCategory(id, name, slug, description) {
        document.getElementById('editId').value = id;
        document.getElementById('editName').value = name;
        document.getElementById('editSlug').value = slug;
        document.getElementById('editDescription').value = description;
        document.getElementById('editForm').action = ADMIN_BASE_PATH + '/categories/edit/' + id;
        document.getElementById('editModal').classList.remove('hidden');
      }

      function closeEditModal(event) {
        if (!event || event.target.classList.contains('modal-backdrop') || event.type === 'click') {
          document.getElementById('editModal').classList.add('hidden');
        }
      }

      function deleteCategory(id, name) {
        if (confirm(\`¿Estás seguro de eliminar la categoría "\${name}"?\`)) {
          fetch(\`\${ADMIN_BASE_PATH}/categories/delete/\${id}\`, { method: 'POST' })
            .then(response => response.ok ? window.location.reload() : alert('Error al eliminar'))
            .catch(() => alert('Error al eliminar'));
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Categorías",
    children: content,
    activePage: "content.categories",
    user,
  });
};

export default CategoriesPage;
