import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
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
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
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

      .stat-value.primary {
        color: var(--nexus-primary, #167bff);
      }

      .stat-value.secondary {
        color: var(--nexus-secondary, #9c5de8);
      }

      .stat-value.warning {
        color: var(--nexus-warning, #f5a524);
      }

      /* ========== GRID LAYOUT ========== */
      .roles-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      @media (max-width: 1280px) {
        .roles-grid {
          grid-template-columns: 1fr;
        }
      }

      /* ========== TABLE CUSTOMIZATIONS ========== */
      .role-name-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .role-name {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .role-description {
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

      .action-btn.view:hover {
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .action-btn.clone:hover {
        border-color: var(--nexus-success, #17c964);
        color: var(--nexus-success, #17c964);
        background: rgba(23, 201, 100, 0.1);
      }

      .action-btn.danger:hover {
        border-color: var(--nexus-error, #f31260);
        color: var(--nexus-error, #f31260);
        background: rgba(243, 18, 96, 0.1);
      }

      /* ========== PERMISSIONS PANEL ========== */
      .permissions-panel {
        max-height: 600px;
        overflow-y: auto;
      }

      .permission-group {
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1rem;
        overflow: hidden;
      }

      .permission-group-header {
        background: var(--nexus-base-200, #eef0f2);
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .permission-count {
        font-size: 0.75rem;
        font-weight: 500;
        opacity: 0.6;
      }

      .permission-items {
        padding: 1rem;
      }

      .permission-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.875rem;
      }

      .permission-action {
        color: var(--nexus-base-content, #1e2328);
        font-weight: 500;
      }

      .permission-description {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      /* ========== MODAL ========== */
      dialog.modal {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
      }

      dialog.modal[open] {
        display: flex !important;
      }

      .modal-box {
        position: relative;
        width: 90%;
        max-width: 900px;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 1.5rem;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-box.small {
        max-width: 600px;
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

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .permissions-grid {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 1rem;
      }

      .module-group {
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
        padding-bottom: 1rem;
        margin-bottom: 1rem;
      }

      .module-group:last-child {
        border-bottom: none;
        padding-bottom: 0;
        margin-bottom: 0;
      }

      .module-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .module-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .module-checkbox,
      .permission-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.2s;
      }

      .module-checkbox:checked,
      .permission-checkbox:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .permissions-list {
        margin-left: 1.5rem;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .permission-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
      }

      .permission-label-text {
        font-weight: 500;
      }

      .permission-label-description {
        font-size: 0.75rem;
        opacity: 0.5;
        margin-left: 0.25rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
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

        .modal-box {
          width: 95%;
          padding: 1rem;
        }

        .permissions-list {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
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
              onclick: "openRoleModal('create')",
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
      <!-- Roles Table -->
      ${NexusCard({
        header: html`
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Roles configurados</h2>
            <p style="font-size: 0.875rem; opacity: 0.6; margin: 0.25rem 0 0 0;">${roles.length} rol${roles.length === 1 ? "" : "es"} disponibles</p>
          </div>
        `,
        children: html`
          <div style="overflow-x: auto;">
            <table class="nexus-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th style="width: 140px;">Tipo</th>
                  <th style="width: 100px;">Usuarios</th>
                  <th style="width: 100px;">Permisos</th>
                  <th style="width: 180px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${roles.length === 0 ? html`
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: var(--nexus-base-content); opacity: 0.5;">
                      No hay roles para mostrar
                    </td>
                  </tr>
                ` : roles.map(role => html`
                  <tr>
                    <td>
                      <div class="role-name-cell">
                        <div class="role-name">
                          ${role.name}
                          ${role.isSystem ? NexusBadge({ label: "Sistema", type: "info", soft: true }) : ""}
                        </div>
                        ${role.description ? html`
                          <div class="role-description">${role.description}</div>
                        ` : ""}
                      </div>
                    </td>
                    <td>
                      ${role.isSystem
                        ? NexusBadge({ label: "Sistema", type: "info", soft: true })
                        : NexusBadge({ label: "Personalizado", type: "default", soft: true })}
                    </td>
                    <td style="font-size: 0.875rem; font-weight: 500;">
                      ${role.userCount !== undefined ? role.userCount : "-"} usuario${role.userCount === 1 ? "" : "s"}
                    </td>
                    <td>
                      ${NexusBadge({
                        label: `${role.permissions.length} permiso${role.permissions.length === 1 ? "" : "s"}`,
                        type: "secondary",
                        soft: true
                      })}
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button
                          onclick="viewRolePermissions(${role.id})"
                          class="action-btn view"
                          title="Ver permisos"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        ${(canUpdate || canManagePermissions) ? html`
                          <button
                            onclick="openRoleModal('edit', ${role.id})"
                            class="action-btn"
                            title="Editar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        ` : ""}
                        ${canCreate ? html`
                          <button
                            onclick="cloneRole(${role.id})"
                            class="action-btn clone"
                            title="Clonar rol"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        ` : ""}
                        ${!role.isSystem && canDelete ? html`
                          <button
                            data-role-id="${role.id}"
                            data-role-name="${role.name}"
                            class="action-btn danger btn-delete-role"
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
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `,
        noPadding: true
      })}

      <!-- Permissions Panel -->
      ${NexusCard({
        header: html`
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Permisos disponibles</h2>
            <p style="font-size: 0.875rem; opacity: 0.6; margin: 0.25rem 0 0 0;">${permissions.length} permisos en ${permissionsByModule.length} módulos</p>
          </div>
        `,
        children: html`
          <div class="permissions-panel">
            ${permissionsByModule.map(group => html`
              <div class="permission-group">
                <div class="permission-group-header">
                  ${group.module}
                  <span class="permission-count">(${group.permissions.length})</span>
                </div>
                <div class="permission-items">
                  ${group.permissions.map(perm => html`
                    <div class="permission-item">
                      <span class="permission-action">${perm.action}</span>
                      ${perm.description ? html`
                        <span class="permission-description">${perm.description}</span>
                      ` : ""}
                    </div>
                  `)}
                </div>
              </div>
            `)}
          </div>
        `
      })}
    </div>

    <!-- Role Modal -->
    <dialog id="roleModal" class="modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="roleModalTitle" class="modal-title">Nuevo Rol</h3>
          <button type="button" class="modal-close" onclick="closeRoleModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form id="roleForm" method="POST">
          <input type="hidden" id="roleId" name="roleId" />

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-field" style="margin-bottom: 0;">
              <label class="form-label">Nombre del rol *</label>
              <input type="text" id="roleName" name="name" class="form-input" required />
            </div>

            <div class="form-field" style="margin-bottom: 0;">
              <label class="form-label">Descripción</label>
              <input type="text" id="roleDescription" name="description" class="form-input" />
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Permisos</label>
            <div class="permissions-grid">
              ${permissionsByModule.map(group => html`
                <div class="module-group">
                  <div class="module-header">
                    <label class="module-title">
                      <input
                        type="checkbox"
                        class="module-checkbox"
                        data-module="${group.module}"
                        onchange="toggleModulePermissions(this)"
                      />
                      ${group.module}
                    </label>
                    <span class="permission-count">(${group.permissions.length} permisos)</span>
                  </div>
                  <div class="permissions-list">
                    ${group.permissions.map(perm => html`
                      <label class="permission-label">
                        <input
                          type="checkbox"
                          name="permissions[]"
                          value="${perm.id}"
                          class="permission-checkbox"
                          data-module="${group.module}"
                          onchange="updateModuleCheckbox()"
                        />
                        <span>
                          <span class="permission-label-text">${perm.action}</span>
                          ${perm.description ? html`
                            <span class="permission-label-description">- ${perm.description}</span>
                          ` : ""}
                        </span>
                      </label>
                    `)}
                  </div>
                </div>
              `)}
            </div>
          </div>

          <div class="modal-actions">
            ${NexusButton({
              label: "Cancelar",
              type: "outline",
              onclick: "closeRoleModal()"
            })}
            ${NexusButton({
              label: "Guardar Rol",
              type: "primary",
              isSubmit: true
            })}
          </div>
        </form>
      </div>
    </dialog>

    <!-- View Permissions Modal -->
    <dialog id="viewPermissionsModal" class="modal">
      <div class="modal-box small">
        <div class="modal-header">
          <h3 id="viewPermissionsTitle" class="modal-title">Permisos del Rol</h3>
          <button type="button" class="modal-close" onclick="closeViewPermissionsModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="viewPermissionsContent" style="padding: 1rem 0;"></div>

        <div class="modal-actions">
          ${NexusButton({
            label: "Cerrar",
            type: "outline",
            onclick: "closeViewPermissionsModal()"
          })}
        </div>
      </div>
    </dialog>

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      const ALL_ROLES = ${JSON.stringify(rolesForScript)};

      // Modal Management
      function openRoleModal(mode, roleId = null) {
        const modal = document.getElementById('roleModal');
        if (!modal) return;

        const form = document.getElementById('roleForm');
        const title = document.getElementById('roleModalTitle');

        // Reset form
        form.reset();
        document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = false);

        if (mode === 'create') {
          title.textContent = 'Nuevo Rol';
          form.action = ADMIN_BASE_PATH + '/roles/create';
        } else if (mode === 'edit' && roleId) {
          const role = ALL_ROLES.find(r => r.id === roleId);
          if (!role) return;

          title.textContent = 'Editar Rol';
          form.action = ADMIN_BASE_PATH + '/roles/edit/' + roleId;
          document.getElementById('roleName').value = role.name;
          document.getElementById('roleDescription').value = role.description;

          // Check permissions
          role.permissionIds.forEach(permId => {
            const checkbox = document.querySelector('.permission-checkbox[value="' + permId + '"]');
            if (checkbox) checkbox.checked = true;
          });

          updateModuleCheckbox();
        }

        modal.showModal();
      }

      function closeRoleModal() {
        document.getElementById('roleModal')?.close();
      }

      function cloneRole(roleId) {
        const role = ALL_ROLES.find(r => r.id === roleId);
        if (!role) return;

        const modal = document.getElementById('roleModal');
        if (!modal) return;

        const form = document.getElementById('roleForm');
        const title = document.getElementById('roleModalTitle');

        // Reset form
        form.reset();
        document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = false);

        // Set up as create with cloned data
        title.textContent = 'Nuevo Rol (Copia de ' + role.name + ')';
        form.action = ADMIN_BASE_PATH + '/roles/create';
        document.getElementById('roleName').value = role.name + ' (Copia)';
        document.getElementById('roleDescription').value = role.description;

        // Check permissions
        role.permissionIds.forEach(permId => {
          const checkbox = document.querySelector('.permission-checkbox[value="' + permId + '"]');
          if (checkbox) checkbox.checked = true;
        });

        updateModuleCheckbox();
        modal.showModal();
      }

      async function deleteRole(roleId, roleName) {
        if (!confirm('¿Eliminar el rol "' + roleName + '"?')) {
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

      function viewRolePermissions(roleId) {
        const role = ALL_ROLES.find(r => r.id === roleId);
        if (!role) return;

        const modal = document.getElementById('viewPermissionsModal');
        if (!modal) return;

        document.getElementById('viewPermissionsTitle').textContent = 'Permisos de ' + role.name;

        // Group permissions by module
        const permsByModule = {};
        role.permissionIds.forEach(permId => {
          const checkbox = document.querySelector('.permission-checkbox[value="' + permId + '"]');
          if (checkbox) {
            const module = checkbox.dataset.module;
            if (!permsByModule[module]) {
              permsByModule[module] = [];
            }
            const label = checkbox.closest('label');
            const actionText = label?.querySelector('.permission-label-text')?.textContent || '';
            permsByModule[module].push(actionText);
          }
        });

        // Build content using DOM API (XSS safe)
        const container = document.getElementById('viewPermissionsContent');
        container.innerHTML = ''; // Clear previous content

        if (Object.keys(permsByModule).length === 0) {
          const emptyMsg = document.createElement('p');
          emptyMsg.style.opacity = '0.5';
          emptyMsg.textContent = 'Sin permisos asignados';
          container.appendChild(emptyMsg);
        } else {
          for (const [module, actions] of Object.entries(permsByModule)) {
            const group = document.createElement('div');
            group.className = 'permission-group';

            const header = document.createElement('div');
            header.className = 'permission-group-header';
            header.textContent = module + ' '; // XSS safe

            const count = document.createElement('span');
            count.className = 'permission-count';
            count.textContent = '(' + actions.length + ')';
            header.appendChild(count);

            const items = document.createElement('div');
            items.className = 'permission-items';

            actions.forEach(action => {
              const item = document.createElement('div');
              item.className = 'permission-item';

              const actionSpan = document.createElement('span');
              actionSpan.className = 'permission-action';
              actionSpan.textContent = action; // XSS safe

              item.appendChild(actionSpan);
              items.appendChild(item);
            });

            group.appendChild(header);
            group.appendChild(items);
            container.appendChild(group);
          }
        }

        modal.showModal();
      }

      function closeViewPermissionsModal() {
        document.getElementById('viewPermissionsModal')?.close();
      }

      // Permission Checkbox Management
      function toggleModulePermissions(moduleCheckbox) {
        const module = moduleCheckbox.dataset.module;
        const isChecked = moduleCheckbox.checked;
        document.querySelectorAll('.permission-checkbox[data-module="' + module + '"]').forEach(cb => {
          cb.checked = isChecked;
        });
      }

      function updateModuleCheckbox() {
        const modules = new Set();
        document.querySelectorAll('.permission-checkbox').forEach(cb => {
          modules.add(cb.dataset.module);
        });

        modules.forEach(module => {
          const moduleCheckbox = document.querySelector('.module-checkbox[data-module="' + module + '"]');
          const permCheckboxes = document.querySelectorAll('.permission-checkbox[data-module="' + module + '"]');
          const checkedCount = Array.from(permCheckboxes).filter(cb => cb.checked).length;

          if (moduleCheckbox) {
            moduleCheckbox.checked = checkedCount > 0 && checkedCount === permCheckboxes.length;
            moduleCheckbox.indeterminate = checkedCount > 0 && checkedCount < permCheckboxes.length;
          }
        });
      }

      // Initialize event listeners (XSS safe - no inline onclick)
      document.addEventListener('DOMContentLoaded', function() {
        // Delete role buttons
        document.addEventListener('click', function(e) {
          const deleteBtn = e.target.closest('.btn-delete-role');
          if (deleteBtn) {
            const roleId = parseInt(deleteBtn.dataset.roleId);
            const roleName = deleteBtn.dataset.roleName;
            deleteRole(roleId, roleName);
          }
        });
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
