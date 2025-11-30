import { html, raw } from "hono/html";

/**
 * Nexus Design System - Reusable Components
 * Componentes reutilizables con el estilo de Nexus DaisyUI
 */

// ========== NEXUS CARD ==========
export interface NexusCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: any;
  children: any;
  className?: string;
  noPadding?: boolean;
}

export const NexusCard = (props: NexusCardProps) => {
  const { title, subtitle, headerAction, children, className = "", noPadding = false } = props;

  return html`
    <div class="nexus-card ${className}">
      ${title ? html`
        <div class="nexus-card-header">
          <div>
            ${title ? html`<h3 class="nexus-card-title">${title}</h3>` : ''}
            ${subtitle ? html`<p class="nexus-card-subtitle">${subtitle}</p>` : ''}
          </div>
          ${headerAction ? html`<div class="nexus-card-action">${headerAction}</div>` : ''}
        </div>
      ` : ''}
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

// ========== NEXUS BUTTON ==========
export interface NexusButtonProps {
  label: string;
  href?: string;
  onClick?: string;
  type?: "primary" | "secondary" | "outline" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
  icon?: any;
  className?: string;
  disabled?: boolean;
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
  } = props;

  const Tag = href ? "a" : "button";
  const baseClass = `nexus-btn nexus-btn-${type} nexus-btn-${size} ${className}`;

  return html`
    <${Tag}
      ${href ? `href="${href}"` : ''}
      ${onClick ? `onclick="${onClick}"` : ''}
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
    </style>
  `;
};

// ========== NEXUS INPUT ==========
export interface NexusInputProps {
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  label?: string;
  required?: boolean;
  icon?: string;
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

// ========== NEXUS BADGE ==========
export interface NexusBadgeProps {
  label: string;
  type?: "default" | "primary" | "success" | "warning" | "error" | "info";
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
    </style>
  `;
};

// ========== NEXUS TABLE ==========
export interface NexusTableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface NexusTableProps {
  columns: NexusTableColumn[];
  rows: string;
  emptyMessage?: string;
}

export const NexusTable = (props: NexusTableProps) => {
  const { columns, rows, emptyMessage = "No hay datos para mostrar" } = props;

  return html`
    <div class="nexus-table-container">
      <table class="nexus-table">
        <thead>
          <tr>
            ${raw(columns.map(col => html`
              <th ${col.width ? `style="width: ${col.width}"` : ''}>
                ${col.label}
              </th>
            `).join(''))}
          </tr>
        </thead>
        <tbody>
          ${rows ? raw(rows) : html`
            <tr>
              <td colspan="${columns.length}" class="nexus-table-empty">
                ${emptyMessage}
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <style>
      .nexus-table-container {
        overflow-x: auto;
        border-radius: var(--nexus-radius-lg, 0.75rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .nexus-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .nexus-table thead {
        background: var(--nexus-base-200, #eef0f2);
      }

      .nexus-table thead th {
        padding: 0.875rem 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        text-align: left;
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        border-bottom: 1px solid var(--nexus-base-300, #dcdee0);
      }

      .nexus-table tbody tr {
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
        transition: background 0.15s;
      }

      .nexus-table tbody tr:last-child {
        border-bottom: none;
      }

      .nexus-table tbody tr:hover {
        background: var(--nexus-base-100, #fafbfc);
      }

      .nexus-table tbody td {
        padding: 1rem;
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-table-empty {
        text-align: center;
        padding: 3rem 1rem !important;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }
    </style>
  `;
};

// ========== NEXUS PAGINATION ==========
export interface NexusPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export const NexusPagination = (props: NexusPaginationProps) => {
  const { currentPage, totalPages, baseUrl } = props;

  if (totalPages <= 1) return '';

  const pages: number[] = [];
  const showPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);

  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return html`
    <div class="nexus-pagination">
      ${currentPage > 1 ? html`
        <a href="${baseUrl}?page=${currentPage - 1}" class="nexus-pagination-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </a>
      ` : html`
        <button class="nexus-pagination-btn" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      `}

      ${pages.map(page => html`
        ${page === currentPage ? html`
          <button class="nexus-pagination-page active">${page}</button>
        ` : html`
          <a href="${baseUrl}?page=${page}" class="nexus-pagination-page">${page}</a>
        `}
      `).join('')}

      ${currentPage < totalPages ? html`
        <a href="${baseUrl}?page=${currentPage + 1}" class="nexus-pagination-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>
      ` : html`
        <button class="nexus-pagination-btn" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      `}
    </div>

    <style>
      .nexus-pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
      }

      .nexus-pagination-btn,
      .nexus-pagination-page {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        padding: 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        background: var(--nexus-base-100, #fff);
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }

      .nexus-pagination-btn:hover:not(:disabled),
      .nexus-pagination-page:hover {
        background: var(--nexus-base-200, #eef0f2);
        border-color: var(--nexus-base-300, #dcdee0);
      }

      .nexus-pagination-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .nexus-pagination-page.active {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
        color: #fff;
      }
    </style>
  `;
};
// @ts-nocheck
