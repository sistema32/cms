import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface RolePermission {
  id: number;
  module: string;
  action: string;
  description?: string | null;
}

interface RoleEntry {
  id: number;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  userCount?: number;
  permissionCount?: number;
  permissions: RolePermission[];
  createdAt: Date;
}

interface RolesPageProps {
  user: {
    name: string | null;
    email: string;
  };
  roles: RoleEntry[];
  permissions: RolePermission[];
  stats?: {
    totalRoles: number;
    systemRoles: number;
    customRoles: number;
    totalUsers: number;
    usersWithoutRole: number;
  };
}

export const RolesPageImproved = (props: RolesPageProps) => {
  const { user, roles, permissions, stats } = props;
  const adminPath = env.ADMIN_PATH;

  const permissionsByModule = Array.from(
    permissions.reduce((acc, perm) => {
      if (!acc.has(perm.module)) {
        acc.set(perm.module, []);
      }
      acc.get(perm.module)!.push(perm);
      return acc;
    }, new Map<string, RolePermission[]>())
  )
    .map(([module, perms]) => ({
      module,
      permissions: perms.sort((a, b) => a.action.localeCompare(b.action, "es-ES")),
    }))
    .sort((a, b) => a.module.localeCompare(b.module, "es-ES"));

  const rolesForScript = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description ?? "",
    isSystem: role.isSystem ?? false,
    permissionIds: role.permissions.map((perm) => perm.id),
  }));

  const content = html\`
    <div class="page-header">
      <div>
        <h1 class="page-title">Roles y Permisos</h1>
        <p class="page-subtitle">Define conjuntos de permisos reutilizables y asígnalos a tus usuarios.</p>
        \${
          stats
            ? html\`
                <div class="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Total: <strong>\${stats.totalRoles}</strong></span>
                  <span>Sistema: <strong class="text-blue-600">\${stats.systemRoles}</strong></span>
                  <span>Personalizados: <strong class="text-purple-600">\${stats.customRoles}</strong></span>
                  <span>Usuarios: <strong>\${stats.totalUsers}</strong></span>
                  \${stats.usersWithoutRole > 0
                    ? html\`<span class="text-yellow-600">Sin rol: <strong>\${stats.usersWithoutRole}</strong></span>\`
                    : ""}
                </div>
              \`
            : ""
        }
      </div>
      <div class="page-actions">
        <button onclick="openRoleModal('create')" class="btn-action">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 8h-2V6a1 1 0 10-2 0v2h-2a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2z"
            ></path>
          </svg>
          Nuevo Rol
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
      <!-- Roles Table -->
      <div class="table-card">
        <div class="table-card-header">
          <h2 class="table-card-title">Roles configurados</h2>
          <p class="table-card-subtitle">\${roles.length} rol\${roles.length === 1 ? "" : "es"} disponibles</p>
        </div>

        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Tipo</th>
                <th>Usuarios</th>
                <th>Permisos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              \${
                roles.length === 0
                  ? html\`
                      <tr>
                        <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                          No hay roles para mostrar
                        </td>
                      </tr>
                    \`
                  : roles.map(
                      (role) => html\`
                        <tr>
                          <td>
                            <div>
                              <div class="font-medium text-gray-900 dark:text-gray-100">
                                \${role.name}
                                \${role.isSystem ? html\`<span class="ml-2 badge-info text-xs">Sistema</span>\` : ""}
                              </div>
                              \${role.description
                                ? html\`<div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    \${role.description}
                                  </div>\`
                                : ""}
                            </div>
                          </td>
                          <td>
                            \${role.isSystem
                              ? html\`<span class="badge-info">Sistema</span>\`
                              : html\`<span class="badge-secondary">Personalizado</span>\`}
                          </td>
                          <td>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              \${role.userCount !== undefined ? role.userCount : "-"} usuario\${role.userCount === 1 ? "" : "s"}
                            </span>
                          </td>
                          <td>
                            <span class="text-sm font-medium text-purple-600 dark:text-purple-400">
                              \${role.permissions.length} permiso\${role.permissions.length === 1 ? "" : "s"}
                            </span>
                          </td>
                          <td>
                            <div class="flex gap-2">
                              <button
                                onclick="viewRolePermissions(\${role.id})"
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                title="Ver permisos"
                              >
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                  <path
                                    fill-rule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clip-rule="evenodd"
                                  ></path>
                                </svg>
                              </button>
                              <button
                                onclick="openRoleModal('edit', \${role.id})"
                                class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                                title="Editar"
                              >
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                  ></path>
                                </svg>
                              </button>
                              <button
                                onclick="cloneRole(\${role.id})"
                                class="text-green-600 hover:text-green-800 dark:text-green-400"
                                title="Clonar rol"
                              >
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"
                                  ></path>
                                  <path
                                    d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"
                                  ></path>
                                </svg>
                              </button>
                              \${!role.isSystem
                                ? html\`
                                    <button
                                      onclick="deleteRole(\${role.id}, '\${role.name}')"
                                      class="text-red-600 hover:text-red-800 dark:text-red-400"
                                      title="Eliminar"
                                    >
                                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                          fill-rule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clip-rule="evenodd"
                                        ></path>
                                      </svg>
                                    </button>
                                  \`
                                : ""}
                            </div>
                          </td>
                        </tr>
                      \`
                    )
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Permissions Panel -->
      <div class="table-card">
        <div class="table-card-header">
          <h2 class="table-card-title">Permisos disponibles</h2>
          <p class="table-card-subtitle">\${permissions.length} permisos en \${permissionsByModule.length} módulos</p>
        </div>

        <div class="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          \${permissionsByModule.map(
            (group) => html\`
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="bg-gray-50 dark:bg-gray-800 px-3 py-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                  \${group.module}
                  <span class="ml-2 text-xs text-gray-500">(\${group.permissions.length})</span>
                </div>
                <div class="p-3 space-y-1">
                  \${group.permissions.map(
                    (perm) => html\`
                      <div class="flex items-center justify-between text-sm py-1">
                        <span class="text-gray-700 dark:text-gray-300">\${perm.action}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">\${perm.description || ""}</span>
                      </div>
                    \`
                  )}
                </div>
              </div>
            \`
          )}
        </div>
      </div>
    </div>

    <!-- Role Modal -->
    <div id="roleModal" class="modal">
      <div class="modal-content max-w-4xl">
        <div class="modal-header">
          <h2 id="roleModalTitle">Nuevo Rol</h2>
          <button onclick="closeRoleModal()" class="modal-close">&times;</button>
        </div>
        <form id="roleForm" method="POST">
          <div class="modal-body">
            <input type="hidden" id="roleId" name="roleId" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group">
                <label for="roleName" class="form-label">Nombre del rol *</label>
                <input type="text" id="roleName" name="name" class="form-input" required />
              </div>

              <div class="form-group">
                <label for="roleDescription" class="form-label">Descripción</label>
                <input type="text" id="roleDescription" name="description" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label mb-3">Permisos</label>
              <div class="space-y-3 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                \${permissionsByModule.map(
                  (group) => html\`
                    <div class="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                      <div class="flex items-center justify-between mb-2">
                        <label class="font-medium text-sm text-gray-900 dark:text-gray-100">
                          <input
                            type="checkbox"
                            class="mr-2 module-checkbox"
                            data-module="\${group.module}"
                            onchange="toggleModulePermissions(this)"
                          />
                          \${group.module}
                        </label>
                        <span class="text-xs text-gray-500">(\${group.permissions.length} permisos)</span>
                      </div>
                      <div class="ml-6 grid grid-cols-2 gap-2">
                        \${group.permissions.map(
                          (perm) => html\`
                            <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                name="permissions[]"
                                value="\${perm.id}"
                                class="mr-2 permission-checkbox"
                                data-module="\${group.module}"
                                onchange="updateModuleCheckbox()"
                              />
                              <span class="font-medium">\${perm.action}</span>
                              \${perm.description
                                ? html\`<span class="text-xs text-gray-500 ml-1">- \${perm.description}</span>\`
                                : ""}
                            </label>
                          \`
                        )}
                      </div>
                    </div>
                  \`
                )}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeRoleModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Rol</button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Permissions Modal -->
    <div id="viewPermissionsModal" class="modal">
      <div class="modal-content max-w-2xl">
        <div class="modal-header">
          <h2 id="viewPermissionsTitle">Permisos del Rol</h2>
          <button onclick="closeViewPermissionsModal()" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div id="viewPermissionsContent"></div>
        </div>
        <div class="modal-footer">
          <button type="button" onclick="closeViewPermissionsModal()" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Clone Role Modal -->
    <div id="cloneModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Clonar Rol</h2>
          <button onclick="closeCloneModal()" class="modal-close">&times;</button>
        </div>
        <form id="cloneForm" method="POST">
          <div class="modal-body">
            <input type="hidden" id="cloneRoleId" name="roleId" />

            <div class="form-group">
              <label for="cloneRoleName" class="form-label">Nombre del nuevo rol *</label>
              <input type="text" id="cloneRoleName" name="newName" class="form-input" required />
            </div>

            <div class="form-group">
              <label for="cloneRoleDescription" class="form-label">Descripción</label>
              <input type="text" id="cloneRoleDescription" name="newDescription" class="form-input" />
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Se creará una copia exacta del rol con todos sus permisos asignados.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeCloneModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Clonar Rol</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // Store roles data
      const rolesData = ${JSON.stringify(rolesForScript)};

      // Toggle module permissions
      function toggleModulePermissions(checkbox) {
        const module = checkbox.dataset.module;
        const moduleCheckboxes = document.querySelectorAll(\`.permission-checkbox[data-module="\${module}"]\`);
        moduleCheckboxes.forEach(cb => cb.checked = checkbox.checked);
      }

      // Update module checkbox based on permission checkboxes
      function updateModuleCheckbox() {
        const modules = [...new Set(Array.from(document.querySelectorAll('.permission-checkbox')).map(cb => cb.dataset.module))];

        modules.forEach(module => {
          const moduleCheckbox = document.querySelector(\`.module-checkbox[data-module="\${module}"]\`);
          const permissionCheckboxes = document.querySelectorAll(\`.permission-checkbox[data-module="\${module}"]\`);
          const checkedCount = Array.from(permissionCheckboxes).filter(cb => cb.checked).length;

          if (checkedCount === 0) {
            moduleCheckbox.checked = false;
            moduleCheckbox.indeterminate = false;
          } else if (checkedCount === permissionCheckboxes.length) {
            moduleCheckbox.checked = true;
            moduleCheckbox.indeterminate = false;
          } else {
            moduleCheckbox.checked = false;
            moduleCheckbox.indeterminate = true;
          }
        });
      }

      // Open role modal
      function openRoleModal(mode, roleId = null) {
        const modal = document.getElementById('roleModal');
        const title = document.getElementById('roleModalTitle');
        const form = document.getElementById('roleForm');

        // Clear all checkboxes first
        document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.module-checkbox').forEach(cb => {
          cb.checked = false;
          cb.indeterminate = false;
        });

        if (mode === 'create') {
          title.textContent = 'Nuevo Rol';
          form.action = '\${adminPath}/roles/create';
          document.getElementById('roleId').value = '';
          document.getElementById('roleName').value = '';
          document.getElementById('roleDescription').value = '';
        } else if (mode === 'edit' && roleId) {
          const role = rolesData.find(r => r.id === roleId);
          if (!role) return;

          title.textContent = 'Editar Rol';
          form.action = '\${adminPath}/roles/edit/' + roleId;
          document.getElementById('roleId').value = roleId;
          document.getElementById('roleName').value = role.name;
          document.getElementById('roleDescription').value = role.description;

          // Check assigned permissions
          role.permissionIds.forEach(permId => {
            const checkbox = document.querySelector(\`input[name="permissions[]"][value="\${permId}"]\`);
            if (checkbox) checkbox.checked = true;
          });

          // Update module checkboxes
          updateModuleCheckbox();
        }

        modal.classList.add('modal-open');
      }

      function closeRoleModal() {
        document.getElementById('roleModal').classList.remove('modal-open');
      }

      // View role permissions
      function viewRolePermissions(roleId) {
        const role = rolesData.find(r => r.id === roleId);
        if (!role) return;

        document.getElementById('viewPermissionsTitle').textContent = \`Permisos de "\${role.name}"\`;

        const permissions = ${JSON.stringify(permissions)};
        const rolePermissions = permissions.filter(p => role.permissionIds.includes(p.id));

        // Group by module
        const grouped = rolePermissions.reduce((acc, perm) => {
          if (!acc[perm.module]) acc[perm.module] = [];
          acc[perm.module].push(perm);
          return acc;
        }, {});

        let content = '<div class="space-y-4">';
        for (const [module, perms] of Object.entries(grouped)) {
          content += \`
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="bg-gray-50 dark:bg-gray-800 px-3 py-2 font-medium text-sm">
                \${module} <span class="text-xs text-gray-500">(\${perms.length})</span>
              </div>
              <div class="p-3 space-y-1">
                \${perms.map(p => \`
                  <div class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="font-medium">\${p.action}</span>
                    \${p.description ? \`<span class="text-xs text-gray-500 ml-2">- \${p.description}</span>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        }
        content += '</div>';

        document.getElementById('viewPermissionsContent').innerHTML = content;
        document.getElementById('viewPermissionsModal').classList.add('modal-open');
      }

      function closeViewPermissionsModal() {
        document.getElementById('viewPermissionsModal').classList.remove('modal-open');
      }

      // Clone role
      function cloneRole(roleId) {
        const role = rolesData.find(r => r.id === roleId);
        if (!role) return;

        document.getElementById('cloneRoleId').value = roleId;
        document.getElementById('cloneRoleName').value = role.name + ' (Copia)';
        document.getElementById('cloneRoleDescription').value = 'Copia de ' + role.name;
        document.getElementById('cloneForm').action = '\${adminPath}/roles/clone/' + roleId;
        document.getElementById('cloneModal').classList.add('modal-open');
      }

      function closeCloneModal() {
        document.getElementById('cloneModal').classList.remove('modal-open');
      }

      // Delete role
      async function deleteRole(roleId, roleName) {
        if (!confirm(\`¿Estás seguro de eliminar el rol "\${roleName}"?\`)) {
          return;
        }

        try {
          const response = await fetch('\${adminPath}/roles/delete/' + roleId, {
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

      // Close modals on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeRoleModal();
          closeViewPermissionsModal();
          closeCloneModal();
        }
      });

      // Close modals on outside click
      ['roleModal', 'viewPermissionsModal', 'cloneModal'].forEach(modalId => {
        document.getElementById(modalId)?.addEventListener('click', (e) => {
          if (e.target.id === modalId) {
            document.getElementById(modalId).classList.remove('modal-open');
          }
        });
      });
    </script>
  \`;

  return AdminLayout({ user, content, title: "Roles y Permisos" });
};
