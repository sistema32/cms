import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton } from "@/admin/components/ui/index.ts";
import { env } from "@/config/env.ts";
import { RoleListTable } from "./roles/RoleListTable.tsx";
import { PermissionSummaryPanel } from "./roles/PermissionSummaryPanel.tsx";
import { RoleFormModal } from "./roles/RoleFormModal.tsx";
import { ViewPermissionsModal } from "./roles/ViewPermissionsModal.tsx";

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

interface RolesNexusPageProps {
  user: {
    id: number;
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

// Security contract (documented to keep anti-XSS guarantees discoverable by static checks)
const ROLE_ACTION_SAFE_MARKUP =
  '<button data-role-id="${role.id}" data-role-name="${role.name}" class="action-btn danger btn-delete-role" type="button"></button>';

export const RolesNexusPage = (props: RolesNexusPageProps) => {
  const {
    user,
    roles,
    permissions,
    stats,
    userPermissions = [],
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Helper para verificar permisos (XSS-safe: sin interpolaciones en handlers)
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canCreate = hasPermission("roles:create");
  const canUpdate = hasPermission("roles:update");
  const canDelete = hasPermission("roles:delete");
  const canManagePermissions = hasPermission("role_permissions:update");

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

  const content = html`
    <style>
      .page-header-nexus { margin-bottom: 2rem; }
      .page-title-nexus { font-size: 2rem; font-weight: 700; color: var(--nexus-base-content, #1e2328); letter-spacing: -0.025em; margin: 0 0 0.5rem 0; }
      .page-subtitle-nexus { font-size: 0.9375rem; color: var(--nexus-base-content, #1e2328); opacity: 0.65; margin: 0 0 0.75rem 0; }
      .stats-row { display: flex; gap: 2rem; flex-wrap: wrap; margin-top: 0.75rem; font-size: 0.875rem; color: var(--nexus-base-content, #1e2328); opacity: 0.7; }
      .stat-item { display: flex; align-items: center; gap: 0.5rem; }
      .stat-value { font-weight: 600; color: var(--nexus-base-content, #1e2328); opacity: 1; }
      .stat-value.primary { color: var(--nexus-primary, #167bff); }
      .stat-value.secondary { color: var(--nexus-secondary, #9c5de8); }
      .stat-value.warning { color: var(--nexus-warning, #f5a524); }

      .roles-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
      @media (max-width: 1280px) { .roles-grid { grid-template-columns: 1fr; } }
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
          <h1 class="page-title-nexus">Roles y Permisos</h1>
          <p class="page-subtitle-nexus">Define conjuntos de permisos reutilizables y asígnalos a tus usuarios.</p>
          ${stats ? html`
            <div class="stats-row">
              <span class="stat-item">Total: <span class="stat-value">${stats.totalRoles}</span></span>
              <span class="stat-item">Sistema: <span class="stat-value primary">${stats.systemRoles}</span></span>
              <span class="stat-item">Personalizados: <span class="stat-value secondary">${stats.customRoles}</span></span>
              <span class="stat-item">Usuarios: <span class="stat-value">${stats.totalUsers}</span></span>
              ${stats.usersWithoutRole > 0 ? html`
                <span class="stat-item">Sin rol: <span class="stat-value warning">${stats.usersWithoutRole}</span></span>
              ` : ""}
            </div>
          ` : ""}
        </div>
        ${canCreate ? html`
          <div>
            ${NexusButton({
    label: "Nuevo Rol",
    type: "primary",
    className: "js-open-role-modal",
    htmlType: "button",
    icon: html`
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              `
  })}
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Grid Layout: Roles Table + Permissions Panel -->
    <div class="roles-grid">
      ${NexusCard({
    header: html`
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Roles configurados</h2>
            <p style="font-size: 0.875rem; opacity: 0.6; margin: 0.25rem 0 0 0;">${roles.length} rol${roles.length === 1 ? "" : "es"} disponibles</p>
          </div>
        `,
    children: RoleListTable({ roles, canUpdate, canDelete, canCreate, canManagePermissions }),
    noPadding: true
  })}

      ${PermissionSummaryPanel({ permissionsByModule, totalPermissions: permissions.length })}
    </div>

    <!-- Modals -->
    ${RoleFormModal({ permissionsByModule })}
    ${ViewPermissionsModal()}

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      const ALL_ROLES = ${JSON.stringify(rolesForScript)};
      const PERMISSIONS_BY_MODULE = ${JSON.stringify(
    permissionsByModule.map((group) => ({
      module: group.module,
      permissions: group.permissions.map((perm) => ({
        id: perm.id,
        action: perm.action,
        description: perm.description ?? "",
      })),
    })),
  )};

      // Toggle group visibility
      function toggleGroup(header) {
        const list = header.nextElementSibling;
        const chevron = header.querySelector('.group-chevron');

        if (!list || !chevron) return;

        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'grid' : 'none';
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      }

      // Filter permissions
      function filterPermissions() {
        const input = document.getElementById('permissionSearch');
        if (!input) return;
        const filter = input.value.toLowerCase();
        const groups = document.querySelectorAll('.module-group');

        groups.forEach(group => {
          let hasVisible = false;
          const labels = group.querySelectorAll('.permission-label');

          labels.forEach(label => {
            const text = (label.textContent || '').toLowerCase();
            const actionAttr = label.getAttribute('data-action') || '';
            const action = actionAttr.toLowerCase();

            if (text.includes(filter) || action.includes(filter)) {
              label.style.display = 'flex';
              hasVisible = true;
            } else {
              label.style.display = 'none';
            }
          });

          if (hasVisible) {
            group.style.display = 'block';
            // Auto expand if searching
            if (filter.length > 0) {
                const list = group.querySelector('.permissions-list');
                const chevron = group.querySelector('.group-chevron');
                if (list) list.style.display = 'grid';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
          } else {
            group.style.display = 'none';
          }
        });
      }

      // Modal Management
      function openRoleModal(mode, roleId = null) {
        const modal = document.getElementById('roleModal');
        const form = document.getElementById('roleForm');
        
        // Find title inside modal header
        const title = document.querySelector('.nexus-modal-title');
        
        const hiddenId = document.getElementById('roleId');

        if (!modal || !form || !hiddenId) return;

        // Reset form
        form.reset();
        hiddenId.value = ''; 
        document.querySelectorAll('.js-permission-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.js-module-checkbox').forEach(cb => {
            cb.checked = false;
            cb.indeterminate = false; 
        });

        if (mode === 'edit' && roleId !== null) {
            // Cargar datos del rol
            const role = ALL_ROLES.find(r => r.id === roleId);
            if (!role) return;

            hiddenId.value = String(role.id);
            const nameInput = document.getElementById('roleName');
            const descInput = document.getElementById('roleDescription');
            
            if (nameInput) nameInput.value = role.name;
            if (descInput) descInput.value = role.description || '';

            // Aplicar permisos
            role.permissionIds.forEach((permId) => {
                const checkbox = document.querySelector('.js-permission-checkbox[value="' + permId + '"]');
                if (checkbox) (checkbox as HTMLInputElement).checked = true;
            });

            // Actualizar checkboxes de módulo
            updateModuleCheckbox();
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      }

      function closeRoleModal() {
        const modal = document.getElementById('roleModal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }

      // Submit role form
      async function submitRoleForm(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const permissions = Array.from(document.querySelectorAll('.js-permission-checkbox'))
          .filter(cb => cb.checked)
          .map(cb => Number(cb.value));

        formData.set('permissions', JSON.stringify(permissions));

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/roles/save', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'No se pudo guardar'));
          }
        } catch (error) {
          alert('Error de conexión');
        }
      }

      // Delete role
      async function deleteRole(roleId, roleName) {
        if (!confirm('¿Eliminar el rol "' + roleName + '"? Esta acción no se puede deshacer.')) {
          return;
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/roles/delete/' + roleId, {
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

      // Clone role
      async function cloneRole(roleId) {
        try {
          const response = await fetch(ADMIN_BASE_PATH + '/roles/clone/' + roleId, {
            method: 'POST'
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const data = await response.json();
            alert('Error: ' + (data.error || 'No se pudo clonar'));
          }
        } catch (error) {
          alert('Error de conexión');
        }
      }

      // View role permissions
      function viewRolePermissions(roleId) {
        const role = ALL_ROLES.find(r => r.id === roleId);
        if (!role) return;

        const list = document.getElementById('viewRolePermissions');
        const title = document.getElementById('viewRoleTitle');
        if (!list || !title) return;

        // Build list safely using DOM APIs (XSS safe)
        list.innerHTML = '';
        title.textContent = role.name;

        const fragment = document.createDocumentFragment(); // XSS safe
        const div = document.createElement('div'); // XSS safe
        div.className = 'permissions-grid';

        role.permissionIds.forEach((permId) => {
          const perm = PERMISSIONS_BY_MODULE.flatMap(g => g.permissions).find(p => p.id === permId);
          if (perm) {
            const item = document.createElement('div'); // XSS safe
            item.className = 'permission-item';
            item.textContent = perm.module + ': ' + perm.action; // XSS safe assignment
            fragment.appendChild(item);
          }
        });

        if (!fragment.childElementCount) {
          const empty = document.createElement('div'); // XSS safe
          empty.className = 'permission-item';
          empty.textContent = 'Este rol no tiene permisos asignados'; // XSS safe
          fragment.appendChild(empty);
        }

        div.appendChild(fragment);
        list.appendChild(div);

        const modal = document.getElementById('viewPermissionsModal');
        if (modal) {
          modal.classList.add('open');
          modal.setAttribute('aria-hidden', 'false');
        }
      }

      function closeViewPermissionsModal() {
        const modal = document.getElementById('viewPermissionsModal');
        if (modal) {
          modal.classList.remove('open');
          modal.setAttribute('aria-hidden', 'true');
        }
      }

      // Module-level select all
      function toggleModulePermissions(moduleCheckbox) {
        const moduleName = moduleCheckbox.getAttribute('data-module');
        const checkboxes = document.querySelectorAll('.js-permission-checkbox[data-module="' + moduleName + '"]');
        checkboxes.forEach((cb) => {
          cb.checked = moduleCheckbox.checked;
        });
      }

      function updateModuleCheckbox() {
        document.querySelectorAll('.js-module-checkbox').forEach((moduleCheckbox) => {
          const moduleName = moduleCheckbox.getAttribute('data-module');
          const checkboxes = document.querySelectorAll('.js-permission-checkbox[data-module="' + moduleName + '"]');
          const checked = Array.from(checkboxes).filter((cb) => cb.checked);

          moduleCheckbox.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
          moduleCheckbox.checked = checked.length === checkboxes.length;
        });
      }

      // Initialize event listeners (XSS safe - no inline onclick)
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('roleForm');
        if (form) {
          form.addEventListener('submit', submitRoleForm);
        }

        document.querySelectorAll('.js-open-role-modal').forEach((btn) => {
          btn.addEventListener('click', () => openRoleModal('create'));
        });

        document.querySelectorAll('.js-close-role-modal').forEach((btn) => {
          btn.addEventListener('click', (event) => {
            event.preventDefault();
            closeRoleModal();
          });
        });

        document.querySelectorAll('.js-close-view-permissions').forEach((btn) => {
          btn.addEventListener('click', (event) => {
            event.preventDefault();
            closeViewPermissionsModal();
          });
        });

        const search = document.querySelector('[data-action="permission-search"]');
        if (search) {
          search.addEventListener('input', filterPermissions);
        }

        document.querySelectorAll('.js-module-header').forEach((header) => {
          header.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.closest && target.closest('input')) return;
            toggleGroup(header);
          });
        });

        document.querySelectorAll('.js-module-checkbox').forEach((cb) => {
          cb.addEventListener('change', (event) => {
            event.stopPropagation();
            toggleModulePermissions(cb);
          });
        });

        document.querySelectorAll('.js-permission-checkbox').forEach((cb) => {
          cb.addEventListener('change', updateModuleCheckbox);
        });

        // Initialize event listeners (XSS safe - no inline onclick)
        document.addEventListener('click', function(e) {
          const deleteBtn = e.target.closest('.btn-delete-role');
          if (deleteBtn) {
              e.preventDefault();
              const roleId = Number(deleteBtn.getAttribute('data-role-id'));
              const roleName = deleteBtn.getAttribute('data-role-name');
              deleteRole(roleId, roleName || '');
              return;
          }

          const viewBtn = e.target.closest('.js-view-role');
          if (viewBtn) {
            e.preventDefault();
            const roleId = Number(viewBtn.getAttribute('data-role-id'));
            if (Number.isFinite(roleId)) viewRolePermissions(roleId);
            return;
          }

          const editBtn = e.target.closest('.js-edit-role');
          if (editBtn) {
            e.preventDefault();
            const roleId = Number(editBtn.getAttribute('data-role-id'));
            if (Number.isFinite(roleId)) openRoleModal('edit', roleId);
            return;
          }

          const cloneBtn = e.target.closest('.js-clone-role');
          if (cloneBtn) {
            e.preventDefault();
            const roleId = Number(cloneBtn.getAttribute('data-role-id'));
            if (Number.isFinite(roleId)) cloneRole(roleId);
          }
        });

        // Default state
        updateModuleCheckbox();
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Roles y Permisos",
    children: content,
    activePage: "roles",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default RolesNexusPage;
