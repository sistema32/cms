import { html } from "hono/html";
import { ContentEditorPage } from "../components/ContentEditorPage.tsx";
import type { SeoFormValues } from "../components/SeoFields.tsx";

interface PageFormPageProps {
  user: {
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
    featuredImageId?: number | null;
    parentId?: number | null;
    visibility?: string | null;
    password?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    template?: string | null;
  };
  availableParents?: Array<
    { id: number; name: string; slug?: string }
  >;
  categories?: Array<
    { id: number; name: string; slug?: string; parentId?: number | null }
  >;
  tags?: Array<{ id: number; name: string; slug?: string }>;
  selectedCategories?: number[];
  selectedTags?: number[];
  featuredImage?: {
    id: number;
    url: string;
  };
  seo?: SeoFormValues;
  errors?: Record<string, string>;
}

export const PageFormPage = (props: PageFormPageProps) => {
  const {
    user,
    page,
    availableParents = [],
    categories = [],
    tags = [],
    selectedCategories = [],
    selectedTags = [],
    featuredImage,
    seo = {},
    errors = {},
  } = props;

  const isEdit = Boolean(page);

  // Sección de template personalizado
  const templateSection = html`
    <div class="mb-4">
      <label class="form-label" for="template">
        Template personalizado
      </label>
      <input
        type="text"
        id="template"
        name="template"
        class="form-input"
        placeholder="page-inicio"
        value="${page?.template || ''}"
      />
      <p class="text-xs text-gray-500 mt-1">
        Nombre del template personalizado (ej: "page-inicio", "page-contacto").
        Déjalo vacío para usar el template por defecto.
      </p>
    </div>
  `;

  return ContentEditorPage({
    user,
    activePage: "content.pages",
    pageTitle: isEdit ? "Editar Página" : "Nueva Página",
    cancelUrl: "/admincp/pages",
    action: isEdit ? `/admincp/pages/edit/${page!.id}` : "/admincp/pages/new",
    submitLabel: isEdit ? "Actualizar Página" : "Publicar Página",
    placeholders: {
      title: "Título de la página",
      slug: "url-amigable",
      excerpt: "Resumen de la página",
      content: "Escribe la página aquí...",
    },
    data: {
      id: page?.id,
      title: page?.title,
      slug: page?.slug,
      excerpt: page?.excerpt || "",
      body: page?.body || "",
      status: page?.status || "draft",
      featuredImageId: page?.featuredImageId || featuredImage?.id || null,
      parentId: page?.parentId,
      visibility: page?.visibility || "public",
      password: page?.password,
      scheduledAt: page?.scheduledAt,
      publishedAt: page?.publishedAt,
    },
    errors,
    showSeo: true,
    seo,
    showMediaPicker: true,
    featuredImage: featuredImage || null,
    mediaPickerFieldName: "featuredImageId",
    showCategories: true,
    categories,
    selectedCategories,
    showTags: true,
    tags,
    selectedTags,
    // Nuevas funcionalidades
    showRevisionHistory: isEdit, // Solo en modo edición
    showParentSelector: true, // Mostrar selector de página padre
    availableParents, // Páginas disponibles como padre
    showVisibility: true, // Mostrar selector de visibilidad
    showScheduling: true, // Mostrar programación de publicación
    showCommentsControl: false, // Las páginas normalmente no tienen comentarios
    additionalSidebarSections: [templateSection], // Agregar selector de template
  });
};

export default PageFormPage;
