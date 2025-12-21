import { html } from "hono/html";

export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: any;
    breadcrumbs?: { label: string; href?: string }[];
    className?: string;
}

export const PageHeader = (props: PageHeaderProps) => {
    const { title, description, actions, breadcrumbs, className = "" } = props;

    return html`
    <div class="page-header ${className}">
      <div class="page-header-content">
        ${breadcrumbs ? html`
          <nav class="page-breadcrumbs">
            ${breadcrumbs.map((crumb, i) => html`
              ${i > 0 ? html`<span class="breadcrumb-separator">/</span>` : ''}
              ${crumb.href ? html`
                <a href="${crumb.href}" class="breadcrumb-link">${crumb.label}</a>
              ` : html`
                <span class="breadcrumb-text">${crumb.label}</span>
              `}
            `)}
          </nav>
        ` : ''}
        
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${title}</h1>
            ${description ? html`<p class="page-description">${description}</p>` : ''}
          </div>
          ${actions ? html`<div class="page-actions">${actions}</div>` : ''}
        </div>
      </div>
    </div>

    <style>
      .page-header {
        margin-bottom: 2rem;
      }

      .page-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 0.75rem;
      }

      .breadcrumb-link {
        color: inherit;
        text-decoration: none;
      }
      
      .breadcrumb-link:hover {
        text-decoration: underline;
      }

      .page-title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .page-title {
        font-size: 1.875rem;
        font-weight: 800;
        color: var(--nexus-base-content, #1e2328);
        margin: 0;
        line-height: 1.2;
      }

      .page-description {
        font-size: 1rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin: 0.5rem 0 0 0;
      }

      .page-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
    </style>
  `;
};
