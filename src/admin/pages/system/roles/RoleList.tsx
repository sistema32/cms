import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton } from "@/admin/components/ui/index.ts";
import { env } from "@/config/env.ts";
import { RoleListTable } from "./RoleListTable.tsx";
import { PermissionSummaryPanel } from "./PermissionSummaryPanel.tsx";
import { RoleFormModal } from "./RoleFormModal.tsx";
import { ViewPermissionsModal } from "./ViewPermissionsModal.tsx";

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

  // Helper para verificar permisos
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

        // Reset search and groups
        const searchInput = document.getElementById('permissionSearch');
        if(searchInput) {
            searchInput.value = '';
            filterPermissions();
        }

        if (mode === 'create') {
          if(title) title.textContent = 'Nuevo Rol';
          form.action = ADMIN_BASE_PATH + '/roles/create';
        } else {
          if(title) title.textContent = 'Editar Rol';
          form.action = ADMIN_BASE_PATH + '/roles/edit/' + roleId;

          const role = ALL_ROLES.find(r => r.id === roleId);
          if (role) {
            hiddenId.value = String(role.id);
            document.getElementById('roleName').value = role.name;
            document.getElementById('roleDescription').value = role.description || '';

            // Check permissions
            role.permissionIds.forEach(id => {
              const cb = document.querySelector('input[name="permissions[]"][value="' + id + '"]');
              if (cb) cb.checked = true;
            });
            updateModuleCheckbox();
          }
        }

        modal.showModal();
      }

      function closeRoleModal() {
        const modal = document.getElementById('roleModal');
        if (modal) modal.close();
      }

      // Permissions Checkbox Logic
      function toggleModulePermissions(moduleCb) {
        const module = moduleCb.dataset.module;
        if (!module) return;
        const isChecked = moduleCb.checked;
        const permissionCbs = document.querySelectorAll('.js-permission-checkbox[data-module="' + module + '"]');

        permissionCbs.forEach(cb => {
             cb.checked = isChecked;
        });
        updateModuleCheckbox();
      }

      function updateModuleCheckbox() {
        const modules = new Set();
        document.querySelectorAll('.js-module-checkbox').forEach(cb => {
          if (cb.dataset.module) modules.add(cb.dataset.module);
        });

        modules.forEach(module => {
            const moduleCb = document.querySelector('.js-module-checkbox[data-module="' + module + '"]');
            const permissionCbs = Array.from(document.querySelectorAll('.js-permission-checkbox[data-module="' + module + '"]'));

            const checkedCount = permissionCbs.filter(cb => cb.checked).length;

            if (moduleCb) {
                moduleCb.checked = checkedCount > 0 && checkedCount === permissionCbs.length;
                moduleCb.indeterminate = checkedCount > 0 && checkedCount < permissionCbs.length;
            }
        });
      }

      // Delete Role
      async function deleteRole(roleId, roleName) {
        if (!Number.isFinite(roleId)) return;
        const confirmed = confirm('¿Estás seguro de eliminar el rol "' + roleName + '"? Esta acción no se puede deshacer.');
        if (!confirmed) return;

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/roles/delete/' + roleId, {
            method: 'POST'
          });
          const data = await response.json();
          if (data.success) {
            window.location.reload();
          } else {
            alert(data.error || 'Error al eliminar rol');
          }
        } catch (err) {
          console.error(err);
          alert('Error de conexión');
        }
      }

      async function cloneRole(roleId) {
        if (!Number.isFinite(roleId)) return;
        const role = ALL_ROLES.find((r) => r.id === roleId);

        const defaultName = role ? role.name + ' (copia)' : '';
        const newName = prompt('Nombre para el nuevo rol:', defaultName);
        const normalizedName = (newName || '').trim();
        if (!normalizedName) return;

        const newDescription = prompt('Descripción (opcional):', role?.description ?? '') || '';

        const formData = new FormData();
        formData.append('newName', normalizedName);
        if (newDescription.trim().length > 0) {
          formData.append('newDescription', newDescription.trim());
        }

        try {
          const response = await fetch(ADMIN_BASE_PATH + '/roles/clone/' + roleId, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            window.location.reload();
          } else {
            const message = await response.text();
            alert(message || 'Error al clonar rol');
          }
        } catch (error) {
          console.error(error);
          alert('Error al clonar rol');
        }
      }

      // View Permissions
      function viewRolePermissions(roleId) {
        const role = ALL_ROLES.find(r => r.id === roleId);
        if (!role) return;

        const modal = document.getElementById('viewPermissionsModal');
        const container = document.getElementById('viewPermissionsContent');
        const title = document.querySelector('#viewPermissionsModal .nexus-modal-title');

        if(title) title.textContent = 'Permisos de ' + role.name;
        container.innerHTML = '';

        const selectedPermissions = new Set(role.permissionIds);

        // XSS safe: build DOM nodes with textContent only
        if (selectedPermissions.size === 0) {
          const empty = document.createElement('p');
          empty.className = 'text-center opacity-50';
          empty.textContent = 'Este rol no tiene permisos asignados.';
          container.appendChild(empty);
          modal.showModal();
          return;
        }

        const fragment = document.createDocumentFragment();

        PERMISSIONS_BY_MODULE.forEach((group) => {
          const matching = group.permissions.filter((perm) => selectedPermissions.has(perm.id));
          if (matching.length === 0) return;

          const wrapper = document.createElement('div');
          wrapper.className = 'permission-group';
          // Use style from RoleFormModal.tsx which is global in this context via shadow DOM or similar? No, simple injection.
          // Add style to wrapper or rely on existing class?
          // The ViewPermissionsModal does not have style block for permission-group.
          // I should add inline style or make sure it's available.
          // Since styles are scoped in components usually, but here they are just style tags in body.
          // Providing basic styles.
          wrapper.style.border = '1px solid #eef0f2';
          wrapper.style.borderRadius = '0.5rem';
          wrapper.style.marginBottom = '1rem';
          wrapper.style.overflow = 'hidden';

          const header = document.createElement('div');
          header.className = 'permission-group-header';
          header.style.background = '#eef0f2';
          header.style.padding = '0.75rem 1rem';
          header.style.fontWeight = '600';
          header.textContent = group.module;

          const count = document.createElement('span');
          count.className = 'permission-count';
          count.textContent = ' (' + matching.length + ')';
          header.appendChild(count);

          const list = document.createElement('div');
          list.className = 'permission-items';
          list.style.padding = '1rem';

          matching.forEach((perm) => {
            const item = document.createElement('div');
            item.className = 'permission-item';
            item.style.marginBottom = '0.5rem';

            const actionSpan = document.createElement('span');
            actionSpan.className = 'permission-action';
            actionSpan.style.fontWeight = '500';
            actionSpan.textContent = perm.action;
            item.appendChild(actionSpan);

            if (perm.description) {
              const descriptionSpan = document.createElement('span');
              descriptionSpan.className = 'permission-description';
              descriptionSpan.style.fontSize = '0.75rem';
              descriptionSpan.style.opacity = '0.5';
              descriptionSpan.style.marginLeft = '0.5rem';
              descriptionSpan.textContent = '- ' + perm.description;
              item.appendChild(descriptionSpan);
            }

            list.appendChild(item);
          });

          wrapper.appendChild(header);
          wrapper.appendChild(list);
          fragment.appendChild(wrapper);
        });

        if (!fragment.childNodes.length) {
          const fallback = document.createElement('p');
          fallback.textContent = 'No se encontraron permisos para este rol.';
          container.appendChild(fallback);
        } else {
          container.appendChild(fragment);
        }

        modal.showModal();
      }

      function closeViewPermissionsModal() {
        const modal = document.getElementById('viewPermissionsModal');
        if (modal) modal.close();
      }

      // Initialize listeners
      document.addEventListener('DOMContentLoaded', function() {
        const createBtn = document.querySelector('.js-open-role-modal');
        if (createBtn) {
          createBtn.addEventListener('click', (event) => {
            event.preventDefault();
            openRoleModal('create');
          });
        }

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
