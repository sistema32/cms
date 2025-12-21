import { html } from "hono/html";
import { NexusTable, NexusBadge } from "@/admin/components/ui/index.ts";

interface RoleListTableProps {
    roles: Array<{
        id: number;
        name: string;
        description?: string | null;
        isSystem?: boolean;
        userCount?: number;
        permissions: any[];
    }>;
    canUpdate: boolean;
    canDelete: boolean;
    canCreate: boolean; // For clone
    canManagePermissions: boolean;
}

export const RoleListTable = (props: RoleListTableProps) => {
    const { roles, canUpdate, canDelete, canCreate, canManagePermissions } = props;

    const columns = [
        { key: "role", label: "Rol" },
        { key: "type", label: "Tipo", width: "140px" },
        { key: "users", label: "Usuarios", width: "100px" },
        { key: "permissions", label: "Permisos", width: "100px" },
        { key: "actions", label: "Acciones", width: "180px" }
    ];

    const rowsHtml = roles.map(role => html`
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
            data-role-id="${role.id}"
            class="action-btn view js-view-role"
            type="button"
            title="Ver permisos"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          ${(canUpdate || canManagePermissions) ? html`
            <button
              data-role-id="${role.id}"
              class="action-btn js-edit-role"
              type="button"
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
              data-role-id="${role.id}"
              class="action-btn clone js-clone-role"
              type="button"
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
              type="button"
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
  `).join("");

    return html`
    ${NexusTable({
        columns,
        rows: rowsHtml,
        emptyMessage: "No hay roles para mostrar"
    })}

    <style>
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
    </style>
  `;
};
