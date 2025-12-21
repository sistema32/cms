import { html } from "hono/html";

export interface NexusTextAreaProps {
    name: string;
    value?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    className?: string;
}

export const NexusTextArea = (props: NexusTextAreaProps) => {
    const {
        name,
        value = "",
        label,
        placeholder = "",
        required = false,
        rows = 4,
        className = "",
    } = props;

    return html`
    <div class="nexus-textarea-wrapper ${className}">
      ${label ? html`
        <label class="nexus-textarea-label" for="${name}">
          ${label}${required ? html`<span class="text-red-500">*</span>` : ''}
        </label>
      ` : ''}
      <textarea
        name="${name}"
        id="${name}"
        rows="${rows}"
        placeholder="${placeholder}"
        class="nexus-textarea"
        ${required ? 'required' : ''}
      >${value}</textarea>
    </div>

    <style>
      .nexus-textarea-wrapper {
        margin-bottom: 1rem;
      }

      .nexus-textarea-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .nexus-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        resize: vertical;
        font-family: inherit;
      }

      .nexus-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .nexus-textarea::placeholder {
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
      }
    </style>
  `;
};
