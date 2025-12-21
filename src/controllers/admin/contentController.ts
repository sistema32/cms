
import { Context } from "hono";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/config/db.ts";
import {
    categories,
    content,
    contentCategories,
    contentSeo,
    contentTags,
    contentTypes,
} from "@/db/schema.ts";
import { env } from "@/config/env.ts";
import { notificationService } from "@/lib/email/index.ts";
import * as contentService from "@/services/content/contentService.ts";
import ContentListNexusPage from "@/admin/pages/content/ContentListNexus.tsx";
import ContentFormNexusPage from "@/admin/pages/content/ContentFormNexus.tsx";
import { PostFormNexusPage } from "@/admin/pages/content/PostFormNexus.tsx";
import PageFormNexusPage from "@/admin/pages/content/PageFormNexus.tsx";
import {
    extractSeoPayload,
    parseIds,
    parseNullableField,
    parseStringField,
} from "@/routes/admin/helpers.ts";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { getEditorSidebarWidgets } from "@/lib/hooks/editorHooks.ts";

const log = createLogger("adminContentController");

// --- Helper Functions ---

const normalizeUser = (user: any) => ({
    id: user.userId ?? user.id,
    name: typeof user.name === "string" ? user.name : null,
    email: user.email ?? "",
});

const ALLOWED_STATUSES = ["draft", "published", "archived", "scheduled"] as const;
type ContentStatus = (typeof ALLOWED_STATUSES)[number];

const normalizeAuthor = (author: any) => ({
    name: typeof author?.name === "string" ? author.name : (author?.email ?? ""),
    email: author?.email ?? "",
});

const normalizeSeo = (seo: any | null | undefined) =>
    seo
        ? {
            metaTitle: seo.metaTitle ?? undefined,
            metaDescription: seo.metaDescription ?? undefined,
            metaKeywords: seo.metaKeywords ?? undefined,
            ogTitle: seo.ogTitle ?? undefined,
            ogDescription: seo.ogDescription ?? undefined,
            ogImage: seo.ogImage ?? undefined,
            twitterCard: seo.twitterCard ?? undefined,
            twitterTitle: seo.twitterTitle ?? undefined,
            twitterDescription: seo.twitterDescription ?? undefined,
            twitterImage: seo.twitterImage ?? undefined,
            canonicalUrl: seo.canonicalUrl ?? undefined,
            noIndex: seo.noIndex ?? undefined,
            noFollow: seo.noFollow ?? undefined,
            focusKeyword: seo.focusKeyword ?? undefined,
            schemaJson: seo.schemaJson ?? undefined,
        }
        : undefined;

const renderTextError = (
    c: Context,
    error: unknown,
    fallbackMessage: string,
    fallbackStatus = 500,
) => {
    if (error instanceof AppError) {
        return new Response(error.message, { status: error.status });
    }
    log.error(fallbackMessage, error instanceof Error ? error : undefined);
    return new Response(fallbackMessage, { status: fallbackStatus });
};

async function getContentTypeBySlug(slug: string) {
    let contentType = await db.query.contentTypes.findFirst({
        where: eq(contentTypes.slug, slug),
    });

    if (!contentType && slug === "post") {
        const [created] = await db.insert(contentTypes).values({
            name: "Post",
            slug: "post",
            description: "Entradas de blog estándar",
            icon: "📝",
            isPublic: true,
            hasCategories: true,
            hasTags: true,
            hasComments: true,
        }).returning();
        contentType = created;
    }

    if (!contentType && slug === "page") {
        const [created] = await db.insert(contentTypes).values({
            name: "Page",
            slug: "page",
            description: "Páginas estáticas del sitio",
            icon: "📄",
            isPublic: true,
            hasCategories: false,
            hasTags: false,
            hasComments: false,

        }).returning();
        contentType = created;
    }

    if (!contentType) {
        throw new Error(`Tipo de contenido '${slug}' no encontrado`);
    }
    return contentType;
}

