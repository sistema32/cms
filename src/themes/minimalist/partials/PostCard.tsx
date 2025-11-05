import { html } from "hono/html";
import type { PostData } from "../helpers/index.ts";

/**
 * Minimalist PostCard - Card minimalista y limpio
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
    showImage = true,
  } = props;

  return html`
    <article class="minimalist-post-card">
      ${showImage && post.featureImage ? html`
        <a href="/blog/${post.slug}" class="minimalist-card-image">
          <img src="${post.featureImage}" alt="${post.title}" loading="lazy" />
        </a>
      ` : ''}

      <div class="minimalist-card-content">
        ${(showDate || showAuthor) ? html`
          <div class="minimalist-card-meta">
            ${showDate ? html`
              <time class="minimalist-card-date" datetime="${post.createdAt}">
                ${new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            ` : ''}
            ${showDate && showAuthor ? html`<span class="meta-dot">·</span>` : ''}
            ${showAuthor ? html`
              <span class="minimalist-card-author">${post.author.name}</span>
            ` : ''}
          </div>
        ` : ''}

        <h2 class="minimalist-card-title">
          <a href="/blog/${post.slug}">${post.title}</a>
        </h2>

        ${showExcerpt && post.excerpt ? html`
          <p class="minimalist-card-excerpt">${post.excerpt}</p>
        ` : ''}

        <a href="/blog/${post.slug}" class="minimalist-card-link">Leer más →</a>
      </div>
    </article>

    <style>
      .minimalist-post-card {
        display: flex;
        gap: 40px;
        align-items: flex-start;
      }

      .minimalist-card-image {
        flex-shrink: 0;
        width: 280px;
        height: 180px;
        display: block;
        overflow: hidden;
        background: var(--bg-light, #fafafa);
      }

      .minimalist-card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.3s;
      }

      .minimalist-post-card:hover .minimalist-card-image img {
        opacity: 0.85;
      }

      .minimalist-card-content {
        flex: 1;
        padding-top: 4px;
      }

      .minimalist-card-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-light, #666);
        margin-bottom: 12px;
        font-weight: 400;
      }

      .meta-dot {
        opacity: 0.5;
      }

      .minimalist-card-title {
        font-size: 28px;
        font-weight: 400;
        line-height: 1.3;
        margin: 0 0 16px 0;
        letter-spacing: -0.02em;
      }

      .minimalist-card-title a {
        color: var(--text-color, #1a1a1a);
        text-decoration: none;
        transition: opacity 0.3s;
      }

      .minimalist-card-title a:hover {
        opacity: 0.6;
      }

      .minimalist-card-excerpt {
        font-size: 16px;
        line-height: 1.7;
        color: var(--text-light, #666);
        margin: 0 0 20px 0;
        font-weight: 300;
      }

      .minimalist-card-link {
        display: inline-block;
        color: var(--text-color, #1a1a1a);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.5px;
        transition: opacity 0.3s;
      }

      .minimalist-card-link:hover {
        opacity: 0.6;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .minimalist-post-card {
          flex-direction: column;
          gap: 20px;
        }

        .minimalist-card-image {
          width: 100%;
          height: 220px;
        }

        .minimalist-card-title {
          font-size: 24px;
        }

        .minimalist-card-excerpt {
          font-size: 15px;
        }
      }
    </style>
  `;
};

export default PostCard;
