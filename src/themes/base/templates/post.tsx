import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";
import {
  renderCommentBox,
  renderComments,
  commentsScript,
  type CommentData,
  type CommentsStats,
} from "../../../lib/comments/index.ts";

/**
 * Base Post Template - Single post view with comments
 */

interface PostAuthor {
  id: number;
  name: string | null;
  email: string;
  avatar?: string | null;
}

interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  featureImage?: string | null;
  status: string;
  author?: PostAuthor;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
}

interface PostProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  post: PostData;
  comments?: CommentData[];
  commentsStats?: CommentsStats;
}

export const PostTemplate = (props: PostProps) => {
  const {
    site,
    custom,
    activeTheme,
    post,
    comments = [],
    commentsStats = { total: 0, approved: 0, pending: 0 },
  } = props;

  const publishDate = post.publishedAt || post.createdAt;
  const formattedDate = new Date(publishDate).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = html`
    ${Header({ site, custom })}

    <main class="site-main">
      <article class="post-single">
        <div class="mx-auto max-w-4xl px-4 py-8">
          <!-- Post Header -->
          <header class="post-header mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              ${post.title}
            </h1>

            <div class="post-meta flex items-center gap-4 text-gray-600 text-sm">
              ${post.author ? html`
                <div class="post-author flex items-center gap-2">
                  ${post.author.avatar ? html`
                    <img
                      src="${post.author.avatar}"
                      alt="${post.author.name}"
                      class="w-8 h-8 rounded-full"
                    />
                  ` : ""}
                  <span>${post.author.name || "Anónimo"}</span>
                </div>
              ` : ""}

              <time class="post-date" datetime="${new Date(publishDate).toISOString()}">
                ${formattedDate}
              </time>

              ${commentsStats.approved > 0 ? html`
                <a
                  href="#comments"
                  class="post-comments-link hover:text-gray-900"
                >
                  💬 ${commentsStats.approved} comentario${commentsStats.approved !== 1 ? "s" : ""}
                </a>
              ` : ""}
            </div>
          </header>

          <!-- Featured Image -->
          ${post.featureImage ? html`
            <figure class="post-featured-image mb-8">
              <img
                src="${post.featureImage}"
                alt="${post.title}"
                class="w-full h-auto rounded-lg"
              />
            </figure>
          ` : ""}

          <!-- Post Content -->
          <div class="post-content prose prose-lg max-w-none mb-12">
            ${html([post.body] as any)}
          </div>

          <!-- Post Footer -->
          <footer class="post-footer border-t border-gray-200 pt-6 mt-12">
            <div class="flex items-center justify-between">
              <div class="post-tags">
                <!-- Tags could go here -->
              </div>

              <div class="post-share">
                <span class="text-sm text-gray-600">Compartir:</span>
                <div class="flex gap-2 mt-2">
                  <a
                    href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(site.url + "/" + post.slug)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Compartir en Twitter"
                  >
                    𝕏
                  </a>
                  <a
                    href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(site.url + "/" + post.slug)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Compartir en Facebook"
                  >
                    f
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </article>

      <!-- Comments Section -->
      <section class="post-comments-section bg-gray-50 py-12" id="comments">
        <div class="mx-auto max-w-4xl px-4">
          <!-- Comments List -->
          ${comments.length > 0 || commentsStats.total > 0 ? html`
            ${renderComments(comments, commentsStats, {
              className: "comments",
              showReplies: true,
              maxDepth: 3,
              enablePagination: false,
              showAvatar: true,
              showTimestamp: true,
              dateFormat: "relative",
              sortOrder: "desc",
            })}
          ` : ""}

          <!-- Comment Form -->
          ${renderCommentBox(post.id, {
            className: "comment-box",
            placeholder: "Comparte tu opinión sobre este artículo...",
            submitText: "Publicar comentario",
            showWebsiteField: true,
            requireLogin: false,
            maxLength: 2000,
          })}
        </div>
      </section>
    </main>

    ${Footer({ site, custom })}

    <!-- Comments Script -->
    ${commentsScript}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    title: post.title,
    description: post.excerpt || undefined,
    bodyClass: "post-template",
    children: content,
  });
};

export default PostTemplate;
