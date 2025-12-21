import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge, MinimalSection, SidebarCustomizationPanel, SidebarCustomizationScript } from "@/admin/components/nexus/NexusComponents.tsx";
import { MediaPickerModal } from "@/admin/components/media/MediaPickerModal.tsx";
import { TipTapEditor } from "@/admin/components/editors/TipTapEditor.tsx";
import { AutoSaveIndicator, AutoSaveScript } from "@/admin/components/ui/AutoSaveIndicator.tsx";
import { ImmersiveModeStyles, ImmersiveModeScript, ImmersiveModeToggle } from "@/admin/components/layout/ImmersiveMode.tsx";
import { EditorEnhancements, WordCounter, SeoScoreWidget, EditorEnhancementsScript } from "@/admin/components/editors/EditorEnhancements.tsx";
import { env } from "@/config/env.ts";

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
  contentTypeId: number;
  featuredImage?: { id: number; url: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
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
  /** Plugin-provided sidebar widgets */
  pluginSidebarWidgets?: Array<{
    id: string;
    title: string;
    html: string;
    initScript?: string;
    order?: number;
    icon?: string;
    collapsed?: boolean;
  }>;
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
    contentTypeId,
    pluginSidebarWidgets = [],
  } = props;

  const isEdit = !!post;
  const pageTitle = isEdit ? "Editar Entrada" : "Nueva Entrada";
  const formAction = isEdit
    ? `${env.ADMIN_PATH}/posts/edit/${post!.id}`
    : `${env.ADMIN_PATH}/posts/new`;

  const initialEditorMode = 'classic';

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

      /* ========== FORM LAYOUT - MODERN SPLIT ========== */
      .post-form-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 3rem;
        padding-bottom: 4rem;
        transition: all 0.3s ease;
      }

      /* ZEN MODE */
      .post-form-layout.is-zen-mode {
         grid-template-columns: minmax(0, 1fr) 0px;
         gap: 0;
      }
      .post-form-layout.is-zen-mode #customizableSidebar {
         display: none;
      }
      .post-form-layout.is-zen-mode .main-content-container {
         max-width: 800px; /* Slightly wider in Zen */
      }


      /* ========== MAIN CONTENT AREA ========== */
      .main-content-wrapper {
         min-width: 0; /* Flexbox safety */
      }

      .main-content-container {
        max-width: 740px; /* Optimal reading width */
        margin: 0 auto;
        transition: max-width 0.3s ease;
      }

      /* Sticky Toolbar */
      .editor-toolbar-sticky {
        position: sticky;
        top: 20px;
        z-index: 40;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        margin-bottom: 2rem;
        padding: 0.75rem 1rem;
        border: 1px solid #eef0f2;
        border-radius: 999px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      .editor-mode-toggle {
        display: flex;
        background: #f3f4f6;
        padding: 3px;
        border-radius: 999px;
      }
      
      .mode-btn {
        border: none;
        background: transparent;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .mode-btn.active {
        background: white;
        color: #000;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }

      /* Title Input - H1 Style */
      input[name="title"] {
        font-family: 'Merriweather', serif;
        font-size: 2.75rem;
        font-weight: 900;
        color: #111;
        background: transparent;
        border: none;
        padding: 0;
        line-height: 1.2;
        margin-bottom: 1rem;
        width: 100%;
        outline: none;
      }
      input[name="title"]::placeholder {
        color: #e5e7eb;
      }

      /* Excerpt - Subtle */
      textarea[name="excerpt"] {
        font-family: 'Merriweather', serif;
        font-style: italic;
        font-size: 1.1rem;
        color: #666;
        border: none;
        background: transparent;
        resize: none;
        width: 100%;
        outline: none;
        padding: 0;
        margin-bottom: 2rem;
      }

      /* ========== SIDEBAR ========== */
      #customizableSidebar {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 2rem;
        height: fit-content;
        max-height: calc(100vh - 4rem);
        overflow-y: auto;
        padding-right: 4px; /* Scrollbar spacing */
        overscroll-behavior: contain;
        z-index: 30;
      }
      
      /* Sidebar panel styles */
      .sidebar-panel {
         background: #fff;
         border: 1px solid #eef0f2;
         border-radius: 0.75rem;
         padding: 1.25rem;
         margin-bottom: 1.5rem;
      }

      .sidebar-label {
         font-size: 0.8125rem;
         font-weight: 600;
         text-transform: none;
         letter-spacing: normal;
         color: #374151;
         margin-bottom: 0.5rem;
         display: block;
      }

      .sidebar-input {
         width: 100%;
         padding: 0.5rem;
         font-size: 0.85rem;
         border: 1px solid #e5e7eb;
         border-radius: 0.375rem;
         color: #374151;
      }

      .btn-zen-toggle {
         width: 32px;
         height: 32px;
         display: flex;
         align-items: center;
         justify-content: center;
         border: 1px solid #eef0f2;
         background: white;
         border-radius: 50%;
         cursor: pointer;
         color: #666;
         transition: all 0.2s;
      }
      .btn-zen-toggle:hover {
         background: #f9fafb;
         color: #111;
      }
      
      .btn-action-primary {
         width: 100%;
         padding: 0.75rem;
         background: #111;
         color: white;
         border: none;
         border-radius: 0.5rem;
         font-weight: 600;
         cursor: pointer;
         transition: opacity 0.2s;
      }
      .btn-action-primary:hover {
         opacity: 0.9;
      }
      
      .pill-btn {
         display: inline-flex;
         align-items: center;
         justify-content: center;
         padding: 0.5rem 1rem;
         font-size: 0.8125rem;
         font-weight: 500;
         color: #374151;
         background: #f3f4f6;
         border: 1px solid #e5e7eb;
         border-radius: 0.375rem;
         cursor: pointer;
         transition: all 0.15s ease;
      }
      .pill-btn:hover {
         background: #e5e7eb;
         color: #111827;
      }
      
      .text-hint {
         font-size: 0.75rem;
         color: #9ca3af;
      }
      
      /* Collapsible panels */
      .sidebar-panel-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         cursor: pointer;
         user-select: none;
      }
      .sidebar-panel-header .collapse-icon {
         transition: transform 0.2s ease;
      }
      .sidebar-panel-header.collapsed .collapse-icon {
         transform: rotate(-90deg);
      }
      .sidebar-panel-content {
         overflow: hidden;
         transition: max-height 0.25s ease;
      }
      .sidebar-panel-content.collapsed {
         max-height: 0 !important;
         padding-top: 0;
         margin-top: 0;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
         .post-form-layout {
            grid-template-columns: 1fr;
         }
         #customizableSidebar {
            position: relative;
            max-height: none;
            top: 0;
         }
         .btn-zen-toggle {
            display: none;
         }
      }
    </style>

    <!-- Header (Hidden in Zen potentially, but kept for navigation) -->
    <div class="page-header-nexus">
       <div>
          <a href="${env.ADMIN_PATH}/posts" style="font-size: 0.8rem; font-weight: 600; color: #666; text-decoration: none;">&larr; Volver a Entradas</a>
       </div>
    </div>

    ${ImmersiveModeToggle()}
    ${SidebarCustomizationPanel()}
    ${MediaPickerModal()}

    <form id="postForm" method="POST" action="${formAction}" enctype="multipart/form-data" autocomplete="off">
        ${isEdit ? html`<input type="hidden" name="id" value="${post!.id}">` : ''}
        <div class="post-form-layout" id="postFormLayout">
            
            <!-- MAIN CONTENT COL -->
            <div class="main-content-wrapper">
                <div class="main-content-container">
                    
                    <!-- Floating Toolbar -->
                    <div class="editor-toolbar-sticky">
                        <div class="editor-mode-toggle" id="editorModeToggle">
                            <button type="button" class="mode-btn mode-classic active" data-mode="classic">Clásico</button>
                            <button type="button" class="mode-btn mode-blocks" data-mode="blocks">Bloques</button>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                           ${AutoSaveIndicator({})}
                           <button type="button" class="btn-zen-toggle" id="zenModeBtn" title="Modo Zen (Expandir Editor)">
                              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                           </button>
                        </div>
                    </div>

                    <!-- Title -->
                    <input 
                       type="text" 
                       name="title" 
                       placeholder="Título de la entrada..." 
                       value="${post?.title || ""}" 
                       required
                    />
                    
                    <!-- Excerpt -->
                    <textarea 
                       name="excerpt" 
                       rows="2" 
                       placeholder="Escribe un subtítulo o extracto breve..."
                    >${post?.excerpt || ""}</textarea>

                    <!-- Editor -->
                    <div style="min-height: 500px;">
                        ${TipTapEditor({
    name: "body",
    value: post?.body || "",
    placeholder: "Empieza a escribir tu historia...",
    required: true,
    editorMode: initialEditorMode,
  })}
                    </div>
                     ${WordCounter()}

                </div>
            </div>

            <!-- SIDEBAR COL -->
            <div id="customizableSidebar">
                <!-- Publish Panel -->
                <div class="sidebar-panel" data-block-id="publish-section">
                    <div class="sidebar-panel-header" onclick="togglePanel('publishContent', this)">
                        <label class="sidebar-label" style="margin:0;">Publicación</label>
                        <svg class="collapse-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div class="sidebar-panel-content" id="publishContent" style="margin-top: 0.75rem;">
                        <select name="status" class="sidebar-input" style="margin-bottom: 1rem;">
                            <option value="draft" ${!post || post.status === 'draft' ? 'selected' : ''}>Borrador</option>
                            <option value="published" ${post?.status === 'published' ? 'selected' : ''}>Publicado</option>
                            <option value="scheduled" ${post?.status === 'scheduled' ? 'selected' : ''}>Programado</option>
                        </select>
                        
                        <button type="submit" class="btn-action-primary">
                           ${isEdit ? 'Actualizar' : 'Publicar'}
                        </button>
                    </div>
                </div>

                <!-- Slug Panel -->
                <div class="sidebar-panel" data-block-id="slug-section">
                    <div class="sidebar-panel-header" onclick="togglePanel('slugContent', this)">
                        <label class="sidebar-label" style="margin:0;">URL Slug</label>
                        <svg class="collapse-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div class="sidebar-panel-content" id="slugContent" style="margin-top: 0.75rem;">
                        <input type="text" name="slug" id="slugInput" value="${post?.slug || ""}" class="sidebar-input" placeholder="url-amigable-entrada">
                    </div>
                </div>

                <!-- Categories & Tags (Organization) -->
                <div class="sidebar-panel" data-block-id="organization-section">
                    <div class="sidebar-panel-header" onclick="togglePanel('organizationContent', this)">
                        <label class="sidebar-label" style="margin:0;">Categorías y Etiquetas</label>
                        <svg class="collapse-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div class="sidebar-panel-content" id="organizationContent" style="margin-top: 0.75rem;">
                        <label class="sidebar-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Categorías</label>
                        <div class="checkbox-list" id="categoryList" style="margin-bottom: 0.75rem; border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 0.375rem; max-height: 200px; overflow-y: auto;">
                            ${raw(categories
    .map(
      (cat) => `
                                <div class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <input 
                                    type="checkbox" 
                                    id="cat_${cat.id}" 
                                    name="categoryIds[]" 
                                    value="${cat.id}"
                                    ${selectedCategories.includes(cat.id) ? "checked" : ""}
                                />
                                <label for="cat_${cat.id}" style="margin:0; font-size: 0.9rem;">${cat.name}</label>
                                </div>
                            `
    )
    .join(""))}
                        </div>
                        <div class="new-category-box" style="display: grid; gap: 0.5rem; margin-bottom: 1.5rem;">
                          <input type="text" id="newCategoryName" class="sidebar-input" placeholder="Nombre de la categoría">
                          <input type="text" id="newCategorySlug" class="sidebar-input" placeholder="slug-opcional">
                          <button type="button" class="pill-btn" id="btnCreateCategory">Agregar categoría</button>
                          <p class="text-hint" style="margin:0;">Se creará en este tipo de contenido.</p>
                        </div>

                        <label class="sidebar-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Etiquetas</label>
                        <div class="checkbox-list" style="border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 0.375rem; max-height: 150px; overflow-y: auto;">
                            ${raw(tags
      .map(
        (tag) => `
                                <div class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <input 
                                    type="checkbox" 
                                    id="tag_${tag.id}" 
                                    name="tags[]" 
                                    value="${tag.id}"
                                    ${selectedTags.includes(tag.id) ? "checked" : ""}
                                />
                                <label for="tag_${tag.id}" style="margin:0; font-size: 0.9rem;">${tag.name}</label>
                                </div>
                            `
      )
      .join(""))}
                        </div>
                        <div class="new-tag-box" style="display: grid; gap: 0.5rem; margin-top: 0.75rem;">
                          <input type="text" id="newTagName" class="sidebar-input" placeholder="Nombre de la etiqueta">
                          <button type="button" class="pill-btn" id="btnCreateTag">Agregar etiqueta</button>
                        </div>
                    </div>
                </div>

                <!-- Featured Image -->
                 <div class="sidebar-panel" data-block-id="featured-image-section">
                    <div class="sidebar-panel-header" onclick="togglePanel('featuredImageContent', this)">
                        <label class="sidebar-label" style="margin:0;">Imagen Destacada</label>
                        <svg class="collapse-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div class="sidebar-panel-content" id="featuredImageContent" style="margin-top: 0.75rem; text-align: center;">
                        <div id="featuredImagePreviewContainer" style="background: #f3f4f6; border-radius: 6px; min-height: 150px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; cursor: pointer; border: 1px dashed #ccc;" onclick="openMediaPickerForFeatured()">
                           ${featuredImage
      ? html`<img src="${featuredImage.url}" style="max-width: 100%; border-radius: 6px;">`
      : html`<span style="color: #999; font-size: 0.8rem;">+ Seleccionar Imagen</span>`
    }
                        </div>
                        <input type="hidden" name="featuredImageId" id="featuredImageIdInput" value="${featuredImage?.id || ""}">
                    </div>
                 </div>

                 <!-- SEO Section (Full Suite) -->
                 <div class="sidebar-panel" data-block-id="seo-section">
                    <label class="sidebar-label" style="display: flex; justify-content: space-between; cursor: pointer;" onclick="const d = document.getElementById('seoDetails'); d.style.display = d.style.display === 'none' ? 'block' : 'none';">
                        <span>SEO Avanzado</span>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </label>
                    
                    <div id="seoDetails" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                        <!-- Basic -->
                        <div style="margin-bottom: 1rem;">
                            <label style="display:block; font-size: 0.8rem; font-weight: 600; color: #666; margin-bottom: 0.25rem;">Meta Title</label>
                            <input type="text" name="seo_metaTitle" class="sidebar-input" value="${seo?.metaTitle || ''}" placeholder="${post?.title || ''}">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display:block; font-size: 0.8rem; font-weight: 600; color: #666; margin-bottom: 0.25rem;">Meta Description</label>
                            <textarea name="seo_metaDescription" class="sidebar-input" rows="3">${seo?.metaDescription || ''}</textarea>
                        </div>
                        
                        <!-- OpenGraph -->
                        <details style="margin-bottom: 1rem; border: 1px solid #eee; border-radius: 4px; padding: 0.5rem;">
                            <summary style="font-size: 0.8rem; font-weight: 600; cursor: pointer;">Facebook / OpenGraph</summary>
                            <div style="margin-top: 0.5rem;">
                                <input type="text" name="seo_ogTitle" class="sidebar-input" placeholder="OG Title" value="${seo?.ogTitle || ''}" style="margin-bottom: 0.5rem;">
                                <textarea name="seo_ogDescription" class="sidebar-input" rows="2" placeholder="OG Description" style="margin-bottom: 0.5rem;">${seo?.ogDescription || ''}</textarea>
                                <input type="text" name="seo_ogImage" class="sidebar-input" placeholder="OG Image URL" value="${seo?.ogImage || ''}">
                            </div>
                        </details>

                        <!-- Twitter -->
                        <details style="margin-bottom: 1rem; border: 1px solid #eee; border-radius: 4px; padding: 0.5rem;">
                            <summary style="font-size: 0.8rem; font-weight: 600; cursor: pointer;">Twitter Card</summary>
                            <div style="margin-top: 0.5rem;">
                                <input type="text" name="seo_twitterTitle" class="sidebar-input" placeholder="Twitter Title" value="${seo?.twitterTitle || ''}" style="margin-bottom: 0.5rem;">
                                <textarea name="seo_twitterDescription" class="sidebar-input" rows="2" placeholder="Twitter Description" style="margin-bottom: 0.5rem;">${seo?.twitterDescription || ''}</textarea>
                                <input type="text" name="seo_twitterImage" class="sidebar-input" placeholder="Twitter Image URL" value="${seo?.twitterImage || ''}">
                            </div>
                        </details>
                        
                        <!-- Advanced -->
                        <div style="margin-bottom: 1rem;">
                             <label style="display:block; font-size: 0.8rem; font-weight: 600; color: #666; margin-bottom: 0.25rem;">Canonical URL</label>
                             <input type="text" name="seo_canonicalUrl" class="sidebar-input" value="${seo?.canonicalUrl || ''}">
                        </div>

                        <div style="margin-bottom: 0.5rem;">
                             <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                                <input type="checkbox" name="seo_noIndex" value="true" ${seo?.noIndex ? 'checked' : ''}>
                                No Index (Ocultar de Google)
                             </label>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                             <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                                <input type="checkbox" name="seo_noFollow" value="true" ${seo?.noFollow ? 'checked' : ''}>
                                No Follow
                             </label>
                        </div>
                    </div>
                 </div>

                 <!-- Plugin Widgets -->
                 ${pluginSidebarWidgets.length > 0 ? pluginSidebarWidgets.map(widget => html`
                   <div class="sidebar-panel" data-block-id="plugin-${widget.id}">
                     <div class="sidebar-panel-header" onclick="togglePanel('pluginWidget_${widget.id}', this)">
                       <label class="sidebar-label" style="margin:0;">
                         ${widget.icon ? html`<span style="margin-right: 0.5rem;">${widget.icon}</span>` : ''}
                         ${widget.title}
                       </label>
                       <svg class="collapse-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                     <div class="sidebar-panel-content ${widget.collapsed ? 'collapsed' : ''}" id="pluginWidget_${widget.id}" style="margin-top: 0.75rem;">
                       ${raw(widget.html)}
                     </div>
                   </div>
                 `) : ''}
            </div>

        </div>
    </form>

    ${html`
      <script>
        window.POST_CONTENT_TYPE_ID = ${contentTypeId};
        
        // Global helper to insert content into the editor
        window.insertIntoEditor = function(content) {
          // Try TipTap first
          if (window.editorInstance && window.editorInstance.chain) {
            window.editorInstance.chain().focus().insertContent(content).run();
            console.log('[Editor] Inserted via TipTap:', content);
            return true;
          }
          
          // Fallback: append to hidden body input
          const bodyInput = document.querySelector('[name="body"]');
          if (bodyInput) {
            const separator = bodyInput.value ? '\\n\\n' : '';
            bodyInput.value += separator + content;
            bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[Editor] Inserted via body input:', content);
            return true;
          }
          
          console.warn('[Editor] Could not insert content');
          return false;
        };
        
        document.addEventListener('DOMContentLoaded', () => {
           // Zen Mode Toggle
           const zenBtn = document.getElementById('zenModeBtn');
           const layout = document.getElementById('postFormLayout');
           
           if(zenBtn && layout) {
               zenBtn.addEventListener('click', () => {
                   const isZen = layout.classList.toggle('is-zen-mode');
                   // Update Icon
                   if (isZen) {
                       zenBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 14h6v6M10 4H4v6M20 10h-6V4M14 20h6v-6"/></svg>'; 
                       zenBtn.title = "Salir del Modo Zen";
                   } else {
                       zenBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'; 
                       zenBtn.title = "Modo Zen (Expandir Editor)";
                   }
               });
           }

           // Toggle sidebar panel collapse
           window.togglePanel = function(contentId, headerEl) {
             const content = document.getElementById(contentId);
             if (!content) return;
             
             const isCollapsed = content.classList.contains('collapsed');
             
             if (isCollapsed) {
               // Expand
               content.classList.remove('collapsed');
               headerEl.classList.remove('collapsed');
               content.style.maxHeight = content.scrollHeight + 'px';
               setTimeout(() => { content.style.maxHeight = 'none'; }, 250);
             } else {
               // Collapse
               content.style.maxHeight = content.scrollHeight + 'px';
               requestAnimationFrame(() => {
                 content.classList.add('collapsed');
                 headerEl.classList.add('collapsed');
                 content.style.maxHeight = '0';
               });
             }
           };

           // Editor Mode Toggle
           const modeBtns = document.querySelectorAll('.mode-btn');
           const editorWrapper = document.querySelector('.lex-editor-wrapper'); 
           
           modeBtns.forEach(btn => {
              btn.addEventListener('click', () => {
                  const mode = btn.dataset.mode;
                  modeBtns.forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  if (editorWrapper) {
                      editorWrapper.classList.remove('editor-mode-classic', 'editor-mode-blocks');
                      editorWrapper.classList.add('editor-mode-' + mode);
                  }
              });
           });

           // Auto Slug
           const titleInput = document.querySelector('input[name="title"]');
           const slugInput = document.getElementById('slugInput');
           
           if (titleInput && slugInput) {
               titleInput.addEventListener('input', () => {
                   if (!slugInput.value) { // Only auto-update if empty or untouched (logic could be improved but simple for now)
                       const slug = titleInput.value.toLowerCase().trim()
                           .replace(/[^a-z0-9]+/g, '-')
                           .replace(/^-+|-+$/g, '');
                       slugInput.value = slug;
                   }
               });
               
               // Also allow manual slug editing to stick (don't overwrite if user edited)
               slugInput.addEventListener('change', () => {
                   slugInput.dataset.manual = 'true';
               });
               
               // Improved logic: update if not manually changed
               titleInput.addEventListener('keyup', () => {
                   if(slugInput.dataset.manual !== 'true') {
                       const slug = titleInput.value.toLowerCase().trim()
                           .replace(/[^a-z0-9]+/g, '-')
                           .replace(/^-+|-+$/g, '');
                       slugInput.value = slug; 
                   }
               });
           }

           // Inline create category
           const btnCreateCategory = document.getElementById('btnCreateCategory');
           const catNameInput = document.getElementById('newCategoryName');
           const catSlugInput = document.getElementById('newCategorySlug');
           const categoryList = document.getElementById('categoryList');

           btnCreateCategory?.addEventListener('click', async () => {
              if (!(catNameInput && categoryList)) return;
              const name = catNameInput.value.trim();
              let slug = (catSlugInput && catSlugInput.value.trim()) || '';
              if (!name) {
                alert('Ingresa un nombre de categoría');
                return;
              }
              if (!slug) {
                slug = name.toLowerCase().trim()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
              }
              const btn = btnCreateCategory;
              btn.textContent = 'Creando...';
              btn.disabled = true;
              try {
                const res = await fetch('/api/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    slug,
                    contentTypeId: window.POST_CONTENT_TYPE_ID,
                  }),
                });
                if (!res.ok) {
                  const msg = await res.text();
                  throw new Error(msg || 'Error al crear la categoría');
                }
                const data = await res.json();
                const cat = data.category;
                const wrapper = document.createElement('div');
                wrapper.className = 'checkbox-item';
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '0.5rem';
                wrapper.style.marginBottom = '0.25rem';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.name = 'categoryIds[]';
                input.id = 'cat_' + cat.id;
                input.value = cat.id;
                input.checked = true;

                const label = document.createElement('label');
                label.setAttribute('for', 'cat_' + cat.id);
                label.style.margin = '0';
                label.style.fontSize = '0.9rem';
                label.textContent = cat.name;

                wrapper.appendChild(input);
                wrapper.appendChild(label);
                categoryList.appendChild(wrapper);

                catNameInput.value = '';
                if (catSlugInput) catSlugInput.value = '';
              } catch (err) {
                alert(err?.message || 'No se pudo crear la categoría');
              } finally {
                btn.textContent = 'Agregar categoría';
                btn.disabled = false;
              }
           });

           // Inline create tag
           const btnCreateTag = document.getElementById('btnCreateTag');
           const tagNameInput = document.getElementById('newTagName');
           const tagList = document.querySelector('.checkbox-list:last-of-type');

           btnCreateTag?.addEventListener('click', async () => {
              if (!tagNameInput) return;
              const name = tagNameInput.value.trim();
              if (!name) {
                alert('Ingresa un nombre de etiqueta');
                return;
              }
              const slug = name.toLowerCase().trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              const btn = btnCreateTag;
              btn.textContent = 'Creando...';
              btn.disabled = true;
              try {
                const res = await fetch('/api/tags', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, slug }),
                });
                if (!res.ok) {
                  const msg = await res.text();
                  throw new Error(msg || 'Error al crear la etiqueta');
                }
                const data = await res.json();
                const tag = data.tag;
                
                // Find the tags checkbox list (second checkbox-list in sidebar)
                const allCheckboxLists = document.querySelectorAll('#customizableSidebar .checkbox-list');
                const tagsListContainer = allCheckboxLists[1]; // Second one is tags
                
                if (tagsListContainer) {
                  const wrapper = document.createElement('div');
                  wrapper.className = 'checkbox-item';
                  wrapper.style.display = 'flex';
                  wrapper.style.alignItems = 'center';
                  wrapper.style.gap = '0.5rem';
                  wrapper.style.marginBottom = '0.25rem';

                  const input = document.createElement('input');
                  input.type = 'checkbox';
                  input.name = 'tags[]';
                  input.id = 'tag_' + tag.id;
                  input.value = tag.id;
                  input.checked = true;

                  const label = document.createElement('label');
                  label.setAttribute('for', 'tag_' + tag.id);
                  label.style.margin = '0';
                  label.style.fontSize = '0.9rem';
                  label.textContent = tag.name;

                  wrapper.appendChild(input);
                  wrapper.appendChild(label);
                  tagsListContainer.appendChild(wrapper);
                }

                tagNameInput.value = '';
              } catch (err) {
                alert(err?.message || 'No se pudo crear la etiqueta');
              } finally {
                btn.textContent = 'Agregar etiqueta';
                btn.disabled = false;
              }
           });
        });

        // Simplified Media Picker for Featured Image
        function openMediaPickerForFeatured() {
             if (window.openMediaPicker) {
                  window.openMediaPicker({
                      type: 'image',
                      onSelect: (media) => {
                          const container = document.getElementById('featuredImagePreviewContainer');
                          const input = document.getElementById('featuredImageIdInput');
                          if (media && media.url) {
                              container.innerHTML = \`<img src="\${media.url}" style="max-width: 100%; border-radius: 6px;">\`;
                              input.value = media.id;
                          }
                      }
                  });
             }
        }
      </script>
    `}

    ${AutoSaveScript({ formId: "postForm", saveUrl: `${env.ADMIN_PATH}/posts/autosave` })}
    ${SidebarCustomizationScript()}
  `;

  return AdminLayoutNexus({
    user,
    title: pageTitle,
    children: content_html,
    notifications,
    unreadNotificationCount,
    activeUrl: `${env.ADMIN_PATH}/posts`,
  });
};
