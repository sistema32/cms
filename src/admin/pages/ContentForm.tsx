import { html } from "hono/html";
import { ContentEditorPage } from "../components/ContentEditorPage.tsx";

interface ContentFormProps {
  user: {
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
}

export const ContentFormPage = (props: ContentFormProps) => {
  const {
    user,
    content,
    contentTypes,
    categories,
    tags,
    selectedCategories = [],
    selectedTags = [],
    errors = {},
  } = props;

  const isEdit = !!content;
  const pageTitle = isEdit ? "Editar Contenido" : "Nuevo Contenido";

  const featuredImageSection = html`
    <div class="form-card">
      <h3 class="text-lg font-semibold mb-4">Imagen destacada</h3>
      ${content?.featuredImage
        ? html`
          <img
            src="${content.featuredImage}"
            alt="Imagen destacada"
            class="mb-4 rounded-lg w-full"
          />
        `
        : ""}
      <input
        type="file"
        name="featuredImage"
        accept="image/*"
        class="form-input"
      />
    </div>
  `;

  return ContentEditorPage({
    user,
    activePage: "content",
    pageTitle,
    cancelUrl: "/admincp/content",
    action: isEdit
      ? `/admincp/content/edit/${content!.id}`
      : "/admincp/content/new",
    enctype: "multipart/form-data",
    submitLabel: isEdit ? "Actualizar" : "Publicar",
    placeholders: {
      title: "Título del contenido",
      slug: "url-amigable",
      excerpt: "Breve descripción del contenido...",
      content: "Escribe tu contenido aquí...",
    },
    data: {
      title: content?.title,
      slug: content?.slug,
      excerpt: content?.excerpt || "",
      body: content?.body || "",
      status: content?.status || "draft",
      contentTypeId: content?.contentTypeId || contentTypes[0]?.id || null,
      featuredImageUrl: content?.featuredImage || null,
    },
    errors,
    contentTypes,
    showContentTypeSelect: true,
    categories,
    selectedCategories,
    showCategories: categories.length > 0,
    tags,
    selectedTags,
    showTags: tags.length > 0,
    additionalSidebarSections: [featuredImageSection],
  });
};

export default ContentFormPage;
