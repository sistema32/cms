import { html } from "hono/html";

export interface NexusBadgeProps {
    label: string;
    type?: "default" | "primary" | "success" | "warning" | "error" | "info" | "secondary";
    size?: "sm" | "md";
    soft?: boolean;
}

export const NexusBadge = (props: NexusBadgeProps) => {
    const { label, type = "default", size = "md", soft = false } = props;

    return html`
    <span class="nexus-badge nexus-badge-${type} nexus-badge-${size} ${soft ? 'nexus-badge-soft' : ''}">
      ${label}
    </span>

    <style>
      .nexus-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        white-space: nowrap;
      }

      .nexus-badge-sm {
        padding: 0.125rem 0.5rem;
        font-size: 0.6875rem;
      }

      .nexus-badge-default {
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-badge-primary {
        background: var(--nexus-primary, #167bff);
        color: #fff;
      }

      .nexus-badge-primary.nexus-badge-soft {
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .nexus-badge-success {
        background: var(--nexus-success, #0bbf58);
        color: #fff;
      }

      .nexus-badge-success.nexus-badge-soft {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .nexus-badge-warning {
        background: var(--nexus-warning, #f5a524);
        color: #fff;
      }

      .nexus-badge-warning.nexus-badge-soft {
        background: rgba(245, 165, 36, 0.1);
        color: var(--nexus-warning, #f5a524);
      }

      .nexus-badge-error {
        background: var(--nexus-error, #f31260);
        color: #fff;
      }

      .nexus-badge-error.nexus-badge-soft {
        background: rgba(243, 18, 96, 0.1);
        color: var(--nexus-error, #f31260);
      }

      .nexus-badge-info {
        background: var(--nexus-info, #14b4ff);
        color: #fff;
      }

      .nexus-badge-info.nexus-badge-soft {
        background: rgba(20, 180, 255, 0.1);
        color: var(--nexus-info, #14b4ff);
      }

      .nexus-badge-secondary {
        background: var(--nexus-secondary, #9c5de8);
        color: #fff;
      }

      .nexus-badge-secondary.nexus-badge-soft {
        background: rgba(156, 93, 232, 0.12);
        color: var(--nexus-secondary, #9c5de8);
      }
    </style>
  `;
};
