/**
 * Comments System - Sistema de comentarios para LexCMS
 * Proporciona hooks y funciones para integrar comentarios en cualquier theme
 */

import { html } from "hono/html";

// Define HtmlEscapedString type
type HtmlEscapedString = ReturnType<typeof html>;

export interface CommentAuthor {
  id?: number;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
}

export interface CommentData {
  id: number;
  parentId?: number | null;
  author: CommentAuthor;
  body: string;
  bodyCensored: string;
  createdAt: Date | string;
  status: "approved" | "pending" | "spam" | "deleted";
  replies?: CommentData[];
}

export interface CommentsStats {
  total: number;
  approved: number;
  pending: number;
}

export interface CommentBoxOptions {
  className?: string;
  placeholder?: string;
  submitText?: string;
  showWebsiteField?: boolean;
  requireLogin?: boolean;
  maxLength?: number;
  enableRichText?: boolean;
}

export interface CommentsListOptions {
  className?: string;
  showReplies?: boolean;
  maxDepth?: number;
  enablePagination?: boolean;
  perPage?: number;
  currentPage?: number;
  totalPages?: number;
  sortOrder?: "asc" | "desc";
  showAvatar?: boolean;
  showTimestamp?: boolean;
  dateFormat?: "short" | "long" | "relative";
  emptyMessage?: string;
}

/**
 * Renderiza la caja de comentarios (formulario para agregar comentarios)
 */
export function renderCommentBox(
  contentId: number,
  options: CommentBoxOptions = {},
): HtmlEscapedString {
  const {
    className = "comment-box",
    placeholder = "Escribe tu comentario...",
    submitText = "Publicar comentario",
    showWebsiteField = true,
    requireLogin = false,
    maxLength = 2000,
    enableRichText = false,
  } = options;

  if (requireLogin) {
    return html`
      <div class="${className} ${className}--login-required">
        <p class="${className}__message">
          Debes <a href="/login" class="${className}__login-link">iniciar sesión</a> para comentar.
        </p>
      </div>
    `;
  }

  return html`
    <div class="${className}" id="comment-box">
      <h3 class="${className}__title">Deja un comentario</h3>

      <form
        class="${className}__form"
        id="comment-form"
        onsubmit="return submitComment(event)"
        data-content-id="${contentId}"
      >
        <!-- Author Info -->
        <div class="${className}__author-fields">
          <div class="${className}__field">
            <label for="comment-name" class="${className}__label">
              Nombre <span class="${className}__required">*</span>
            </label>
            <input
              type="text"
              id="comment-name"
              name="name"
              class="${className}__input"
              required
              maxlength="100"
              placeholder="Tu nombre"
            />
          </div>

          <div class="${className}__field">
            <label for="comment-email" class="${className}__label">
              Email <span class="${className}__required">*</span>
            </label>
            <input
              type="email"
              id="comment-email"
              name="email"
              class="${className}__input"
              required
              maxlength="100"
              placeholder="tu@email.com"
            />
            <small class="${className}__help">No se publicará tu email</small>
          </div>

          ${showWebsiteField ? html`
            <div class="${className}__field">
              <label for="comment-website" class="${className}__label">
                Sitio web
              </label>
              <input
                type="url"
                id="comment-website"
                name="website"
                class="${className}__input"
                maxlength="200"
                placeholder="https://tusitio.com"
              />
            </div>
          ` : ""}
        </div>

        <!-- Comment Body -->
        <div class="${className}__field ${className}__field--body">
          <label for="comment-body" class="${className}__label">
            Comentario <span class="${className}__required">*</span>
          </label>
          ${enableRichText ? html`
            <div class="${className}__editor" id="comment-editor">
              <textarea
                id="comment-body"
                name="body"
                class="${className}__textarea"
                required
                maxlength="${maxLength}"
                placeholder="${placeholder}"
                rows="5"
              ></textarea>
            </div>
          ` : html`
            <textarea
              id="comment-body"
              name="body"
              class="${className}__textarea"
              required
              maxlength="${maxLength}"
              placeholder="${placeholder}"
              rows="5"
            ></textarea>
          `}
          <small class="${className}__help">
            <span id="comment-chars-count">0</span> / ${maxLength} caracteres
          </small>
        </div>

        <!-- Submit Button -->
        <div class="${className}__actions">
          <button
            type="submit"
            class="${className}__submit"
            id="comment-submit"
          >
            ${submitText}
          </button>
          <div class="${className}__status" id="comment-status"></div>
        </div>
      </form>
    </div>

    <script>
      // Character counter
      const commentBody = document.getElementById('comment-body');
      const charsCount = document.getElementById('comment-chars-count');

      if (commentBody && charsCount) {
        commentBody.addEventListener('input', function() {
          charsCount.textContent = this.value.length;
        });
      }

      // Submit comment
      async function submitComment(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = document.getElementById('comment-submit');
        const statusDiv = document.getElementById('comment-status');
        const contentId = form.dataset.contentId;

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publicando...';
        statusDiv.textContent = '';
        statusDiv.className = '${className}__status';

        try {
          const formData = new FormData(form);
          const parentIdValue = formData.get('parentId');
          const data = {
            contentId: parseInt(contentId),
            authorName: formData.get('name'),
            authorEmail: formData.get('email'),
            authorWebsite: formData.get('website') || null,
            body: formData.get('body'),
            parentId: parentIdValue ? parseInt(parentIdValue) : null,
          };

          const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const result = await response.json();
            statusDiv.className = '${className}__status ${className}__status--success';
            statusDiv.textContent = 'Comentario publicado exitosamente!';
            form.reset();
            charsCount.textContent = '0';

            // Cancel reply if it was a reply
            const replyIndicator = document.getElementById('reply-indicator');
            const parentIdField = document.getElementById('comment-parent-id');
            if (replyIndicator) replyIndicator.remove();
            if (parentIdField) parentIdField.remove();

            // Show success message for 3 seconds
            setTimeout(() => {
              statusDiv.textContent = '';
              statusDiv.className = '${className}__status';
            }, 3000);

            // Reload page to show new comment (simplified for now)
            // TODO: Implement dynamic insertion without reload
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Error al publicar el comentario');
          }
        } catch (error) {
          statusDiv.className = '${className}__status ${className}__status--error';
          statusDiv.textContent = error.message || 'Error al publicar el comentario. Inténtalo de nuevo.';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '${submitText}';
        }

        return false;
      }
    </script>
  `;
}

