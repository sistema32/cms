import { html } from "hono/html";
import { AdminLayout } from "./AdminLayout.tsx";
import { CKEditorField } from "./CKEditorField.tsx";
import renderSeoFields, { type SeoFormValues } from "./SeoFields.tsx";
import { CategoryTagSelector } from "./CategoryTagSelector.tsx";
import { env } from "../../config/env.ts";
import { MediaPicker } from "./MediaPicker.tsx";

type HtmlFragment = ReturnType<typeof html>;

interface ContentEditorData {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  body?: string | null;
  status?: string | null;
  contentTypeId?: number | null;
  featuredImageId?: number | null;
  featuredImageUrl?: string | null;
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
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
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
      <select name="status" class="form-input">
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

  const shouldShowCategories = showCategories &&
    normalizedCategories.length > 0;
  const shouldShowTags = showTags && normalizedTags.length > 0;

  const categoriesBlock = shouldShowCategories
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

  const tagsBlock = shouldShowTags
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
      ${contentTypeSection || ""} ${statusSection} ${categoriesBlock || ""}
      ${tagsBlock || ""} ${featuredImageBlock || ""}
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
      <div class="page-actions">
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
