import { html, raw } from "hono/html";

export interface NexusSwitchProps {
    name: string;
    checked?: boolean;
    label?: string;
    onChange?: string;
    disabled?: boolean;
    className?: string;
}

export const NexusSwitch = (props: NexusSwitchProps) => {
    const {
        name,
        checked = false,
        label,
        onChange,
        disabled = false,
        className = "",
    } = props;

    return html`
    <div class="nexus-switch-wrapper ${className}">
      <label class="nexus-switch-container">
        <input 
          type="checkbox" 
          name="${name}" 
          id="${name}"
          class="nexus-switch-input"
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
          ${raw(onChange ? `onchange="${onChange}"` : '')}
          value="true"
        />
        <span class="nexus-switch-track"></span>
        ${label ? html`<span class="nexus-switch-label">${label}</span>` : ''}
      </label>
    </div>

    <style>
      .nexus-switch-wrapper {
        display: inline-flex;
        align-items: center;
      }

      .nexus-switch-container {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        position: relative;
      }

      .nexus-switch-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .nexus-switch-track {
        position: relative;
        display: inline-block;
        width: 2.75rem;
        height: 1.5rem;
        background-color: var(--nexus-base-300, #dcdee0);
        border-radius: 9999px;
        transition: background-color 0.2s;
        flex-shrink: 0;
      }

      .nexus-switch-track::after {
        content: "";
        position: absolute;
        top: 0.125rem;
        left: 0.125rem;
        width: 1.25rem;
        height: 1.25rem;
        background-color: white;
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .nexus-switch-input:checked + .nexus-switch-track {
        background-color: var(--nexus-primary, #167bff);
      }

      .nexus-switch-input:checked + .nexus-switch-track::after {
        transform: translateX(1.25rem);
      }

      .nexus-switch-input:disabled + .nexus-switch-track {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .nexus-switch-label {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        user-select: none;
      }
    </style>
  `;
};
