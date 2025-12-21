import { html } from "hono/html";
import { NexusTable, NexusBadge } from "@/admin/components/ui/index.ts";

interface UserListTableProps {
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
  currentUser: { email: string };
  canUpdate: boolean;
  canDelete: boolean;
}

export const UserListTable = (props: UserListTableProps) => {
  const { users, currentUser, canUpdate, canDelete } = props;

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

  const columns = [
    { key: "select", label: html`<input type="checkbox" class="nexus-checkbox" id="selectAll" data-select-all="true" />`, width: "50px" },
    { key: "user", label: "Usuario" },
    { key: "status", label: "Estado", width: "120px" },
    { key: "role", label: "Rol", width: "150px" },
    { key: "2fa", label: "2FA", width: "100px" },
    { key: "lastLogin", label: "Último Login", width: "140px" },
    { key: "created", label: "Registro", width: "120px" },
    { key: "actions", label: "Acciones", width: "120px" }
  ];

  const rowsHtml = users.map(u => html`
    <tr>
      <td>
        <input
          type="checkbox"
          class="nexus-checkbox userCheckbox"
          value="${u.id}"
          data-user-checkbox="${u.id}"
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
      <td class="table-meta-text">${formatLastLogin(u.lastLoginAt)}</td>
      <td class="table-meta-text">
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
          ${canDelete && u.email !== currentUser.email && u.id !== 1 ? html`
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
  `).join("");

  return html`
    ${NexusTable({
    columns: columns,
    rows: rowsHtml,
    emptyMessage: "No hay usuarios para mostrar"
  })}

    <style>
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

      .no-permissions {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
      }
      
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

      .table-meta-text {
        font-size: 0.875rem;
        opacity: 0.7;
      }
    </style>
  `;
};
