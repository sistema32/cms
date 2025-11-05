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
    role?: { id: number; name: string };
    twoFactorEnabled: boolean;
    createdAt: Date;
  }>;
  roles: Array<{ id: number; name: string }>;
}

export const UsersPage = (props: UsersPageProps) => {
  const { user, users, roles } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Gestión de Usuarios</h1>
      <div class="page-actions">
        <button onclick="showCreateModal()" class="btn-action">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
          </svg>
          Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>2FA</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${users.length === 0 ? html`
            <tr>
              <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay usuarios para mostrar
              </td>
            </tr>
          ` : users.map(u => html`
            <tr>
              <td>
                <div class="flex items-center">
                  <img
                    class="table-avatar"
                    src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}"
                    alt="${u.name}"
                  />
                  <div class="ml-3">
                    <div class="font-medium text-gray-900 dark:text-gray-100">${u.name || 'Sin nombre'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${u.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge-info">${u.role?.name || 'Sin rol'}</span>
              </td>
              <td>
                ${u.twoFactorEnabled
                  ? html`<span class="badge-success">Habilitado</span>`
                  : html`<span class="badge-secondary">Deshabilitado</span>`
                }
              </td>
              <td class="text-sm text-gray-500 dark:text-gray-400">
                ${new Date(u.createdAt).toLocaleDateString('es-ES')}
              </td>
              <td>
                <div class="flex gap-2">
                  <button
                    onclick="editUser(${u.id}, '${u.name?.replace(/'/g, "\\'") || ''}', '${u.email}', ${u.role?.id || 'null'})"
                    class="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                    title="Editar"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  ${u.email !== user.email ? html`
                    <button
                      onclick="deleteUser(${u.id}, '${u.email}')"
                      class="text-red-600 hover:text-red-800 dark:text-red-400"
                      title="Eliminar"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div id="userModal" class="hidden modal-backdrop" onclick="closeModal(event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title" id="modalTitle">Nuevo Usuario</h3>
          <button onclick="closeModal()" class="modal-close">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <form id="userForm" method="POST" class="modal-body">
          <input type="hidden" id="userId" name="id" />

          <div class="mb-4">
            <label class="form-label">Nombre *</label>
            <input type="text" id="userName" name="name" required class="form-input" />
          </div>

          <div class="mb-4">
            <label class="form-label">Email *</label>
            <input type="email" id="userEmail" name="email" required class="form-input" />
          </div>

          <div class="mb-4" id="passwordField">
            <label class="form-label">Contraseña *</label>
            <input type="password" id="userPassword" name="password" class="form-input" />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mínimo 8 caracteres
            </p>
          </div>

          <div class="mb-4">
            <label class="form-label">Rol</label>
            <select id="userRole" name="roleId" class="form-input">
              <option value="">Sin rol</option>
              ${roles.map(role => html`
                <option value="${role.id}">${role.name}</option>
              `)}
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-action">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      function showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/create';
        document.getElementById('userId').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userRole').value = '';
        document.getElementById('passwordField').classList.remove('hidden');
        document.getElementById('userModal').classList.remove('hidden');
      }

      function editUser(id, name, email, roleId) {
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/edit/' + id;
        document.getElementById('userId').value = id;
        document.getElementById('userName').value = name;
        document.getElementById('userEmail').value = email;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('userRole').value = roleId || '';
        document.getElementById('passwordField').querySelector('label').textContent = 'Nueva Contraseña (dejar en blanco para no cambiar)';
        document.getElementById('userModal').classList.remove('hidden');
      }

      function closeModal(event) {
        if (!event || event.target.classList.contains('modal-backdrop') || event.type === 'click') {
          document.getElementById('userModal').classList.add('hidden');
        }
      }

      function deleteUser(id, email) {
        if (confirm(\`¿Estás seguro de eliminar el usuario "\${email}"?\`)) {
          fetch(\`\${ADMIN_BASE_PATH}/users/delete/\${id}\`, { method: 'POST' })
            .then(response => response.ok ? window.location.reload() : alert('Error al eliminar'))
            .catch(() => alert('Error al eliminar'));
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Usuarios",
    children: content,
    activePage: "access.users",
    user,
  });
};

export default UsersPage;
