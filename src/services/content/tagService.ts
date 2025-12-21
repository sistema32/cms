import { db } from "@/config/db.ts";
import {
  tags,
  type NewTag,
  type Tag,
  content,
  contentTags,
  users,
  contentTypes,
} from "@/db/schema.ts";
import { eq, like, desc } from "drizzle-orm";
import { sanitizeSearchQuery } from "@/utils/sanitization.ts";

export interface CreateTagInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

// Crear un tag
export async function createTag(data: CreateTagInput): Promise<Tag> {
  // Verificar si el slug ya existe
  const existing = await db.query.tags.findFirst({
    where: eq(tags.slug, data.slug),
  });

  if (existing) {
    throw new Error(`El tag con slug '${data.slug}' ya existe`);
  }

  const [newTag] = await db
    .insert(tags)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
    })
    .returning();

  return newTag;
}

// Obtener todos los tags
export async function getAllTags(): Promise<Tag[]> {
  return await db.query.tags.findMany({
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
}

// Buscar tags por nombre
export async function searchTagsDb(query: string): Promise<Tag[]> {
  const sanitizedQuery = sanitizeSearchQuery(query);
  return await db.query.tags.findMany({
    where: like(tags.name, `%${sanitizedQuery}%`),
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
}

// Obtener un tag por ID
export async function getTagById(id: number): Promise<Tag | null> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.id, id),
  });

  return tag || null;
}

// Obtener un tag por slug
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });

  return tag || null;
}

// Actualizar un tag
export async function updateTag(id: number, data: UpdateTagInput): Promise<Tag> {
  const existing = await getTagById(id);

  if (!existing) {
    throw new Error("Tag no encontrado");
  }

  // Verificar slug único
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.query.tags.findFirst({
      where: eq(tags.slug, data.slug),
    });

    if (slugExists) {
      throw new Error(`El slug '${data.slug}' ya está en uso`);
    }
  }

  const [updated] = await db
    .update(tags)
    .set(data)
    .where(eq(tags.id, id))
    .returning();

  return updated;
}

// Eliminar un tag
export async function deleteTag(id: number): Promise<void> {
  const tag = await getTagById(id);

  if (!tag) {
    throw new Error("Tag no encontrado");
  }

  await db.delete(tags).where(eq(tags.id, id));
}

export async function getTagContent(tagId: number) {
  const tag = await getTagById(tagId);

  if (!tag) {
    throw new Error("Tag no encontrado");
  }

  const rows = await db
    .select({
      content,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      contentTypeRow: contentTypes,
    })
    .from(contentTags)
    .innerJoin(content, eq(contentTags.contentId, content.id))
    .leftJoin(users, eq(content.authorId, users.id))
    .leftJoin(contentTypes, eq(content.contentTypeId, contentTypes.id))
    .where(eq(contentTags.tagId, tagId))
    .orderBy(desc(content.publishedAt), desc(content.createdAt));

  const contentList = rows.map((row) => ({
    ...row.content,
    author: row.authorId
      ? {
        id: row.authorId,
        name: row.authorName!,
        email: row.authorEmail!,
      }
      : undefined,
    contentType: row.contentTypeRow ?? undefined,
  }));

  return {
    content: contentList,
    total: contentList.length,
  };
}
// @ts-nocheck
