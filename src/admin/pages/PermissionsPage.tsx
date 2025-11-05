import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface PermissionEntry {
  id: number;
  module: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}

interface PermissionsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  permissions: PermissionEntry[];
}

export const PermissionsPage = (props: PermissionsPageProps) => {
  const { user, permissions } = props;
  const adminPath = env.ADMIN_PATH;

  const permissionsForScript = permissions.map((perm) => ({
    id: perm.id,
    module: perm.module,
    action: perm.action,
    description: perm.description ?? "",
  }));

  const content = html`
    <div class="page-header">
      <div>
        <h1 class="page-title">Permisos</h1>
        <p class="page-subtitle">
          Gestiona las acciones disponibles para los distintos módulos del sistema.
        </p>
      </div>
      <div class="page-actions">
        <button onclick="openPermissionModal('create')" class="btn-action">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
          </svg>
          Nuevo Permiso
        </button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <h2 class="table-card-title">Listado de permisos</h2>
        <p class="table-card-subtitle">
          ${permissions.length} permiso${permissions.length === 1 ? "" : "s"} registrados
        </p>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Módulo</th>
            <th>Acción</th>
            <th>Descripción</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${permissions.length === 0
            ? html`
              <tr>
                <td colspan="5" class="text-center py-10 text-gray-500 dark:text-gray-400">
                  No hay permisos configurados
                </td>
              </tr>
            `
            : permissions.map((perm) => html`
              <tr>
                <td class="uppercase tracking-wide text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ${perm.module}
                </td>
                <td class="font-medium capitalize">
                  ${perm.action}
                </td>
                <td class="text-sm text-slate-600 dark:text-slate-300">
                  ${perm.description || "—"}
                </td>
                <td class="text-xs text-slate-500 dark:text-slate-400">
                  ${new Date(perm.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td>
                  <div class="flex gap-2 justify-end">
                    <button
                      onclick="openPermissionModal('edit', ${perm.id})"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:border-purple-300 transition"
                      title="Editar"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                      </svg>
                    </button>
                    <button
                      onclick="deletePermission(${perm.id})"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 transition"
                      title="Eliminar"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H5a1 1 0 000 2v9a3 3 0 003 3h4a3 3 0 003-3V6a1 1 0 100-2h-2.382l-.724-1.447A1 1 0 0011 2H9zM8 7a1 1 0 012 0v7a1 1 0 11-2 0V7zm4-1a1 1 0 00-1 1v7a1 1 0 102 0V7a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `)}
        </tbody>
      </table>
    </div>

    <!-- Permission Modal -->
    <div id="permissionModal" class="hidden modal-backdrop" onclick="closePermissionModal(event)">
      <div class="modal-container max-w-lg">
        <div class="modal-header">
          <h3 class="modal-title" id="permissionModalTitle">Nuevo permiso</h3>
          <button onclick="closePermissionModal()" class="modal-close" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <form id="permissionForm" method="POST" class="modal-body space-y-4">
          <div>
            <label class="form-label" for="permissionModule">Módulo *</label>
            <input id="permissionModule" name="module" required class="form-input" type="text" placeholder="Ej. users, content, media" />
          </div>
          <div>
            <label class="form-label" for="permissionAction">Acción *</label>
            <input id="permissionAction" name="action" required class="form-input" type="text" placeholder="create, read, update, delete" />
          </div>
          <div>
            <label class="form-label" for="permissionDescription">Descripción</label>
            <textarea id="permissionDescription" name="description" class="form-input" rows="3" placeholder="Describe qué permite esta acción"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closePermissionModal()">Cancelar</button>
            <button type="submit" class="btn-action">Guardar permiso</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      const PERMISSIONS_DATA = ${JSON.stringify(permissionsForScript)};

      function openPermissionModal(mode, permissionId) {
        const modal = document.getElementById('permissionModal');
        const title = document.getElementById('permissionModalTitle');
        const form = document.getElementById('permissionForm');
        const moduleInput = document.getElementById('permissionModule');
        const actionInput = document.getElementById('permissionAction');
        const descriptionInput = document.getElementById('permissionDescription');

        if (mode === 'create') {
          title.textContent = 'Nuevo permiso';
          form.action = ADMIN_BASE_PATH + '/permissions/create';
          moduleInput.value = '';
          actionInput.value = '';
          descriptionInput.value = '';
        } else {
          const permission = PERMISSIONS_DATA.find((item) => item.id === permissionId);
          if (!permission) return;
          title.textContent = 'Editar permiso';
          form.action = ADMIN_BASE_PATH + '/permissions/edit/' + permissionId;
          moduleInput.value = permission.module;
          actionInput.value = permission.action;
          descriptionInput.value = permission.description || '';
        }

        modal.classList.remove('hidden');
      }

      function closePermissionModal(event) {
        if (event && !event.target.classList.contains('modal-backdrop') && event.type === 'click') {
          return;
        }
        document.getElementById('permissionModal').classList.add('hidden');
      }

      function deletePermission(permissionId) {
        const permission = PERMISSIONS_DATA.find((item) => item.id === permissionId);
        const label = permission ? permission.module + ':' + permission.action : 'este permiso';
        if (!confirm('¿Seguro que deseas eliminar "' + label + '"?')) {
          return;
        }

        fetch(ADMIN_BASE_PATH + '/permissions/delete/' + permissionId, { method: 'POST' })
          .then((response) => {
            if (response.ok) {
              window.location.reload();
            } else {
              alert('No fue posible eliminar el permiso');
            }
          })
          .catch(() => alert('No fue posible eliminar el permiso'));
      }
    </script>
  `;

  return AdminLayout({
    title: "Permisos",
    children: content,
    activePage: "access.permissions",
    user,
  });
};

export default PermissionsPage;
