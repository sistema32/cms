import { html } from "hono/html";

export interface NexusCardProps {
    title?: string;
    subtitle?: string;
    headerAction?: any;
    children: any;
    className?: string;
    noPadding?: boolean;
    header?: any;
}

export const NexusCard = (props: NexusCardProps) => {
    const { title, subtitle, headerAction, header, children, className = "", noPadding = false } = props;

    return html`
    <div class="nexus-card ${className}">
      ${(header || title) ? html`
        <div class="nexus-card-header">
          <div>
            ${header ? header : html`
              ${title ? html`<h3 class="nexus-card-title">${title}</h3>` : ''}
              ${subtitle ? html`<p class="nexus-card-subtitle">${subtitle}</p>` : ''}
            `}
          </div>
          ${headerAction ? html`<div class="nexus-card-action">${headerAction}</div>` : ''}
        </div>
      ` : ""}
      <div class="nexus-card-body ${noPadding ? 'no-padding' : ''}">
        ${children}
      </div>
    </div>

    <style>
      .nexus-card {
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.03);
        overflow: hidden;
      }

      .nexus-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .nexus-card-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.0125em;
        margin: 0;
      }

      .nexus-card-subtitle {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0.25rem 0 0 0;
      }

      .nexus-card-body {
        padding: 1.5rem;
      }

      .nexus-card-body.no-padding {
        padding: 0;
      }
    </style>
  `;
};
