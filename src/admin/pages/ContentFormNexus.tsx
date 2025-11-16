import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";

interface ContentFormNexusProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  content?: {
    id: number;
    title: string;
    slug: string;
    body: string;
    excerpt?: string;
    status: string;
    contentTypeId: number;
    featuredImage?: string;
  };
  contentTypes: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
  selectedCategories?: number[];
  selectedTags?: number[];
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

export const ContentFormNexusPage = (props: ContentFormNexusProps) => {
  const {
    user,
    content,
    contentTypes,
    categories,
    tags,
    selectedCategories = [],
    selectedTags = [],
    errors = {},
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const isEdit = !!content;
  const pageTitle = isEdit ? "Editar Contenido" : "Nuevo Contenido";
  const formAction = isEdit
    ? `/admincp/content/edit/${content!.id}`
    : "/admincp/content/new";

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
      .content-form-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      @media (max-width: 1280px) {
        .content-form-layout {
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
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
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

      /* ========== FEATURED IMAGE ========== */
      .featured-image-preview {
        width: 100%;
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1rem;
      }

      .image-upload-area {
        border: 2px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
      }

      .image-upload-area:hover {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.02);
      }

      .image-upload-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.3;
      }

      /* ========== FORM ACTIONS ========== */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== STATUS BADGES ========== */
      .status-select-wrapper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .status-option {
        position: relative;
      }

      .status-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .status-option label {
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

      .status-option input[type="radio"]:checked + label {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.08);
        color: var(--nexus-primary, #167bff);
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .status-select-wrapper {
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
        ${isEdit ? "Actualiza el contenido y guarda los cambios" : "Crea un nuevo contenido para tu sitio"}
      </p>
    </div>

    <!-- Form Layout -->
    <form method="POST" action="${formAction}" enctype="multipart/form-data">
      <div class="content-form-layout">
        <!-- Main Content -->
        <div>
          ${NexusCard({
            children: html`
              <!-- Title -->
              <div class="form-field">
                <label class="form-label">Título *</label>
                <input
                  type="text"
                  name="title"
                  value="${content?.title || ""}"
                  placeholder="Título del contenido"
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
                  value="${content?.slug || ""}"
                  placeholder="url-amigable"
                  class="form-input"
                />
                <p class="form-hint">Se generará automáticamente si se deja vacío</p>
                ${errors.slug ? html`<p class="form-error">${errors.slug}</p>` : ""}
              </div>

              <!-- Excerpt -->
              <div class="form-field">
                <label class="form-label">Extracto</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  placeholder="Breve descripción del contenido..."
                  class="form-input"
                  style="min-height: 100px;"
                >${content?.excerpt || ""}</textarea>
                ${errors.excerpt ? html`<p class="form-error">${errors.excerpt}</p>` : ""}
              </div>

              <!-- Body -->
              <div class="form-field">
                <label class="form-label">Contenido *</label>
                <textarea
                  name="body"
                  placeholder="Escribe tu contenido aquí..."
                  class="form-textarea"
                  required
                >${content?.body || ""}</textarea>
                ${errors.body ? html`<p class="form-error">${errors.body}</p>` : ""}
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
                <div class="status-select-wrapper">
                  <div class="status-option">
                    <input
                      type="radio"
                      id="status-draft"
                      name="status"
                      value="draft"
                      ${!content || content.status === "draft" ? "checked" : ""}
                    />
                    <label for="status-draft">Borrador</label>
                  </div>
                  <div class="status-option">
                    <input
                      type="radio"
                      id="status-published"
                      name="status"
                      value="published"
                      ${content?.status === "published" ? "checked" : ""}
                    />
                    <label for="status-published">Publicado</label>
                  </div>
                  <div class="status-option">
                    <input
                      type="radio"
                      id="status-archived"
                      name="status"
                      value="archived"
                      ${content?.status === "archived" ? "checked" : ""}
                    />
                    <label for="status-archived">Archivado</label>
                  </div>
                </div>
              </div>

              <!-- Content Type -->
              ${contentTypes.length > 0 ? html`
                <div class="form-field">
                  <label class="form-label">Tipo de Contenido</label>
                  <select name="contentTypeId" class="form-select" required>
                    ${contentTypes.map(ct => html`
                      <option
                        value="${ct.id}"
                        ${content?.contentTypeId === ct.id ? "selected" : ""}
                      >
                        ${ct.name}
                      </option>
                    `)}
                  </select>
                </div>
              ` : ""}
            `
          })}

          <!-- Featured Image -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Imagen Destacada</h3>`,
            children: html`
              ${content?.featuredImage ? html`
                <img
                  src="${content.featuredImage}"
                  alt="Imagen destacada"
                  class="featured-image-preview"
                />
              ` : ""}
              <div class="image-upload-area" id="imageUploadArea">
                <svg class="image-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p style="margin: 0; font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.6;">
                  Click para seleccionar imagen
                </p>
              </div>
              <input
                type="file"
                id="featuredImageInput"
                name="featuredImage"
                accept="image/*"
                style="display: none;"
              />
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
              href: "/admincp/content"
            })}
            ${NexusButton({
              label: isEdit ? "Actualizar Contenido" : "Publicar Contenido",
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

        // Image upload area click handler (XSS safe)
        const imageUploadArea = document.getElementById('imageUploadArea');
        const featuredImageInput = document.getElementById('featuredImageInput');

        if (imageUploadArea && featuredImageInput) {
          imageUploadArea.addEventListener('click', function() {
            featuredImageInput.click();
          });
        }
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: pageTitle,
    children: content_html,
    activePage: "content",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ContentFormNexusPage;
