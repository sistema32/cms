import { html } from "hono/html";
import type { PaginationData } from "../helpers/index.ts";
import { getPaginationNumbers } from "../helpers/index.ts";

/**
 * Pagination - Componente de paginación numérica
 * Inspirado en WordPress y Ghost
 */

interface PaginationProps {
  pagination: PaginationData;
  baseUrl?: string;
}

export const Pagination = (props: PaginationProps) => {
  const { pagination, baseUrl = "/blog/page" } = props;

  if (pagination.totalPages <= 1) {
    return html``;
  }

  const pageNumbers = getPaginationNumbers(
    pagination.currentPage,
    pagination.totalPages
  );

  return html`
    <nav class="pagination" role="navigation" aria-label="Paginación">
      <div class="pagination-container">
        ${pagination.hasPrev ? html`
          <a
            href="${baseUrl}/${pagination.prevPage}"
            class="pagination-btn pagination-prev"
            rel="prev"
          >
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>Anterior</span>
          </a>
        ` : html`
          <span class="pagination-btn pagination-prev pagination-disabled">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>Anterior</span>
          </span>
        `}

        <div class="pagination-numbers">
          ${pageNumbers.map((page) => {
            if (page === "...") {
              return html`<span class="pagination-ellipsis">...</span>`;
            }

            const pageNum = page as number;
            const isActive = pageNum === pagination.currentPage;
            const href = pageNum === 1 ? "/blog" : `${baseUrl}/${pageNum}`;

            return isActive
              ? html`
                  <span class="pagination-number pagination-active" aria-current="page">
                    ${pageNum}
                  </span>
                `
              : html`
                  <a href="${href}" class="pagination-number">
                    ${pageNum}
                  </a>
                `;
          })}
        </div>

        ${pagination.hasNext ? html`
          <a
            href="${baseUrl}/${pagination.nextPage}"
            class="pagination-btn pagination-next"
            rel="next"
          >
            <span>Siguiente</span>
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </a>
        ` : html`
          <span class="pagination-btn pagination-next pagination-disabled">
            <span>Siguiente</span>
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </span>
        `}
      </div>

      <div class="pagination-info">
        Página ${pagination.currentPage} de ${pagination.totalPages}
      </div>
    </nav>
  `;
};

export default Pagination;
