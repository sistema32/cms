import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData, MenuItem, CategoryData } from "../helpers/index.ts";

/**
 * Index Template - Página principal con lista de posts
 * Inspirado en index.hbs de Ghost y index.php de WordPress
 */

interface IndexProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  posts: PostData[];
  pagination: PaginationData;
  blogUrl?: string;
  menu?: MenuItem[];
  footerMenu?: MenuItem[];
  categories?: CategoryData[];
}

export const IndexTemplate = (props: IndexProps) => {
  const { site, custom, activeTheme, posts, pagination, blogUrl = "/blog", menu = [], footerMenu = [], categories = [] } = props;
  const postsLayout = custom.posts_layout || "Grid";

  const content = html`
    <!-- Header -->
    ${Header({ site, custom, blogUrl, menu })}

    <!-- Main Content -->
    <main class="site-main">
      <div class="container">
        ${posts.length > 0 ? html`
          <div class="posts-grid layout-${postsLayout.toLowerCase()}">
            ${posts.map((post) => html`
              <article class="post-card">
                ${post.featureImage ? html`
                  <a href="/${post.slug}" class="post-card-image-link">
                    <img src="${post.featureImage}" alt="${post.title}" class="post-card-image" />
                  </a>
                ` : ''}

                <div class="post-card-content">
                  ${post.categories.length > 0 ? html`
                    <div class="post-card-categories">
                      ${post.categories.map((cat) => html`
                        <a href="/category/${cat.slug}" class="post-card-category">${cat.name}</a>
                      `)}
                    </div>
                  ` : ''}

                  <h2 class="post-card-title">
                    <a href="/${post.slug}">${post.title}</a>
                  </h2>

                  ${post.excerpt ? html`<p class="post-card-excerpt">${post.excerpt}</p>` : ''}

                  <div class="post-card-meta">
                    <span class="post-card-author">Por ${post.author.name}</span>
                    <span class="post-card-date">${new Date(post.createdAt).toLocaleDateString("es")}</span>
                  </div>

                  ${post.tags.length > 0 ? html`
                    <div class="post-card-tags">
                      ${post.tags.map((tag) => html`
                        <a href="/tag/${tag.slug}" class="post-card-tag">#${tag.name}</a>
                      `)}
                    </div>
                  ` : ''}
                </div>
              </article>
            `)}
          </div>

          ${pagination.totalPages > 1 ? html`
            <nav class="pagination" role="navigation">
              ${pagination.hasPrev ? html`
                <a href="/page/${pagination.prevPage}" class="pagination-prev">← Anterior</a>
              ` : ''}

              <span class="pagination-info">
                Página ${pagination.currentPage} de ${pagination.totalPages}
              </span>

              ${pagination.hasNext ? html`
                <a href="/page/${pagination.nextPage}" class="pagination-next">Siguiente →</a>
              ` : ''}
            </nav>
          ` : ''}
        ` : html`
          <div class="no-posts">
            <h2>No hay posts publicados</h2>
            <p>Vuelve pronto para ver contenido nuevo.</p>
          </div>
        `}
      </div>
    </main>

    ${custom.cta_text ? html`
      <section class="cta-section">
        <div class="container">
          <h2>${custom.cta_text}</h2>
          <a href="#subscribe" class="btn btn-primary">Suscribirse</a>
        </div>
      </section>
    ` : ''}

    <!-- Footer -->
    ${Footer({ site, custom, blogUrl, footerMenu, categories })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "home blog",
    children: content
  });
};

export default IndexTemplate;
