import { html } from "hono/html";
import type { PostData } from "../helpers/index.ts";

/**
 * Magazine PostCard - Card de artículo estilo revista
 */

interface PostCardProps {
  post: PostData;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showImage?: boolean;
}

export const PostCard = (props: PostCardProps) => {
  const {
    post,
    showExcerpt = true,
    showAuthor = true,
    showDate = true,
    showCategories = true,
    showImage = true,
  } = props;

  return html`
    <article class="magazine-post-card">
      ${showImage && post.featureImage ? html`
        <a href="/blog/${post.slug}" class="magazine-card-image">
          <img src="${post.featureImage}" alt="${post.title}" loading="lazy" />
          ${showCategories && post.categories && post.categories.length > 0 ? html`
            <span class="magazine-card-category">${post.categories[0].name}</span>
          ` : ''}
        </a>
      ` : ''}

      <div class="magazine-card-content">
        <h3 class="magazine-card-title">
          <a href="/blog/${post.slug}">${post.title}</a>
        </h3>

        ${showExcerpt && post.excerpt ? html`
          <p class="magazine-card-excerpt">${post.excerpt}</p>
        ` : ''}

        ${(showAuthor || showDate) ? html`
          <div class="magazine-card-meta">
            ${showAuthor ? html`
              <span class="magazine-card-author">Por ${post.author.name}</span>
            ` : ''}
            ${showAuthor && showDate ? html`<span class="meta-separator">•</span>` : ''}
            ${showDate ? html`
              <time class="magazine-card-date" datetime="${post.createdAt}">
                ${new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </article>

    <style>
      .magazine-post-card {
        background: #fff;
        border: 1px solid var(--border-color, #e0e0e0);
        transition: transform 0.3s, box-shadow 0.3s;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .magazine-post-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      }

      .magazine-card-image {
        position: relative;
        display: block;
        overflow: hidden;
        background: #f5f5f5;
      }

      .magazine-card-image img {
        width: 100%;
        height: 240px;
        object-fit: cover;
        transition: transform 0.3s;
      }

      .magazine-post-card:hover .magazine-card-image img {
        transform: scale(1.08);
      }

      .magazine-card-category {
        position: absolute;
        top: 15px;
        left: 15px;
        background: var(--primary-color, #c41e3a);
        color: #fff;
        padding: 6px 14px;
        font-family: var(--font-sans, system-ui, sans-serif);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        z-index: 1;
      }

      .magazine-card-content {
        padding: 25px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .magazine-card-title {
        font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
        font-size: 22px;
        font-weight: 700;
        line-height: 1.3;
        margin: 0 0 15px 0;
      }

      .magazine-card-title a {
        color: var(--secondary-color, #1a1a1a);
        text-decoration: none;
        transition: color 0.3s;
      }

      .magazine-card-title a:hover {
        color: var(--primary-color, #c41e3a);
      }

      .magazine-card-excerpt {
        font-size: 15px;
        line-height: 1.6;
        color: #555;
        margin: 0 0 15px 0;
        flex: 1;
      }

      .magazine-card-meta {
        font-family: var(--font-sans, system-ui, sans-serif);
        font-size: 13px;
        color: #999;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        border-top: 1px solid var(--border-color, #e0e0e0);
        padding-top: 15px;
        margin-top: auto;
      }

      .magazine-card-author {
        font-weight: 600;
        color: #666;
      }

      .meta-separator {
        margin: 0 8px;
      }

      .magazine-card-date {
        color: #999;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .magazine-card-title {
          font-size: 20px;
        }

        .magazine-card-content {
          padding: 20px;
        }
      }
    </style>
  `;
};

export default PostCard;
