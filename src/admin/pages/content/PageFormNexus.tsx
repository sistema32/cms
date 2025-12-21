import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { MinimalSection, SidebarCustomizationPanel, SidebarCustomizationScript } from "@/admin/components/nexus/NexusComponents.tsx";
import { CKEditorField } from "@/admin/components/editors/CKEditorField.tsx";
import { AutoSaveIndicator, AutoSaveScript } from "@/admin/components/ui/AutoSaveIndicator.tsx";
import { ImmersiveModeStyles, ImmersiveModeScript, ImmersiveModeToggle } from "@/admin/components/layout/ImmersiveMode.tsx";
import { EditorEnhancements, WordCounter, SeoScoreWidget, EditorEnhancementsScript } from "@/admin/components/editors/EditorEnhancements.tsx";
import { env } from "@/config/env.ts";

interface PageFormNexusProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  page?: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    status: string;
    parentId?: number | null;
    template?: string | null;
    visibility?: string | null;
    password?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
  };
  availableParents?: Array<{ id: number; name: string; slug?: string }>;
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

export const PageFormNexusPage = (props: PageFormNexusProps) => {
  const {
    user,
    page,
    availableParents = [],
    featuredImage,
    seo = {},
    errors = {},
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const isEdit = !!page;
  const pageTitle = isEdit ? "Editar Página" : "Nueva Página";
  const formAction = isEdit
    ? `${env.ADMIN_PATH}/pages/edit/${page!.id}`
    : `${env.ADMIN_PATH}/pages/new`;

  const content_html = html`
    ${ImmersiveModeStyles()}
    ${EditorEnhancements()}
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

      /* ========== FORM LAYOUT - FOCUS MODE ========== */
      .post-form-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        gap: 4rem;
        padding: 4rem 0;
        max-width: 1200px;
        margin: 0 auto;
        align-items: start;
      }

      @media (max-width: 1280px) {
        .post-form-layout {
          grid-template-columns: 1fr;
        }
      }

      /* ========== MINIMALIST FORM STYLES ========== */
      .post-form-layout .form-field {
        margin-bottom: 1.5rem;
      }

      .post-form-layout .form-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 400;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }

      .post-form-layout .form-input,
      .post-form-layout .form-select,
      .post-form-layout textarea {
        width: 100%;
        border: none;
        border-bottom: 1px solid #eef0f2;
        border-radius: 0;
        padding: 0.625rem 0;
        background: transparent;
        font-size: 0.9375rem;
        color: #1e2328;
        transition: border-color 0.2s ease;
        box-shadow: none !important;
      }

      .post-form-layout textarea {
        resize: vertical;
      }

      .post-form-layout .form-input:focus,
      .post-form-layout .form-select:focus,
      .post-form-layout textarea:focus {
        outline: none;
        border-bottom-color: #167bff;
        box-shadow: none !important;
      }

      /* Focus Mode Typography Overrides */
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap');

      .post-form-layout input[name="title"] {
        font-family: 'Merriweather', serif;
        font-size: 3.5rem !important;
        font-weight: 900 !important;
        color: #000 !important;
        background: transparent !important;
        border: none !important;
        border-bottom: 0px !important;
        padding: 0.5rem 0 !important;
        line-height: 1.2;
        margin-bottom: 1rem;
        outline: none !important;
        box-shadow: none !important;
      }
      .post-form-layout input[name="title"]::placeholder {
        color: #e0e0e0 !important;
        opacity: 1;
      }

      .post-form-layout textarea[name="excerpt"] {
        font-family: 'Merriweather', serif;
        font-style: italic;
        font-size: 1.125rem !important;
        color: #666 !important;
        border: none !important;
        border-left: 3px solid #f0f0f0 !important;
        padding: 0.5rem 0 0.5rem 1rem !important;
        background: transparent !important;
        resize: none;
        min-height: auto !important;
      }
      .post-form-layout textarea[name="excerpt"]:focus {
        border-left-color: #000 !important;
      }

      /* Hide labels for Title/Excerpt */
      .post-form-layout .form-field:has(input[name="title"]) label,
      .post-form-layout .form-field:has(textarea[name="excerpt"]) label {
        display: none !important;
      }

      /* Sidebar & Action Button Styles */
      .status-pill-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        user-select: none;
      }
      
      .status-pill[data-status="draft"] {
        background: #f3f4f6;
        color: #4b5563;
        border-color: #e5e7eb;
      }
      .status-pill[data-status="published"] {
        background: #ecfdf5;
        color: #059669;
        border-color: #d1fae5;
      }
      .status-pill[data-status="scheduled"] {
        background: #eff6ff;
        color: #2563eb;
        border-color: #dbeafe;
      }
      
      .status-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 20;
        overflow: hidden;
        margin-top: 0.25rem;
        display: none;
      }
      .status-dropdown.active {
        display: block;
        animation: fadeIn 0.1s ease-out;
      }
      
      .status-option {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        color: #333;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .status-option:hover {
        background: #f8f9fa;
      }

      .btn-action-main {
        width: 100%;
        padding: 1rem 1.5rem;
        background: #000;
        color: white;
        border: none;
        font-family: 'Merriweather', serif;
        font-weight: 700;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1rem;
      }
      .btn-action-main:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      /* Sidebar Scroll */
      .post-form-layout #customizableSidebar {
        display: flex;
        flex-direction: column;
        gap: 0;
        position: sticky;
        top: 2rem;
        max-height: calc(100vh - 4rem);
        overflow-y: auto;
        scrollbar-width: thin;
      }

      /* CKEditor Focus Overrides */
      .ck.ck-editor__main > .ck-editor__editable {
        font-family: 'Merriweather', serif !important;
        font-size: 1.125rem !important;
        line-height: 1.8 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        color: #1e2328 !important;
      }
      .ck.ck-toolbar {
        border: none !important;
        background: transparent !important;
        margin-bottom: 1rem !important;
      }
      
      .page-header-nexus { display: none; }
      .main-content-container { max-width: 740px; margin: 0 auto; }
    </style>

    <!-- Page Header (Hidden) -->
    <div class="page-header-nexus">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 class="page-title-nexus">${pageTitle}</h1>
        </div>
        ${AutoSaveIndicator({})}
      </div>
    </div>

    ${ImmersiveModeToggle()}

    <!-- Using same customization panel as Posts but we can configure it differently usually. 
         For now allowing standard blocks. -->
    ${SidebarCustomizationPanel()}

    <!-- Form Layout -->
    <form method="POST" action="${formAction}" enctype="multipart/form-data" autocomplete="off">
      <div class="post-form-layout">
        <!-- Main Content -->
        <div class="main-content-wrapper">
          <div class="main-content-container">
              <!-- Title -->
              <div class="form-field">
                <input
                  type="text"
                  name="title"
                  value="${page?.title || ""}"
                  placeholder="Título de la página"
                  class="form-input"
                  required
                />
                ${errors.title ? html`<p class="form-error">${errors.title}</p>` : ""}
              </div>

              <!-- Excerpt -->
              <div class="form-field">
                <label class="form-label">Extracto</label>
                <textarea
                  name="excerpt"
                  rows="3"
                  placeholder="Resumen de la página"
                  class="form-input"
                  style="min-height: 100px;"
                >${page?.excerpt || ""}</textarea>
              </div>

              <!-- Body -->
              <div class="form-field">
                <label class="form-label">Contenido *</label>
                ${CKEditorField({
    name: "body",
    value: page?.body || "",
    placeholder: "Escribe el contenido de la página...",
    required: true,
    mediaListEndpoint: `${env.ADMIN_PATH}/media/data`,
    mediaUploadEndpoint: `${env.ADMIN_PATH}/media`
  })}
                ${WordCounter()}
                ${errors.body ? html`<p class="form-error">${errors.body}</p>` : ""}
              </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div id="customizableSidebar">
          
          <!-- 1. Publish Settings -->
          ${MinimalSection({
    id: "publish-section",
    title: "Publicación",
    children: html`
              <!-- Status Pill Controller -->
              <input type="hidden" name="status" id="statusInput" value="${page?.status || 'draft'}" />
              
              <div style="position: relative; margin-bottom: 1.5rem;">
                <div class="status-pill-wrapper">
                   <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                     <span style="font-size: 0.75rem; color: #999; font-weight: 500; text-transform: uppercase;">Estado Actual</span>
                     <div id="currentStatusPill" class="status-pill" onclick="toggleStatusDropdown()" data-status="${page?.status || 'draft'}">
                       <span id="statusIcon">📝</span>
                       <span id="statusLabel">Borrador</span>
                       <span style="opacity: 0.4; font-size: 0.7rem; margin-left: 0.25rem;">▼</span>
                     </div>
                   </div>
                </div>

                <!-- Dropdown Menu -->
                <div id="statusDropdown" class="status-dropdown">
                  <div class="status-option" onclick="selectStatus('draft')">
                    <span>📝</span> Borrador
                  </div>
                  <div class="status-option" onclick="selectStatus('published')">
                    <span>🟢</span> Publicado
                  </div>
                  <div class="status-option" onclick="selectStatus('scheduled')">
                    <span>📅</span> Programado
                  </div>
                </div>
              </div>

              <!-- Scheduled Date -->
              <div class="form-field" id="scheduledAtField" style="display: ${page?.status === 'scheduled' ? 'block' : 'none'}; animation: slideDown 0.2s ease;">
                <label class="form-label">Fecha de Programación</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value="${page?.scheduledAt || ""}"
                  class="form-input"
                  style="border-bottom: 1px solid #167bff !important; background: #f8fbff !important;"
                />
              </div>

              <!-- Main Action -->
              <div style="margin-top: 1.5rem;">
                <button type="submit" id="mainActionBtn" class="btn-action-main">
                  ${isEdit ? "Guardar Cambios" : "Guardar Página"}
                </button>
              </div>

              <!-- Visibility -->
              <div class="form-field" style="margin-top: 1.5rem;">
                <label class="form-label">Visibilidad</label>
                <select name="visibility" class="form-select">
                  <option value="public" ${!page || page.visibility === "public" ? "selected" : ""}>Público</option>
                  <option value="private" ${page?.visibility === "private" ? "selected" : ""}>Privado</option>
                  <option value="password" ${page?.visibility === "password" ? "selected" : ""}>Contraseña</option>
                </select>
              </div>
              
               <div class="form-field" id="passwordField" style="display: ${page?.visibility === 'password' ? 'block' : 'none'};">
                <input type="password" name="password" value="${page?.password || ""}" placeholder="Contraseña" class="form-input" />
               </div>
            `
  })}

          <!-- 2. Page Hierarchy -->
          ${availableParents.length > 0 ? MinimalSection({
    id: "hierarchy-section",
    title: "Jerarquía",
    children: html`
               <div class="form-field">
                  <label class="form-label">Página Padre</label>
                  <select name="parentId" class="form-select">
                    <option value="">Raíz (Sin padre)</option>
                    ${availableParents.map(p => html`
                      <option value="${p.id}" ${page?.parentId === p.id ? "selected" : ""}>${p.name}</option>
                    `)}
                  </select>
               </div>
            `
  }) : ""}

          <!-- 3. Slug -->
          ${MinimalSection({
    id: "slug-section",
    title: "URL Permanente",
    children: html`
              <div class="form-field">
                <input type="text" name="slug" value="${page?.slug || ""}" placeholder="url-amigable-pagina" class="form-input" style="font-family: monospace; font-size: 0.85rem;" />
              </div>
            `
  })}

          <!-- 4. Featured Image -->
          ${MinimalSection({
    id: "featured-image-section",
    title: "Imagen Destacada",
    children: html`
              <div id="featuredImagePreview" style="margin-bottom: 1rem;">
                ${featuredImage ? html`
                    <img src="${featuredImage.url}" class="featured-image-preview" style="width: 100%; border-radius: 4px;" />
                    <button type="button" onclick="removeFeaturedImage()" style="color: #f31260; font-size: 0.8rem; text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; margin-top: 0.5rem;">Eliminar imagen</button>
                ` : html`
                    <div style="background: #f8f9fa; border: 1px dashed #ddd; padding: 1.5rem; text-align: center; border-radius: 4px; color: #999; font-size: 0.8rem;">
                       Sin imagen seleccionada
                    </div>
                `}
              </div>
              <input type="hidden" id="featuredImageId" name="featuredImageId" value="${featuredImage?.id || ""}" />
              <button type="button" onclick="openFeaturedImagePicker()" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; background: white; font-size: 0.85rem; border-radius: 4px; cursor: pointer;">Seleccionar Imagen</button>
            `
  })}

          <!-- 5. SEO -->
          ${MinimalSection({
    id: "seo-section",
    title: "SEO",
    children: html`
              <div class="form-field">
                 ${SeoScoreWidget()}
              </div>
              <div class="form-field">
                <label class="form-label">Meta Título</label>
                <input type="text" name="seoMetaTitle" value="${seo.metaTitle || ""}" class="form-input" />
              </div>
              <div class="form-field">
                <label class="form-label">Meta Descripción</label>
                <textarea name="seoMetaDescription" rows="3" class="form-input">${seo.metaDescription || ""}</textarea>
              </div>
            `
  })}
        </div>
      </div>
    </form>

    ${raw(`
    <script>
      // Toggle Visibility Password
      const visibilitySelect = document.querySelector('select[name="visibility"]');
      const passwordField = document.getElementById('passwordField');
      if (visibilitySelect) {
        visibilitySelect.addEventListener('change', (e) => {
          passwordField.style.display = e.target.value === 'password' ? 'block' : 'none';
        });
      }

      // Featured Image Logic
      function openFeaturedImagePicker() {
         if (window.MediaPicker) {
           window.MediaPicker.open({
             onSelect: (media) => {
                document.getElementById('featuredImageId').value = media.id;
                const container = document.getElementById('featuredImagePreview');
                container.innerHTML = \`<img src="\${media.url}" style="width: 100%; border-radius: 4px;" /><button type="button" onclick="removeFeaturedImage()" style="color: #f31260; font-size: 0.8rem; text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; margin-top: 0.5rem;">Eliminar imagen</button>\`;
             }
           });
         }
      }
      function removeFeaturedImage() {
         document.getElementById('featuredImageId').value = '';
         document.getElementById('featuredImagePreview').innerHTML = '<div style="background: #f8f9fa; border: 1px dashed #ddd; padding: 1.5rem; text-align: center; border-radius: 4px; color: #999; font-size: 0.8rem;">Sin imagen seleccionada</div>';
      }

      // Status Pill Logic
      window.toggleStatusDropdown = function() {
        const dd = document.getElementById('statusDropdown');
        dd.classList.toggle('active');
      };

      window.selectStatus = function(status) {
        const input = document.getElementById('statusInput');
        const pill = document.getElementById('currentStatusPill');
        const label = document.getElementById('statusLabel');
        const icon = document.getElementById('statusIcon');
        const scheduleField = document.getElementById('scheduledAtField');
        const mainBtn = document.getElementById('mainActionBtn');
        const dd = document.getElementById('statusDropdown');

        if (input) input.value = status;
        if (pill) pill.setAttribute('data-status', status);

        const config = {
          'draft': { label: 'Borrador', icon: '📝' },
          'published': { label: 'Publicado', icon: '🟢' },
          'scheduled': { label: 'Programado', icon: '📅' }
        };

        if (label && config[status]) label.textContent = config[status].label;
        if (icon && config[status]) icon.textContent = config[status].icon;

        if (status === 'scheduled') {
           if (scheduleField) scheduleField.style.display = 'block';
           if (mainBtn) mainBtn.textContent = 'Programar';
        } else if (status === 'published') {
           if (scheduleField) scheduleField.style.display = 'none';
           if (mainBtn) mainBtn.textContent = '${isEdit ? "Actualizar Página" : "Publicar Página"}';
        } else {
           if (scheduleField) scheduleField.style.display = 'none';
           if (mainBtn) mainBtn.textContent = 'Guardar Borrador';
        }

        if (dd) dd.classList.remove('active');
      };
      
      // Auto-set status on load
      document.addEventListener('DOMContentLoaded', () => {
         const input = document.getElementById('statusInput');
         if (input && window.selectStatus) {
            window.selectStatus(input.value);
         }
      });
    </script>
    `)}

    ${AutoSaveScript()}
    ${ImmersiveModeScript()}
    ${EditorEnhancementsScript()}
    ${SidebarCustomizationScript()}
  `;

  return AdminLayoutNexus({
    user,
    activePage: "content.pages",
    title: pageTitle,
    children: content_html
  });
};

export default PageFormNexusPage;
