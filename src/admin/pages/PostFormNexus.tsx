import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge, MinimalSection, SidebarCustomizationPanel, SidebarCustomizationScript } from "../components/nexus/NexusComponents.tsx";
import { MediaPickerModal } from "../components/MediaPickerModal.tsx";
import { TipTapEditor } from "../components/TipTapEditor.tsx";
import { AutoSaveIndicator, AutoSaveScript } from "../components/AutoSaveIndicator.tsx";
import { ImmersiveModeStyles, ImmersiveModeScript, ImmersiveModeToggle } from "../components/ImmersiveMode.tsx";
import { EditorEnhancements, WordCounter, SeoScoreWidget, EditorEnhancementsScript } from "../components/EditorEnhancements.tsx";
import { env } from "../../config/env.ts";

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

      /* ========== FORM LAYOUT - FOCUS MODE ========== */
      .post-form-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px; /* Prevent grid blowout */
        gap: 4rem;
        padding: 4rem 0;
        max-width: 1200px;
        margin: 0 auto;
        align-items: start; /* Fix sidebar height */
      }

      /* Editor Mode Toggle */
      .editor-mode-toggle {
        display: flex;
        background: #f3f4f6;
        padding: 4px;
        border-radius: 999px;
        gap: 4px;
      }
      
      .mode-btn {
        border: none;
        background: transparent;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .mode-btn.active {
        background: white;
        color: #000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      /* ========== FORM FIELDS REPAIRED ========== */
      .form-input {
        background: #fff;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      /* sticky toolbar */
      .editor-toolbar-sticky {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        margin: -2rem -2rem 2rem -2rem; /* Negative margin to span full width if inside padded container */
        padding: 1rem 2rem;
        border-bottom: 1px solid #eef0f2;
        display: flex;
        justify-content: flex-end; /* Align items to the right */
        align-items: center;
        gap: 0.75rem;
      }
      
      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        text-decoration: none;
      }
      
      .toolbar-btn-ghost {
        background: transparent;
        color: #666;
        border-color: #eef0f2;
      }
      .toolbar-btn-ghost:hover {
        background: #f8f9fa;
        color: #333;
      }

      .toolbar-btn-primary {
        background: #000;
        color: white;
      }
      .toolbar-btn-primary:hover {
        background: #333;
        transform: translateY(-1px);
      }
      
      /* Scheduling Popover */
      .schedule-popover {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        width: 320px;
        z-index: 100;
        display: none;
      }
      .schedule-popover.active {
        display: block;
        animation: fadeIn 0.15s ease-out;
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

      .post-form-layout .form-input:focus,
      .post-form-layout .form-select:focus,
      .post-form-layout textarea:focus {
        outline: none;
        border-bottom-color: #167bff;
        box-shadow: none !important;
        background: transparent;
      }

      .post-form-layout .form-hint {
        font-size: 0.75rem;
        color: #999;
        margin-top: 0.25rem;
      }

      /* ========== RESPONSIVE ========== */
      }

      /* ========== FOCUS MODE TYPOGRAPHY & OVERRIDES ========== */
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap');

      /* Main Title Input - Huge & Serif */
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

      /* Excerpt - Subtle Italic */
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

      /* Labels - Hide labels for Title and Excerpt for purity */
      .post-form-layout .form-field:has(input[name="title"]) label,
      .post-form-layout .form-field:has(textarea[name="excerpt"]) label {
        display: none !important;
      }

      /* Sidebar minimalist inputs */
      .post-form-layout #customizableSidebar .form-input,
      .post-form-layout #customizableSidebar textarea {
        font-size: 0.85rem !important;
        padding: 0.25rem 0 !important;
        border-bottom: 1px solid #eee !important;
        color: #333 !important;
      }
      
      .post-form-layout #customizableSidebar {
        display: flex;
        flex-direction: column;
        gap: 0;
        position: sticky;
        top: 2rem;
        max-height: calc(100vh - 4rem);
        overflow-y: auto;
        /* Custom scrollbar */
        scrollbar-width: thin;
        scrollbar-color: #ddd transparent;
      }
      .post-form-layout #customizableSidebar::-webkit-scrollbar {
        width: 4px;
      }
      .post-form-layout #customizableSidebar::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
      }


      
      .post-form-layout #customizableSidebar label {
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.1em !important;
        color: #aaa !important;
      }

      /* Main Action Button Class */
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
      .btn-action-main:active {
        transform: translateY(0);
        box-shadow: none;
      }
      
      /* Toast Notification */
      .cms-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: white;
        color: #1e2328;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 9999;
        transform: translateY(150%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border-left: 4px solid #000;
      }
      .cms-toast.show {
        transform: translateY(0);
      }
      .cms-toast.success { border-left-color: #059669; }
      .cms-toast.error { border-left-color: #dc2626; }
      .cms-toast.info { border-left-color: #2563eb; }

      /* Remove all card styling */
      .nexus-card {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }

      /* Hide Page Header for ultra focus */
      .page-header-nexus {
        display: none;
      }

      /* Custom container for main content */
      .main-content-container {
        max-width: 740px; /* Optimal line length ~65ch */
        margin: 0 auto;   /* Center within the first grid column */
      }

      /* CKEditor Overrides for Focus Mode */
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
      
      /* Hide toolbar when not focused? Optional, maybe later */
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 class="page-title-nexus">${pageTitle}</h1>
          <p class="page-subtitle-nexus">
            ${isEdit ? "Actualiza tu entrada de blog" : "Crea una nueva entrada para tu blog"}
          </p>
        </div>
        ${AutoSaveIndicator({})}
      </div>
    </div>

    ${ImmersiveModeToggle()}

    ${SidebarCustomizationPanel()}
    ${MediaPickerModal()}

    <!-- Form Layout -->
    <form method="POST" action="${formAction}" enctype="multipart/form-data" autocomplete="off">
      <!-- FAKE FIELDS TO TRICK BROWSER AUTOFILL (Honey Pot) -->
      <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1;">
          <input type="text" name="fake_username_prevention" autocomplete="username" tabindex="-1" />
          <input type="password" name="fake_password_prevention" autocomplete="current-password" tabindex="-1" />
      </div>

      <div class="post-form-layout">
        <!-- Main Content -->
        
        <div class="main-content-wrapper">
          
          <div class="main-content-container">
              <!-- Sticky Toolbar -->
              <div class="editor-toolbar-sticky">
                   <!-- Editor Mode Toggle -->
                   <div class="editor-mode-toggle" id="editorModeToggle">
                       <button type="button" class="mode-btn mode-classic active" data-mode="classic">Clásico</button>
                       <button type="button" class="mode-btn mode-blocks" data-mode="blocks">Bloques</button>
                   </div>

                   <div style="flex: 1"></div> <!-- Spacer -->

                   <div class="save-status" id="autoSaveIndicator">
                      ${AutoSaveIndicator({})}
                   </div>
              </div>

              <!-- Title -->
              <div class="form-field">
                <input
                  type="text"
                  id="postTitleInput"
                  name="title"
                  value="${post?.title || ""}"
                  placeholder="Título de la entrada"
                  class="form-input"
                  required
                />
                ${errors.title ? html`<p class="form-error">${errors.title}</p>` : ""}
              </div>

              <!-- Slug moved to Sidebar -->

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
                ${TipTapEditor({
    name: "body",
    value: post?.body || "",
    placeholder: "Escribe la entrada aquí...",
    required: true,
    editorMode: initialEditorMode,
  })}
            
            ${WordCounter()}
            ${errors.body ? html`<p class="form-error">${errors.body}</p>` : ""}
          </div>
        </div>
      </div>

        <!-- Sidebar -->
        <!-- Sidebar -->
        <div id="customizableSidebar">
          <!-- Hidden Input for Panel Control -->
          <input
            type="hidden"
            name="commentsEnabled"
            id="commentsEnabledInput"
            value="${!post || post.commentsEnabled ? 'true' : 'false'}"
          />

          <!-- 1. Publish Settings (Without Buttons) -->
          ${MinimalSection({
    id: "publish-section",
    title: "Publicación",
    children: html`
     <!-- Native Status Select -->
              <div class="form-field" style="margin-bottom: 1.5rem;">
                <label class="form-label">Estado de la Publicación</label>
                <div style="position: relative;">
                  <select 
                    name="status" 
                    id="statusSelect" 
                    class="form-select"
                    style="appearance: none; -webkit-appearance: none; padding-right: 2rem; font-weight: 500; cursor: pointer;"
                    onchange="handleStatusChange(this.value)"
                  >
                    <option value="draft" ${!post || post.status === 'draft' ? 'selected' : ''}>📝 Borrador</option>
                    <option value="published" ${post?.status === 'published' ? 'selected' : ''}>🟢 Publicado</option>
                    <option value="scheduled" ${post?.status === 'scheduled' ? 'selected' : ''}>📅 Programado</option>
                  </select>
                  <div style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #666; font-size: 0.8rem;">▼</div>
                </div>
              </div>

              <!-- Scheduled Date Input -->
              <div class="form-field" id="scheduledAtField" style="display: ${post?.status === 'scheduled' ? 'block' : 'none'}; animation: slideDown 0.2s ease;">
                <label class="form-label">Fecha de Programación</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  id="scheduledAtInput"
                  value="${post?.scheduledAt || ""}"
                  class="form-input"
                  style="border-bottom: 1px solid #167bff !important; background: #f8fbff !important;"
                />
              </div>

              <!--Action Buttons-- >
              <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <button
                  type="submit"
                  id="mainActionBtn"
                  class="btn-action-main"
                >
                  ${isEdit ? "Guardar Cambios" : "Guardar Entrada"}
                </button>
              </div>

              <!--Visibility -->
              <div class="form-field">
                <label class="form-label">Visibilidad</label>
                <select name="visibility" class="form-select">
                  <option value="public" ${!post || post.visibility === "public" ? "selected" : ""}>Público</option>
                  <option value="private" ${post?.visibility === "private" ? "selected" : ""}>Privado</option>
                  <option value="password" ${post?.visibility === "password" ? "selected" : ""}>Contraseña</option>
                </select>
              </div>

              <!--Password -->
    <div class="form-field" id="passwordField" style="display: ${post?.visibility === 'password' ? 'block' : 'none'};">
      <input
        type="password"
        name="password"
        value="${post?.password || ""}"
      placeholder="Contraseña"
      class="form-input"
                />
    </div>
  `
  })}

          <!-- 3. Slug -->
          ${MinimalSection({
    id: "slug-section",
    title: "Enlace Permanente",
    children: html`
              <div class="form-field">
                <input
                  type="text"
                  id="postSlugInput"
                  name="slug"
                  value="${post?.slug || ""}"
                  placeholder="url-amigable"
                  class="form-input"
                  autocomplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  readonly
                  onfocus="this.removeAttribute('readonly');"
                />
                <p class="form-hint" style="font-size: 0.7rem;">Se genera desde el título</p>
                ${errors.slug ? html`<p class="form-error">${errors.slug}</p>` : ""}
              </div>
            `
  })}

          <!-- 4. Organization (Categories + Tags) -->
          ${MinimalSection({
    id: "organization-section",
    title: "Organización",
    children: html`
              <!-- Categories -->
              <div style="margin-bottom: 1.5rem;">
                <label class="form-label">Categorías</label>
                ${categories.length > 0 ? html`
                  <div class="checkbox-list" id="categories-list" style="max-height: 150px; margin-bottom: 0.5rem;">
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
                ` : html`<p style="font-size: 0.8rem; color: #999;">No hay categorías.</p>`}
                
                <!-- Add Category -->
                <div style="display: flex; gap: 0.5rem;">
                   <input type="text" id="newCategoryInput" placeholder="+ Nueva Cat." class="form-input" style="font-size: 0.8rem; padding: 0.25rem;" />
                   <button type="button" onclick="addNewCategory()" style="background: none; border: 1px solid #ddd; cursor: pointer;">+</button>
                   <input type="hidden" id="newCategoriesData" name="newCategories" value="" />
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label class="form-label">Etiquetas</label>
                 ${tags.length > 0 ? html`
                  <div class="checkbox-list" id="tags-list" style="max-height: 150px; margin-bottom: 0.5rem;">
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
                ` : html`<p style="font-size: 0.8rem; color: #999;">No hay etiquetas.</p>`}

                <!-- Add Tag -->
                <div style="display: flex; gap: 0.5rem;">
                   <input type="text" id="newTagInput" placeholder="+ Nueva Etiqueta" class="form-input" style="font-size: 0.8rem; padding: 0.25rem;" />
                   <button type="button" onclick="addNewTag()" style="background: none; border: 1px solid #ddd; cursor: pointer;">+</button>
                   <input type="hidden" id="newTagsData" name="newTags" value="" />
                </div>
              </div>
            `
  })}

          <!-- 5. Featured Image -->
          ${MinimalSection({
    id: "featured-image-section",
    title: "Imagen Destacada",
    children: html`
               <div id="featuredImagePreview" style="margin-bottom: 1rem;">
                ${featuredImage ? html`
                  <img id="featuredImageImg" src="${featuredImage.url}" style="width: 100%; border-radius: 4px;" />
                  <button type="button" onclick="removeFeaturedImage()" style="font-size: 0.75rem; color: red; background: none; border: none; cursor: pointer; margin-top: 0.5rem;">Quitar imagen</button>
                ` : html`<div style="font-size: 0.8rem; color: #999; text-align: center; border: 1px dashed #ddd; padding: 1rem;">Sin imagen</div>`}
               </div>
               <input type="hidden" id="featuredImageId" name="featuredImageId" value="${featuredImage?.id || ''}" />
               <button type="button" onclick="selectFeaturedImage()" style="width: 100%; font-size: 0.8rem; border: 1px solid #ddd; padding: 0.5rem; background: transparent; cursor: pointer;">Seleccionar Imagen</button>
            `
  })}

          <!-- 6. SEO -->
          ${MinimalSection({
    id: "seo-section",
    title: "SEO",
    defaultOpen: false,
    children: html`
              <div class="form-field">
                <input type="text" name="seoMetaTitle" value="${seo.metaTitle || ""}" placeholder="Meta Título" class="form-input" />
              </div>
              <div class="form-field">
                <textarea name="seoMetaDescription" rows="2" placeholder="Meta Descripción" class="form-input">${seo.metaDescription || ""}</textarea>
              </div>
            `
  })}
        </div>

          <!-- Form Actions -->
    </form>



    ${raw(`<script>
      // Auto-generate slug from title (XSS safe)
      document.addEventListener('DOMContentLoaded', function() {
        // Auto-generate slug (Restored from git version + Debug)
        console.log('PostFormNexus: Initializing slug generation (Git Ver)');
        
        // Using querySelector as per original working version
        const titleInput = document.querySelector('input[name="title"]');
        const slugInput = document.querySelector('input[name="slug"]');
        
        console.log('PostFormNexus: Found inputs?', { 
            title: !!titleInput, 
            slug: !!slugInput,
            titleValue: titleInput ? titleInput.value : 'N/A',
            slugValue: slugInput ? slugInput.value : 'N/A'
        });

        if (titleInput && slugInput) {
            // Check if slug has an '@' symbol (likely autofilled email)
            if (slugInput.value.includes('@')) {
                console.log('PostFormNexus: Detected email in slug (autofill), clearing...');
                slugInput.value = '';
                slugInput.dataset.manuallyEdited = ''; // Reset flag
            }

            // Clear autofilled junk if newly creating
            if (!slugInput.value && !slugInput.dataset.manuallyEdited) {
               slugInput.value = '';
            }
            
            titleInput.addEventListener('input', function() {
                if (!slugInput.dataset.manuallyEdited) {
                    const slug = titleInput.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    
                    slugInput.value = slug;
                    console.log('PostFormNexus: Slug updated', slug);
                }
            });

            slugInput.addEventListener('input', function() {
                slugInput.dataset.manuallyEdited = 'true';
            });
        }




      });

      // Unified Media Picker Integration
      window.selectFeaturedImage = function() {
        if (window.openMediaPicker) {
            window.openMediaPicker({
                type: 'image',
                onSelect: (media) => {
                    const previewDiv = document.getElementById('featuredImagePreview');
                    const hiddenInput = document.getElementById('featuredImageId');
                    
                    if (previewDiv && hiddenInput && media) {
                        hiddenInput.value = media.id;
                        previewDiv.innerHTML = \`
                            <img id="featuredImageImg" src="\${media.url}" style="width: 100%; border-radius: 4px;" />
                            <button type="button" onclick="removeFeaturedImage()" style="font-size: 0.75rem; color: red; background: none; border: none; cursor: pointer; margin-top: 0.5rem;">Quitar imagen</button>
                        \`;
                    }
                }
            });
        } else {
            console.error('Unified Media Picker not initialized');
        }
      };

      // Legacy code removed


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
        const catName = input.value.trim();

        if (!catName) {
          alert('Por favor ingresa un nombre para la categoría');
          return;
        }

        // Add to temporary array
        newCategories.push(catName);

        // Update hidden input
        document.getElementById('newCategoriesData').value = JSON.stringify(newCategories);

        // Add visual feedback
        let checkboxList = document.getElementById('categories-list');
        
        // If list doesn't exist (because empty state), create it
        if (!checkboxList) {
           const container = input.closest('.minimal-section-body') || input.parentElement.parentElement;
           const emptyMsg = container.querySelector('p');
           if (emptyMsg) emptyMsg.remove();
           
           checkboxList = document.createElement('div');
           checkboxList.id = 'categories-list';
           checkboxList.className = 'checkbox-list';
           checkboxList.style.marginBottom = '1rem';
           checkboxList.style.maxHeight = '150px';
           
           // Insert before the input container
           input.parentElement.parentElement.insertBefore(checkboxList, input.parentElement.parentElement.querySelector('div:last-child'));
           // Actually simpler: insert before the "Add Category" div
           const addDiv = input.parentElement.parentElement.querySelector('div:has(#newCategoryInput)'); // modern browser support?
           // Fallback if structure is complex:
           // The structure is: Label -> List(maybe) -> AddDiv
           // Just look for the label "Categorías", insert after it? No.
           // Let's rely on finding where to put it relative to the input container.
           // The input container is div style="display: flex..."
           const addContainer = input.parentElement; // div flex
           const wrapper = addContainer.parentElement; // div wrapper
           wrapper.insertBefore(checkboxList, addContainer);
        }

        if (checkboxList) {
          const newItem = document.createElement('div');
          newItem.className = 'checkbox-item';
          newItem.style.background = '#e8f4ff';
          newItem.innerHTML = \`
            <input type="checkbox" checked disabled style="width: 18px; height: 18px;">
            <label style="font-size: 0.875rem; color: #1e2328;">\${catName} <em style="color: #167bff;">(nueva)</em></label>
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
        let checkboxList = document.getElementById('tags-list');
        
        if (!checkboxList) {
           const container = input.parentElement.parentElement;
           const emptyMsg = container.querySelector('p');
           if (emptyMsg) emptyMsg.remove();
           
           checkboxList = document.createElement('div');
           checkboxList.id = 'tags-list';
           checkboxList.className = 'checkbox-list';
           checkboxList.style.marginBottom = '0.5rem';
           checkboxList.style.maxHeight = '150px';
           
           const addContainer = input.parentElement;
           const wrapper = addContainer.parentElement;
           wrapper.insertBefore(checkboxList, addContainer);
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
      
      
      // Handle Status Change from Select
      window.handleStatusChange = function(status) {
        const scheduleField = document.getElementById('scheduledAtField');
        const mainBtn = document.getElementById('mainActionBtn');
        const isEditMode = ${isEdit}; // Injected boolean
        
        // Toggle Schedule Field
        if (status === 'scheduled') {
           if (scheduleField) scheduleField.style.display = 'block';
           if (mainBtn) mainBtn.textContent = 'Programar';
        } else if (status === 'published') {
           if (scheduleField) scheduleField.style.display = 'none';
           if (mainBtn) {
             if (isEditMode) {
                mainBtn.textContent = 'Actualizar';
             } else {
                mainBtn.textContent = 'Publicar Ahora';
             }
           }
        } else {
           // Draft
           if (scheduleField) scheduleField.style.display = 'none';
           if (mainBtn) mainBtn.textContent = 'Guardar Borrador';
        }
      };
      
      // Initialize Status UI on Load
      document.addEventListener('DOMContentLoaded', () => {
         const select = document.getElementById('statusSelect');
         if (select && window.handleStatusChange) {
            window.handleStatusChange(select.value);
         }
         
         // Check for pending toasts
         const pendingToast = sessionStorage.getItem('pendingToast');
         if (pendingToast) {
             try {
                const data = JSON.parse(pendingToast);
                showToast(data.message, data.type);
                sessionStorage.removeItem('pendingToast');
             } catch(e) {
                console.error('Toast error', e); 
             }
         }
         
         // Intercept Form Submit
         const form = document.querySelector('form');
         if (form) {
             form.addEventListener('submit', function() {
                 const status = document.getElementById('statusSelect')?.value;
                 let message = 'Cambios guardados';
                 let type = 'success';
                 
                 if (status === 'scheduled') {
                    const dateInput = document.getElementById('scheduledAtInput');
                    const dateVal = dateInput ? dateInput.value : '';
                    const dateStr = dateVal ? new Date(dateVal).toLocaleString() : 'la fecha seleccionada';
                    message = 'Entrada programada para ' + dateStr;
                    type = 'info';
                 } else if (status === 'draft') {
                    message = 'Borrador guardado correctamente';
                    type = 'info';
                 } else if (status === 'published') {
                     message = 'Entrada publicada con éxito';
                     type = 'success';
                 }
                 
                 sessionStorage.setItem('pendingToast', JSON.stringify({ message, type }));
             });
         }
      });
      
      // Toast Function
      function showToast(message, type) {
          if (!type) type = 'info';
          
          // Create if not exists
          let toast = document.getElementById('cmsToast');
          if (!toast) {
              toast = document.createElement('div');
              toast.id = 'cmsToast';
              toast.className = 'cms-toast';
              document.body.appendChild(toast);
          }
          
          // Set content
          let icon = 'ℹ️';
          if (type === 'success') icon = '✅';
          if (type === 'error') icon = '⚠️';
          
          toast.className = 'cms-toast ' + type;
          toast.innerHTML = '<span>' + icon + '</span><span style="font-weight: 500;">' + message + '</span>';
          
          // Show
          setTimeout(() => toast.classList.add('show'), 10);
          
          // Hide after 4s
          setTimeout(() => {
              toast.classList.remove('show');
          }, 4000);
      }
    </script>`)}

    ${AutoSaveScript()}
    ${ImmersiveModeScript()}
    ${EditorEnhancementsScript()}
    ${SidebarCustomizationScript()}

    ${raw(`<script>
      // Editor Mode Logic
      (function() {
        const toggleContainer = document.getElementById('editorModeToggle');
        if (!toggleContainer) return;
        
        const modeBtns = toggleContainer.querySelectorAll('.mode-btn');
        let currentMode = localStorage.getItem('nexus_editor_mode') || 'classic';
        
        // Update UI
        function updateToggleUI(mode) {
            modeBtns.forEach(btn => {
                if (btn.dataset.mode === mode) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            
            const wrapper = document.querySelector('.lex-editor-wrapper');
            if (wrapper) {
                if (mode === 'blocks') {
                    wrapper.classList.add('editor-mode-blocks');
                    wrapper.classList.remove('editor-mode-classic');
                } else {
                    wrapper.classList.add('editor-mode-classic');
                    wrapper.classList.remove('editor-mode-blocks');
                }
            }
        }
        
        // Initialize
        updateToggleUI(currentMode);
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newMode = btn.dataset.mode;
                currentMode = newMode;
                localStorage.setItem('nexus_editor_mode', newMode);
                updateToggleUI(newMode);
            });
        });
        
      })();
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
