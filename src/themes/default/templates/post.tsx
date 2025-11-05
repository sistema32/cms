import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Post Template - Template para posts individuales
 * Inspirado en post.hbs de Ghost y single.php de WordPress
 */

interface PostProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  post: PostData;
  relatedPosts?: PostData[];
}

export const PostTemplate = (props: PostProps) => {
  const { site, custom, post, relatedPosts = [] } = props;
  const showSidebar = custom.show_sidebar;
  const showAuthorBio = custom.show_author_bio && showSidebar;
  const showRelatedPosts = custom.show_related_posts;

  const content = html`
    <!-- Header -->
    <header class="site-header minimal">
      <div class="container">
        <a href="/" class="site-logo-link">
          ${custom.logo_image ? html`
            <img src="${custom.logo_image}" alt="${site.name}" class="site-logo" />
          ` : ''}
          <span class="site-title">${site.name}</span>
        </a>
      </div>
    </header>

    <!-- Main Content -->
    <main class="site-main">
      <div class="container ${showSidebar ? 'has-sidebar' : ''}">
        <div class="content-area">
          <article class="post-full">
            ${post.featureImage ? html`
              <figure class="post-full-image">
                <img src="${post.featureImage}" alt="${post.title}" />
              </figure>
            ` : ''}

            <!-- Post Header -->
            <header class="post-full-header">
              ${post.categories.length > 0 ? html`
                <div class="post-categories">
                  ${post.categories.map((cat) => html`
                    <a href="/category/${cat.slug}" class="post-category">${cat.name}</a>
                  `)}
                </div>
              ` : ''}

              <h1 class="post-full-title">${post.title}</h1>

              <div class="post-full-meta">
                <div class="post-meta-author">
                  <span>Por ${post.author.name}</span>
                </div>
                <div class="post-meta-date">
                  <time datetime="${post.createdAt.toISOString()}">
                    ${new Date(post.createdAt).toLocaleDateString("es", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>

              ${post.tags.length > 0 ? html`
                <div class="post-tags">
                  ${post.tags.map((tag) => html`
                    <a href="/tag/${tag.slug}" class="post-tag">#${tag.name}</a>
                  `)}
                </div>
              ` : ''}
            </header>

            <!-- Post Content -->
            <section class="post-full-content">
              ${html([post.body || ""])}
            </section>

            ${showAuthorBio ? html`
              <section class="post-author-bio">
                <h3>Sobre el autor</h3>
                <div class="author-info">
                  <h4>${post.author.name}</h4>
                  <p>Autor en ${site.name}</p>
                </div>
              </section>
            ` : ''}
          </article>

          ${showRelatedPosts && relatedPosts.length > 0 ? html`
            <section class="related-posts">
              <h2>Posts Relacionados</h2>
              <div class="related-posts-grid">
                ${relatedPosts.map((relatedPost) => html`
                  <article class="related-post-card">
                    ${relatedPost.featureImage ? html`
                      <a href="/${relatedPost.slug}" class="related-post-image-link">
                        <img src="${relatedPost.featureImage}" alt="${relatedPost.title}" />
                      </a>
                    ` : ''}
                    <h3>
                      <a href="/${relatedPost.slug}">${relatedPost.title}</a>
                    </h3>
                    ${relatedPost.excerpt ? html`<p>${relatedPost.excerpt}</p>` : ''}
                  </article>
                `)}
              </div>
            </section>
          ` : ''}

          <!-- Comments Section -->
          <section class="post-comments">
            <h2>Comentarios</h2>
            <div id="comments-container">
              <p>Cargando comentarios...</p>
            </div>
          </section>
        </div>

        ${showSidebar ? html`
          <aside class="sidebar">
            <div class="widget widget-search">
              <h3>Buscar</h3>
              <form action="/search" method="get">
                <input type="search" name="q" placeholder="Buscar..." required />
                <button type="submit">Buscar</button>
              </form>
            </div>

            <div class="widget widget-categories">
              <h3>Categorías</h3>
              <ul>
                ${post.categories.map((cat) => html`
                  <li><a href="/category/${cat.slug}">${cat.name}</a></li>
                `)}
              </ul>
            </div>

            ${custom.cta_text ? html`
              <div class="widget widget-cta">
                <h3>${custom.cta_text}</h3>
                <a href="#subscribe" class="btn btn-primary">Suscribirse</a>
              </div>
            ` : ''}
          </aside>
        ` : ''}
      </div>
    </main>

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
    title: post.title,
    description: post.excerpt || "",
    bodyClass: `post post-${post.slug}`,
    children: content
  });
};

export default PostTemplate;
