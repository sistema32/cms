import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusPagination } from "@/admin/components/ui/index.ts";
import { env } from "@/config/env.ts";
import { UserListTable } from "./UserListTable.tsx";
import { UserFilters } from "./UserFilters.tsx";
import { UserFormModal } from "./UserFormModal.tsx";

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

  const content = html`
    <style>
      .page-header-nexus { margin-bottom: 2rem; }
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
      .stat-item { display: flex; align-items: center; gap: 0.5rem; }
      .stat-value { font-weight: 600; color: var(--nexus-base-content, #1e2328); opacity: 1; }
      .stat-value.success { color: var(--nexus-success, #17c964); }
      .stat-value.warning { color: var(--nexus-warning, #f5a524); }
      .stat-value.error { color: var(--nexus-error, #f31260); }
      .stat-value.info { color: var(--nexus-primary, #167bff); }

      .bulk-actions-bar {
        display: none;
        padding: 1rem 1.5rem;
        background: rgba(22, 123, 255, 0.08);
        border: 1px solid var(--nexus-primary, #167bff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1.5rem;
      }
      .bulk-actions-bar.active { display: flex; align-items: center; justify-content: space-between; }
      .bulk-actions-label { font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content, #1e2328); }
      .bulk-actions-buttons { display: flex; gap: 0.5rem; }

      @media (max-width: 768px) {
        .page-title-nexus { font-size: 1.5rem; }
        .stats-row { flex-direction: column; gap: 0.5rem; }
      }
      .page-header-actions {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div class="page-header-actions">
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
    onClick: "showCreateModal()",
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
    ${UserFilters({ filters, roles, adminPath })}

    <!-- Bulk Actions Bar -->
    ${(canUpdate || canDelete) ? html`
      <div id="bulkActions" class="bulk-actions-bar">
        <span class="bulk-actions-label">
          <span id="selectedCount">0</span> usuario(s) seleccionado(s)
        </span>
        <div class="bulk-actions-buttons">
          ${canUpdate ? html`
            ${NexusButton({ label: "Activar", type: "success", size: "sm", onClick: "bulkUpdateStatus('active')" })}
            ${NexusButton({ label: "Desactivar", type: "warning", size: "sm", onClick: "bulkUpdateStatus('inactive')" })}
            ${NexusButton({ label: "Suspender", type: "warning", size: "sm", onClick: "bulkUpdateStatus('suspended')" })}
          ` : ""}
          ${canDelete ? html`
            ${NexusButton({ label: "Eliminar", type: "error", size: "sm", onClick: "bulkDelete()" })}
          ` : ""}
        </div>
      </div>
    ` : ""}

    <!-- Users Table -->
    ${NexusCard({
    children: html`
        ${UserListTable({ users, currentUser: user, canUpdate, canDelete })}

        ${pagination && pagination.total > pagination.limit ? NexusPagination({
      currentPage: Math.floor(pagination.offset / pagination.limit) + 1,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      baseUrl: `${adminPath}/users`
    }) : ""}
      `,
    noPadding: true
  })}

    <!-- Create/Edit User Modal -->
    ${UserFormModal({ roles })}

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
        const titleEl = document.querySelector('.nexus-modal-title');
        if(titleEl) titleEl.textContent = 'Nuevo Usuario';
        
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/create';
        document.getElementById('userId').value = '';
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
        const titleEl = document.querySelector('.nexus-modal-title');
        if(titleEl) titleEl.textContent = 'Editar Usuario';
        
        document.getElementById('userForm').action = ADMIN_BASE_PATH + '/users/edit/' + id;
        document.getElementById('userId').value = id;
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

      // Initialize event listeners
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
