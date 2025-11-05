import { db } from "../config/db.ts";
import { contentTypes, type NewContentType, type ContentType } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface CreateContentTypeInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
  hasCategories?: boolean;
  hasTags?: boolean;
  hasComments?: boolean;
}

export interface UpdateContentTypeInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
  hasCategories?: boolean;
  hasTags?: boolean;
  hasComments?: boolean;
}

// Crear un nuevo tipo de contenido
export async function createContentType(
  data: CreateContentTypeInput
): Promise<ContentType> {
  // Verificar si el slug ya existe
  const existing = await db.query.contentTypes.findFirst({
    where: eq(contentTypes.slug, data.slug),
  });

  if (existing) {
    throw new Error(`El tipo de contenido con slug '${data.slug}' ya existe`);
  }

  const [newContentType] = await db
    .insert(contentTypes)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      isPublic: data.isPublic ?? true,
      hasCategories: data.hasCategories ?? true,
      hasTags: data.hasTags ?? true,
      hasComments: data.hasComments ?? false,
    })
    .returning();

  return newContentType;
}

// Obtener todos los tipos de contenido
export async function getAllContentTypes(): Promise<ContentType[]> {
  return await db.query.contentTypes.findMany({
    orderBy: (contentTypes, { asc }) => [asc(contentTypes.name)],
  });
}

// Obtener un tipo de contenido por ID
export async function getContentTypeById(id: number): Promise<ContentType | null> {
  const contentType = await db.query.contentTypes.findFirst({
    where: eq(contentTypes.id, id),
  });

  return contentType || null;
}

// Obtener un tipo de contenido por slug
export async function getContentTypeBySlug(slug: string): Promise<ContentType | null> {
  const contentType = await db.query.contentTypes.findFirst({
    where: eq(contentTypes.slug, slug),
  });

  return contentType || null;
}

// Actualizar un tipo de contenido
export async function updateContentType(
  id: number,
  data: UpdateContentTypeInput
): Promise<ContentType> {
  const existing = await getContentTypeById(id);

  if (!existing) {
    throw new Error("Tipo de contenido no encontrado");
  }

  // Si se está cambiando el slug, verificar que no exista
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.query.contentTypes.findFirst({
      where: eq(contentTypes.slug, data.slug),
    });

    if (slugExists) {
      throw new Error(`El slug '${data.slug}' ya está en uso`);
    }
  }

  const [updated] = await db
    .update(contentTypes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(contentTypes.id, id))
    .returning();

  return updated;
}

// Eliminar un tipo de contenido
export async function deleteContentType(id: number): Promise<void> {
  // Verificar que no sea un tipo de sistema (post o page)
  const contentType = await getContentTypeById(id);

  if (!contentType) {
    throw new Error("Tipo de contenido no encontrado");
  }

  if (contentType.slug === "post" || contentType.slug === "page") {
    throw new Error("No se pueden eliminar los tipos de contenido del sistema");
  }

  await db.delete(contentTypes).where(eq(contentTypes.id, id));
}
