import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface Permission {
  id: number;
  module: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}

interface PermissionModule {
  module: string;
  permissions: Permission[];
  count: number;
}

interface PermissionsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  permissions: Permission[];
  permissionsByModule?: PermissionModule[];
  modules?: string[];
  stats?: {
    totalPermissions: number;
    totalModules: number;
    moduleBreakdown: Array<{ module: string; count: number }>;
  };
  userPermissions?: string[];
}

export const PermissionsPageImproved = (props: PermissionsPageProps) => {
  const { user, permissions, permissionsByModule, modules, stats, userPermissions = [] } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canCreate = hasPermission("permissions:create");
  const canUpdate = hasPermission("permissions:update");
  const canDelete = hasPermission("permissions:delete");

  const grouped = permissionsByModule || Array.from(
    permissions.reduce((acc, perm) => {
      if (!acc.has(perm.module)) {
        acc.set(perm.module, []);
      }
      acc.get(perm.module)!.push(perm);
      return acc;
    }, new Map<string, Permission[]>())
  ).map(([module, perms]) => ({
    module,
    permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
    count: perms.length,
  })).sort((a, b) => a.module.localeCompare(b.module));

  const content = html`
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Permisos</h1>
        <p class="page-subtitle">
          Define permisos específicos para módulos y acciones del sistema
        </p>
        ${stats ? html`
          <div class="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: <strong>${stats.totalPermissions}</strong></span>
            <span>Módulos: <strong class="text-purple-600">${stats.totalModules}</strong></span>
          </div>
        ` : ""}
      </div>
      <div class="page-actions">
        ${canCreate ? html`
          <button onclick="showCreateModal()" class="btn-action">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
            </svg>
            Nuevo Permiso
          </button>
        ` : ""}
      </div>
    </div>

    <!-- Stats Cards -->
    ${stats && stats.moduleBreakdown.length > 0 ? html`
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${stats.moduleBreakdown.slice(0, 4).map(item => html`
          <div class="table-card p-4">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              ${item.module}
            </div>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${item.count}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              permiso${item.count === 1 ? '' : 's'}
            </div>
          </div>
        `)}
      </div>
    ` : ""}

    <!-- Permissions by Module -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      ${grouped.map(group => html`
        <div class="table-card">
          <div class="table-card-header">
            <h2 class="table-card-title">
              Módulo: ${group.module}
            </h2>
            <span class="badge-info">${group.count} permiso${group.count === 1 ? '' : 's'}</span>
          </div>

          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${group.permissions.map(perm => html`
                  <tr>
                    <td>
                      <span class="font-mono text-sm font-medium text-purple-600 dark:text-purple-400">
                        ${perm.action}
                      </span>
                    </td>
                    <td class="text-sm text-gray-600 dark:text-gray-400">
                      ${perm.description || '-'}
                    </td>
                    <td>
                      <div class="flex gap-2">
                        ${canUpdate ? html`
                          <button
                            onclick="editPermission(${perm.id}, '${perm.module}', '${perm.action}', '${perm.description || ''}')"
                            class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                            title="Editar"
                          >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                            </svg>
                          </button>
                        ` : ""}
                        ${canDelete ? html`
                          <button
                            onclick="deletePermission(${perm.id}, '${perm.module}:${perm.action}')"
                            class="text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Eliminar"
                          >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                          </button>
                        ` : ""}
                        ${!canUpdate && !canDelete ? html`
                          <span class="text-xs text-gray-400">Sin permisos</span>
                        ` : ""}
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `)}
    </div>

    <!-- Create/Edit Modal -->
    <div id="permissionModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">Nuevo Permiso</h2>
          <button onclick="closeModal()" class="modal-close">&times;</button>
        </div>
        <form id="permissionForm" method="POST">
          <div class="modal-body">
            <input type="hidden" id="permissionId" name="permissionId" />

            <div class="form-group">
              <label for="module" class="form-label">Módulo *</label>
              <input
                type="text"
                id="module"
                name="module"
                class="form-input"
                list="modulesList"
                required
                placeholder="ej: users, posts, media..."
              />
              <datalist id="modulesList">
                ${modules && modules.length > 0 ? modules.map(m => html`
                  <option value="${m}">${m}</option>
                `) : grouped.map(g => html`
                  <option value="${g.module}">${g.module}</option>
                `)}
              </datalist>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Nombre del módulo o sección del sistema
              </p>
            </div>

            <div class="form-group">
              <label for="action" class="form-label">Acción *</label>
              <input
                type="text"
                id="action"
                name="action"
                class="form-input"
                required
                placeholder="ej: create, read, update, delete..."
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Acción que permite realizar este permiso
              </p>
            </div>

            <div class="form-group">
              <label for="description" class="form-label">Descripción</label>
              <input
                type="text"
                id="description"
                name="description"
                class="form-input"
                placeholder="Descripción breve del permiso..."
              />
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <strong>Convención:</strong> Los permisos se nombran como <code class="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">módulo:acción</code>
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Ejemplos: users:create, posts:delete, media:read
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeModal()" class="btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      function showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Nuevo Permiso';
        document.getElementById('permissionForm').action = ADMIN_BASE_PATH + '/permissions/create';
        document.getElementById('permissionId').value = '';
        document.getElementById('module').value = '';
        document.getElementById('action').value = '';
        document.getElementById('description').value = '';
        document.getElementById('module').readOnly = false;
        document.getElementById('action').readOnly = false;
        document.getElementById('permissionModal').classList.add('modal-open');
      }

      function editPermission(id, module, action, description) {
        document.getElementById('modalTitle').textContent = 'Editar Permiso';
        document.getElementById('permissionForm').action = ADMIN_BASE_PATH + '/permissions/edit/' + id;
        document.getElementById('permissionId').value = id;
        document.getElementById('module').value = module;
        document.getElementById('action').value = action;
        document.getElementById('description').value = description;
        // Don't allow changing module/action for existing permissions
        document.getElementById('module').readOnly = true;
        document.getElementById('action').readOnly = true;
        document.getElementById('permissionModal').classList.add('modal-open');
      }

      function closeModal() {
        document.getElementById('permissionModal').classList.remove('modal-open');
      }

      async function deletePermission(id, name) {
        if (!confirm('¿Estás seguro de eliminar el permiso "' + name + '"?\nEsto puede afectar a roles que tengan este permiso asignado.')) {
          return;
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/permissions/delete/' + id, {
            method: 'POST'
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'No se pudo eliminar'));
          }
        } catch (error) {
          alert('Error de conexión');
        }
      }

      // Close modal on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      });

      // Close modal on outside click
      document.getElementById('permissionModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'permissionModal') {
          closeModal();
        }
      });
    </script>
  `;

  return AdminLayout({ user, children: content, title: "Permisos" });
};
