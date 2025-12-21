import { html } from "hono/html";

export interface NexusInputProps {
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    label?: string;
    required?: boolean;
    icon?: any;
    className?: string;
}

export const NexusInput = (props: NexusInputProps) => {
    const {
        name,
        type = "text",
        placeholder = "",
        value = "",
        label,
        required = false,
        icon,
        className = "",
    } = props;

    return html`
    <div class="nexus-input-wrapper ${className}">
      ${label ? html`
        <label class="nexus-input-label" for="${name}">
          ${label}${required ? html`<span class="text-red-500">*</span>` : ''}
        </label>
      ` : ''}
      <div class="nexus-input-container ${icon ? 'with-icon' : ''}">
        ${icon ? html`<span class="nexus-input-icon">${icon}</span>` : ''}
        <input
          type="${type}"
          name="${name}"
          id="${name}"
          placeholder="${placeholder}"
          value="${value}"
          ${required ? 'required' : ''}
          class="nexus-input"
        />
      </div>
    </div>

    <style>
      .nexus-input-wrapper {
        margin-bottom: 1rem;
      }

      .nexus-input-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .nexus-input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .nexus-input-container.with-icon .nexus-input {
        padding-left: 2.75rem;
      }

      .nexus-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .nexus-input:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .nexus-input::placeholder {
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
      }

      .nexus-input-icon {
        position: absolute;
        left: 0.875rem;
        display: flex;
        align-items: center;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
        pointer-events: none;
      }
    </style>
  `;
};
