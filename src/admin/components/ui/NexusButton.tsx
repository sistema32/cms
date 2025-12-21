import { html, raw } from "hono/html";

export interface NexusButtonProps {
  label: string;
  href?: string;
  onClick?: string;
  type?: "primary" | "secondary" | "outline" | "ghost" | "soft" | "success" | "warning" | "error" | "info" | "default";
  size?: "sm" | "md" | "lg";
  icon?: any;
  className?: string;
  disabled?: boolean;
  isSubmit?: boolean;
  htmlType?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  target?: string;
  rel?: string;
  attributes?: Record<string, string>;
  dataAttributes?: Record<string, string>;
}

export const NexusButton = (props: NexusButtonProps) => {
  const {
    label,
    href,
    onClick,
    type = "primary",
    size = "md",
    icon,
    className = "",
    disabled = false,
    isSubmit = false,
    htmlType,
    fullWidth = false,
    target,
    rel,
    attributes = {},
    dataAttributes = {},
  } = props;

  const Tag = href ? "a" : "button";
  const resolvedType = href ? undefined : (htmlType ?? (isSubmit ? "submit" : "button"));
  const baseClass = `nexus-btn nexus-btn-${type} nexus-btn-${size} ${fullWidth ? "nexus-btn-full" : ""} ${className}`;
  // Add onClick to data-action attribute if provided
  const mergedAttrs = { ...attributes, ...dataAttributes };
  if (onClick) {
    mergedAttrs["data-action"] = onClick;
  }
  const attrString = Object.entries(mergedAttrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ");

  return html`
    <${Tag}
      ${raw(href ? `href="${href}"` : '')}
      ${resolvedType ? `type="${resolvedType}"` : ''}
      ${target ? `target="${target}"` : ''}
      ${rel ? `rel="${rel}"` : ''}
      ${raw(attrString)}
      ${disabled ? 'disabled' : ''}
      class="${baseClass}"
    >
      ${icon ? html`<span class="nexus-btn-icon">${icon}</span>` : ''}
      <span>${label}</span>
    </${Tag}>

    <style>
      .nexus-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        white-space: nowrap;
        width: auto;
      }

      .nexus-btn-full {
        width: 100%;
      }

      .nexus-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .nexus-btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
      }

      .nexus-btn-lg {
        padding: 0.875rem 1.75rem;
        font-size: 0.9375rem;
      }

      .nexus-btn-primary {
        background: var(--nexus-primary, #167bff);
        color: var(--nexus-primary-content, #fff);
      }

      .nexus-btn-primary:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(22, 123, 255, 0.3);
      }

      .nexus-btn-secondary {
        background: var(--nexus-secondary, #9c5de8);
        color: #fff;
      }

      .nexus-btn-secondary:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .nexus-btn-outline {
        background: transparent;
        border-color: var(--nexus-base-300, #dcdee0);
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-btn-outline:hover:not(:disabled) {
        background: var(--nexus-base-200, #eef0f2);
        border-color: var(--nexus-base-300, #dcdee0);
      }

      .nexus-btn-ghost {
        background: transparent;
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-btn-ghost:hover:not(:disabled) {
        background: var(--nexus-base-200, #eef0f2);
      }

      .nexus-btn-soft {
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .nexus-btn-soft:hover:not(:disabled) {
        background: rgba(22, 123, 255, 0.15);
      }

      .nexus-btn-icon {
        display: inline-flex;
      }

      .nexus-btn-success {
        background: var(--nexus-success, #0bbf58);
        color: #fff;
      }

      .nexus-btn-success:hover:not(:disabled) {
        opacity: 0.92;
        box-shadow: 0 4px 12px rgba(11, 191, 88, 0.25);
      }

      .nexus-btn-warning {
        background: var(--nexus-warning, #f5a524);
        color: #fff;
      }

      .nexus-btn-warning:hover:not(:disabled) {
        opacity: 0.92;
        box-shadow: 0 4px 12px rgba(245, 165, 36, 0.25);
      }

      .nexus-btn-error {
        background: var(--nexus-error, #f31260);
        color: #fff;
      }

      .nexus-btn-error:hover:not(:disabled) {
        opacity: 0.92;
        box-shadow: 0 4px 12px rgba(243, 18, 96, 0.25);
      }

      .nexus-btn-info {
        background: var(--nexus-info, #14b4ff);
        color: #fff;
      }

      .nexus-btn-info:hover:not(:disabled) {
        opacity: 0.92;
        box-shadow: 0 4px 12px rgba(20, 180, 255, 0.25);
      }
    </style>
  `;
};
