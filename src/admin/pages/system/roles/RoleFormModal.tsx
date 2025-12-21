import { html } from "hono/html";
import { NexusModal, NexusButton } from "@/admin/components/ui/index.ts";

interface RoleFormModalProps {
  permissionsByModule: Array<{
    module: string;
    permissions: Array<{ id: number; action: string; description?: string | null }>;
  }>;
}

export const RoleFormModal = (props: RoleFormModalProps) => {
  const { permissionsByModule } = props;

  return NexusModal({
    id: "roleModal",
    title: "Nuevo Rol", // Updated by JS
    size: "lg",
    children: html`
      <form id="roleForm" method="POST">
        <input type="hidden" id="roleId" name="roleId" />

        <div class="u-grid-cols-2 u-gap-md u-mb-lg">
          <div class="form-field u-mb-0">
            <label class="form-label">Nombre del rol *</label>
            <input type="text" id="roleName" name="name" class="form-input" required />
          </div>

          <div class="form-field u-mb-0">
            <label class="form-label">Descripción</label>
            <input type="text" id="roleDescription" name="description" class="form-input" />
          </div>
        </div>

        <div class="form-field">
          <div class="u-flex-between u-items-center u-mb-sm">
            <label class="form-label u-mb-0">Permisos</label>
            <input 
              type="text" 
              id="permissionSearch" 
              placeholder="Buscar permisos..." 
              class="form-input" 
              data-action="permission-search"
              class="form-input text-xs w-[200px] py-1 px-2"
            />
          </div>
          
          <div class="permissions-grid">
            ${permissionsByModule.map(group => html`
              <div class="module-group" data-module="${group.module}">
                <div class="module-header js-module-header cursor-pointer select-none" data-module="${group.module}">
                  <div class="module-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-chevron transition-transform duration-200">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    <input
                      type="checkbox"
                      class="module-checkbox js-module-checkbox"
                      data-module="${group.module}"
                    />
                    ${group.module}
                  </div>
                  <span class="permission-count">(${group.permissions.length})</span>
                </div>
                <div class="permissions-list">
                  ${group.permissions.map(perm => html`
                    <label class="permission-label" data-action="${perm.action}">
                      <input
                        type="checkbox"
                        name="permissions[]"
                        value="${perm.id}"
                        class="permission-checkbox js-permission-checkbox"
                        data-module="${group.module}"
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
      className: "js-close-role-modal",
      htmlType: "button"
    })}
          ${NexusButton({
      label: "Guardar Rol",
      type: "primary",
      isSubmit: true
    })}
        </div>
      </form>

      <style>
        .form-field { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content, #1e2328); margin-bottom: 0.5rem; }
        .form-input { 
          width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; 
          color: var(--nexus-base-content, #1e2328); background: var(--nexus-base-100, #fff); 
          border: 1px solid var(--nexus-base-300, #dcdee0); border-radius: var(--nexus-radius-md, 0.5rem); 
          transition: all 0.2s; 
        }
        .form-input:focus { outline: none; border-color: var(--nexus-primary, #167bff); box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1); }
        .permissions-grid { max-height: 400px; overflow-y: auto; border: 1px solid var(--nexus-base-200, #eef0f2); border-radius: var(--nexus-radius-md, 0.5rem); padding: 1rem; }
        .module-group { border-bottom: 1px solid var(--nexus-base-200, #eef0f2); padding-bottom: 1rem; margin-bottom: 1rem; }
        .module-group:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .module-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .module-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content, #1e2328); }
        .module-checkbox, .permission-checkbox { width: 18px; height: 18px; border: 2px solid var(--nexus-base-300, #dcdee0); border-radius: var(--nexus-radius-sm, 0.25rem); cursor: pointer; transition: all 0.2s; }
        .module-checkbox:checked, .permission-checkbox:checked { background: var(--nexus-primary, #167bff); border-color: var(--nexus-primary, #167bff); }
        .permissions-list { margin-left: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        .permission-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--nexus-base-content, #1e2328); cursor: pointer; }
        .permission-label-text { font-weight: 500; }
        .permission-label-description { font-size: 0.75rem; opacity: 0.5; margin-left: 0.25rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--nexus-base-200, #eef0f2); }
        
        @media (max-width: 768px) {
          .permissions-list { grid-template-columns: 1fr; }
        }
      </style>
    `
  });
};
