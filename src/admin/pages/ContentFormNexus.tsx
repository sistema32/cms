import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { CKEditorField } from "../components/CKEditorField.tsx";
import { env } from "../../config/env.ts";

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
    featuredImageId?: number | null;
    visibility?: string | null;
    password?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    commentsEnabled?: boolean;
  };
  contentTypes: Array<{ id: number; name: string }>;
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

export const ContentFormNexusPage = (props: ContentFormNexusProps) => {
  const {
    user,
    content,
    contentTypes,
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

  const isEdit = !!content;
  const pageTitle = isEdit ? "Editar Contenido" : "Nuevo Contenido";
  const formAction = isEdit
    ? `${env.ADMIN_PATH}/content/edit/${content!.id}`
    : `${env.ADMIN_PATH}/content/new`;

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
                ${CKEditorField({
                  name: "body",
                  value: content?.body || "",
                  placeholder: "Escribe tu contenido aquí...",
                  required: true,
                  mediaListEndpoint: `${env.ADMIN_PATH}/media/data`,
                  mediaUploadEndpoint: `${env.ADMIN_PATH}/media`
                })}
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
                      id="status-scheduled"
                      name="status"
                      value="scheduled"
                      ${content?.status === "scheduled" ? "checked" : ""}
                    />
                    <label for="status-scheduled">Programado</label>
                  </div>
                </div>
              </div>

              <!-- Scheduled Date -->
              <div class="form-field" id="scheduledAtField" style="display: ${content?.status === 'scheduled' ? 'block' : 'none'};">
                <label class="form-label">Fecha de Publicación</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value="${content?.scheduledAt || ""}"
                  class="form-input"
                />
              </div>

              <!-- Visibility -->
              <div class="form-field">
                <label class="form-label">Visibilidad</label>
                <select name="visibility" class="form-select">
                  <option value="public" ${!content || content.visibility === "public" ? "selected" : ""}>Público</option>
                  <option value="private" ${content?.visibility === "private" ? "selected" : ""}>Privado</option>
                  <option value="password" ${content?.visibility === "password" ? "selected" : ""}>Protegido por contraseña</option>
                </select>
              </div>

              <!-- Password (shown when visibility is password) -->
              <div class="form-field" id="passwordField" style="display: ${content?.visibility === 'password' ? 'block' : 'none'};">
                <label class="form-label">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value="${content?.password || ""}"
                  placeholder="Contraseña de acceso"
                  class="form-input"
                />
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

              <!-- Comments Enabled -->
              <div class="form-field" style="margin-bottom: 0;">
                <div class="toggle-wrapper">
                  <span class="toggle-label">Permitir comentarios</span>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      name="commentsEnabled"
                      value="true"
                      ${!content || content.commentsEnabled ? "checked" : ""}
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
              <div id="featuredImagePreview" style="margin-bottom: 1rem;">
                ${featuredImage ? html`
                  <img
                    id="featuredImageImg"
                    src="${featuredImage.url}"
                    alt="Imagen destacada"
                    class="featured-image-preview"
                    style="width: 100%; border-radius: 0.5rem; margin-bottom: 0.5rem;"
                  />
                  <button
                    type="button"
                    onclick="removeFeaturedImage()"
                    style="width: 100%; padding: 0.5rem; background: #f31260; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
                  >
                    Eliminar imagen
                  </button>
                ` : html`
                  <div style="text-align: center; padding: 2rem; border: 2px dashed #dcdee0; border-radius: 0.5rem; color: #888;">
                    No hay imagen seleccionada
                  </div>
                `}
              </div>
              <input type="hidden" id="featuredImageId" name="featuredImageId" value="${featuredImage?.id || ''}" />
              <button
                type="button"
                onclick="openFeaturedImagePicker()"
                style="width: 100%; padding: 0.75rem 1rem; background: transparent; color: #167bff; border: 2px solid #167bff; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s;"
                onmouseover="this.style.background='#167bff'; this.style.color='white';"
                onmouseout="this.style.background='transparent'; this.style.color='#167bff';"
              >
                Seleccionar Imagen
              </button>
            `
          })}

          <!-- Categories -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Categorías</h3>`,
            children: html`
              ${categories.length > 0 ? html`
                <div class="checkbox-list" style="margin-bottom: 1rem;">
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
              ` : html`
                <p style="font-size: 0.875rem; color: #888; margin-bottom: 1rem;">No hay categorías disponibles</p>
              `}

              <!-- Add new category -->
              <div style="border-top: 1px solid var(--nexus-base-200, #eef0f2); padding-top: 1rem;">
                <label class="form-label" style="margin-bottom: 0.5rem;">Crear nueva categoría</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input
                    type="text"
                    id="newCategoryInput"
                    placeholder="Nombre de la categoría"
                    class="form-input"
                    style="flex: 1;"
                  />
                  <button
                    type="button"
                    onclick="addNewCategory()"
                    style="padding: 0.75rem 1rem; background: #167bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; white-space: nowrap;"
                  >
                    Agregar
                  </button>
                </div>
                <input type="hidden" id="newCategoriesData" name="newCategories" value="" />
              </div>
            `
          })}

          <!-- Tags -->
          ${NexusCard({
            header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Etiquetas</h3>`,
            children: html`
              ${tags.length > 0 ? html`
                <div class="checkbox-list" style="margin-bottom: 1rem;">
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
              ` : html`
                <p style="font-size: 0.875rem; color: #888; margin-bottom: 1rem;">No hay etiquetas disponibles</p>
              `}

              <!-- Add new tag -->
              <div style="border-top: 1px solid var(--nexus-base-200, #eef0f2); padding-top: 1rem;">
                <label class="form-label" style="margin-bottom: 0.5rem;">Crear nueva etiqueta</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input
                    type="text"
                    id="newTagInput"
                    placeholder="Nombre de la etiqueta"
                    class="form-input"
                    style="flex: 1;"
                  />
                  <button
                    type="button"
                    onclick="addNewTag()"
                    style="padding: 0.75rem 1rem; background: #167bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; white-space: nowrap;"
                  >
                    Agregar
                  </button>
                </div>
                <input type="hidden" id="newTagsData" name="newTags" value="" />
              </div>
            `
          })}
        </div>
      </div>

      <!-- Form Actions -->
      ${NexusCard({
        children: html`
          <div class="form-actions">
            ${NexusButton({
              label: "Cancelar",
              type: "outline",
              href: `${env.ADMIN_PATH}/content`
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

    <!-- Featured Image Picker Modal -->
    <div id="featuredImageModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; padding: 2rem; overflow-y: auto;">
      <div style="max-width: 1200px; margin: 0 auto; background: white; border-radius: 0.75rem; padding: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Seleccionar Imagen Destacada</h3>
          <button
            type="button"
            onclick="closeFeaturedImagePicker()"
            style="width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 1.5rem; color: #666;"
          >
            ×
          </button>
        </div>

        <!-- Upload Section -->
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
          <input type="file" id="featuredImageUploadInput" accept="image/*" style="display: none;" />
          <button
            type="button"
            onclick="document.getElementById('featuredImageUploadInput').click()"
            style="width: 100%; padding: 0.75rem 1rem; background: #167bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s;"
            onmouseover="this.style.background='#1266dd';"
            onmouseout="this.style.background='#167bff';"
          >
            📤 Subir Nueva Imagen
          </button>
          <div id="uploadProgress" style="display: none; margin-top: 0.5rem; text-align: center; color: #167bff; font-size: 0.875rem;"></div>
        </div>

        <div id="featuredImageModalContent">
          <div style="text-align: center; padding: 2rem; color: #666;">
            Cargando...
          </div>
        </div>
      </div>
    </div>

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

      // Featured Image Picker Functions
      let mediaItems = [];

      async function openFeaturedImagePicker() {
        const modal = document.getElementById('featuredImageModal');
        const modalContent = document.getElementById('featuredImageModalContent');

        modal.style.display = 'block';
        modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Cargando biblioteca de medios...</div>';

        try {
          const response = await fetch('${env.ADMIN_PATH}/media/data?limit=100', { credentials: 'include' });
          if (!response.ok) throw new Error('Error al cargar medios');

          const data = await response.json();
          mediaItems = Array.isArray(data.media) ? data.media : [];
          renderFeaturedImageGrid(mediaItems);
        } catch (error) {
          console.error('Error loading media:', error);
          modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f31260;">Error al cargar la biblioteca de medios</div>';
        }
      }

      // Handle image upload
      document.addEventListener('DOMContentLoaded', function() {
        const uploadInput = document.getElementById('featuredImageUploadInput');
        if (uploadInput) {
          uploadInput.addEventListener('change', async function(e) {
            const file = e.target.files?.[0];
            if (!file) return;

            const uploadProgress = document.getElementById('uploadProgress');
            uploadProgress.style.display = 'block';
            uploadProgress.textContent = 'Subiendo imagen...';

            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('${env.ADMIN_PATH}/media', {
                method: 'POST',
                body: formData,
                credentials: 'include'
              });

              if (!response.ok) throw new Error('Error al subir imagen');

              const result = await response.json();
              uploadProgress.textContent = '✓ Imagen subida exitosamente';

              // Reload media grid
              setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadProgress.textContent = '';
                uploadInput.value = '';
                openFeaturedImagePicker();
              }, 1000);

            } catch (error) {
              console.error('Upload error:', error);
              uploadProgress.textContent = '✗ Error al subir imagen';
              uploadProgress.style.color = '#f31260';
              setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadProgress.textContent = '';
                uploadProgress.style.color = '#167bff';
              }, 3000);
            }
          });
        }
      });

      function closeFeaturedImagePicker() {
        document.getElementById('featuredImageModal').style.display = 'none';
      }

      function renderFeaturedImageGrid(items) {
        const modalContent = document.getElementById('featuredImageModalContent');
        const images = items.filter(item => item.type === 'image');

        if (!images.length) {
          modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No hay imágenes disponibles</div>';
          return;
        }

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">';
        images.forEach(media => {
          html += \`
            <div
              onclick="selectFeaturedImage(\${media.id}, '\${media.url}')"
              style="position: relative; cursor: pointer; border-radius: 0.5rem; overflow: hidden; border: 2px solid transparent; transition: border-color 0.2s;"
              onmouseover="this.style.borderColor='#167bff'"
              onmouseout="this.style.borderColor='transparent'"
            >
              <div style="aspect-ratio: 1; background: #f3f4f6;">
                <img
                  src="\${media.url}"
                  alt="\${media.originalFilename || ''}"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  loading="lazy"
                />
              </div>
            </div>
          \`;
        });
        html += '</div>';
        modalContent.innerHTML = html;
      }

      function selectFeaturedImage(id, url) {
        const previewDiv = document.getElementById('featuredImagePreview');
        const hiddenInput = document.getElementById('featuredImageId');

        hiddenInput.value = id;

        previewDiv.innerHTML = \`
          <img
            id="featuredImageImg"
            src="\${url}"
            alt="Imagen destacada"
            style="width: 100%; border-radius: 0.5rem; margin-bottom: 0.5rem;"
          />
          <button
            type="button"
            onclick="removeFeaturedImage()"
            style="width: 100%; padding: 0.5rem; background: #f31260; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
          >
            Eliminar imagen
          </button>
        \`;

        closeFeaturedImagePicker();
      }

      function removeFeaturedImage() {
        const previewDiv = document.getElementById('featuredImagePreview');
        const hiddenInput = document.getElementById('featuredImageId');

        hiddenInput.value = '';
        previewDiv.innerHTML = \`
          <div style="text-align: center; padding: 2rem; border: 2px dashed #dcdee0; border-radius: 0.5rem; color: #888;">
            No hay imagen seleccionada
          </div>
        \`;
      }

      // Close modal when clicking outside
      document.getElementById('featuredImageModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
          closeFeaturedImagePicker();
        }
      });

      // Add new category
      const newCategories = [];
      function addNewCategory() {
        const input = document.getElementById('newCategoryInput');
        const categoryName = input.value.trim();

        if (!categoryName) {
          alert('Por favor ingresa un nombre para la categoría');
          return;
        }

        // Add to temporary array
        newCategories.push(categoryName);

        // Update hidden input
        document.getElementById('newCategoriesData').value = JSON.stringify(newCategories);

        // Add visual feedback
        const checkboxList = input.closest('.nexus-card').querySelector('.checkbox-list');
        if (!checkboxList) {
          // Create checkbox list if it doesn't exist
          const paragraph = input.closest('.nexus-card').querySelector('p');
          if (paragraph) {
            const newList = document.createElement('div');
            newList.className = 'checkbox-list';
            newList.style.marginBottom = '1rem';
            paragraph.replaceWith(newList);
            checkboxList = newList;
          }
        }

        if (checkboxList) {
          const newItem = document.createElement('div');
          newItem.className = 'checkbox-item';
          newItem.style.background = '#e8f4ff';
          newItem.innerHTML = \`
            <input type="checkbox" checked disabled style="width: 18px; height: 18px;">
            <label style="font-size: 0.875rem; color: #1e2328;">\${categoryName} <em style="color: #167bff;">(nueva)</em></label>
          \`;
          checkboxList.appendChild(newItem);
        }

        // Clear input
        input.value = '';

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✓ Categoría agregada';
        successMsg.style.cssText = 'margin-top: 0.5rem; color: #00a651; font-size: 0.875rem;';
        input.parentElement.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      }

      // Add new tag
      const newTags = [];
      function addNewTag() {
        const input = document.getElementById('newTagInput');
        const tagName = input.value.trim();

        if (!tagName) {
          alert('Por favor ingresa un nombre para la etiqueta');
          return;
        }

        // Add to temporary array
        newTags.push(tagName);

        // Update hidden input
        document.getElementById('newTagsData').value = JSON.stringify(newTags);

        // Add visual feedback
        const checkboxList = input.closest('.nexus-card').querySelector('.checkbox-list');
        if (!checkboxList) {
          // Create checkbox list if it doesn't exist
          const paragraph = input.closest('.nexus-card').querySelector('p');
          if (paragraph) {
            const newList = document.createElement('div');
            newList.className = 'checkbox-list';
            newList.style.marginBottom = '1rem';
            paragraph.replaceWith(newList);
            checkboxList = newList;
          }
        }

        if (checkboxList) {
          const newItem = document.createElement('div');
          newItem.className = 'checkbox-item';
          newItem.style.background = '#e8f4ff';
          newItem.innerHTML = \`
            <input type="checkbox" checked disabled style="width: 18px; height: 18px;">
            <label style="font-size: 0.875rem; color: #1e2328;">\${tagName} <em style="color: #167bff;">(nueva)</em></label>
          \`;
          checkboxList.appendChild(newItem);
        }

        // Clear input
        input.value = '';

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✓ Etiqueta agregada';
        successMsg.style.cssText = 'margin-top: 0.5rem; color: #00a651; font-size: 0.875rem;';
        input.parentElement.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      }

      // Allow Enter key to add categories/tags
      document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('newCategoryInput')?.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addNewCategory();
          }
        });

        document.getElementById('newTagInput')?.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addNewTag();
          }
        });
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
