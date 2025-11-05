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
  };
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
    categories = [],
    tags = [],
    selectedCategories = [],
    selectedTags = [],
    featuredImage,
    seo = {},
    errors = {},
  } = props;

  const isEdit = Boolean(page);

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
      title: page?.title,
      slug: page?.slug,
      excerpt: page?.excerpt || "",
      body: page?.body || "",
      status: page?.status || "draft",
      featuredImageId: page?.featuredImageId || featuredImage?.id || null,
    },
    errors,
    showSeo: true,
    seo,
    showMediaPicker: true,
    featuredImage: featuredImage || null,
    mediaPickerFieldName: "featuredImageId",
    showCategories: categories.length > 0,
    categories,
    selectedCategories,
    showTags: tags.length > 0,
    tags,
    selectedTags,
  });
};

export default PageFormPage;
