import { html } from "hono/html";
import type { PostData } from "../helpers/index.ts";

/**
 * PostCard - Componente reutilizable para mostrar un post
 * Similar a post-card.hbs de Ghost
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
    showTags = true,
    showImage = true,
  } = props;

  return html`
    <article class="post-card">
      ${showImage && post.featureImage ? html`
        <a href="/blog/${post.slug}" class="post-card-image-link">
          <img
            src="${post.featureImage}"
            alt="${post.title}"
            class="post-card-image"
            loading="lazy"
          />
        </a>
      ` : ''}

      <div class="post-card-content">
        ${showCategories && post.categories.length > 0 ? html`
          <div class="post-card-categories">
            ${post.categories.map((cat) => html`
              <a href="/category/${cat.slug}" class="post-card-category">
                ${cat.name}
              </a>
            `)}
          </div>
        ` : ''}

        <h2 class="post-card-title">
          <a href="/blog/${post.slug}">${post.title}</a>
        </h2>

        ${showExcerpt && post.excerpt ? html`
          <p class="post-card-excerpt">${post.excerpt}</p>
        ` : ''}

        <div class="post-card-meta">
          ${showAuthor ? html`
            <span class="post-card-author">
              <svg class="icon icon-user" width="16" height="16" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              ${post.author.name}
            </span>
          ` : ''}

          ${showDate ? html`
            <span class="post-card-date">
              <svg class="icon icon-calendar" width="16" height="16" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
              </svg>
              ${new Date(post.createdAt).toLocaleDateString("es", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
          ` : ''}
        </div>

        ${showTags && post.tags.length > 0 ? html`
          <div class="post-card-tags">
            ${post.tags.map((tag) => html`
              <a href="/tag/${tag.slug}" class="post-card-tag">
                #${tag.name}
              </a>
            `)}
          </div>
        ` : ''}
      </div>
    </article>
  `;
};

export default PostCard;
