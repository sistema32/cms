import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";

interface PostFormNexusProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  post?: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    status: string;
    featuredImageId?: number | null;
    visibility?: string | null;
    password?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    commentsEnabled?: boolean;
  };
  categories: Array<{ id: number; name: string; slug?: string; parentId?: number | null }>;
  tags: Array<{ id: number; name: string; slug?: string }>;
  selectedCategories?: number[];
  selectedTags?: number[];
  featuredImage?: { id: number; url: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  errors?: Record<string, string>;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

export const PostFormNexusPage = (props: PostFormNexusProps) => {
  const {
    user,
    post,
    categories,
    tags,
    selectedCategories = [],
    selectedTags = [],
    featuredImage,
    seo = {},
    errors = {},
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const isEdit = !!post;
  const pageTitle = isEdit ? "Editar Entrada" : "Nueva Entrada";
  const formAction = isEdit
    ? `/admincp/posts/edit/${post!.id}`
    : "/admincp/posts/new";

  const content_html = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0;
      }

      /* ========== FORM LAYOUT ========== */
      .post-form-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      @media (max-width: 1280px) {
        .post-form-layout {
          grid-template-columns: 1fr;
        }
      }

      /* ========== FORM FIELDS ========== */
      .form-field {
        margin-bottom: 1.5rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .form-input,
      .form-textarea,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-textarea {
        min-height: 400px;
        font-family: inherit;
        resize: vertical;
      }

      .form-input:focus,
      .form-textarea:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .form-error {
        color: var(--nexus-error, #f31260);
        font-size: 0.8125rem;
        margin-top: 0.5rem;
      }

      .form-hint {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-top: 0.5rem;
      }

      /* ========== CHECKBOX LISTS ========== */
      .checkbox-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 0.75rem;
      }

      .checkbox-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        transition: background 0.2s;
      }

      .checkbox-item:hover {
        background: var(--nexus-base-200, #eef0f2);
      }

      .checkbox-item input[type="checkbox"] {
        width: 18px;
        height: 18px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.2s;
      }

      .checkbox-item input[type="checkbox"]:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .checkbox-item label {
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
      }

      /* ========== TOGGLE SWITCH ========== */
      .toggle-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
      }

      .toggle-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content, #1e2328);
      }

      .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
      }

      .toggle-switch input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--nexus-base-300, #dcdee0);
        border-radius: 24px;
        transition: 0.3s;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        border-radius: 50%;
        transition: 0.3s;
      }

      .toggle-switch input:checked + .toggle-slider {
        background-color: var(--nexus-primary, #167bff);
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }

      /* ========== FEATURED IMAGE ========== */
      .featured-image-preview {
        width: 100%;
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1rem;
      }

      /* ========== STATUS RADIO BUTTONS ========== */
      .status-radio-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
      }

      .status-radio-option {
        position: relative;
      }

      .status-radio-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .status-radio-option label {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .status-radio-option input[type="radio"]:checked + label {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.08);
        color: var(--nexus-primary, #167bff);
      }

      /* ========== FORM ACTIONS ========== */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .status-radio-group {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <h1 class="page-title-nexus">${pageTitle}</h1>
      <p class="page-subtitle-nexus">
        ${isEdit ? "Actualiza tu entrada de blog" : "Crea una nueva entrada para tu blog"}
      </p>
    </div>

    <!-- Form Layout -->
    <form method="POST" action="${formAction}" enctype="multipart/form-data">
      <div class="post-form-layout">
        <!-- Main Content -->
        <div>
          ${NexusCard({
            children: html`
              <!-- Title -->
              <div class="form-field">
                <label class="form-label">Título de la Entrada *</label>
                <input
                  type="text"
                  name="title"
                  value="${post?.title || ""}"
                  placeholder="Título de la entrada"
                  class="form-input"
                  required
                />
                ${errors.title ? html`<p class="form-error">${errors.title}</p>` : ""}
              </div>

              <!-- Slug -->
              <div class="form-field">
                <label class="form-label">URL (Slug)</label>
                <input
                  type="text"
                  name="slug"
                  value="${post?.slug || ""}"
                  placeholder="url-amigable"
                  class="form-input"
                />
                <p class="form-hint">Se generará automáticamente desde el título</p>
                ${errors.slug ? html`<p class="form-error">${errors.slug}</p>` : ""}
              </div>

              <!-- Excerpt -->
              <div class="form-field">
                <label class="form-label">Extracto</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  placeholder="Resumen breve de la entrada"
                  class="form-input"
                  style="min-height: 100px;"
                >${post?.excerpt || ""}</textarea>
                <p class="form-hint">Opcional. Se muestra en listados y compartidos sociales</p>
              </div>

              <!-- Body -->
              <div class="form-field">
                <label class="form-label">Contenido de la Entrada *</label>
                <textarea
                  name="body"
                  placeholder="Escribe la entrada aquí..."
                  class="form-textarea"
                  required
                >${post?.body || ""}</textarea>
                ${errors.body ? html`<p class="form-error">${errors.body}</p>` : ""}
              </div>
            `
          })}

          <!-- SEO Settings -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Configuración SEO</h3>`,
            children: html`
              <div class="form-field">
                <label class="form-label">Meta Título</label>
                <input
                  type="text"
                  name="seoMetaTitle"
                  value="${seo.metaTitle || ""}"
                  placeholder="Título para motores de búsqueda"
                  class="form-input"
                  maxlength="60"
                />
                <p class="form-hint">Recomendado: 50-60 caracteres</p>
              </div>

              <div class="form-field">
                <label class="form-label">Meta Descripción</label>
                <textarea
                  name="seoMetaDescription"
                  rows="3"
                  placeholder="Descripción para motores de búsqueda"
                  class="form-input"
                  style="min-height: 80px;"
                  maxlength="160"
                >${seo.metaDescription || ""}</textarea>
                <p class="form-hint">Recomendado: 150-160 caracteres</p>
              </div>

              <div class="form-field" style="margin-bottom: 0;">
                <label class="form-label">Palabras Clave</label>
                <input
                  type="text"
                  name="seoMetaKeywords"
                  value="${seo.metaKeywords || ""}"
                  placeholder="palabra1, palabra2, palabra3"
                  class="form-input"
                />
                <p class="form-hint">Separadas por comas</p>
              </div>
            `
          })}
        </div>

        <!-- Sidebar -->
        <div>
          <!-- Publish Settings -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Publicación</h3>`,
            children: html`
              <!-- Status -->
              <div class="form-field">
                <label class="form-label">Estado</label>
                <div class="status-radio-group">
                  <div class="status-radio-option">
                    <input
                      type="radio"
                      id="status-draft"
                      name="status"
                      value="draft"
                      ${!post || post.status === "draft" ? "checked" : ""}
                    />
                    <label for="status-draft">Borrador</label>
                  </div>
                  <div class="status-radio-option">
                    <input
                      type="radio"
                      id="status-published"
                      name="status"
                      value="published"
                      ${post?.status === "published" ? "checked" : ""}
                    />
                    <label for="status-published">Publicado</label>
                  </div>
                  <div class="status-radio-option">
                    <input
                      type="radio"
                      id="status-scheduled"
                      name="status"
                      value="scheduled"
                      ${post?.status === "scheduled" ? "checked" : ""}
                    />
                    <label for="status-scheduled">Programado</label>
                  </div>
                </div>
              </div>

              <!-- Scheduled Date -->
              <div class="form-field" id="scheduledAtField" style="display: ${post?.status === 'scheduled' ? 'block' : 'none'};">
                <label class="form-label">Fecha de Publicación</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value="${post?.scheduledAt || ""}"
                  class="form-input"
                />
              </div>

              <!-- Visibility -->
              <div class="form-field">
                <label class="form-label">Visibilidad</label>
                <select name="visibility" class="form-select">
                  <option value="public" ${!post || post.visibility === "public" ? "selected" : ""}>Público</option>
                  <option value="private" ${post?.visibility === "private" ? "selected" : ""}>Privado</option>
                  <option value="password" ${post?.visibility === "password" ? "selected" : ""}>Protegido por contraseña</option>
                </select>
              </div>

              <!-- Password (shown when visibility is password) -->
              <div class="form-field" id="passwordField" style="display: ${post?.visibility === 'password' ? 'block' : 'none'};">
                <label class="form-label">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value="${post?.password || ""}"
                  placeholder="Contraseña de acceso"
                  class="form-input"
                />
              </div>

              <!-- Comments Enabled -->
              <div class="form-field" style="margin-bottom: 0;">
                <div class="toggle-wrapper">
                  <span class="toggle-label">Permitir comentarios</span>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      name="commentsEnabled"
                      value="true"
                      ${!post || post.commentsEnabled ? "checked" : ""}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            `
          })}

          <!-- Featured Image -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Imagen Destacada</h3>`,
            children: html`
              ${featuredImage ? html`
                <img
                  src="${featuredImage.url}"
                  alt="Imagen destacada"
                  class="featured-image-preview"
                />
                <input type="hidden" name="featuredImageId" value="${featuredImage.id}" />
              ` : ""}
              ${NexusButton({
                label: "Seleccionar Imagen",
                type: "outline",
                onclick: "alert('Media picker functionality would be here')",
                fullWidth: true
              })}
            `
          })}

          <!-- Categories -->
          ${categories.length > 0 ? NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Categorías</h3>`,
            children: html`
              <div class="checkbox-list">
                ${categories.map(cat => html`
                  <div class="checkbox-item">
                    <input
                      type="checkbox"
                      id="category-${cat.id}"
                      name="categories[]"
                      value="${cat.id}"
                      ${selectedCategories.includes(cat.id) ? "checked" : ""}
                    />
                    <label for="category-${cat.id}">${cat.name}</label>
                  </div>
                `)}
              </div>
            `
          }) : ""}

          <!-- Tags -->
          ${tags.length > 0 ? NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Etiquetas</h3>`,
            children: html`
              <div class="checkbox-list">
                ${tags.map(tag => html`
                  <div class="checkbox-item">
                    <input
                      type="checkbox"
                      id="tag-${tag.id}"
                      name="tags[]"
                      value="${tag.id}"
                      ${selectedTags.includes(tag.id) ? "checked" : ""}
                    />
                    <label for="tag-${tag.id}">${tag.name}</label>
                  </div>
                `)}
              </div>
            `
          }) : ""}
        </div>
      </div>

      <!-- Form Actions -->
      ${NexusCard({
        children: html`
          <div class="form-actions">
            ${NexusButton({
              label: "Cancelar",
              type: "outline",
              href: "/admincp/posts"
            })}
            ${NexusButton({
              label: isEdit ? "Actualizar Entrada" : "Publicar Entrada",
              type: "primary",
              isSubmit: true,
              icon: html`
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              `
            })}
          </div>
        `
      })}
    </form>

    ${raw(`<script>
      // Auto-generate slug from title (XSS safe)
      document.addEventListener('DOMContentLoaded', function() {
        const titleInput = document.querySelector('input[name="title"]');
        const slugInput = document.querySelector('input[name="slug"]');
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const scheduledField = document.getElementById('scheduledAtField');
        const visibilitySelect = document.querySelector('select[name="visibility"]');
        const passwordField = document.getElementById('passwordField');

        // Auto-generate slug
        if (titleInput && slugInput) {
          titleInput.addEventListener('input', function() {
            if (!slugInput.dataset.manuallyEdited) {
              const slug = titleInput.value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              slugInput.value = slug;
            }
          });

          slugInput.addEventListener('input', function() {
            slugInput.dataset.manuallyEdited = 'true';
          });
        }

        // Show/hide scheduled date field
        if (statusRadios && scheduledField) {
          statusRadios.forEach(radio => {
            radio.addEventListener('change', function() {
              scheduledField.style.display = this.value === 'scheduled' ? 'block' : 'none';
            });
          });
        }

        // Show/hide password field
        if (visibilitySelect && passwordField) {
          visibilitySelect.addEventListener('change', function() {
            passwordField.style.display = this.value === 'password' ? 'block' : 'none';
          });
        }
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: pageTitle,
    children: content_html,
    activePage: "content.posts",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default PostFormNexusPage;
