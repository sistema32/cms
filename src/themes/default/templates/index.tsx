import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Index Template - Página principal con lista de posts
 * Inspirado en index.hbs de Ghost y index.php de WordPress
 */

interface IndexProps {
  site: SiteData;
  custom: Record<string, any>;
  posts: PostData[];
  pagination: PaginationData;
}

export const IndexTemplate = (props: IndexProps) => {
  const { site, custom, posts, pagination } = props;
  const postsLayout = custom.posts_layout || "Grid";

  const postsHtml = posts.map((post) => html`
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
  `).join('');

  const content = html`
    <!-- Header -->
    <header class="site-header">
      <div class="container">
        ${custom.logo_image ? html`<img src="${custom.logo_image}" alt="${site.name}" class="site-logo" />` : ''}
        <h1 class="site-title">${site.name}</h1>
        ${site.description ? html`<p class="site-description">${site.description}</p>` : ''}
      </div>
    </header>

    <!-- Main Content -->
    <main class="site-main">
      <div class="container">
        ${posts.length > 0 ? html`
          <div class="posts-grid layout-${postsLayout.toLowerCase()}">
            ${postsHtml}
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
    <footer class="site-footer">
      <div class="container">
        <p>© ${new Date().getFullYear()} ${site.name}. Todos los derechos reservados.</p>
        <p>Powered by <a href="https://lexcms.com">LexCMS</a></p>
      </div>
    </footer>
  `;

  return Layout({
    site,
    custom,
    bodyClass: "home blog",
    children: content
  });
};

export default IndexTemplate;
