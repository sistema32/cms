import { html, raw } from "hono/html";

export interface NexusSelectOption {
    value: string;
    label: string;
}

export interface NexusSelectProps {
    name: string;
    options: NexusSelectOption[];
    value?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    onChange?: string;
}

export const NexusSelect = (props: NexusSelectProps) => {
    const {
        name,
        options,
        value = "",
        label,
        placeholder = "Seleccionar...",
        required = false,
        className = "",
        onChange,
    } = props;

    return html`
    <div class="nexus-select-wrapper ${className}">
      ${label ? html`
        <label class="nexus-select-label" for="${name}">
          ${label}${required ? html`<span class="text-red-500">*</span>` : ''}
        </label>
      ` : ''}
      <div class="nexus-select-container">
        <select
          name="${name}"
          id="${name}"
          class="nexus-select"
          ${required ? 'required' : ''}
          ${raw(onChange ? `onchange="${onChange}"` : '')}
        >
          ${placeholder ? html`<option value="" disabled ${!value ? 'selected' : ''}>${placeholder}</option>` : ''}
          ${options.map(opt => html`
            <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
          `)}
        </select>
        <div class="nexus-select-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>

    <style>
      .nexus-select-wrapper {
        margin-bottom: 1rem;
      }

      .nexus-select-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .nexus-select-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .nexus-select {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        appearance: none;
        cursor: pointer;
      }

      .nexus-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .nexus-select-arrow {
        position: absolute;
        right: 1rem;
        pointer-events: none;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        display: flex;
        align-items: center;
      }
    </style>
  `;
};
