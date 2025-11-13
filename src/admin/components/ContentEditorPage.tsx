import { html } from "hono/html";
import { AdminLayout } from "./AdminLayout.tsx";
import { CKEditorField } from "./CKEditorField.tsx";
import renderSeoFields, { type SeoFormValues } from "./SeoFields.tsx";
import { CategoryTagSelector } from "./CategoryTagSelector.tsx";
import { env } from "../../config/env.ts";
import { MediaPicker } from "./MediaPicker.tsx";
import { RevisionHistory } from "./RevisionHistory.tsx";

type HtmlFragment = ReturnType<typeof html>;

interface ContentEditorData {
  id?: number; // Para editar contenido existente
  title?: string;
  slug?: string;
  excerpt?: string | null;
  body?: string | null;
  status?: string | null;
  contentTypeId?: number | null;
  featuredImageId?: number | null;
  featuredImageUrl?: string | null;
  parentId?: number | null; // Para páginas hijas
  visibility?: string | null; // public, private, password
  password?: string | null; // Para contenido protegido
  publishedAt?: string | null; // Fecha de publicación
  scheduledAt?: string | null; // Fecha programada
  commentsEnabled?: boolean; // Control de comentarios
}

interface TaxonomyItem {
  id: number;
  name: string;
  slug?: string;
  parentId?: number | null;
}

interface ContentEditorPageProps {
  user: { name: string | null; email: string };
  activePage: string;
  pageTitle: string;
  cancelUrl: string;
  action: string;
  enctype?: string;
  submitLabel: string;
  placeholders: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
  };
  data?: ContentEditorData;
  errors?: Record<string, string>;
  contentTypes?: Array<{ id: number; name: string }>;
  showContentTypeSelect?: boolean;
  contentTypeFieldName?: string;
  categories?: TaxonomyItem[];
  selectedCategories?: number[];
  categoryFieldName?: string;
  tags?: TaxonomyItem[];
  selectedTags?: number[];
  tagFieldName?: string;
  showCategories?: boolean;
  showTags?: boolean;
  featuredImage?: { id: number; url: string } | null;
  mediaPickerFieldName?: string;
  showMediaPicker?: boolean;
  mediaPickerLabel?: string;
  mediaPickerRequired?: boolean;
  seo?: SeoFormValues;
  showSeo?: boolean;
  additionalMainSections?: HtmlFragment[];
  additionalSidebarSections?: HtmlFragment[];
  // Nuevas props para funcionalidades faltantes
  showRevisionHistory?: boolean; // Mostrar historial de versiones
  showParentSelector?: boolean; // Mostrar selector de página padre
  availableParents?: TaxonomyItem[]; // Páginas disponibles como padre
  showVisibility?: boolean; // Mostrar selector de visibilidad
  showScheduling?: boolean; // Mostrar programación de publicación
  showCommentsControl?: boolean; // Mostrar control de comentarios
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "scheduled", label: "Programado" },
  { value: "archived", label: "Archivado" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Público" },
  { value: "private", label: "Privado (solo usuarios autenticados)" },
  { value: "password", label: "Protegido por contraseña" },
];

