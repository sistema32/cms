import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface UsersPageProps {
  user: {
    name: string | null;
    email: string;
  };
  users: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    status?: string;
    role?: { id: number; name: string; isSystem?: boolean };
    lastLoginAt?: Date | null;
    twoFactorEnabled: boolean;
    createdAt: Date;
  }>;
  roles: Array<{ id: number; name: string; isSystem?: boolean }>;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    with2FA: number;
  };
  filters?: {
    search?: string;
    status?: string;
    roleId?: number;
  };
  pagination?: {
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
  };
  userPermissions?: string[];
}

export const UsersPageImproved = (props: UsersPageProps) => {
  const { user, users, roles, stats, filters = {}, pagination, userPermissions = [] } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canCreate = hasPermission("users:create");
  const canUpdate = hasPermission("users:update");
  const canDelete = hasPermission("users:delete");

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return html`<span class="badge-success">Activo</span>`;
      case "inactive":
        return html`<span class="badge-warning">Inactivo</span>`;
      case "suspended":
        return html`<span class="badge-danger">Suspendido</span>`;
      default:
        return html`<span class="badge-secondary">Desconocido</span>`;
    }
  };

  const formatLastLogin = (lastLogin?: Date | null) => {
    if (!lastLogin) return "Nunca";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES");
  };

  const content = html`
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        ${
          stats
            ? html`
                <div class="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Total: <strong>${stats.total}</strong></span>
                  <span>Activos: <strong class="text-green-600">${stats.active}</strong></span>
                  <span>Inactivos: <strong class="text-yellow-600">${stats.inactive}</strong></span>
                  <span>Suspendidos: <strong class="text-red-600">${stats.suspended}</strong></span>
                  <span>Con 2FA: <strong class="text-blue-600">${stats.with2FA}</strong></span>
                </div>
              `
            : ""
        }
      </div>
      <div class="page-actions">
        ${canCreate ? html`
          <button onclick="showCreateModal()" class="btn-action">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
              ></path>
            </svg>
            Nuevo Usuario
          </button>
        ` : ""}
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="table-card mb-6">
      <form method="GET" action="${adminPath}/users" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              name="search"
              value="${filters.search || ""}"
              placeholder="Nombre o email..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              name="status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="active" ${filters.status === "active" ? "selected" : ""}>Activo</option>
              <option value="inactive" ${filters.status === "inactive" ? "selected" : ""}>Inactivo</option>
              <option value="suspended" ${filters.status === "suspended" ? "selected" : ""}>
                Suspendido
              </option>
            </select>
          </div>

          <!-- Role Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <select
              name="roleId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Todos los roles</option>
              ${roles.map(
                (r) => html`
                  <option value="${r.id}" ${filters.roleId === r.id ? "selected" : ""}>
                    ${r.name}${r.isSystem ? " (sistema)" : ""}
                  </option>
                `
              )}
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-end gap-2">
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Filtrar
            </button>
            <a
              href="${adminPath}/users"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Limpiar
            </a>
          </div>
        </div>
      </form>
    </div>

    <!-- Bulk Actions -->
    ${(canUpdate || canDelete) ? html`
      <div id="bulkActions" class="hidden table-card mb-6 p-4 bg-purple-50 dark:bg-purple-900/20">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span id="selectedCount">0</span> usuario(s) seleccionado(s)
          </span>
          <div class="flex gap-2">
            ${canUpdate ? html`
              <button
                onclick="bulkUpdateStatus('active')"
                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activar
              </button>
              <button
                onclick="bulkUpdateStatus('inactive')"
                class="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Desactivar
              </button>
              <button
                onclick="bulkUpdateStatus('suspended')"
                class="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Suspender
              </button>
            ` : ""}
            ${canDelete ? html`
              <button
                onclick="bulkDelete()"
                class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            ` : ""}
          </div>
        </div>
      </div>
    ` : ""}

    <!-- Users Table -->
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="w-12">
              <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" />
            </th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Rol</th>
            <th>2FA</th>
            <th>Último Login</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            users.length === 0
              ? html`
                  <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                `
              : users.map(
                  (u) => html`
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          class="userCheckbox"
                          value="${u.id}"
                          onchange="updateBulkActions()"
                          ${u.id === 1 ? "disabled" : ""}
                        />
                      </td>
                      <td>
                        <div class="flex items-center">
                          <img
                            class="table-avatar"
                            src="${u.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}`}"
                            alt="${u.name}"
                          />
                          <div class="ml-3">
                            <div class="font-medium text-gray-900 dark:text-gray-100">
                              ${u.name || "Sin nombre"}
                              ${u.id === 1 ? html`<span class="ml-2 badge-info text-xs">Superadmin</span>` : ""}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">${u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>${getStatusBadge(u.status)}</td>
                      <td>
                        <span class="badge-info">
                          ${u.role?.name || "Sin rol"}
                          ${u.role?.isSystem ? html`<span class="ml-1 text-xs">(sistema)</span>` : ""}
                        </span>
                      </td>
                      <td>
                        ${u.twoFactorEnabled
                          ? html`<span class="badge-success">Habilitado</span>`
                          : html`<span class="badge-secondary">Deshabilitado</span>`}
                      </td>
                      <td class="text-sm text-gray-500 dark:text-gray-400">${formatLastLogin(u.lastLoginAt)}</td>
                      <td class="text-sm text-gray-500 dark:text-gray-400">
                        ${new Date(u.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td>
                        <div class="flex gap-2">
                          ${canUpdate ? html`
                            <button
                              onclick="editUser(${u.id}, '${u.name?.replace(/'/g, "\\\\'") || ""}', '${u.email}', ${u.role?.id || "null"}, '${u.status || "active"}')"
                              class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                              title="Editar"
                            >
                              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                ></path>
                              </svg>
                            </button>
                          ` : ""}
                          ${canDelete && u.email !== user.email && u.id !== 1
                            ? html`
                                <button
                                  onclick="deleteUser(${u.id}, '${u.email}')"
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
                              `
                            : ""}
                          ${!canUpdate && !canDelete ? html`
                            <span class="text-xs text-gray-400">Sin permisos</span>
                          ` : ""}
                        </div>
                      </td>
                    </tr>
                  `
                )
          }
        </tbody>
      </table>

      ${
        pagination && pagination.total > pagination.limit
          ? html`
              <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando ${pagination.offset + 1} a ${Math.min(pagination.offset + pagination.limit, pagination.total)}
                    de ${pagination.total} resultados
                  </div>
                  <div class="flex gap-2">
                    ${pagination.offset > 0
                      ? html`
                          <a
                            href="?offset=${Math.max(0, pagination.offset - pagination.limit)}&limit=${pagination.limit}"
                            class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                          >
                            Anterior
                          </a>
                        `
                      : ""}
                    ${pagination.hasMore
                      ? html`
                          <a
                            href="?offset=${pagination.offset + pagination.limit}&limit=${pagination.limit}"
                            class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Siguiente
                          </a>
                        `
                      : ""}
                  </div>
                </div>
              </div>
            `
          : ""
      }
    </div>

    <!-- Create/Edit Modal -->
    <div id="userModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">Nuevo Usuario</h2>
          <button onclick="closeModal()" class="modal-close">&times;</button>
        </div>
        <form id="userForm" method="POST">
          <div class="modal-body">
            <input type="hidden" id="userId" name="userId" />

            <div class="form-group">
              <label for="name" class="form-label">Nombre</label>
              <input type="text" id="name" name="name" class="form-input" required />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" name="email" class="form-input" required />
            </div>

            <div class="form-group">
              <label for="roleId" class="form-label">Rol</label>
              <select id="roleId" name="roleId" class="form-input" required>
                <option value="">Seleccionar rol...</option>
                ${roles.map(
                  (r) => html` <option value="${r.id}">${r.name}${r.isSystem ? " (sistema)" : ""}</option> `
                )}
              </select>
            </div>

            <div class="form-group">
              <label for="status" class="form-label">Estado</label>
              <select id="status" name="status" class="form-input" required>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>

            <div id="passwordSection" class="form-group">
              <label for="password" class="form-label">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // Select All functionality
      function toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.userCheckbox:not([disabled])');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
        updateBulkActions();
      }

      // Update bulk actions visibility
      function updateBulkActions() {
        const checkboxes = document.querySelectorAll('.userCheckbox:checked');
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (checkboxes.length > 0) {
          bulkActions.classList.remove('hidden');
          selectedCount.textContent = checkboxes.length;
        } else {
          bulkActions.classList.add('hidden');
        }
      }

      // Get selected user IDs
      function getSelectedIds() {
        const checkboxes = document.querySelectorAll('.userCheckbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
      }

      // Bulk update status
      async function bulkUpdateStatus(status) {
        const ids = getSelectedIds();
        if (ids.length === 0) return;

        if (!confirm('Estás seguro de cambiar el estado de ' + ids.length + ' usuario(s) a "' + status + '"?')) {
          return;
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/users/bulk-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: ids, status })
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'No se pudo actualizar'));
          }
        } catch (error) {
          alert('Error de conexión');
        }
      }

      // Bulk delete
      async function bulkDelete() {
        const ids = getSelectedIds();
        if (ids.length === 0) return;

        if (!confirm('Estás seguro de eliminar ' + ids.length + ' usuario(s)? Esta acción no se puede deshacer.')) {
          return;
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/users/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: ids })
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

      // Modal functions
      function showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/create';
        document.getElementById('userId').value = '';
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('roleId').value = '';
        document.getElementById('status').value = 'active';
        document.getElementById('password').value = '';
        document.getElementById('password').required = true;
        document.getElementById('userModal').classList.add('modal-open');
      }

      function editUser(id, name, email, roleId, status) {
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/edit/' + id;
        document.getElementById('userId').value = id;
        document.getElementById('name').value = name;
        document.getElementById('email').value = email;
        document.getElementById('roleId').value = roleId || '';
        document.getElementById('status').value = status || 'active';
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('userModal').classList.add('modal-open');
      }

      function closeModal() {
        document.getElementById('userModal').classList.remove('modal-open');
      }

      async function deleteUser(id, email) {
        if (!confirm('Estás seguro de eliminar el usuario "' + email + '"?')) {
          return;
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/users/delete/' + id, {
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
      document.getElementById('userModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'userModal') {
          closeModal();
        }
      });
    </script>
  `;

  return AdminLayout({ user, content, title: "Usuarios" });
};
