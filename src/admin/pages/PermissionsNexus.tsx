import { html } from "hono/html";
import { AdminLayoutNexus } from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusBadge, NexusButton } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";
import type { NotificationItem } from "../components/NotificationPanel.tsx";

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
    id: number;
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
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const PermissionsNexus = (props: PermissionsPageProps) => {
  const {
    user,
    permissions,
    permissionsByModule,
    modules,
    stats,
    userPermissions = [],
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
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
    <div class="page-header" style="margin-bottom: 2rem;">
      <div>
        <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--nexus-base-content); letter-spacing: -0.025em; margin-bottom: 0.5rem;">
          Gestión de Permisos
        </h1>
        <p style="font-size: 0.9375rem; color: var(--nexus-base-content); opacity: 0.6;">
          Define permisos específicos para módulos y acciones del sistema
        </p>
        ${stats ? html`
          <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.6;">
            <span>Total: <strong style="color: var(--nexus-base-content); opacity: 1;">${stats.totalPermissions}</strong></span>
            <span>Módulos: <strong style="color: var(--nexus-primary);">${stats.totalModules}</strong></span>
          </div>
        ` : ""}
      </div>
      ${canCreate ? html`
        <div>
          <button
            data-action="create-permission"
            style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: var(--nexus-primary); color: #fff; border: none; cursor: pointer; transition: all 0.2s;"
          >
            <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
            </svg>
            Nuevo Permiso
          </button>
        </div>
      ` : ""}
    </div>

    <!-- Stats Cards -->
    ${stats && stats.moduleBreakdown.length > 0 ? html`
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        ${stats.moduleBreakdown.slice(0, 4).map(item => html`
          ${NexusCard({
            children: html`
              <div style="text-align: center;">
                <div style="font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); opacity: 0.65; margin-bottom: 0.5rem;">
                  ${item.module}
                </div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--nexus-primary); margin-bottom: 0.25rem;">
                  ${item.count}
                </div>
                <div style="font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.5;">
                  permiso${item.count === 1 ? '' : 's'}
                </div>
              </div>
            `,
            noPadding: false,
          })}
        `)}
      </div>
    ` : ""}

    <!-- Permissions by Module -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 1.5rem;">
      ${grouped.map(group => html`
        ${NexusCard({
          title: `Módulo: ${group.module}`,
          headerAction: html`${NexusBadge({ label: `${group.count} permiso${group.count === 1 ? '' : 's'}`, type: 'info', soft: true })}`,
          children: html`
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--nexus-base-200);">
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Acción</th>
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Descripción</th>
                    <th style="padding: 0.75rem 1rem; font-weight: 600; color: var(--nexus-base-content); text-align: left; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.025em;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.permissions.map(perm => html`
                    <tr style="border-bottom: 1px solid var(--nexus-base-200); transition: background 0.15s;">
                      <td style="padding: 1rem;">
                        <span style="font-family: monospace; font-size: 0.875rem; font-weight: 600; color: var(--nexus-primary);">
                          ${perm.action}
                        </span>
                      </td>
                      <td style="padding: 1rem; font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.65;">
                        ${perm.description || '-'}
                      </td>
                      <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                          ${canUpdate ? html`
                            <button
                              data-action="edit-permission"
                              data-id="${perm.id}"
                              data-module="${perm.module}"
                              data-perm-action="${perm.action}"
                              data-description="${perm.description || ''}"
                              style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--nexus-radius-md); background: transparent; border: none; color: var(--nexus-primary); cursor: pointer; transition: all 0.2s;"
                              title="Editar"
                            >
                              <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                              </svg>
                            </button>
                          ` : ""}
                          ${canDelete ? html`
                            <button
                              data-action="delete-permission"
                              data-id="${perm.id}"
                              data-name="${perm.module}:${perm.action}"
                              style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--nexus-radius-md); background: transparent; border: none; color: var(--nexus-error); cursor: pointer; transition: all 0.2s;"
                              title="Eliminar"
                            >
                              <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                              </svg>
                            </button>
                          ` : ""}
                          ${!canUpdate && !canDelete ? html`
                            <span style="font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.4;">Sin permisos</span>
                          ` : ""}
                        </div>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          `,
          noPadding: true,
        })}
      `)}
    </div>

    <!-- Create/Edit Modal -->
    <dialog id="permissionModal" style="max-width: 42rem; padding: 0; border: none; border-radius: var(--nexus-radius-lg); background: var(--nexus-base-100); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
      <div style="position: relative; padding: 2rem;">
        <button
          data-action="close-modal"
          style="position: absolute; right: 1rem; top: 1rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: transparent; border: none; color: var(--nexus-base-content); opacity: 0.6; cursor: pointer; transition: all 0.2s;"
          aria-label="Cerrar"
        >
          <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h3 id="modalTitle" style="font-size: 1.25rem; font-weight: 700; color: var(--nexus-base-content); margin-bottom: 1.5rem;">
          Nuevo Permiso
        </h3>

        <form id="permissionForm" method="POST">
          <input type="hidden" id="permissionId" name="permissionId" />

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Módulo <span style="color: var(--nexus-error);">*</span>
            </label>
            <input
              type="text"
              id="module"
              name="module"
              list="modulesList"
              required
              placeholder="ej: users, posts, media..."
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
            />
            <datalist id="modulesList">
              ${modules && modules.length > 0 ? modules.map(m => html`
                <option value="${m}">${m}</option>
              `) : grouped.map(g => html`
                <option value="${g.module}">${g.module}</option>
              `)}
            </datalist>
            <p style="margin-top: 0.25rem; font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.5;">
              Nombre del módulo o sección del sistema
            </p>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Acción <span style="color: var(--nexus-error);">*</span>
            </label>
            <input
              type="text"
              id="action"
              name="action"
              required
              placeholder="ej: create, read, update, delete..."
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
            />
            <p style="margin-top: 0.25rem; font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.5;">
              Acción que permite realizar este permiso
            </p>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content); margin-bottom: 0.5rem;">
              Descripción
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Descripción breve del permiso..."
              style="width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content); background: var(--nexus-base-100); border: 1px solid var(--nexus-base-300); border-radius: var(--nexus-radius-md); transition: all 0.2s;"
            />
          </div>

          <div style="padding: 1rem; background: rgba(20, 180, 255, 0.1); border-radius: var(--nexus-radius-md); margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 0.75rem;">
              <svg style="width: 1.5rem; height: 1.5rem; flex-shrink: 0; color: var(--nexus-info);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div style="font-size: 0.875rem; color: var(--nexus-base-content);">
                <p style="margin-bottom: 0.25rem;"><strong>Convención:</strong> Los permisos se nombran como <code style="font-family: monospace; background: var(--nexus-base-300); padding: 0.125rem 0.375rem; border-radius: 0.25rem;">módulo:acción</code></p>
                <p style="font-size: 0.75rem; opacity: 0.7;">Ejemplos: users:create, posts:delete, media:read</p>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button
              type="button"
              data-action="close-modal"
              style="padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: transparent; border: 1px solid var(--nexus-base-300); color: var(--nexus-base-content); cursor: pointer; transition: all 0.2s;"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style="padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-radius: var(--nexus-radius-md); background: var(--nexus-primary); color: #fff; border: none; cursor: pointer; transition: all 0.2s;"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <script>
      // XSS safe - Using data attributes and event listeners instead of inline handlers
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('permissionModal');
        const form = document.getElementById('permissionForm');
        const modalTitle = document.getElementById('modalTitle');
        const moduleInput = document.getElementById('module');
        const actionInput = document.getElementById('action');
        const descriptionInput = document.getElementById('description');
        const permissionIdInput = document.getElementById('permissionId');

        // XSS safe - Create permission button handler
        document.querySelectorAll('[data-action="create-permission"]').forEach(btn => {
          btn.addEventListener('click', function() {
            // XSS safe - Using textContent instead of innerHTML
            modalTitle.textContent = 'Nuevo Permiso';
            form.action = ADMIN_BASE_PATH + '/permissions/create';
            permissionIdInput.value = '';
            moduleInput.value = '';
            actionInput.value = '';
            descriptionInput.value = '';
            moduleInput.readOnly = false;
            actionInput.readOnly = false;
            modal?.showModal();
          });
        });

        // XSS safe - Edit permission button handlers
        document.querySelectorAll('[data-action="edit-permission"]').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id') || '';
            const module = this.getAttribute('data-module') || '';
            const permAction = this.getAttribute('data-perm-action') || '';
            const desc = this.getAttribute('data-description') || '';

            // XSS safe - Using textContent instead of innerHTML
            modalTitle.textContent = 'Editar Permiso';
            form.action = ADMIN_BASE_PATH + '/permissions/edit/' + encodeURIComponent(id);
            permissionIdInput.value = id;
            moduleInput.value = module;
            actionInput.value = permAction;
            descriptionInput.value = desc;
            moduleInput.readOnly = true;
            actionInput.readOnly = true;
            modal?.showModal();
          });
        });

        // XSS safe - Close modal button handlers
        document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
          btn.addEventListener('click', function() {
            modal?.close();
          });
        });

        // XSS safe - Delete permission button handlers
        document.querySelectorAll('[data-action="delete-permission"]').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id') || '';
            const name = this.getAttribute('data-name') || '';

            // XSS safe - Using template literals with sanitized data
            if (!confirm('¿Estás seguro de eliminar el permiso "' + name + '"?\\nEsto puede afectar a roles que tengan este permiso asignado.')) {
              return;
            }

            try {
              const response = await fetch(ADMIN_BASE_PATH + '/permissions/delete/' + encodeURIComponent(id), {
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
          });
        });

        // Close modal on backdrop click
        modal?.addEventListener('click', function(e) {
          if (e.target === modal) {
            modal.close();
          }
        });
      });
    </script>
  `;

  return AdminLayoutNexus({
    user,
    children: content,
    title: "Permisos",
    activePage: "access.permissions",
    notifications,
    unreadNotificationCount,
  });
};

export default PermissionsNexus;
