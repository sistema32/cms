import { html } from "hono/html";

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
