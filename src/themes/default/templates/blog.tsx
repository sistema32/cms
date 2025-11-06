import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import { Pagination } from "../partials/Pagination.tsx";
import { Sidebar } from "../partials/Sidebar.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Blog Template - Página de listado de posts con paginación
 * Inspirado en index.php de WordPress y index.hbs de Ghost
 *
 * Esta es la página del blog (separada de la homepage)
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
  blogBase?: string;
}

export const BlogTemplate = (props: BlogProps) => {
  const { site, custom, posts, pagination, recentPosts = [], categories = [], tags = [], blogBase = "blog" } = props;

  // Settings del blog
  const blogTitle = custom.blog_title || "Blog";
  const blogDescription = custom.blog_description || "Todos nuestros artículos";
  const blogLayout = custom.blog_layout || custom.posts_layout || "grid"; // grid, list, masonry
  const sidebarEnabled = custom.blog_sidebar_enabled !== false;
  const showBreadcrumbs = custom.blog_show_breadcrumbs !== false;

  const content = html`
    <!-- Header -->
    ${Header({ site, custom, blogUrl })}

    <!-- Main Content -->
    <main class="site-main blog-page">
      <div class="container">
        ${showBreadcrumbs ? html`
          <!-- Breadcrumbs -->
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <ol class="breadcrumb-list">
              <li class="breadcrumb-item">
                <a href="/">Inicio</a>
                <svg class="breadcrumb-separator" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </li>
              <li class="breadcrumb-item" aria-current="page">
                Blog
              </li>
            </ol>
          </nav>
        ` : ''}

        <!-- Page Header -->
        <header class="page-header">
          <h1 class="page-title">${blogTitle}</h1>
          ${blogDescription ? html`
            <p class="page-description">${blogDescription}</p>
          ` : ''}
        </header>

        <!-- Blog Content -->
        <div class="blog-layout ${sidebarEnabled ? 'has-sidebar' : 'no-sidebar'}">
          <!-- Posts Grid/List -->
          <div class="blog-content">
            ${posts.length > 0 ? html`
              <div class="posts-grid layout-${blogLayout}">
                ${posts.map((post) => PostCard({
                  post,
                  showExcerpt: true,
                  showAuthor: true,
                  showDate: true,
                  showCategories: true,
                  showTags: true,
                  showImage: true,
                }))}
              </div>

              <!-- Paginación -->
              ${pagination.totalPages > 1 ? Pagination({
                pagination,
                baseUrl: `/${blogBase}/page`,
              }) : ''}
            ` : html`
              <!-- No hay posts -->
              <div class="no-posts">
                <svg class="no-posts-icon" width="64" height="64" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                  <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                </svg>
                <h2 class="no-posts-title">No hay posts publicados</h2>
                <p class="no-posts-message">
                  Vuelve pronto para descubrir contenido nuevo.
                </p>
                <a href="/" class="btn btn-primary">Volver al inicio</a>
              </div>
            `}
          </div>

          <!-- Sidebar -->
          ${sidebarEnabled ? Sidebar({
            recentPosts: recentPosts.slice(0, 5),
            categories,
            tags: tags.slice(0, 20),
            showSearch: true,
            showRecentPosts: true,
            showCategories: true,
            showTags: true,
          }) : ''}
        </div>
      </div>
    </main>

    <!-- Footer -->
    ${Footer({ site, custom, blogUrl })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: `blog archive ${blogLayout}-layout ${sidebarEnabled ? 'has-sidebar' : 'no-sidebar'}`,
    children: content,
  });
};

export default BlogTemplate;
