import { html } from "hono/html";
import { NexusCard } from "@/admin/components/ui/index.ts";

interface PermissionSummaryPanelProps {
    permissionsByModule: Array<{
        module: string;
        permissions: Array<{ action: string; description?: string | null }>;
    }>;
    totalPermissions: number;
}

export const PermissionSummaryPanel = (props: PermissionSummaryPanelProps) => {
    const { permissionsByModule, totalPermissions } = props;

    return NexusCard({
        header: html`
      <div>
        <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Permisos disponibles</h2>
        <p style="font-size: 0.875rem; opacity: 0.6; margin: 0.25rem 0 0 0;">
          ${totalPermissions} permisos en ${permissionsByModule.length} módulos
        </p>
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

      <style>
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
      </style>
    `
    });
};
