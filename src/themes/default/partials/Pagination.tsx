import type { FC } from "hono/jsx";
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

export const Pagination: FC<PaginationProps> = (props) => {
  const { pagination, baseUrl = "/blog/page" } = props;

  if (pagination.totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPaginationNumbers(
    pagination.currentPage,
    pagination.totalPages
  );

  return (
    <nav class="pagination" role="navigation" aria-label="Paginación">
      <div class="pagination-container">
        {pagination.hasPrev ? (
          <a
            href={`${baseUrl}/${pagination.prevPage}`}
            class="pagination-btn pagination-prev"
            rel="prev"
          >
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span>Anterior</span>
          </a>
        ) : (
          <span class="pagination-btn pagination-prev pagination-disabled">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span>Anterior</span>
          </span>
        )}

        <div class="pagination-numbers">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return <span class="pagination-ellipsis" key={`ellipsis-${index}`}>...</span>;
            }

            const pageNum = page as number;
            const isActive = pageNum === pagination.currentPage;
            const href = pageNum === 1 ? "/blog" : `${baseUrl}/${pageNum}`;

            return isActive ? (
              <span
                class="pagination-number pagination-active"
                aria-current="page"
                key={pageNum}
              >
                {pageNum}
              </span>
            ) : (
              <a href={href} class="pagination-number" key={pageNum}>
                {pageNum}
              </a>
            );
          })}
        </div>

        {pagination.hasNext ? (
          <a
            href={`${baseUrl}/${pagination.nextPage}`}
            class="pagination-btn pagination-next"
            rel="next"
          >
            <span>Siguiente</span>
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </a>
        ) : (
          <span class="pagination-btn pagination-next pagination-disabled">
            <span>Siguiente</span>
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </span>
        )}
      </div>

      <div class="pagination-info">
        Página {pagination.currentPage} de {pagination.totalPages}
      </div>
    </nav>
  );
};

export default Pagination;