// --- Controller Methods ---

export const contentController = {
    // --- Generic Content ---

    async list(c: Context) {
        try {
            const user = c.get("user");
            const page = parseInt(c.req.query("page") || "1");
            const status = c.req.query("status");
            const limit = 20;
            const offset = (page - 1) * limit;

            const whereClause = status ? eq(content.status, status) : undefined;

            const [contents, totalResult] = await Promise.all([
                db.query.content.findMany({
                    where: whereClause,
                    limit,
                    offset,
                    orderBy: [desc(content.createdAt)],
                    with: {
                        contentType: true,
                        author: true,
                    },
                }),
                db.select({ count: count() }).from(content).where(
                    whereClause || undefined,
                ),
            ]);

            const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit);

            return c.html(
                ContentListNexusPage({
                    user: normalizeUser(user),
                    contents: contents.map((item) => ({
                        id: item.id,
                        title: item.title,
                        slug: item.slug,
                        status: item.status,
                        contentType: { name: item.contentType.name },
                        author: normalizeAuthor(item.author),
                        createdAt: item.createdAt,
                    })),
                    totalPages,
                    currentPage: page,
                }),
            );
        } catch (error: any) {
            log.error("Error rendering content list", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el contenido", 500);
        }
    },

    async createForm(c: Context) {
        try {
            const user = c.get("user");
            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            const [contentTypesData, categoriesData, tagsData] = await Promise.all([
                db.query.contentTypes.findMany(),
                db.query.categories.findMany(),
                db.query.tags.findMany(),
            ]);

            return c.html(
                ContentFormNexusPage({
                    user: normalizeUser(user),
                    contentTypes: contentTypesData,
                    categories: categoriesData.map((cat) => ({
                        ...cat,
                        description: cat.description ?? undefined,
                    })),
                    tags: tagsData,
                    notifications,
                    unreadNotificationCount,
                }),
            );
        } catch (error: any) {
            log.error("Error rendering content form", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el formulario", 500);
        }
    },

    async create(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.parseBody();

            const [newContent] = await db.insert(content).values({
                title: String(body.title ?? ""),
                slug: String(body.slug ?? ""),
                body: String(body.body ?? ""),
                excerpt: parseNullableField(body.excerpt) ?? null,
                status: String(body.status ?? "draft"),
                contentTypeId: parseInt(body.contentTypeId as string),
                authorId: user.userId,
            }).returning();

            const categoryIds = Array.isArray(body.categories)
                ? body.categories.map((id: any) => parseInt(id as string))
                : body.categories
                    ? [parseInt(body.categories as string)]
                    : [];

            if (categoryIds.length > 0) {
                await db.insert(contentCategories).values(
                    categoryIds.map((categoryId) => ({
                        contentId: newContent.id,
                        categoryId,
                    })),
                );
            }

            const tagIds = Array.isArray(body.tags)
                ? body.tags.map((id: any) => parseInt(id as string))
                : body.tags
                    ? [parseInt(body.tags as string)]
                    : [];

            if (tagIds.length > 0) {
                await db.insert(contentTags).values(
                    tagIds.map((tagId) => ({
                        contentId: newContent.id,
                        tagId,
                    })),
                );
            }

            return c.redirect(`${env.ADMIN_PATH}/content`);
        } catch (error: any) {
            log.error("Error creating content", error instanceof Error ? error : undefined);
            return c.text("Error al crear el contenido", 500);
        }
    },

    async editForm(c: Context) {
        try {
            const user = c.get("user");
            const id = parseNumericParam(c.req.param("id"), "ID de contenido");

            const contentItem = await db.query.content.findFirst({
                where: eq(content.id, id),
                with: {
                    contentType: true,
                    author: true,
                },
            });

            if (!contentItem) {
                return c.text("Contenido no encontrado", 404);
            }

            const selectedCategoriesData = await db.query.contentCategories.findMany({
                where: eq(contentCategories.contentId, id),
            });
            const selectedCategories = selectedCategoriesData.map((c) => c.categoryId);

            const selectedTagsData = await db.query.contentTags.findMany({
                where: eq(contentTags.contentId, id),
            });
            const selectedTags = selectedTagsData.map((t) => t.tagId);

            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            const [contentTypesData, categoriesData, tagsData] = await Promise.all([
                db.query.contentTypes.findMany(),
                db.query.categories.findMany(),
                db.query.tags.findMany(),
            ]);

            return c.html(ContentFormNexusPage({
                user: normalizeUser(user),
                content: {
                    id: contentItem.id,
                    title: contentItem.title,
                    slug: contentItem.slug,
                    body: contentItem.body ?? "",
                    excerpt: contentItem.excerpt ?? undefined,
                    status: contentItem.status,
                    contentTypeId: contentItem.contentTypeId,
                    featuredImageId: contentItem.featuredImageId ?? null,
                    visibility: contentItem.visibility ?? null,
                    password: contentItem.password ?? null,
                    scheduledAt: contentItem.scheduledAt
                        ? contentItem.scheduledAt.toISOString()
                        : null,
                    publishedAt: contentItem.publishedAt
                        ? contentItem.publishedAt.toISOString()
                        : null,
                    commentsEnabled: contentItem.commentsEnabled ?? undefined,
                },
                contentTypes: contentTypesData,
                categories: categoriesData.map((cat) => ({
                    ...cat,
                    description: cat.description ?? undefined,
                })),
                tags: tagsData,
                selectedCategories,
                selectedTags,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            return renderTextError(c, error, "Error al cargar el contenido");
        }
    },

    async update(c: Context) {
        try {
            const user = c.get("user");
            const id = parseNumericParam(c.req.param("id"), "ID de contenido");
            const body = await c.req.parseBody();

            const title = parseStringField(body.title) ?? "";
            const slug = parseStringField(body.slug) ?? "";
            const bodyContent = parseStringField(body.body) ?? "";
            const excerpt = parseNullableField(body.excerpt);
            const status = parseStringField(body.status) as ContentStatus | undefined;

            await db.update(content).set({
                title,
                slug,
                body: bodyContent,
                excerpt: excerpt ?? null,
                status: status && ALLOWED_STATUSES.includes(status)
                    ? status
                    : "draft",
                contentTypeId: parseInt(body.contentTypeId as string),
                updatedAt: new Date(),
            }).where(eq(content.id, id));

            await db.delete(contentCategories).where(
                eq(contentCategories.contentId, id),
            );

            const categoryIds = Array.isArray(body.categories)
                ? body.categories.map((id: any) => parseInt(id as string))
                : body.categories
                    ? [parseInt(body.categories as string)]
                    : [];

            if (categoryIds.length > 0) {
                await db.insert(contentCategories).values(
                    categoryIds.map((categoryId) => ({
                        contentId: id,
                        categoryId,
                    })),
                );
            }

            await db.delete(contentTags).where(eq(contentTags.contentId, id));

            const tagIds = Array.isArray(body.tags)
                ? body.tags.map((id: any) => parseInt(id as string))
                : body.tags
                    ? [parseInt(body.tags as string)]
                    : [];

            if (tagIds.length > 0) {
                await db.insert(contentTags).values(
                    tagIds.map((tagId) => ({
                        contentId: id,
                        tagId,
                    })),
                );
            }

            return c.redirect(`${env.ADMIN_PATH}/content`);
        } catch (error: any) {
            return renderTextError(c, error, "Error al actualizar el contenido");
        }
    },

    async delete(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de contenido");
            await db.delete(content).where(eq(content.id, id));
            return c.json({ success: true });
        } catch (error: any) {
            log.error("Error deleting content", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("content_delete_failed", getErrorMessage(error), 500);
        }
    },

    // --- Posts ---

    async listPosts(c: Context) {
        try {
            const user = c.get("user");
            const page = parseInt(c.req.query("page") || "1");
            const status = c.req.query("status");
            const limit = 20;
            const offset = (page - 1) * limit;

            const postType = await getContentTypeBySlug("post");

            const conditions = [eq(content.contentTypeId, postType.id)];
            if (status) {
                conditions.push(eq(content.status, status));
            }

            const whereClause = conditions.length > 1
                ? and(...conditions)
                : conditions[0];

            const [posts, totalResult] = await Promise.all([
                db.query.content.findMany({
                    where: whereClause,
                    limit,
                    offset,
                    orderBy: [desc(content.createdAt)],
                    with: {
                        contentType: true,
                        author: true,
                    },
                }),
                db.select({ count: count() }).from(content).where(whereClause),
            ]);

            const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit) || 1;

            return c.html(ContentListNexusPage({
                user: normalizeUser(user),
                contents: posts.map((item) => ({
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    status: item.status,
                    contentType: { name: item.contentType.name },
                    author: normalizeAuthor(item.author),
                    createdAt: item.createdAt,
                })),
                totalPages,
                currentPage: page,
                title: "Entradas",
                createPath: `${env.ADMIN_PATH}/posts/new`,
                createLabel: "Nueva Entrada",
                basePath: `${env.ADMIN_PATH}/posts`,
                showContentType: false,
                activePage: "content.posts",
            }));
        } catch (error: any) {
            log.error("Error rendering posts list", error instanceof Error ? error : undefined);
            return c.text("Error al cargar las entradas", 500);
        }
    },

    async createPostForm(c: Context) {
        try {
            const user = c.get("user");
            const postType = await getContentTypeBySlug("post");

            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            const [categoriesData, tagsData] = await Promise.all([
                db.query.categories.findMany({
                    where: (categories, { eq, or, isNull }) =>
                        or(eq(categories.contentTypeId, postType.id), isNull(categories.contentTypeId)),
                    orderBy: (categories, { asc }) => [asc(categories.name)],
                }),
                db.query.tags.findMany({
                    orderBy: (tags, { asc }) => [asc(tags.name)],
                }),
            ]);

            // Load plugin sidebar widgets
            const pluginSidebarWidgets = await getEditorSidebarWidgets({ postType: 'post' });

            return c.html(PostFormNexusPage({
                user: normalizeUser(user),
                categories: categoriesData,
                tags: tagsData,
                selectedCategories: [],
                selectedTags: [],
                contentTypeId: postType.id,
                seo: {},
                notifications,
                unreadNotificationCount,
                pluginSidebarWidgets,
            }));
        } catch (error: any) {
            log.error("Error rendering new post form", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el formulario", 500);
        }
    },

    async createPost(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.parseBody();
            const postType = await getContentTypeBySlug("post");

            const categoryIds = parseIds(
                (body as any).categories
                ?? (body as any)["categories[]"]
                ?? (body as any).categoryIds
                ?? (body as any)["categoryIds[]"],
            );
            const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

            const title = parseStringField(body.title);
            const slug = parseStringField(body.slug);
            const bodyContent = parseStringField(body.body);

            if (!title || !slug || !bodyContent) {
                throw AppError.fromCatalog("validation_error", { message: "Título, slug y contenido son obligatorios" });
            }

            const status = parseStringField(body.status) as ContentStatus | undefined;

            await contentService.createContent({
                contentTypeId: postType.id,
                title,
                slug,
                excerpt: parseNullableField(body.excerpt) ?? undefined,
                body: bodyContent,
                status: status && ["draft", "published", "archived"].includes(status)
                    ? status
                    : "draft",
                authorId: user.userId,
                categoryIds,
                tagIds,
                seo: extractSeoPayload(body as Record<string, unknown>),
            });

            return c.redirect(`${env.ADMIN_PATH}/posts`);
        } catch (error: any) {
            log.error("Error creating post", error instanceof Error ? error : undefined);
            return c.text("Error al crear la entrada", 500);
        }
    },

    async editPostForm(c: Context) {
        try {
            const user = c.get("user");
            const id = parseNumericParam(c.req.param("id"), "ID de entrada");
            const postType = await getContentTypeBySlug("post");

            const postItem = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
                with: {
                    contentType: true,
                    contentCategories: true,
                    contentTags: true,
                },
            });

            if (!postItem) {
                return c.text("Entrada no encontrada", 404);
            }

            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            const [categoriesData, tagsData, seoData] = await Promise.all([
                db.query.categories.findMany({
                    where: (categories, { eq, or, isNull }) =>
                        or(eq(categories.contentTypeId, postType.id), isNull(categories.contentTypeId)),
                    orderBy: (categories, { asc }) => [asc(categories.name)],
                }),
                db.query.tags.findMany({
                    orderBy: (tags, { asc }) => [asc(tags.name)],
                }),
                db.query.contentSeo.findFirst({ where: eq(contentSeo.contentId, id) }),
            ]);

            const selectedCategories = postItem.contentCategories?.map((cat) =>
                cat.categoryId
            ) ?? [];
            const selectedTags = postItem.contentTags?.map((tag) => tag.tagId) ?? [];

            const seo = normalizeSeo(seoData) ?? {};

            // Load plugin sidebar widgets
            const pluginSidebarWidgets = await getEditorSidebarWidgets({ postId: postItem.id, postType: 'post' });

            return c.html(PostFormNexusPage({
                user: normalizeUser(user),
                post: {
                    id: postItem.id,
                    title: postItem.title,
                    slug: postItem.slug,
                    excerpt: postItem.excerpt ?? undefined,
                    body: postItem.body ?? "",
                    status: postItem.status,
                },
                categories: categoriesData,
                tags: tagsData,
                selectedCategories,
                selectedTags,
                contentTypeId: postType.id,
                seo,
                notifications,
                unreadNotificationCount,
                pluginSidebarWidgets,
            }));
        } catch (error: any) {
            return renderTextError(c, error, "Error al cargar la entrada");
        }
    },

    async updatePost(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de entrada");
            const body = await c.req.parseBody();
            const postType = await getContentTypeBySlug("post");

            const post = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
            });

            if (!post) {
                throw AppError.fromCatalog("post_not_found");
            }

            const categoryIds = parseIds(
                (body as any).categories
                ?? (body as any)["categories[]"]
                ?? (body as any).categoryIds
                ?? (body as any)["categoryIds[]"],
            );
            const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

            const title = parseStringField(body.title) || post.title;
            const slug = parseStringField(body.slug) || post.slug;
            const status = parseStringField(body.status) as ContentStatus | undefined;

            const normalizedStatus: ContentStatus =
                status && ALLOWED_STATUSES.includes(status)
                    ? status
                    : (post.status as ContentStatus);

            await contentService.updateContent(id, {
                title,
                slug,
                excerpt: parseNullableField(body.excerpt) ?? undefined,
                body: parseStringField(body.body) || post.body || undefined,
                status: normalizedStatus,
                categoryIds,
                tagIds,
                seo: extractSeoPayload(body as Record<string, unknown>),
            });

            return c.redirect(`${env.ADMIN_PATH}/posts`);
        } catch (error: any) {
            return renderTextError(c, error, "Error al actualizar la entrada");
        }
    },

    async autosavePost(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json();

            const rawId = body.id ?? null;
            let id: number | null = null;
            if (rawId !== null) {
                id = Number(rawId);
                if (Number.isNaN(id)) {
                    throw AppError.fromCatalog("invalid_id");
                }
            }

            if (!body.title) {
                throw AppError.fromCatalog("validation_error", { message: "Title required" });
            }

            const postType = await getContentTypeBySlug("post");

            const updateData: any = {
                title: String(body.title),
                slug: String(body.slug),
                body: String(body.body ?? ""),
                excerpt: body.excerpt ? String(body.excerpt) : null,
                updatedAt: new Date(),
                contentTypeId: postType.id,
                authorId: user.id || user.userId, // Fallback for safety
            };

            if (body.status) updateData.status = String(body.status);
            if (body.featuredImageId) updateData.featuredImageId = parseInt(body.featuredImageId);
            if (body.visibility) updateData.visibility = body.visibility;
            if (body.password) updateData.password = body.password;

            if (id !== null) {
                const postId = id;
                await db.update(content).set(updateData).where(eq(content.id, postId));
                if (body['categoryIds[]']) {
                    const catIds = Array.isArray(body['categoryIds[]'])
                        ? body['categoryIds[]'].map((i: any) => parseInt(i))
                        : [parseInt(body['categoryIds[]'])].filter((n: any) => !isNaN(n));

                    await db.delete(contentCategories).where(eq(contentCategories.contentId, postId));
                    if (catIds.length > 0) {
                        await db.insert(contentCategories).values(
                            catIds.map((cid: number) => ({ contentId: postId, categoryId: cid })),
                        );
                    }
                }
            } else {
                updateData.status = 'draft';
                const [newPost] = await db.insert(content).values(updateData).returning();
                id = newPost.id;
            }

            return c.json({ success: true, id: id });
        } catch (error: any) {
            log.error("Autosave error", error instanceof Error ? error : undefined);
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Datos inválidos" });
            }
            throw error instanceof AppError ? error : AppError.fromCatalog("internal_error", {
                message: getErrorMessage(error),
                status: 500,
            });
        }
    },

    async deletePost(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de entrada");
            const postType = await getContentTypeBySlug("post");

            const post = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
            });

            if (!post) {
                throw new AppError("post_not_found", "Entrada no encontrada", 404);
            }

            await contentService.deleteContent(id);
            return c.json({ success: true });
        } catch (error: any) {
            log.error("Error deleting post", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("post_delete_failed", getErrorMessage(error), 500);
        }
    },

    // --- Pages ---

    async listPages(c: Context) {
        try {
            const user = c.get("user");
            const page = parseInt(c.req.query("page") || "1");
            const status = c.req.query("status");
            const limit = 20;
            const offset = (page - 1) * limit;

            const pageType = await getContentTypeBySlug("page");

            const conditions = [eq(content.contentTypeId, pageType.id)];
            if (status) {
                conditions.push(eq(content.status, status));
            }
            const whereClause = conditions.length > 1
                ? and(...conditions)
                : conditions[0];

            const [pages, totalResult] = await Promise.all([
                db.query.content.findMany({
                    where: whereClause,
                    limit,
                    offset,
                    orderBy: [desc(content.createdAt)],
                    with: {
                        contentType: true,
                        author: true,
                    },
                }),
                db.select({ count: count() }).from(content).where(whereClause),
            ]);

            const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit) || 1;

            return c.html(ContentListNexusPage({
                user: normalizeUser(user),
                contents: pages.map((item) => ({
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    status: item.status,
                    contentType: { name: item.contentType.name },
                    author: normalizeAuthor(item.author),
                    createdAt: item.createdAt,
                })),
                totalPages,
                currentPage: page,
                title: "Páginas",
                createPath: `${env.ADMIN_PATH}/pages/new`,
                createLabel: "Nueva Página",
                basePath: `${env.ADMIN_PATH}/pages`,
                showContentType: false,
                activePage: "content.pages",
            }));
        } catch (error: any) {
            log.error("Error rendering pages list", error instanceof Error ? error : undefined);
            return c.text("Error al cargar las páginas", 500);
        }
    },

    async createPageForm(c: Context) {
        try {
            const user = c.get("user");

            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            return c.html(PageFormNexusPage({
                user: normalizeUser(user),
                seo: {},
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            log.error("Error rendering new page form", error instanceof Error ? error : undefined);
            return c.text("Error al cargar el formulario", 500);
        }
    },

    async createPage(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.parseBody();
            const pageType = await getContentTypeBySlug("page");

            const title = parseStringField(body.title);
            const slug = parseStringField(body.slug);
            const bodyContent = parseStringField(body.body);

            if (!title || !slug || !bodyContent) {
                return c.text("Título, slug y contenido son obligatorios", 400);
            }

            const status = parseStringField(body.status) as ContentStatus | undefined;

            await contentService.createContent({
                contentTypeId: pageType.id,
                title,
                slug,
                excerpt: parseNullableField(body.excerpt) ?? undefined,
                body: bodyContent,
                status: status && ["draft", "published", "archived", "scheduled"].includes(status)
                    ? status
                    : "draft",
                template: parseNullableField(body.template) ?? undefined,
                authorId: user.userId,
                seo: extractSeoPayload(body as Record<string, unknown>),
            });

            return c.redirect(`${env.ADMIN_PATH}/pages`);
        } catch (error: any) {
            log.error("Error creating page", error instanceof Error ? error : undefined);
            return c.text("Error al crear la página", 500);
        }
    },

    async editPageForm(c: Context) {
        try {
            const user = c.get("user");
            const id = parseNumericParam(c.req.param("id"), "ID de página");
            const pageType = await getContentTypeBySlug("page");

            const pageItem = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
            });

            if (!pageItem) {
                throw AppError.fromCatalog("page_not_found");
            }

            let notifications: any[] = [];
            let unreadNotificationCount = 0;
            try {
                notifications = await notificationService.getForUser({
                    userId: user.userId,
                    isRead: false,
                    limit: 5,
                    offset: 0,
                });
                unreadNotificationCount = await notificationService.getUnreadCount(
                    user.userId,
                );
            } catch (error) {
                log.error("Error loading notifications", error instanceof Error ? error : undefined);
            }

            const seoData = await db.query.contentSeo.findFirst({
                where: eq(contentSeo.contentId, id),
            });

            const seo = normalizeSeo(seoData) ?? {};

            return c.html(PageFormNexusPage({
                user: normalizeUser(user),
                page: {
                    id: pageItem.id,
                    title: pageItem.title,
                    slug: pageItem.slug,
                    excerpt: pageItem.excerpt ?? undefined,
                    body: pageItem.body ?? "",
                    status: pageItem.status,
                    template: pageItem.template,
                },
                seo,
                notifications,
                unreadNotificationCount,
            }));
        } catch (error: any) {
            return renderTextError(c, error, "Error al cargar la página");
        }
    },

    async updatePage(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de página");
            const body = await c.req.parseBody();
            const pageType = await getContentTypeBySlug("page");

            const pageItem = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
            });

            if (!pageItem) {
                return c.text("Página no encontrada", 404);
            }

            const title = parseStringField(body.title) || pageItem.title;
            const slug = parseStringField(body.slug) || pageItem.slug;
            const status = parseStringField(body.status) as ContentStatus | undefined;

            const normalizedStatus: ContentStatus =
                status && ALLOWED_STATUSES.includes(status)
                    ? status
                    : (pageItem.status as ContentStatus);

            await contentService.updateContent(id, {
                title,
                slug,
                excerpt: parseNullableField(body.excerpt) ?? undefined,
                body: parseStringField(body.body) || pageItem.body || undefined,
                status: normalizedStatus,
                template: parseNullableField(body.template) ?? undefined,
                seo: extractSeoPayload(body as Record<string, unknown>),
            });

            return c.redirect(`${env.ADMIN_PATH}/pages`);
        } catch (error: any) {
            return renderTextError(c, error, "Error al actualizar la página");
        }
    },

    async deletePage(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "ID de página");
            const pageType = await getContentTypeBySlug("page");

            const pageItem = await db.query.content.findFirst({
                where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
            });

            if (!pageItem) {
                throw AppError.fromCatalog("page_not_found");
            }

            await contentService.deleteContent(id);
            return c.json({ success: true });
        } catch (error: any) {
            log.error("Error deleting page", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("page_delete_failed", getErrorMessage(error), 500);
        }
    },
};
