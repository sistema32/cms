import { ContentEditorPage } from "../components/ContentEditorPage.tsx";
import type { SeoFormValues } from "../components/SeoFields.tsx";

interface PostFormPageProps {
  user: {
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
  };
  categories: Array<
    { id: number; name: string; slug?: string; parentId?: number | null }
  >;
  tags: Array<{ id: number; name: string; slug?: string }>;
  selectedCategories?: number[];
  selectedTags?: number[];
  featuredImage?: {
    id: number;
    url: string;
  };
  seo?: SeoFormValues;
  errors?: Record<string, string>;
}

export const PostFormPage = (props: PostFormPageProps) => {
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
  } = props;

  const isEdit = Boolean(post);

  return ContentEditorPage({
    user,
    activePage: "content.posts",
    pageTitle: isEdit ? "Editar Entrada" : "Nueva Entrada",
    cancelUrl: "/admincp/posts",
    action: isEdit ? `/admincp/posts/edit/${post!.id}` : "/admincp/posts/new",
    submitLabel: isEdit ? "Actualizar Entrada" : "Publicar Entrada",
    placeholders: {
      title: "Título de la entrada",
      slug: "url-amigable",
      excerpt: "Resumen breve de la entrada",
      content: "Escribe la entrada aquí...",
    },
    data: {
      title: post?.title,
      slug: post?.slug,
      excerpt: post?.excerpt || "",
      body: post?.body || "",
      status: post?.status || "draft",
      featuredImageId: post?.featuredImageId || featuredImage?.id || null,
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

export default PostFormPage;
