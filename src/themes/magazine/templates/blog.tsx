import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../../default/partials/Header.tsx";
import { Footer } from "../../default/partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Magazine Blog Template - Blog listing estilo revista
 * Layout tipo periódico con grid de artículos
 */

interface BlogProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  posts: PostData[];
  pagination: PaginationData;
  recentPosts?: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
  tags?: Array<{ id: number; name: string; slug: string; count?: number }>;
  blogUrl?: string;
}

export const BlogTemplate = (props: BlogProps) => {
  const { site, custom, activeTheme, posts, pagination, blogUrl = "blog" } = props;

  const blogTitle = custom.blog_title || "Blog";
  const blogDescription = custom.blog_description || "Todas las historias";

  const content = html`
    <!-- Header -->
    ${Header({ site, custom, blogUrl })}

    <!-- Main Content -->
    <main class="site-main magazine-blog">
      <div class="container">
        <!-- Page Header -->
        <header class="magazine-page-header">
          <h1 class="magazine-page-title">${blogTitle}</h1>
          ${blogDescription ? html`
            <p class="magazine-page-description">${blogDescription}</p>
          ` : ''}
        </header>

        ${posts.length > 0 ? html`
          <!-- Posts Grid -->
          <div class="magazine-posts-grid">
            ${posts.map((post) => PostCard({
              post,
              showExcerpt: true,
              showAuthor: true,
              showDate: true,
              showCategories: true,
              showTags: false,
              showImage: true,
            }))}
          </div>

          <!-- Pagination -->
          ${pagination.totalPages > 1 ? html`
            <nav class="magazine-pagination">
              ${pagination.hasPrev ? html`
                <a
                  href="${pagination.prevPage === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${pagination.prevPage}`}"
                  class="pagination-btn pagination-prev"
                >
                  ← Anterior
                </a>
              ` : ''}

              <div class="pagination-numbers">
                ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => html`
                  <a
                    href="${page === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${page}`}"
                    class="pagination-number ${page === pagination.currentPage ? 'active' : ''}"
                  >
                    ${page}
                  </a>
                `)}
              </div>

              ${pagination.hasNext ? html`
                <a
                  href="/${blogUrl}/page/${pagination.nextPage}"
                  class="pagination-btn pagination-next"
                >
                  Siguiente →
                </a>
              ` : ''}
            </nav>
          ` : ''}
        ` : html`
          <!-- Empty State -->
          <div class="magazine-empty-state">
            <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
            <h2 class="empty-title">No hay artículos publicados</h2>
            <p class="empty-message">Vuelve pronto para descubrir nuevas historias.</p>
          </div>
        `}
      </div>
    </main>

    <!-- Footer -->
    ${Footer({ site, custom, blogUrl })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "blog magazine-theme",
    children: content,
  });
};

export default BlogTemplate;
