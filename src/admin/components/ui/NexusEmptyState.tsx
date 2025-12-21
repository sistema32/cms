import { html } from "hono/html";

export interface NexusEmptyStateProps {
    title?: string;
    description?: string;
    icon?: any;
    action?: any;
    className?: string;
}

export const NexusEmptyState = (props: NexusEmptyStateProps) => {
    const {
        title = "No hay datos",
        description,
        icon,
        action,
        className = "",
    } = props;

    return html`
    <div class="nexus-empty-state ${className}">
      <div class="nexus-empty-icon">
        ${icon ? icon : html`
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        `}
      </div>
      <h3 class="nexus-empty-title">${title}</h3>
      ${description ? html`<p class="nexus-empty-description">${description}</p>` : ''}
      ${action ? html`<div class="nexus-empty-action">${action}</div>` : ''}
    </div>

    <style>
      .nexus-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem 1rem;
        background: var(--nexus-base-100, #fff);
        border: 1px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-empty-icon {
        margin-bottom: 1rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.2;
      }

      .nexus-empty-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .nexus-empty-description {
        font-size: 0.875rem;
        opacity: 0.6;
        margin: 0 0 1.5rem 0;
        max-width: 400px;
      }

      .nexus-empty-action {
        margin-top: 0.5rem;
      }
    </style>
  `;
};
