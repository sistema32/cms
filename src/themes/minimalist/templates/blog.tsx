import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../../default/partials/Header.tsx";
import { Footer } from "../../default/partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Minimalist Blog Template - Blog listing minimalista
 * Diseño limpio y centrado en el contenido
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

  const blogTitle = custom.blog_title || "Artículos";
  const blogDescription = custom.blog_description || "Pensamientos, ideas y reflexiones";

  const content = html`
    <!-- Header -->
    ${Header({ site, custom, blogUrl })}

    <!-- Main Content -->
    <main class="site-main minimalist-blog">
      <!-- Page Header -->
      <section class="minimalist-page-header">
        <div class="container">
          <h1 class="page-title">${blogTitle}</h1>
          ${blogDescription ? html`
            <p class="page-description">${blogDescription}</p>
          ` : ''}
        </div>
      </section>

      ${posts.length > 0 ? html`
        <!-- Posts List -->
        <section class="minimalist-posts-section">
          <div class="container">
            <div class="posts-list">
              ${posts.map((post) => PostCard({
                post,
                showExcerpt: true,
                showAuthor: true,
                showDate: true,
                showCategories: false,
                showTags: false,
                showImage: true,
              }))}
            </div>

            <!-- Pagination -->
            ${pagination.totalPages > 1 ? html`
              <nav class="minimalist-pagination">
                ${pagination.hasPrev ? html`
                  <a
                    href="${pagination.prevPage === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${pagination.prevPage}`}"
                    class="pagination-link pagination-prev"
                  >
                    ← Anterior
                  </a>
                ` : html`
                  <span class="pagination-link pagination-disabled"></span>
                `}

                <span class="pagination-info">
                  Página ${pagination.currentPage} de ${pagination.totalPages}
                </span>

                ${pagination.hasNext ? html`
                  <a
                    href="/${blogUrl}/page/${pagination.nextPage}"
                    class="pagination-link pagination-next"
                  >
                    Siguiente →
                  </a>
                ` : html`
                  <span class="pagination-link pagination-disabled"></span>
                `}
              </nav>
            ` : ''}
          </div>
        </section>
      ` : html`
        <!-- Empty State -->
        <section class="minimalist-empty-state">
          <div class="container">
            <div class="empty-content">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="currentColor"/>
              </svg>
              <h2 class="empty-title">Aún no hay publicaciones</h2>
              <p class="empty-message">Pero estamos trabajando en ello.</p>
            </div>
          </div>
        </section>
      `}
    </main>

    <!-- Footer -->
    ${Footer({ site, custom, blogUrl })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "blog minimalist-theme",
    children: content,
  });
};

export default BlogTemplate;
