import { html } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusBadge, NexusButton } from "@/admin/components/nexus/NexusComponents.tsx";
import { env } from "@/config/env.ts";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

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
    <div class="page-header u-mb-xl">
      <div>
        <h1 class="text-3xl font-bold text-base-content tracking-tight mb-2">
          Gestión de Permisos
        </h1>
        <p class="text-sm text-base-content opacity-60">
          Define permisos específicos para módulos y acciones del sistema
        </p>
        ${stats ? html`
          <div class="u-flex-gap-md mt-2 text-sm text-base-content opacity-60">
            <span>Total: <strong class="text-base-content opacity-100">${stats.totalPermissions}</strong></span>
            <span>Módulos: <strong class="text-primary">${stats.totalModules}</strong></span>
          </div>
        ` : ""}
      </div>
      ${canCreate ? html`
        <div>
          <button
            data-action="create-permission"
            class="u-flex-center gap-2 py-3 px-6 text-sm font-semibold rounded-md bg-primary text-white border-0 cursor-pointer transition-all hover:opacity-90"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
            </svg>
            Nuevo Permiso
          </button>
        </div>
      ` : ""}
    </div>

    <!-- Stats Cards -->
    ${stats && stats.moduleBreakdown.length > 0 ? html`
      <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
        ${stats.moduleBreakdown.slice(0, 4).map(item => html`
          ${NexusCard({
    children: html`
              <div class="text-center">
                <div class="text-sm font-semibold text-base-content opacity-60 mb-2">
                  ${item.module}
                </div>
                <div class="text-3xl font-bold text-primary mb-1">
                  ${item.count}
                </div>
                <div class="text-xs text-base-content opacity-50">
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
    <div class="grid grid-cols-[repeat(auto-fit,minmax(500px,1fr))] gap-6">
      ${grouped.map(group => html`
        ${NexusCard({
    title: `Módulo: ${group.module}`,
    headerAction: html`${NexusBadge({ label: `${group.count} permiso${group.count === 1 ? '' : 's'}`, type: 'info', soft: true })}`,
    children: html`
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-base-200">
                    <th class="p-3 font-semibold text-base-content text-left text-xs uppercase tracking-wide">Acción</th>
                    <th class="p-3 font-semibold text-base-content text-left text-xs uppercase tracking-wide">Descripción</th>
                    <th class="p-3 font-semibold text-base-content text-left text-xs uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.permissions.map(perm => html`
                    <tr class="border-b border-base-200 transition-colors hover:bg-base-50">
                      <td class="p-4">
                        <span class="font-mono text-sm font-semibold text-primary">
                          ${perm.action}
                        </span>
                      </td>
                      <td class="p-4 text-sm text-base-content opacity-60">
                        ${perm.description || '-'}
                      </td>
                      <td class="p-4">
                        <div class="flex gap-2">
                          ${canUpdate ? html`
                            <button
                              data-action="edit-permission"
                              data-id="${perm.id}"
                              data-module="${perm.module}"
                              data-perm-action="${perm.action}"
                              data-description="${perm.description || ''}"
                              class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-0 text-primary cursor-pointer transition-all hover:bg-base-200"
                              title="Editar"
                            >
                              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                              </svg>
                            </button>
                          ` : ""}
                          ${canDelete ? html`
                            <button
                              data-action="delete-permission"
                              data-id="${perm.id}"
                              data-name="${perm.module}:${perm.action}"
                              class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-0 text-error cursor-pointer transition-all hover:bg-base-200"
                              title="Eliminar"
                            >
                              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                              </svg>
                            </button>
                          ` : ""}
                          ${!canUpdate && !canDelete ? html`
                            <span class="text-xs text-base-content opacity-40">Sin permisos</span>
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
    <dialog id="permissionModal" class="p-0 border-0 rounded-lg bg-base-100 shadow-xl max-w-2xl w-full">
      <div class="relative p-8">
        <button
          data-action="close-modal"
          class="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-0 text-base-content opacity-60 cursor-pointer transition-all hover:bg-base-200"
          aria-label="Cerrar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h3 id="modalTitle" class="text-xl font-bold text-base-content mb-6">
          Nuevo Permiso
        </h3>

        <form id="permissionForm" method="POST">
          <input type="hidden" id="permissionId" name="permissionId" />

          <div class="mb-4">
            <label class="block text-sm font-semibold text-base-content mb-2">
              Módulo <span class="text-error">*</span>
            </label>
            <input
              type="text"
              id="module"
              name="module"
              list="modulesList"
              required
              placeholder="ej: users, posts, media..."
              class="w-full px-4 py-3 text-sm text-base-content bg-base-100 border border-base-300 rounded-md transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <datalist id="modulesList">
              ${modules && modules.length > 0 ? modules.map(m => html`
                <option value="${m}">${m}</option>
              `) : grouped.map(g => html`
                <option value="${g.module}">${g.module}</option>
              `)}
            </datalist>
            <p class="mt-1 text-xs text-base-content opacity-50">
              Nombre del módulo o sección del sistema
            </p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold text-base-content mb-2">
              Acción <span class="text-error">*</span>
            </label>
            <input
              type="text"
              id="action"
              name="action"
              required
              placeholder="ej: create, read, update, delete..."
              class="w-full px-4 py-3 text-sm text-base-content bg-base-100 border border-base-300 rounded-md transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <p class="mt-1 text-xs text-base-content opacity-50">
              Acción que permite realizar este permiso
            </p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold text-base-content mb-2">
              Descripción
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Descripción breve del permiso..."
              class="w-full px-4 py-3 text-sm text-base-content bg-base-100 border border-base-300 rounded-md transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div class="p-4 bg-info/10 rounded-md mb-6">
            <div class="flex gap-3">
              <svg class="w-6 h-6 shrink-0 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="text-sm text-base-content">
                <p class="mb-1"><strong>Convención:</strong> Los permisos se nombran como <code class="font-mono bg-base-300 px-1.5 py-0.5 rounded text-xs">módulo:acción</code></p>
                <p class="text-xs opacity-70">Ejemplos: users:create, posts:delete, media:read</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              data-action="close-modal"
              class="py-2.5 px-5 text-sm font-semibold rounded-md bg-transparent border border-base-300 text-base-content cursor-pointer transition-all hover:bg-base-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="py-2.5 px-5 text-sm font-semibold rounded-md bg-primary text-white border-0 cursor-pointer transition-all hover:opacity-90"
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
