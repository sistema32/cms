import { html } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusBadge } from "@/admin/components/nexus/NexusComponents.tsx";
import { env } from "@/config/env.ts";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

interface CategoriesPageProps {
  user: {
    id: number;
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
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const CategoriesNexus = (props: CategoriesPageProps) => {
  const { user, categories, notifications = [], unreadNotificationCount = 0 } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <div style="margin-bottom: 2rem;">
      <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--nexus-base-content); letter-spacing: -0.025em; margin-bottom: 0.5rem;">
        Categorías
      </h1>
      <p style="font-size: 0.9375rem; color: var(--nexus-base-content); opacity: 0.6;">
        Organiza tu contenido en categorías temáticas
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
        <!-- Add Category Form -->
        ${NexusCard({
          title: 'Nueva Categoría',
          children: html`
            <form method="POST" action="${adminPath}/categories/create">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
                  Nombre <span style="color: var(--nexus-error);">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="categoryName"
                  required
                  placeholder="Nombre de la categoría"
                  style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
                />
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
                  Slug <span style="color: var(--nexus-error);">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  id="categorySlugInput"
                  required
                  placeholder="categoria-slug"
                  style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
                />
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Descripción opcional..."
                  style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s; resize: vertical;"
                ></textarea>
              </div>

              <button
                type="submit"
                style="width: 100%; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: var(--nexus-primary); color: #fff; border: none; cursor: pointer; transition: all 0.2s;"
              >
                Agregar Categoría
              </button>
            </form>
          `,
        })}

        <!-- Categories List -->
        ${NexusCard({
          title: 'Listado de Categorías',
          subtitle: `${categories.length} categoría${categories.length === 1 ? '' : 's'} registrada${categories.length === 1 ? '' : 's'}`,
          children: html`
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--nexus-base-200);">
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Nombre</th>
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Slug</th>
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Contenidos</th>
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${categories.length === 0 ? html`
                    <tr>
                      <td colspan="4" style="text-align: center; padding: 3rem 1rem; color: var(--nexus-base-content); opacity: 0.5;">
                        No hay categorías creadas
                      </td>
                    </tr>
                  ` : categories.map(cat => html`
                    <tr style="border-bottom: 1px solid var(--nexus-base-200); transition: background 0.15s;">
                      <td style="padding: 1rem;">
                        <div style="font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.25rem;">
                          ${cat.name}
                        </div>
                        ${cat.description ? html`
                          <div style="font-size: 0.8125rem; color: var(--nexus-base-content); opacity: 0.6;">
                            ${cat.description}
                          </div>
                        ` : ''}
                      </td>
                      <td style="padding: 1rem; font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.65;">
                        /${cat.slug}
                      </td>
                      <td style="padding: 1rem;">
                        ${NexusBadge({ label: String(cat._count?.content || 0), type: 'info', soft: true })}
                      </td>
                      <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                          <button
                            data-action="edit-category"
                            data-id="${cat.id}"
                            data-name="${cat.name}"
                            data-slug="${cat.slug}"
                            data-description="${cat.description || ''}"
                            style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--nexus-radius-md); background: transparent; border: none; color: var(--nexus-primary); cursor: pointer; transition: all 0.2s;"
                            title="Editar"
                          >
                            <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                            </svg>
                          </button>
                          <button
                            data-action="delete-category"
                            data-id="${cat.id}"
                            data-name="${cat.name}"
                            style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--nexus-radius-md); background: transparent; border: none; color: var(--nexus-error); cursor: pointer; transition: all 0.2s;"
                            title="Eliminar"
                          >
                            <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
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
          `,
          noPadding: true,
        })}
      </div>
    </div>

    <!-- Edit Modal -->
    <dialog id="editModal" style="max-width: 32rem; padding: 0; border: none; border-radius: var(--nexus-radius-lg); background: var(--nexus-base-100); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
      <div style="position: relative; padding: 2rem;">
        <button
          data-action="close-edit-modal"
          style="position: absolute; right: 1rem; top: 1rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: transparent; border: none; color: var(--nexus-base-content); opacity: 0.6; cursor: pointer; transition: all 0.2s;"
          aria-label="Cerrar"
        >
          <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--nexus-base-content); margin-bottom: 1.5rem;">
          Editar Categoría
        </h3>

        <form id="editForm" method="POST">
          <input type="hidden" id="editId" name="id" />

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Nombre
            </label>
            <input
              type="text"
              id="editName"
              name="name"
              required
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
            />
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Slug
            </label>
            <input
              type="text"
              id="editSlug"
              name="slug"
              required
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
            />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Descripción
            </label>
            <textarea
              id="editDescription"
              name="description"
              rows="3"
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s; resize: vertical;"
            ></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button
              type="button"
              data-action="close-edit-modal"
              style="padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: transparent; border: 1px solid var(--nexus-base-300); color: var(--nexus-base-content); cursor: pointer; transition: all 0.2s;"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style="padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: var(--nexus-primary); color: #fff; border: none; cursor: pointer; transition: all 0.2s;"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <script>
      // XSS safe - Using data attributes and event listeners instead of inline handlers
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      document.addEventListener('DOMContentLoaded', function() {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');
        const categoryNameInput = document.getElementById('categoryName');
        const categorySlugInput = document.getElementById('categorySlugInput');

        // XSS safe - Auto-generate slug from name
        categoryNameInput?.addEventListener('keyup', function() {
          // XSS safe - Using textContent and proper escaping
          const name = this.value;
          const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          categorySlugInput.value = slug;
        });

        // XSS safe - Edit category button handlers
        document.querySelectorAll('[data-action="edit-category"]').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id') || '';
            const name = this.getAttribute('data-name') || '';
            const slug = this.getAttribute('data-slug') || '';
            const description = this.getAttribute('data-description') || '';

            // XSS safe - Using value assignment instead of innerHTML
            document.getElementById('editId').value = id;
            document.getElementById('editName').value = name;
            document.getElementById('editSlug').value = slug;
            document.getElementById('editDescription').value = description;
            editForm.action = ADMIN_BASE_PATH + '/categories/edit/' + encodeURIComponent(id);
            editModal?.showModal();
          });
        });

        // XSS safe - Close edit modal button handlers
        document.querySelectorAll('[data-action="close-edit-modal"]').forEach(btn => {
          btn.addEventListener('click', function() {
            editModal?.close();
          });
        });

        // XSS safe - Delete category button handlers
        document.querySelectorAll('[data-action="delete-category"]').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id') || '';
            const name = this.getAttribute('data-name') || '';

            if (!confirm('¿Estás seguro de eliminar la categoría "' + name + '"?')) {
              return;
            }

            try {
              const response = await fetch(ADMIN_BASE_PATH + '/categories/delete/' + encodeURIComponent(id), {
                method: 'POST'
              });

              if (response.ok) {
                window.location.reload();
              } else {
                alert('Error al eliminar');
              }
            } catch (error) {
              alert('Error al eliminar');
            }
          });
        });

        // Close modal on backdrop click
        editModal?.addEventListener('click', function(e) {
          if (e.target === editModal) {
            editModal.close();
          }
        });
      });
    </script>
  `;

  return AdminLayoutNexus({
    title: "Categorías",
    children: content,
    activePage: "content.categories",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default CategoriesNexus;
