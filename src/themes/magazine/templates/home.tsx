import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../../default/partials/Header.tsx";
import { Footer } from "../../default/partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Magazine Home Template - Homepage estilo revista
 * Layout tipo periódico con featured post grande y grid de artículos
 */

interface HomeProps {
  site: SiteData;
  custom: Record<string, any>;
  featuredPosts: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
}

export const HomeTemplate = (props: HomeProps) => {
  const { site, custom, featuredPosts, categories = [] } = props;

  // El primer post es el hero principal
  const mainPost = featuredPosts[0];
  const secondaryPosts = featuredPosts.slice(1, 4); // Siguientes 3 posts
  const otherPosts = featuredPosts.slice(4); // Resto de posts

  const content = html`
    <!-- Header -->
    ${Header({ site, custom })}

    <!-- Main Content -->
    <main class="site-main magazine-home">
      <div class="container">
        <!-- Featured Section: Estilo periódico -->
        ${mainPost ? html`
          <section class="magazine-featured-section">
            <div class="featured-grid">
              <!-- Main Featured Post -->
              <article class="featured-main">
                ${mainPost.featureImage ? html`
                  <a href="/blog/${mainPost.slug}" class="featured-image">
                    <img src="${mainPost.featureImage}" alt="${mainPost.title}" />
                  </a>
                ` : ''}
                <div class="featured-content">
                  <div class="featured-meta">
                    ${mainPost.categories && mainPost.categories.length > 0 ? html`
                      <span class="category-badge primary">${mainPost.categories[0].name}</span>
                    ` : ''}
                  </div>
                  <h1 class="featured-title">
                    <a href="/blog/${mainPost.slug}">${mainPost.title}</a>
                  </h1>
                  ${mainPost.excerpt ? html`
                    <p class="featured-excerpt">${mainPost.excerpt}</p>
                  ` : ''}
                  <div class="featured-author-date">
                    <span class="author">Por ${mainPost.author.name}</span>
                    <span class="separator">•</span>
                    <time datetime="${mainPost.createdAt}">${new Date(mainPost.createdAt).toLocaleDateString('es-ES')}</time>
                  </div>
                </div>
              </article>

              <!-- Secondary Posts -->
              ${secondaryPosts.length > 0 ? html`
                <div class="featured-secondary">
                  ${secondaryPosts.map((post) => html`
                    <article class="secondary-post">
                      ${post.featureImage ? html`
                        <a href="/blog/${post.slug}" class="secondary-image">
                          <img src="${post.featureImage}" alt="${post.title}" />
                        </a>
                      ` : ''}
                      <div class="secondary-content">
                        ${post.categories && post.categories.length > 0 ? html`
                          <span class="category-badge">${post.categories[0].name}</span>
                        ` : ''}
                        <h3 class="secondary-title">
                          <a href="/blog/${post.slug}">${post.title}</a>
                        </h3>
                        <div class="secondary-meta">
                          <time datetime="${post.createdAt}">${new Date(post.createdAt).toLocaleDateString('es-ES')}</time>
                        </div>
                      </div>
                    </article>
                  `)}
                </div>
              ` : ''}
            </div>
          </section>
        ` : ''}

        <!-- Latest Articles Grid -->
        ${otherPosts.length > 0 ? html`
          <section class="magazine-articles-section">
            <div class="section-header">
              <h2 class="section-title">Últimas Noticias</h2>
              <div class="section-divider"></div>
            </div>

            <div class="articles-grid">
              ${otherPosts.map((post) => PostCard({
                post,
                showExcerpt: true,
                showAuthor: true,
                showDate: true,
                showCategories: true,
                showTags: false,
                showImage: true,
              }))}
            </div>

            <div class="section-footer">
              <a href="/blog" class="btn btn-magazine">
                Ver todos los artículos →
              </a>
            </div>
          </section>
        ` : ''}

        <!-- Categories Section: Newspaper style -->
        ${categories.length > 0 ? html`
          <section class="magazine-categories-section">
            <div class="section-header">
              <h2 class="section-title">Secciones</h2>
              <div class="section-divider"></div>
            </div>

            <div class="categories-magazine-grid">
              ${categories.slice(0, 6).map((cat) => html`
                <a href="/category/${cat.slug}" class="category-magazine-card">
                  <span class="category-magazine-name">${cat.name}</span>
                  ${cat.count ? html`
                    <span class="category-magazine-count">${cat.count}</span>
                  ` : ''}
                </a>
              `)}
            </div>
          </section>
        ` : ''}
      </div>
    </main>

    <!-- Footer -->
    ${Footer({ site, custom })}

    <style>
      /* Magazine Home Styles */
      .magazine-home {
        padding: 40px 0;
      }

      /* Featured Section */
      .magazine-featured-section {
        margin-bottom: 60px;
        border-bottom: 3px double var(--border-color);
        padding-bottom: 40px;
      }

      .featured-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 30px;
      }

      .featured-main {
        border-right: 1px solid var(--border-color);
        padding-right: 30px;
      }

      .featured-main .featured-image {
        display: block;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .featured-main .featured-image img {
        width: 100%;
        height: 400px;
        object-fit: cover;
        transition: transform 0.3s;
      }

      .featured-main .featured-image:hover img {
        transform: scale(1.05);
      }

      .category-badge {
        display: inline-block;
        background: var(--secondary-color);
        color: #fff;
        padding: 4px 12px;
        font-family: var(--font-sans);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 15px;
      }

      .category-badge.primary {
        background: var(--primary-color);
      }

      .featured-title {
        font-size: 48px;
        font-weight: 900;
        margin-bottom: 20px;
        line-height: 1.1;
      }

      .featured-title a {
        color: var(--secondary-color);
        text-decoration: none;
      }

      .featured-title a:hover {
        color: var(--primary-color);
      }

      .featured-excerpt {
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 20px;
        color: #555;
      }

      .featured-author-date {
        font-family: var(--font-sans);
        font-size: 14px;
        color: #666;
      }

      .separator {
        margin: 0 8px;
      }

      /* Secondary Posts */
      .featured-secondary {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .secondary-post {
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .secondary-post:last-child {
        border-bottom: none;
      }

      .secondary-image {
        display: block;
        margin-bottom: 12px;
        overflow: hidden;
      }

      .secondary-image img {
        width: 100%;
        height: 150px;
        object-fit: cover;
      }

      .secondary-title {
        font-size: 20px;
        font-weight: 700;
        margin: 10px 0;
      }

      .secondary-title a {
        color: var(--secondary-color);
        text-decoration: none;
      }

      .secondary-title a:hover {
        color: var(--primary-color);
      }

      .secondary-meta {
        font-family: var(--font-sans);
        font-size: 13px;
        color: #999;
      }

      /* Section Headers */
      .section-header {
        margin-bottom: 30px;
      }

      .section-title {
        font-size: 36px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 15px;
      }

      .section-divider {
        width: 80px;
        height: 4px;
        background: var(--primary-color);
      }

      /* Articles Grid */
      .magazine-articles-section {
        margin-bottom: 60px;
      }

      .articles-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
        margin-bottom: 40px;
      }

      .section-footer {
        text-align: center;
        padding-top: 30px;
        border-top: 1px solid var(--border-color);
      }

      .btn-magazine {
        display: inline-block;
        padding: 12px 40px;
        background: var(--secondary-color);
        color: #fff;
        font-family: var(--font-sans);
        font-weight: 600;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: background 0.3s;
      }

      .btn-magazine:hover {
        background: var(--primary-color);
      }

      /* Categories Magazine */
      .categories-magazine-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }

      .category-magazine-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border: 2px solid var(--border-color);
        font-family: var(--font-sans);
        font-weight: 600;
        text-decoration: none;
        color: var(--secondary-color);
        transition: all 0.3s;
      }

      .category-magazine-card:hover {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: #fff;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .featured-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .featured-main {
          border-right: none;
          padding-right: 0;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
        }

        .featured-title {
          font-size: 32px;
        }

        .articles-grid,
        .categories-magazine-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;

  return Layout({
    site,
    custom,
    bodyClass: "home front-page magazine-theme",
    children: content,
  });
};

export default HomeTemplate;
