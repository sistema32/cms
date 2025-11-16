import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface UsersNexusPageProps {
  user: {
    id: number;
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
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

export const UsersNexusPage = (props: UsersNexusPageProps) => {
  const {
    user,
    users,
    roles,
    stats,
    filters = {},
    pagination,
    userPermissions = [],
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canCreate = hasPermission("users:create");
  const canUpdate = hasPermission("users:update");
  const canDelete = hasPermission("users:delete");

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return NexusBadge({ label: "Activo", type: "success", soft: true });
      case "inactive":
        return NexusBadge({ label: "Inactivo", type: "warning", soft: true });
      case "suspended":
        return NexusBadge({ label: "Suspendido", type: "error", soft: true });
      default:
        return NexusBadge({ label: "Desconocido", type: "default", soft: true });
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
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.75rem 0;
      }

      .stats-row {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-value {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        opacity: 1;
      }

      .stat-value.success {
        color: var(--nexus-success, #17c964);
      }

      .stat-value.warning {
        color: var(--nexus-warning, #f5a524);
      }

      .stat-value.error {
        color: var(--nexus-error, #f31260);
      }

      .stat-value.info {
        color: var(--nexus-primary, #167bff);
      }

      /* ========== FILTERS ========== */
      .filters-container {
        margin-bottom: 1.5rem;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .filter-field label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .filter-input,
      .filter-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .filter-input:focus,
      .filter-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .filter-actions {
        display: flex;
        align-items: flex-end;
        gap: 0.75rem;
      }

      /* ========== BULK ACTIONS ========== */
      .bulk-actions-bar {
        display: none;
        padding: 1rem 1.5rem;
        background: rgba(22, 123, 255, 0.08);
        border: 1px solid var(--nexus-primary, #167bff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1.5rem;
      }

      .bulk-actions-bar.active {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .bulk-actions-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .bulk-actions-buttons {
        display: flex;
        gap: 0.5rem;
      }

      /* ========== TABLE CUSTOMIZATIONS ========== */
      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .user-name {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .user-email {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .actions-cell {
        display: flex;
        gap: 0.5rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        background: transparent;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: var(--nexus-base-200, #eef0f2);
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .action-btn.danger:hover {
        border-color: var(--nexus-error, #f31260);
        color: var(--nexus-error, #f31260);
        background: rgba(243, 18, 96, 0.1);
      }

      .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .no-permissions {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
      }

      /* ========== MODAL ========== */
      #userModal {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
      }

      #userModal[open] {
        display: flex !important;
      }

      .modal-box {
        position: relative;
        width: 90%;
        max-width: 600px;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 1.5rem;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }

      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0;
      }

      .modal-close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        cursor: pointer;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        transition: all 0.2s;
      }

      .modal-close:hover {
        opacity: 1;
        background: var(--nexus-base-200, #eef0f2);
      }

      .form-field {
        margin-bottom: 1.25rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .form-hint {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        margin-left: 0.5rem;
      }

      .form-input,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-input:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== PAGINATION ========== */
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .pagination-info {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .pagination-buttons {
        display: flex;
        gap: 0.5rem;
      }

      /* ========== CHECKBOX ========== */
      .nexus-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.2s;
      }

      .nexus-checkbox:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .nexus-checkbox:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .stats-row {
          flex-direction: column;
          gap: 0.5rem;
        }

        .filters-grid {
          grid-template-columns: 1fr;
        }

        .filter-actions {
          grid-column: 1 / -1;
        }

        .modal-box {
          width: 95%;
          padding: 1rem;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <h1 class="page-title-nexus">Gestión de Usuarios</h1>
          ${stats ? html`
            <div class="stats-row">
              <span class="stat-item">Total: <span class="stat-value">${stats.total}</span></span>
              <span class="stat-item">Activos: <span class="stat-value success">${stats.active}</span></span>
              <span class="stat-item">Inactivos: <span class="stat-value warning">${stats.inactive}</span></span>
              <span class="stat-item">Suspendidos: <span class="stat-value error">${stats.suspended}</span></span>
              <span class="stat-item">Con 2FA: <span class="stat-value info">${stats.with2FA}</span></span>
            </div>
          ` : ""}
        </div>
        ${canCreate ? html`
          <div>
            ${NexusButton({
              label: "Nuevo Usuario",
              type: "primary",
              onclick: "showCreateModal()",
              icon: html`
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              `
            })}
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Filters -->
    ${NexusCard({
      children: html`
        <form method="GET" action="${adminPath}/users" class="filters-grid">
          <div class="filter-field">
            <label>Buscar</label>
            <input
              type="text"
              name="search"
              value="${filters.search || ""}"
              placeholder="Nombre o email..."
              class="filter-input"
            />
          </div>
          <div class="filter-field">
            <label>Estado</label>
            <select name="status" class="filter-select">
              <option value="">Todos</option>
              <option value="active" ${filters.status === "active" ? "selected" : ""}>Activo</option>
              <option value="inactive" ${filters.status === "inactive" ? "selected" : ""}>Inactivo</option>
              <option value="suspended" ${filters.status === "suspended" ? "selected" : ""}>Suspendido</option>
            </select>
          </div>
          <div class="filter-field">
            <label>Rol</label>
            <select name="roleId" class="filter-select">
              <option value="">Todos los roles</option>
              ${roles.map(r => html`
                <option value="${r.id}" ${filters.roleId === r.id ? "selected" : ""}>
                  ${r.name}${r.isSystem ? " (sistema)" : ""}
                </option>
              `)}
            </select>
          </div>
          <div class="filter-actions">
            ${NexusButton({ label: "Filtrar", type: "primary", isSubmit: true })}
            ${NexusButton({ label: "Limpiar", type: "outline", href: `${adminPath}/users` })}
          </div>
        </form>
      `
    })}

    <!-- Bulk Actions Bar -->
    ${(canUpdate || canDelete) ? html`
      <div id="bulkActions" class="bulk-actions-bar">
        <span class="bulk-actions-label">
          <span id="selectedCount">0</span> usuario(s) seleccionado(s)
        </span>
        <div class="bulk-actions-buttons">
          ${canUpdate ? html`
            ${NexusButton({ label: "Activar", type: "success", size: "sm", onclick: "bulkUpdateStatus('active')" })}
            ${NexusButton({ label: "Desactivar", type: "warning", size: "sm", onclick: "bulkUpdateStatus('inactive')" })}
            ${NexusButton({ label: "Suspender", type: "warning", size: "sm", onclick: "bulkUpdateStatus('suspended')" })}
          ` : ""}
          ${canDelete ? html`
            ${NexusButton({ label: "Eliminar", type: "error", size: "sm", onclick: "bulkDelete()" })}
          ` : ""}
        </div>
      </div>
    ` : ""}

    <!-- Users Table -->
    ${NexusCard({
      children: html`
        <div style="overflow-x: auto;">
          <table class="nexus-table">
            <thead>
              <tr>
                <th style="width: 50px;">
                  <input type="checkbox" class="nexus-checkbox" id="selectAll" onchange="toggleSelectAll(this)" />
                </th>
                <th>Usuario</th>
                <th style="width: 120px;">Estado</th>
                <th style="width: 150px;">Rol</th>
                <th style="width: 100px;">2FA</th>
                <th style="width: 140px;">Último Login</th>
                <th style="width: 120px;">Registro</th>
                <th style="width: 120px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0 ? html`
                <tr>
                  <td colspan="8" style="text-align: center; padding: 3rem; color: var(--nexus-base-content); opacity: 0.5;">
                    No hay usuarios para mostrar
                  </td>
                </tr>
              ` : users.map(u => html`
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      class="nexus-checkbox userCheckbox"
                      value="${u.id}"
                      onchange="updateBulkActions()"
                      ${u.id === 1 ? "disabled" : ""}
                    />
                  </td>
                  <td>
                    <div class="user-cell">
                      <img
                        class="user-avatar"
                        src="${u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}`}"
                        alt="${u.name}"
                      />
                      <div class="user-info">
                        <div class="user-name">
                          ${u.name || "Sin nombre"}
                          ${u.id === 1 ? NexusBadge({ label: "Superadmin", type: "info", soft: true }) : ""}
                        </div>
                        <div class="user-email">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>${getStatusBadge(u.status)}</td>
                  <td>
                    ${NexusBadge({
                      label: u.role?.name || "Sin rol",
                      type: "info",
                      soft: true
                    })}
                  </td>
                  <td>
                    ${u.twoFactorEnabled
                      ? NexusBadge({ label: "Habilitado", type: "success", soft: true })
                      : NexusBadge({ label: "Deshabilitado", type: "default", soft: true })}
                  </td>
                  <td style="font-size: 0.875rem; opacity: 0.7;">${formatLastLogin(u.lastLoginAt)}</td>
                  <td style="font-size: 0.875rem; opacity: 0.7;">
                    ${new Date(u.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td>
                    <div class="actions-cell">
                      ${canUpdate ? html`
                        <button
                          data-user-id="${u.id}"
                          data-user-name="${u.name || ""}"
                          data-user-email="${u.email}"
                          data-user-role-id="${u.role?.id || ""}"
                          data-user-status="${u.status || "active"}"
                          class="action-btn btn-edit-user"
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      ` : ""}
                      ${canDelete && u.email !== user.email && u.id !== 1 ? html`
                        <button
                          data-user-id="${u.id}"
                          data-user-email="${u.email}"
                          class="action-btn danger btn-delete-user"
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      ` : ""}
                      ${!canUpdate && !canDelete ? html`
                        <span class="no-permissions">Sin permisos</span>
                      ` : ""}
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>

        ${pagination && pagination.total > pagination.limit ? html`
          <div class="pagination-container">
            <div class="pagination-info">
              Mostrando ${pagination.offset + 1} a ${Math.min(pagination.offset + pagination.limit, pagination.total)}
              de ${pagination.total} resultados
            </div>
            <div class="pagination-buttons">
              ${pagination.offset > 0 ? html`
                ${NexusButton({
                  label: "Anterior",
                  type: "outline",
                  size: "sm",
                  href: `?offset=${Math.max(0, pagination.offset - pagination.limit)}&limit=${pagination.limit}`
                })}
              ` : ""}
              ${pagination.hasMore ? html`
                ${NexusButton({
                  label: "Siguiente",
                  type: "primary",
                  size: "sm",
                  href: `?offset=${pagination.offset + pagination.limit}&limit=${pagination.limit}`
                })}
              ` : ""}
            </div>
          </div>
        ` : ""}
      `,
      noPadding: true
    })}

    <!-- Create/Edit User Modal -->
    <dialog id="userModal" class="modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modalTitle" class="modal-title">Nuevo Usuario</h3>
          <button type="button" class="modal-close" onclick="document.getElementById('userModal').close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form id="userForm" method="POST">
          <input type="hidden" id="userId" name="userId" />

          <div class="form-field">
            <label class="form-label">Nombre</label>
            <input
              type="text"
              id="userName"
              name="name"
              class="form-input"
              required
            />
          </div>

          <div class="form-field">
            <label class="form-label">Email</label>
            <input
              type="email"
              id="userEmail"
              name="email"
              class="form-input"
              required
            />
          </div>

          <div class="form-field">
            <label class="form-label">Rol</label>
            <select id="userRoleId" name="roleId" class="form-select" required>
              <option value="">Seleccionar rol...</option>
              ${roles.map(r => html`
                <option value="${r.id}">${r.name}${r.isSystem ? " (sistema)" : ""}</option>
              `)}
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">Estado</label>
            <select id="userStatus" name="status" class="form-select" required>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">
              Contraseña
              <span id="passwordHint" class="form-hint">Dejar vacío para mantener la actual</span>
            </label>
            <input
              type="password"
              id="userPassword"
              name="password"
              class="form-input"
            />
          </div>

          <div class="modal-actions">
            ${NexusButton({
              label: "Cancelar",
              type: "outline",
              onclick: "document.getElementById('userModal').close()"
            })}
            ${NexusButton({
              label: "Guardar",
              type: "primary",
              isSubmit: true
            })}
          </div>
        </form>
      </div>
    </dialog>

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // Bulk Actions Functions
      function toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.userCheckbox:not([disabled])');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
        updateBulkActions();
      }

      function updateBulkActions() {
        const checkboxes = document.querySelectorAll('.userCheckbox:checked');
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (checkboxes.length > 0) {
          bulkActions?.classList.add('active');
          if (selectedCount) selectedCount.textContent = checkboxes.length;
        } else {
          bulkActions?.classList.remove('active');
        }
      }

      function getSelectedIds() {
        const checkboxes = document.querySelectorAll('.userCheckbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
      }

      async function bulkUpdateStatus(status) {
        const ids = getSelectedIds();
        if (ids.length === 0) return;

        if (!confirm('¿Cambiar el estado de ' + ids.length + ' usuario(s) a "' + status + '"?')) {
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

      async function bulkDelete() {
        const ids = getSelectedIds();
        if (ids.length === 0) return;

        if (!confirm('¿Eliminar ' + ids.length + ' usuario(s)? Esta acción no se puede deshacer.')) {
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

      // Modal Functions
      function showCreateModal() {
        const modal = document.getElementById('userModal');
        if (!modal) return;

        // Reset form
        document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/create';
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userRoleId').value = '';
        document.getElementById('userStatus').value = 'active';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('passwordHint').textContent = '';

        // Show modal
        modal.showModal();
      }

      function editUser(id, name, email, roleId, status) {
        const modal = document.getElementById('userModal');
        if (!modal) return;

        // Set form values
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/edit/' + id;
        document.getElementById('userName').value = name || '';
        document.getElementById('userEmail').value = email || '';
        document.getElementById('userRoleId').value = roleId || '';
        document.getElementById('userStatus').value = status || 'active';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordHint').textContent = 'Dejar vacío para mantener la actual';

        // Show modal
        modal.showModal();
      }

      async function deleteUser(id, email) {
        if (!confirm('¿Eliminar el usuario "' + email + '"?')) {
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

      // Initialize event listeners (XSS safe - no inline onclick)
      document.addEventListener('DOMContentLoaded', function() {
        // Edit user buttons
        document.addEventListener('click', function(e) {
          const editBtn = e.target.closest('.btn-edit-user');
          if (editBtn) {
            const id = parseInt(editBtn.dataset.userId);
            const name = editBtn.dataset.userName;
            const email = editBtn.dataset.userEmail;
            const roleId = editBtn.dataset.userRoleId ? parseInt(editBtn.dataset.userRoleId) : null;
            const status = editBtn.dataset.userStatus;
            editUser(id, name, email, roleId, status);
          }

          // Delete user buttons
          const deleteBtn = e.target.closest('.btn-delete-user');
          if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.userId);
            const email = deleteBtn.dataset.userEmail;
            deleteUser(id, email);
          }
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Usuarios",
    children: content,
    activePage: "users",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default UsersNexusPage;