export const ContentEditorPage = (props: ContentEditorPageProps) => {
  const {
    user,
    activePage,
    pageTitle,
    cancelUrl,
    action,
    enctype,
    submitLabel,
    placeholders,
    data = {},
    errors = {},
    contentTypes = [],
    showContentTypeSelect = false,
    contentTypeFieldName = "contentTypeId",
    categories = [],
    selectedCategories = [],
    categoryFieldName = "categories",
    tags = [],
    selectedTags = [],
    tagFieldName = "tags",
    showCategories = false,
    showTags = false,
    featuredImage = null,
    mediaPickerFieldName = "featuredImageId",
    showMediaPicker = false,
    mediaPickerLabel = "Imagen destacada",
    mediaPickerRequired = false,
    seo,
    showSeo = false,
    additionalMainSections = [],
    additionalSidebarSections = [],
    showRevisionHistory = false,
    showParentSelector = false,
    availableParents = [],
    showVisibility = false,
    showScheduling = false,
    showCommentsControl = false,
  } = props;

  const normalizedCategories = categories.map((item) => ({
    ...item,
    slug: item.slug || item.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const normalizedTags = tags.map((item) => ({
    ...item,
    slug: item.slug || item.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const statusValue = data.status || "draft";

  const mainContentSections: HtmlFragment[] = [
    html`
      <div class="form-card">
        <label class="form-label">Título *</label>
        <input
          type="text"
          name="title"
          value="${data.title || ""}"
          required
          class="form-input"
          placeholder="${placeholders.title}"
          onkeyup="generateSlug(this.value)"
        />
      </div>
    `,
    html`
      <div class="form-card">
        <label class="form-label">Slug *</label>
        <input
          type="text"
          name="slug"
          id="slugInput"
          value="${data.slug || ""}"
          required
          class="form-input"
          placeholder="${placeholders.slug}"
        />
      </div>
    `,
    html`
      <div class="form-card">
        <label class="form-label">Extracto</label>
        <textarea
          name="excerpt"
          rows="3"
          class="form-input"
          placeholder="${placeholders.excerpt}"
        >${data.excerpt || ""}</textarea>
      </div>
    `,
    html`
      <div class="form-card">
        <label class="form-label mb-2">Contenido *</label>
        ${CKEditorField({
          name: "body",
          value: data.body || "",
          placeholder: placeholders.content,
          required: true,
        })}
      </div>
    `,
  ];

  if (showSeo && seo) {
    const seoSection = renderSeoFields(seo);
    if (seoSection) {
      mainContentSections.push(seoSection);
    }
  }

  if (additionalMainSections.length > 0) {
    mainContentSections.push(...additionalMainSections);
  }

  const contentTypeSection = showContentTypeSelect
    ? html`
      <div class="mb-4">
        <label class="form-label">Tipo de contenido</label>
        <select name="${contentTypeFieldName}" class="form-input" required>
          ${contentTypes.map((type) =>
            html`
              <option value="${type.id}" ${data.contentTypeId === type.id
                ? "selected"
                : ""}>
                ${type.name}
              </option>
            `
          )}
        </select>
      </div>
    `
    : null;

  const statusSection = html`
    <div class="mb-4">
      <label class="form-label">Estado</label>
      <select name="status" class="form-input" id="statusSelect">
        ${STATUS_OPTIONS.map((option) =>
          html`
            <option value="${option.value}" ${statusValue === option.value
              ? "selected"
              : ""}>
              ${option.label}
            </option>
          `
        )}
      </select>
    </div>
  `;

  // Selector de programación de publicación
  const schedulingSection = showScheduling ? html`
    <div class="mb-4" id="schedulingSection" style="display: ${statusValue === 'scheduled' ? 'block' : 'none'}">
      <label class="form-label">Fecha y hora de publicación</label>
      <input
        type="datetime-local"
        name="scheduledAt"
        class="form-input"
        value="${data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : ''}"
      />
      <p class="text-xs text-gray-500 mt-1">
        Deja vacío para publicar inmediatamente al cambiar el estado
      </p>
    </div>
  ` : null;

  // Selector de visibilidad
  const visibilitySection = showVisibility ? html`
    <div class="mb-4">
      <label class="form-label">Visibilidad</label>
      <select name="visibility" class="form-input" id="visibilitySelect">
        ${VISIBILITY_OPTIONS.map((option) =>
          html`
            <option value="${option.value}" ${(data.visibility || 'public') === option.value ? "selected" : ""}>
              ${option.label}
            </option>
          `
        )}
      </select>
    </div>
    <div class="mb-4" id="passwordSection" style="display: ${data.visibility === 'password' ? 'block' : 'none'}">
      <label class="form-label">Contraseña</label>
      <input
        type="text"
        name="password"
        class="form-input"
        value="${data.password || ''}"
        placeholder="Contraseña para acceder"
      />
    </div>
  ` : null;

  // Selector de página padre
  const parentSection = showParentSelector ? html`
    <div class="mb-4">
      <label class="form-label">Página padre</label>
      <select name="parentId" class="form-input">
        <option value="">Sin página padre</option>
        ${availableParents.map((parent) =>
          html`
            <option value="${parent.id}" ${data.parentId === parent.id ? "selected" : ""}>
              ${parent.name}
            </option>
          `
        )}
      </select>
      <p class="text-xs text-gray-500 mt-1">
        ${availableParents.length > 0
          ? "Crear una página hija de otra página"
          : "Aún no hay páginas disponibles para usar como padre"}
      </p>
    </div>
  ` : null;

  // Control de comentarios
  const commentsSection = showCommentsControl ? html`
    <div class="mb-4">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          name="commentsEnabled"
          value="true"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          ${data.commentsEnabled ? "checked" : ""}
        />
        <span class="form-label mb-0">Permitir comentarios</span>
      </label>
    </div>
  ` : null;

  const categoriesBlock = showCategories
    ? html`
      <div
        class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
      >
        ${CategoryTagSelector({
          type: "category",
          items: normalizedCategories,
          selected: selectedCategories,
          fieldName: categoryFieldName,
        })}
      </div>
    `
    : null;

  const tagsBlock = showTags
    ? html`
      <div
        class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
      >
        ${CategoryTagSelector({
          type: "tag",
          items: normalizedTags,
          selected: selectedTags,
          fieldName: tagFieldName,
        })}
      </div>
    `
    : null;

  const featuredImageBlock = showMediaPicker
    ? html`
      <div
        class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
      >
        ${MediaPicker({
          fieldName: mediaPickerFieldName ?? "featuredImageId",
          currentImageUrl: featuredImage?.url || data.featuredImageUrl ||
            undefined,
          currentImageId: data.featuredImageId ?? featuredImage?.id ??
            undefined,
          label: mediaPickerLabel ?? "Imagen destacada",
          required: mediaPickerRequired ?? false,
        })}
      </div>
    `
    : null;

  const publishCard = html`
    <div class="form-card">
      <h3 class="text-lg font-semibold mb-4">Publicación</h3>
      ${contentTypeSection || ""}
      ${statusSection}
      ${schedulingSection || ""}
      ${visibilitySection || ""}
      ${parentSection || ""}
      ${commentsSection || ""}
      ${categoriesBlock || ""}
      ${tagsBlock || ""}
      ${featuredImageBlock || ""}
      <button type="submit" class="w-full btn-action">
        ${submitLabel}
      </button>
    </div>
  `;

  const sidebarSections: HtmlFragment[] = [publishCard];

  if (additionalSidebarSections.length > 0) {
    sidebarSections.push(...additionalSidebarSections);
  }

  const formContent = html`
    <div class="page-header">
      <h1 class="page-title">${pageTitle}</h1>
      <div class="page-actions space-x-2">
        ${showRevisionHistory && data.id ? RevisionHistory({
          contentId: data.id,
          currentTitle: data.title || "Contenido"
        }) : ""}
        <a href="${cancelUrl}" class="btn-secondary">Cancelar</a>
      </div>
    </div>

    ${Object.keys(errors).length > 0
      ? html`
        <div
          class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-200 dark:text-red-800"
        >
          <ul class="list-disc list-inside space-y-1">
            ${Object.values(errors).map((message) =>
              html`
                <li>${message}</li>
              `
            )}
          </ul>
        </div>
      `
      : ""}

    <form method="POST" action="${action}" ${enctype
      ? `enctype="${enctype}"`
      : ""}>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          ${mainContentSections.map((section) => section)}
        </div>
        <div class="space-y-6">
          ${sidebarSections.map((section) => section)}
        </div>
      </div>
    </form>

    <script>
    function generateSlug(title) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const slugInput = document.getElementById('slugInput');
      if (slugInput && !slugInput.dataset.locked) {
        slugInput.value = slug;
      }
    }

    const slugInput = document.getElementById('slugInput');
    if (slugInput) {
      slugInput.addEventListener('input', function () {
        this.dataset.locked = this.value.length > 0 ? 'true' : '';
      });
    }

    // Control de visibilidad del campo de contraseña
    const visibilitySelect = document.getElementById('visibilitySelect');
    if (visibilitySelect) {
      visibilitySelect.addEventListener('change', function() {
        const passwordSection = document.getElementById('passwordSection');
        if (passwordSection) {
          passwordSection.style.display = this.value === 'password' ? 'block' : 'none';
        }
      });
    }

    // Control de visibilidad del campo de programación
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', function() {
        const schedulingSection = document.getElementById('schedulingSection');
        if (schedulingSection) {
          schedulingSection.style.display = this.value === 'scheduled' ? 'block' : 'none';
        }
      });
    }
    </script>
  `;

  return AdminLayout({
    title: pageTitle,
    activePage,
    user,
    children: formContent,
  });
};

export default ContentEditorPage;