/**
 * Renderiza la lista de comentarios
 */
export function renderComments(
  comments: CommentData[],
  stats: CommentsStats,
  options: CommentsListOptions = {},
): HtmlEscapedString {
  const {
    className = "comments",
    showReplies = true,
    maxDepth = 3,
    enablePagination = false,
    perPage = 10,
    currentPage = 1,
    totalPages = 1,
    sortOrder = "desc",
    showAvatar = true,
    showTimestamp = true,
    dateFormat = "relative",
    emptyMessage = "Aún no hay comentarios. ¡Sé el primero en comentar!",
  } = options;

  if (!comments || comments.length === 0) {
    return html`
      <div class="${className} ${className}--empty">
        <p class="${className}__empty-message">${emptyMessage}</p>
      </div>
    `;
  }

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  return html`
    <div class="${className}">
      <!-- Comments Header -->
      <div class="${className}__header">
        <h3 class="${className}__title">
          Comentarios (${stats.approved})
        </h3>
        ${stats.pending > 0 ? html`
          <p class="${className}__pending-notice">
            ${stats.pending} comentario${stats.pending > 1 ? "s" : ""} pendiente${stats.pending > 1 ? "s" : ""} de moderación
          </p>
        ` : ""}
      </div>

      <!-- Comments List -->
      <div class="${className}__list">
        ${sortedComments.map((comment) =>
          renderSingleComment(comment, {
            className,
            showReplies,
            maxDepth,
            currentDepth: 0,
            showAvatar,
            showTimestamp,
            dateFormat,
          })
        )}
      </div>

      <!-- Pagination -->
      ${enablePagination && totalPages > 1 ? html`
        <div class="${className}__pagination">
          ${currentPage > 1 ? html`
            <a
              href="?comments_page=${currentPage - 1}#comments"
              class="${className}__pagination-btn ${className}__pagination-btn--prev"
            >
              ← Anterior
            </a>
          ` : html`
            <span class="${className}__pagination-btn ${className}__pagination-btn--prev ${className}__pagination-btn--disabled">
              ← Anterior
            </span>
          `}

          <span class="${className}__pagination-info">
            Página ${currentPage} de ${totalPages}
          </span>

          ${currentPage < totalPages ? html`
            <a
              href="?comments_page=${currentPage + 1}#comments"
              class="${className}__pagination-btn ${className}__pagination-btn--next"
            >
              Siguiente →
            </a>
          ` : html`
            <span class="${className}__pagination-btn ${className}__pagination-btn--next ${className}__pagination-btn--disabled">
              Siguiente →
            </span>
          `}
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * Renderiza un comentario individual (recursivo para replies)
 */
function renderSingleComment(
  comment: CommentData,
  options: {
    className: string;
    showReplies: boolean;
    maxDepth: number;
    currentDepth: number;
    showAvatar: boolean;
    showTimestamp: boolean;
    dateFormat: "short" | "long" | "relative";
  },
): HtmlEscapedString {
  const {
    className,
    showReplies,
    maxDepth,
    currentDepth,
    showAvatar,
    showTimestamp,
    dateFormat,
  } = options;

  const hasReplies = showReplies && comment.replies && comment.replies.length > 0;
  const canShowReplies = currentDepth < maxDepth;

  // Format date
  const formattedDate = formatCommentDate(comment.createdAt, dateFormat);

  // Get avatar (Gravatar or initial)
  const avatarUrl = comment.author.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=random`;

  return html`
    <div
      class="${className}__item ${className}__item--depth-${currentDepth}"
      id="comment-${comment.id}"
      data-comment-id="${comment.id}"
    >
      <div class="${className}__comment">
        ${showAvatar ? html`
          <div class="${className}__avatar">
            <img
              src="${avatarUrl}"
              alt="${comment.author.name}"
              class="${className}__avatar-img"
              loading="lazy"
            />
          </div>
        ` : ""}

        <div class="${className}__content">
          <div class="${className}__meta">
            <div class="${className}__author-info">
              ${comment.author.website ? html`
                <a
                  href="${comment.author.website}"
                  class="${className}__author-name ${className}__author-name--link"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  ${comment.author.name}
                </a>
              ` : html`
                <span class="${className}__author-name">
                  ${comment.author.name}
                </span>
              `}

              ${showTimestamp ? html`
                <time
                  class="${className}__timestamp"
                  datetime="${new Date(comment.createdAt).toISOString()}"
                  title="${new Date(comment.createdAt).toLocaleString('es-ES')}"
                >
                  ${formattedDate}
                </time>
              ` : ""}
            </div>

            ${comment.status === "pending" ? html`
              <span class="${className}__status ${className}__status--pending">
                Pendiente de moderación
              </span>
            ` : ""}
          </div>

          <div class="${className}__body">
            ${comment.bodyCensored}
          </div>

          <div class="${className}__actions">
            <button
              class="${className}__action-btn ${className}__action-btn--reply"
              data-comment-id="${comment.id}"
              data-author-name="${comment.author.name}"
              type="button"
              aria-label="Responder al comentario de ${comment.author.name}"
            >
              💬 Responder
            </button>
          </div>
        </div>
      </div>

      ${hasReplies && canShowReplies ? html`
        <div class="${className}__replies">
          ${comment.replies!.map((reply) =>
            renderSingleComment(reply, {
              ...options,
              currentDepth: currentDepth + 1,
            })
          )}
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * Formatea la fecha del comentario
 */
function formatCommentDate(
  date: Date | string,
  format: "short" | "long" | "relative",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return getRelativeTime(dateObj);
  }

  const options: Intl.DateTimeFormatOptions = format === "long"
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "short", day: "numeric" };

  return new Intl.DateTimeFormat("es-ES", options).format(dateObj);
}

/**
 * Obtiene tiempo relativo
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

  if (years > 0) return rtf.format(-years, "year");
  if (months > 0) return rtf.format(-months, "month");
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

/**
 * Script global para manejar respuestas a comentarios
 * Usa event delegation para evitar vulnerabilidades XSS
 */
export const commentsScript = html`
  <script>
    (function() {
      'use strict';

      // Funciones helper
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function replyToComment(commentId, authorName) {
        const commentBox = document.getElementById('comment-box');
        const commentForm = document.getElementById('comment-form');
        const commentBody = document.getElementById('comment-body');

        if (commentBox && commentForm && commentBody) {
          // Scroll to comment box
          commentBox.scrollIntoView({ behavior: 'smooth' });

          // Add reply indicator
          let replyIndicator = document.getElementById('reply-indicator');
          if (!replyIndicator) {
            replyIndicator = document.createElement('div');
            replyIndicator.id = 'reply-indicator';
            replyIndicator.className = 'comment-box__reply-indicator';
            commentForm.insertBefore(replyIndicator, commentForm.firstChild);
          }

          const escapedAuthorName = escapeHtml(authorName);
          replyIndicator.innerHTML =
            'Respondiendo a <strong>' + escapedAuthorName + '</strong> ' +
            '<button type="button" data-action="cancel-reply" class="comment-box__cancel-reply" aria-label="Cancelar respuesta">✕</button>';

          // Add event listener to cancel button
          const cancelBtn = replyIndicator.querySelector('[data-action="cancel-reply"]');
          if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelReply);
          }

          // Add hidden field with parent ID
          let parentIdField = document.getElementById('comment-parent-id');
          if (!parentIdField) {
            parentIdField = document.createElement('input');
            parentIdField.type = 'hidden';
            parentIdField.id = 'comment-parent-id';
            parentIdField.name = 'parentId';
            commentForm.appendChild(parentIdField);
          }
          parentIdField.value = commentId;

          // Focus on textarea
          commentBody.focus();
        }
      }

      function cancelReply() {
        const replyIndicator = document.getElementById('reply-indicator');
        const parentIdField = document.getElementById('comment-parent-id');

        if (replyIndicator) replyIndicator.remove();
        if (parentIdField) parentIdField.remove();
      }

      // Event delegation for reply buttons
      document.addEventListener('click', function(e) {
        const replyBtn = e.target.closest('[data-comment-id]');
        if (replyBtn && replyBtn.classList.contains('comments__action-btn--reply')) {
          e.preventDefault();
          const commentId = replyBtn.dataset.commentId;
          const authorName = replyBtn.dataset.authorName;
          replyToComment(commentId, authorName);
        }
      });

      // Keyboard accessibility for reply buttons
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const replyBtn = e.target.closest('[data-comment-id]');
          if (replyBtn && replyBtn.classList.contains('comments__action-btn--reply')) {
            e.preventDefault();
            const commentId = replyBtn.dataset.commentId;
            const authorName = replyBtn.dataset.authorName;
            replyToComment(commentId, authorName);
          }
        }
      });
    })();
  </script>
`;
