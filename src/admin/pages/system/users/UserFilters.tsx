import { html } from "hono/html";
import { NexusCard, NexusButton } from "@/admin/components/ui/index.ts";

interface UserFiltersProps {
    filters: {
        search?: string;
        status?: string;
        roleId?: number;
    };
    roles: Array<{ id: number; name: string; isSystem?: boolean }>;
    adminPath: string;
}

export const UserFilters = (props: UserFiltersProps) => {
    const { filters, roles, adminPath } = props;

    return NexusCard({
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

      <style>
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

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          .filter-actions {
            grid-column: 1 / -1;
          }
        }
      </style>
    `
    });
};
