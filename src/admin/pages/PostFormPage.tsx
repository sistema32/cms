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
    visibility?: string | null;
    password?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    commentsEnabled?: boolean;
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
      id: post?.id,
      title: post?.title,
      slug: post?.slug,
      excerpt: post?.excerpt || "",
      body: post?.body || "",
      status: post?.status || "draft",
      featuredImageId: post?.featuredImageId || featuredImage?.id || null,
      visibility: post?.visibility || "public",
      password: post?.password,
      scheduledAt: post?.scheduledAt,
      publishedAt: post?.publishedAt,
      commentsEnabled: post?.commentsEnabled ?? true, // Posts tienen comentarios habilitados por defecto
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
    showVisibility: true, // Mostrar selector de visibilidad
    showScheduling: true, // Mostrar programación de publicación
    showCommentsControl: true, // Mostrar control de comentarios
  });
};

export default PostFormPage;
