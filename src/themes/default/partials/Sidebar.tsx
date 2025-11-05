import { html } from "hono/html";
import type { PostData } from "../helpers/index.ts";

/**
 * Sidebar - Sidebar con widgets
 * Incluye búsqueda, posts recientes, categorías, tags
 */

interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface SidebarProps {
  recentPosts?: PostData[];
  categories?: Category[];
  tags?: Tag[];
  showSearch?: boolean;
  showRecentPosts?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
}

export const Sidebar = (props: SidebarProps) => {
  const {
    recentPosts = [],
    categories = [],
    tags = [],
    showSearch = true,
    showRecentPosts = true,
    showCategories = true,
    showTags = true,
  } = props;

  return html`
    <aside class="sidebar">
      <!-- Widget: Búsqueda -->
      ${showSearch ? html`
        <div class="widget widget-search">
          <h3 class="widget-title">Buscar</h3>
          <form action="/search" method="GET" role="search" class="search-form">
            <div class="search-field">
              <input
                type="search"
                name="q"
                placeholder="Buscar artículos..."
                aria-label="Buscar"
                class="search-input"
                required
              />
              <button type="submit" class="search-submit" aria-label="Buscar">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Widget: Posts Recientes -->
      ${showRecentPosts && recentPosts.length > 0 ? html`
        <div class="widget widget-recent-posts">
          <h3 class="widget-title">Posts Recientes</h3>
          <ul class="recent-posts-list">
            ${recentPosts.map((post) => html`
              <li class="recent-post-item">
                ${post.featureImage ? html`
                  <a href="/blog/${post.slug}" class="recent-post-thumb">
                    <img src="${post.featureImage}" alt="${post.title}" loading="lazy" />
                  </a>
                ` : ''}
                <div class="recent-post-content">
                  <a href="/blog/${post.slug}" class="recent-post-title">
                    ${post.title}
                  </a>
                  <span class="recent-post-date">
                    ${new Date(post.createdAt).toLocaleDateString("es", {
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </div>
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      <!-- Widget: Categorías -->
      ${showCategories && categories.length > 0 ? html`
        <div class="widget widget-categories">
          <h3 class="widget-title">Categorías</h3>
          <ul class="categories-list">
            ${categories.map((cat) => html`
              <li class="category-item">
                <a href="/category/${cat.slug}" class="category-link">
                  <span class="category-name">${cat.name}</span>
                  ${cat.count ? html`
                    <span class="category-count">${cat.count}</span>
                  ` : ''}
                </a>
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      <!-- Widget: Tags -->
      ${showTags && tags.length > 0 ? html`
        <div class="widget widget-tags">
          <h3 class="widget-title">Tags Populares</h3>
          <div class="tags-cloud">
            ${tags.map((tag) => html`
              <a href="/tag/${tag.slug}" class="tag-link">
                ${tag.name}
                ${tag.count ? html`<span class="tag-count">${tag.count}</span>` : ''}
              </a>
            `)}
          </div>
        </div>
      ` : ''}

      <!-- Widget: Newsletter (opcional) -->
      <div class="widget widget-newsletter">
        <h3 class="widget-title">Newsletter</h3>
        <p class="widget-description">
          Suscríbete para recibir las últimas actualizaciones en tu email.
        </p>
        <form action="/subscribe" method="POST" class="newsletter-form">
          <input
            type="email"
            name="email"
            placeholder="Tu email"
            required
            class="newsletter-input"
          />
          <button type="submit" class="newsletter-submit btn btn-primary">
            Suscribirse
          </button>
        </form>
      </div>
    </aside>
  `;
};

export default Sidebar;
