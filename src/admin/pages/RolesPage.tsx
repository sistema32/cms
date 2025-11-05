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
}

export const RolesPage = (props: RolesPageProps) => {
  const { user, roles, permissions } = props;
  const adminPath = env.ADMIN_PATH;

  const permissionsByModule = Array.from(
    permissions.reduce((acc, perm) => {
      if (!acc.has(perm.module)) {
        acc.set(perm.module, []);
      }
      acc.get(perm.module)!.push(perm);
      return acc;
    }, new Map<string, RolePermission[]>()),
  ).map(([module, perms]) => ({
    module,
    permissions: perms.sort((a, b) =>
      a.action.localeCompare(b.action, "es-ES")
    ),
  })).sort((a, b) => a.module.localeCompare(b.module, "es-ES"));

  const rolesForScript = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description ?? "",
    permissionIds: role.permissions.map((perm) => perm.id),
  }));

  const content = html`
    <div class="page-header">
      <div>
        <h1 class="page-title">Roles y Permisos</h1>
        <p class="page-subtitle">
          Define conjuntos de permisos reutilizables y asígnalos a tus usuarios.
        </p>
      </div>
      <div class="page-actions">
        <button onclick="openRoleModal('create')" class="btn-action">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 8h-2V6a1 1 0 10-2 0v2h-2a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2z"></path>
          </svg>
          Nuevo Rol
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
      <div class="table-card">
        <div class="table-card-header">
          <h2 class="table-card-title">Roles configurados</h2>
          <p class="table-card-subtitle">
            ${roles.length} rol${roles.length === 1 ? "" : "es"} disponibles
          </p>
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Rol</th>
              <th class="hidden md:table-cell">Descripción</th>
              <th>Permisos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${roles.length === 0
              ? html`
                <tr>
                  <td colspan="4" class="text-center py-10 text-gray-500 dark:text-gray-400">
                    No hay roles configurados todavía
                  </td>
                </tr>
              `
              : roles.map((role) =>
                html`
                  <tr>
                    <td>
                      <div class="flex flex-col">
                        <span class="font-semibold text-gray-900 dark:text-gray-100">
                          ${role.name}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          ID ${role.id}
                        </span>
                      </div>
                    </td>
                    <td class="hidden md:table-cell text-sm text-gray-600 dark:text-gray-300">
                      ${role.description || "—"}
                    </td>
                    <td>
                      <span class="badge-info">
                        ${role.permissions.length} permiso${role.permissions.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-2 justify-end">
                        <button
                          onclick="openRoleModal('edit', ${role.id})"
                          class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:border-purple-300 transition"
                          title="Editar rol"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                          </svg>
                        </button>
                        <button
                          onclick="openPermissionsModal(${role.id})"
                          class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-200 transition"
                          title="Gestionar permisos"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a2 2 0 012 2v2h2.5a1.5 1.5 0 011.493 1.356L16 7.5v5a1.5 1.5 0 01-1.356 1.493L14.5 14H12v2a2 2 0 01-1.85 1.995L10 18h-0.25a2 2 0 01-1.995-1.85L7.75 16l-.001-2H5.5a1.5 1.5 0 01-1.493-1.356L4 12.5v-5a1.5 1.5 0 011.356-1.493L5.5 6H8V4a2 2 0 012-2z"></path>
                          </svg>
                        </button>
                        <button
                          onclick="deleteRole(${role.id})"
                          class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 transition"
                          title="Eliminar"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H5a1 1 0 000 2v9a3 3 0 003 3h4a3 3 0 003-3V6a1 1 0 100-2h-2.382l-.724-1.447A1 1 0 0011 2H9zM8 7a1 1 0 012 0v7a1 1 0 11-2 0V7zm4-1a1 1 0 00-1 1v7a1 1 0 102 0V7a1 1 0 00-1-1z" clip-rule="evenodd"></path>
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

      <aside class="table-card">
        <div class="table-card-header">
          <h2 class="table-card-title flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v1h14V5a2 2 0 00-2-2H5zm12 5H3v7a2 2 0 002 2h10a2 2 0 002-2V8zm-8 3a1 1 0 112 0v3a1 1 0 11-2 0v-3z" clip-rule="evenodd" />
            </svg>
            Módulos disponibles
          </h2>
          <p class="table-card-subtitle">
            Los permisos están agrupados por módulo. Activa solo los que necesitas para cada rol.
          </p>
        </div>
        <div class="space-y-3">
          ${permissionsByModule.map(({ module, permissions }) => html`
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  ${module}
                </span>
                <span class="badge-secondary text-xs">
                  ${permissions.length} acción${permissions.length === 1 ? "" : "es"}
                </span>
              </div>
              <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                ${permissions.map((perm) => perm.action).join(" · ")}
              </div>
            </div>
          `)}
        </div>
      </aside>
    </div>

    <!-- Create/Edit Role Modal -->
    <div id="roleModal" class="hidden modal-backdrop" onclick="closeRoleModal(event)">
      <div class="modal-container max-w-lg">
        <div class="modal-header">
          <h3 class="modal-title" id="roleModalTitle">Nuevo rol</h3>
          <button onclick="closeRoleModal()" class="modal-close" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <form id="roleForm" method="POST" class="modal-body space-y-4">
          <div>
            <label class="form-label" for="roleName">Nombre *</label>
            <input id="roleName" name="name" required class="form-input" type="text" />
          </div>
          <div>
            <label class="form-label" for="roleDescription">Descripción</label>
            <textarea id="roleDescription" name="description" class="form-input" rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeRoleModal()">Cancelar</button>
            <button type="submit" class="btn-action">Guardar rol</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Permissions Modal -->
    <div id="permissionsModal" class="hidden modal-backdrop" onclick="closePermissionsModal(event)">
      <div class="modal-container max-w-3xl">
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="permissionsModalTitle">Permisos del rol</h3>
            <p class="modal-subtitle">Selecciona los permisos que tendrá este rol.</p>
          </div>
          <button onclick="closePermissionsModal()" class="modal-close" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <form id="permissionsForm" method="POST" class="modal-body space-y-6">
          <div class="space-y-5 max-h-[24rem] overflow-y-auto pr-1">
            ${permissionsByModule.map(({ module, permissions }) => html`
              <fieldset class="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <legend class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  ${module}
                </legend>
                <div class="mt-3 grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                  ${permissions.map((perm) => html`
                    <label class="flex items-start gap-3 rounded-lg border border-transparent hover:border-purple-300/50 hover:bg-purple-50/50 dark:hover:bg-slate-800/60 p-3 transition">
                      <input
                        type="checkbox"
                        name="permissionIds[]"
                        value="${perm.id}"
                        class="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span class="flex flex-col text-sm text-slate-600 dark:text-slate-200">
                        <span class="font-medium capitalize">${perm.action}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">
                          ${perm.description || "Sin descripción"}
                        </span>
                      </span>
                    </label>
                  `)}
                </div>
              </fieldset>
            `)}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closePermissionsModal()">Cancelar</button>
            <button type="submit" class="btn-action">Guardar permisos</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      const ROLES_DATA = ${JSON.stringify(rolesForScript)};

      function openRoleModal(mode, roleId) {
        const modal = document.getElementById('roleModal');
        const title = document.getElementById('roleModalTitle');
        const form = document.getElementById('roleForm');
        const nameInput = document.getElementById('roleName');
        const descriptionInput = document.getElementById('roleDescription');

        if (mode === 'create') {
          title.textContent = 'Nuevo rol';
          form.action = ADMIN_BASE_PATH + '/roles/create';
          nameInput.value = '';
          descriptionInput.value = '';
        } else {
          const role = ROLES_DATA.find((item) => item.id === roleId);
          if (!role) return;
          title.textContent = 'Editar rol';
          form.action = ADMIN_BASE_PATH + '/roles/edit/' + roleId;
          nameInput.value = role.name;
          descriptionInput.value = role.description || '';
        }

        modal.classList.remove('hidden');
      }

      function closeRoleModal(event) {
        if (event && !event.target.classList.contains('modal-backdrop') && event.type === 'click') {
          return;
        }
        document.getElementById('roleModal').classList.add('hidden');
      }

      function openPermissionsModal(roleId) {
        const modal = document.getElementById('permissionsModal');
        const title = document.getElementById('permissionsModalTitle');
        const form = document.getElementById('permissionsForm');
        const role = ROLES_DATA.find((item) => item.id === roleId);
        if (!role) return;

        title.textContent = 'Permisos de "' + role.name + '"';
        form.action = ADMIN_BASE_PATH + '/roles/' + roleId + '/permissions';

        const checkboxes = form.querySelectorAll('input[name="permissionIds[]"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = role.permissionIds.includes(Number(checkbox.value));
        });

        modal.classList.remove('hidden');
      }

      function closePermissionsModal(event) {
        if (event && !event.target.classList.contains('modal-backdrop') && event.type === 'click') {
          return;
        }
        document.getElementById('permissionsModal').classList.add('hidden');
      }

      function deleteRole(roleId) {
        const role = ROLES_DATA.find((item) => item.id === roleId);
        const roleName = role ? role.name : 'este rol';
        if (!confirm('¿Seguro que deseas eliminar "' + roleName + '"? Esta acción no se puede deshacer.')) {
          return;
        }

        fetch(ADMIN_BASE_PATH + '/roles/delete/' + roleId, { method: 'POST' })
          .then((response) => {
            if (response.ok) {
              window.location.reload();
            } else {
              alert('No fue posible eliminar el rol');
            }
          })
          .catch(() => alert('No fue posible eliminar el rol'));
      }
    </script>
  `;

  return AdminLayout({
    title: "Roles",
    children: content,
    activePage: "access.roles",
    user,
  });
};

export default RolesPage;
