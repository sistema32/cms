import { html, raw } from "hono/html";

export interface NexusTableColumn {
  key: string;
  label: any;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface NexusTableProps {
  columns: NexusTableColumn[];
  rows: string;
  emptyMessage?: string;
  loading?: boolean;
}

export const NexusTable = (props: NexusTableProps) => {
  const { columns, rows, emptyMessage = "No hay datos para mostrar", loading = false } = props;

  // Generate unique table ID for CSS scoping
  const tableId = `nxt-${Math.random().toString(36).substring(2, 9)}`;

  // Generate CSS for column widths
  const widthStyles = columns
    .map((col, index) => col.width ? `.${tableId} th:nth-child(${index + 1}), .${tableId} td:nth-child(${index + 1}) { width: ${col.width}; min-width: ${col.width}; }` : '')
    .filter(Boolean)
    .join('\n      ');

  return html`
    <div class="nexus-table-container">
      <table class="nexus-table ${tableId}">
        <thead>
          <tr>
            ${raw(columns.map(col => html`
              <th class="${col.align ? `text-${col.align}` : ''}">
                ${col.label}
              </th>
            `).join(''))}
          </tr>
        </thead>
        <tbody>
          ${loading ? html`
             <tr>
               <td colspan="${columns.length}" class="nexus-table-loading">
                 <div class="nexus-spinner"></div> Cargando...
               </td>
             </tr>
          ` : (rows ? raw(rows) : html`
            <tr>
              <td colspan="${columns.length}" class="nexus-table-empty">
                ${emptyMessage}
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>

    ${widthStyles ? html`<style>${raw(widthStyles)}</style>` : ''}

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
      
      .nexus-table thead th.text-center { text-align: center; }
      .nexus-table thead th.text-right { text-align: right; }

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

      .nexus-table-loading {
        text-align: center;
        padding: 3rem 1rem !important;
      }
      
      .nexus-spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(0,0,0,0.1);
        border-left-color: var(--nexus-primary, #167bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
        vertical-align: middle;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
};
