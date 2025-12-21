import { html } from "hono/html";
import { NexusModal, NexusButton } from "@/admin/components/ui/index.ts";

interface UserFormModalProps {
    roles: Array<{ id: number; name: string; isSystem?: boolean }>;
}

export const UserFormModal = (props: UserFormModalProps) => {
    const { roles } = props;

    return NexusModal({
        id: "userModal",
        title: "Usuario", // Title is updated by JS
        size: "md",
        children: html`
      <form id="userForm" method="POST">
        <input type="hidden" id="userId" name="userId" />

        <div class="form-field">
          <label class="form-label">Nombre</label>
          <input
            type="text"
            id="userName"
            name="name"
            class="form-input"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label">Email</label>
          <input
            type="email"
            id="userEmail"
            name="email"
            class="form-input"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label">Rol</label>
          <select id="userRoleId" name="roleId" class="form-select" required>
            <option value="">Seleccionar rol...</option>
            ${roles.map(r => html`
              <option value="${r.id}">${r.name}${r.isSystem ? " (sistema)" : ""}</option>
            `)}
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">Estado</label>
          <select id="userStatus" name="status" class="form-select" required>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label">
            Contraseña
            <span id="passwordHint" class="form-hint">Dejar vacío para mantener la actual</span>
          </label>
          <input
            type="password"
            id="userPassword"
            name="password"
            class="form-input"
          />
        </div>

        <div class="modal-actions">
          ${NexusButton({
            label: "Cancelar",
            type: "outline",
            onClick: "document.getElementById('userModal').close()",
            htmlType: "button"
        })}
          ${NexusButton({
            label: "Guardar",
            type: "primary",
            isSubmit: true
        })}
        </div>
      </form>

      <style>
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

        .form-hint {
          font-size: 0.75rem;
          color: var(--nexus-base-content, #1e2328);
          opacity: 0.5;
          margin-left: 0.5rem;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--nexus-base-content, #1e2328);
          background: var(--nexus-base-100, #fff);
          border: 1px solid var(--nexus-base-300, #dcdee0);
          border-radius: var(--nexus-radius-md, 0.5rem);
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--nexus-primary, #167bff);
          box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--nexus-base-200, #eef0f2);
        }
      </style>
    `
    });
};
