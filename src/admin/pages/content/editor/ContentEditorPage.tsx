import { html } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton } from "@/admin/components/ui/index.ts";
import { env } from "@/config/env.ts";
import { MainContentPanel } from "./MainContentPanel.tsx";
import { PublishSettingsCard } from "./PublishSettingsCard.tsx";
import { FeaturedImageCard } from "./FeaturedImageCard.tsx";
import { TaxonomyCard } from "./TaxonomyCard.tsx";
import { FeaturedImageModal } from "./FeaturedImageModal.tsx";
import { ContentEditorScripts } from "./ContentEditorScripts.tsx";

interface ContentEditorPageProps {
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

export const ContentEditorPage = (props: ContentEditorPageProps) => {
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
      .page-header-nexus { margin-bottom: 2rem; }
      .page-title-nexus { font-size: 2rem; font-weight: 700; color: var(--nexus-base-content, #1e2328); letter-spacing: -0.025em; margin: 0 0 0.5rem 0; }
      .page-subtitle-nexus { font-size: 0.9375rem; color: var(--nexus-base-content, #1e2328); opacity: 0.65; margin: 0; }
      
      .content-form-layout { display: grid; grid-template-columns: 1fr 350px; gap: 1.5rem; margin-bottom: 2rem; }
      @media (max-width: 1280px) { .content-form-layout { grid-template-columns: 1fr; } }

      /* Common styles for child components */
      .form-field { margin-bottom: 1.5rem; }
      .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--nexus-base-content, #1e2328); margin-bottom: 0.5rem; }
      .form-input, .form-textarea, .form-select { 
        width: 100%; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--nexus-base-content, #1e2328); 
        background: var(--nexus-base-100, #fff); border: 1px solid var(--nexus-base-300, #dcdee0); 
        border-radius: var(--nexus-radius-md, 0.5rem); transition: all 0.2s; 
      }
      .form-textarea { min-height: 400px; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; resize: vertical; }
      .form-input:focus, .form-textarea:focus, .form-select:focus { 
        outline: none; border-color: var(--nexus-primary, #167bff); box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1); 
      }
      .form-error { color: var(--nexus-error, #f31260); font-size: 0.8125rem; margin-top: 0.5rem; }
      .form-hint { font-size: 0.8125rem; color: var(--nexus-base-content, #1e2328); opacity: 0.6; margin-top: 0.5rem; }
      
      /* Checkbox Lists */
      .checkbox-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--nexus-base-200, #eef0f2); border-radius: var(--nexus-radius-md, 0.5rem); padding: 0.75rem; }
      .checkbox-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: var(--nexus-radius-sm, 0.25rem); transition: background 0.2s; }
      .checkbox-item:hover { background: var(--nexus-base-200, #eef0f2); }
      .checkbox-item input[type="checkbox"] { width: 18px; height: 18px; border: 2px solid var(--nexus-base-300, #dcdee0); border-radius: var(--nexus-radius-sm, 0.25rem); cursor: pointer; transition: all 0.2s; }
      .checkbox-item input[type="checkbox"]:checked { background: var(--nexus-primary, #167bff); border-color: var(--nexus-primary, #167bff); }
      .checkbox-item label { cursor: pointer; font-size: 0.875rem; color: var(--nexus-base-content, #1e2328); }

      /* Toggle Switch */
      .toggle-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--nexus-base-100, #fff); border: 1px solid var(--nexus-base-200, #eef0f2); border-radius: var(--nexus-radius-md, 0.5rem); }
      .toggle-label { font-size: 0.875rem; font-weight: 500; color: var(--nexus-base-content, #1e2328); }
      .toggle-switch { position: relative; width: 44px; height: 24px; }
      .toggle-switch input[type="checkbox"] { opacity: 0; width: 0; height: 0; }
      .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--nexus-base-300, #dcdee0); border-radius: 24px; transition: 0.3s; }
      .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.3s; }
      .toggle-switch input:checked + .toggle-slider { background-color: var(--nexus-primary, #167bff); }
      .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }

      /* Status Badges */
      .status-select-wrapper { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .status-option { position: relative; }
      .status-option input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }
      .status-option label { display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 2px solid var(--nexus-base-300, #dcdee0); border-radius: var(--nexus-radius-md, 0.5rem); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
      .status-option input[type="radio"]:checked + label { border-color: var(--nexus-primary, #167bff); background: rgba(22, 123, 255, 0.08); color: var(--nexus-primary, #167bff); }

      .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--nexus-base-200, #eef0f2); }
      
      @media (max-width: 768px) {
        .page-title-nexus { font-size: 1.5rem; }
        .status-select-wrapper { grid-template-columns: 1fr; }
        .form-actions { flex-direction: column; }
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
        ${MainContentPanel({ content, seo, errors })}

        <!-- Sidebar -->
        <div>
          ${PublishSettingsCard({ content, contentTypes })}
          
          ${FeaturedImageCard({ featuredImage })}

          ${TaxonomyCard({
        title: "Categorías",
        items: categories,
        selectedItems: selectedCategories,
        inputName: "categories[]",
        newItemInputId: "newCategoryInput",
        addNewFunction: "addNewCategory()",
        emptyMessage: "No hay categorías disponibles",
        newItemPlaceholder: "Crear nueva categoría",
        newItemDataId: "newCategoriesData",
        newItemDataName: "newCategories"
    })}

          ${TaxonomyCard({
        title: "Etiquetas",
        items: tags,
        selectedItems: selectedTags,
        inputName: "tags[]",
        newItemInputId: "newTagInput",
        addNewFunction: "addNewTag()",
        emptyMessage: "No hay etiquetas disponibles",
        newItemPlaceholder: "Crear nueva etiqueta",
        newItemDataId: "newTagsData",
        newItemDataName: "newTags"
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

    ${FeaturedImageModal()}
    ${ContentEditorScripts()}
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

export default ContentEditorPage;
