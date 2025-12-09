import { Hono } from "hono";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import {
    categories,
    content,
    contentCategories,
    contentSeo,
    contentTags,
    contentTypes,
} from "../../db/schema.ts";
import { env } from "../../config/env.ts";
import { notificationService } from "../../lib/email/index.ts";
import * as contentService from "../../services/contentService.ts";
import ContentListNexusPage from "../../admin/pages/ContentListNexus.tsx";
import ContentFormNexusPage from "../../admin/pages/ContentFormNexus.tsx";
import { PostFormNexusPage } from "../../admin/pages/PostFormNexus.tsx";
import PageFormNexusPage from "../../admin/pages/PageFormNexus.tsx";
import {
    extractSeoPayload,
    parseIds,
    parseNullableField,
    parseStringField,
} from "./helpers.ts";

export const contentRouter = new Hono();

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

/**
 * GET /content - Content list
 */
contentRouter.get("/content", async (c) => {
    try {
        const user = c.get("user");
        const page = parseInt(c.req.query("page") || "1");
        const status = c.req.query("status");
        const limit = 20;
        const offset = (page - 1) * limit;

        // Get content with filters
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
                user: {
                    id: user.userId,
                    name: user.name as string | null,
                    email: user.email,
                },
                contents: contents.map((item) => ({
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    status: item.status,
                    contentType: { name: item.contentType.name },
                    author: { name: item.author.name || "", email: item.author.email },
                    createdAt: item.createdAt,
                })),
                totalPages,
                currentPage: page,
            }),
        );
    } catch (error: any) {
        console.error("Error rendering content list:", error);
        return c.text("Error al cargar el contenido", 500);
    }
});

/**
 * GET /content/new - New content form
 */
contentRouter.get("/content/new", async (c) => {
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
            console.error("Error loading notifications:", error);
        }

        const [contentTypesData, categoriesData, tagsData] = await Promise.all([
            db.query.contentTypes.findMany(),
            db.query.categories.findMany(),
            db.query.tags.findMany(),
        ]);

        return c.html(
            ContentFormNexusPage({
                user: {
                    id: user.userId,
                    name: user.name as string | null,
                    email: user.email,
                },
                contentTypes: contentTypesData,
                categories: categoriesData,
                tags: tagsData,
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error rendering content form:", error);
        return c.text("Error al cargar el formulario", 500);
    }
});

/**
 * POST /content/new - Create content
 */
contentRouter.post("/content/new", async (c) => {
    try {
        const user = c.get("user");
        const body = await c.req.parseBody();

        const [newContent] = await db.insert(content).values({
            title: body.title as string,
            slug: body.slug as string,
            body: body.body as string,
            excerpt: body.excerpt as string || null,
            status: body.status as string,
            contentTypeId: parseInt(body.contentTypeId as string),
            authorId: user.userId,
        }).returning();

        // Handle categories - get array from form data
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

        // Handle tags - get array from form data
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
        console.error("Error creating content:", error);
        return c.text("Error al crear el contenido", 500);
    }
});

/**
 * GET /content/edit/:id - Show content edit form
 */
contentRouter.get("/content/edit/:id", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));

        // Get content with relations
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

        // Get selected categories
        const selectedCategoriesData = await db.query.contentCategories.findMany({
            where: eq(contentCategories.contentId, id),
        });
        const selectedCategories = selectedCategoriesData.map((c) => c.categoryId);

        // Get selected tags
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
            console.error("Error loading notifications:", error);
        }

        // Get all content types, categories, and tags for selects
        const [contentTypesData, categoriesData, tagsData] = await Promise.all([
            db.query.contentTypes.findMany(),
            db.query.categories.findMany(),
            db.query.tags.findMany(),
        ]);

        return c.html(ContentFormNexusPage({
            user: { id: user.userId, name: user.name, email: user.email },
            content: contentItem,
            contentTypes: contentTypesData,
            categories: categoriesData,
            tags: tagsData,
            selectedCategories,
            selectedTags,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading content for edit:", error);
        return c.text("Error al cargar el contenido", 500);
    }
});

/**
 * POST /content/edit/:id - Update content
 */
contentRouter.post("/content/edit/:id", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));
        const body = await c.req.parseBody();

        // Update content
        await db.update(content).set({
            title: body.title as string,
            slug: body.slug as string,
            body: body.body as string,
            excerpt: body.excerpt as string || null,
            status: body.status as string,
            contentTypeId: parseInt(body.contentTypeId as string),
            updatedAt: new Date(),
        }).where(eq(content.id, id));

        // Update categories - delete existing and insert new
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

        // Update tags - delete existing and insert new
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
        console.error("Error updating content:", error);
        return c.text("Error al actualizar el contenido", 500);
    }
});

/**
 * POST /content/delete/:id - Delete content
 */
contentRouter.post("/content/delete/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        await db.delete(content).where(eq(content.id, id));
        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting content:", error);
        return c.json({ success: false }, 500);
    }
});

/**
 * GET /posts - Posts list
 */
contentRouter.get("/posts", async (c) => {
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
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            contents: posts.map((item) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                status: item.status,
                contentType: { name: item.contentType.name },
                author: { name: item.author.name || "", email: item.author.email },
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
        console.error("Error rendering posts list:", error);
        return c.text("Error al cargar las entradas", 500);
    }
});

/**
 * POST /posts/autosave - Autosave post draft
 */
contentRouter.post("/posts/autosave", async (c) => {
    try {
        const user = c.get("user");
        const body = await c.req.json();

        let id = body.id ? parseInt(body.id) : null;

        if (!body.title) {
            return c.json({ success: false, error: "Title required" }, 400);
        }

        const postType = await getContentTypeBySlug("post");

        const updateData: any = {
            title: body.title,
            slug: body.slug,
            body: body.body,
            excerpt: body.excerpt || null,
            updatedAt: new Date(),
            contentTypeId: postType.id,
            authorId: user.id || user.userId, // Fallback for safety
        };

        if (body.status) updateData.status = body.status;
        if (body.featuredImageId) updateData.featuredImageId = parseInt(body.featuredImageId);
        if (body.visibility) updateData.visibility = body.visibility;
        if (body.password) updateData.password = body.password;

        if (id) {
            await db.update(content).set(updateData).where(eq(content.id, id));
            if (body['categoryIds[]']) {
                const catIds = Array.isArray(body['categoryIds[]'])
                    ? body['categoryIds[]'].map((i: any) => parseInt(i))
                    : [parseInt(body['categoryIds[]'])].filter((n: any) => !isNaN(n));

                await db.delete(contentCategories).where(eq(contentCategories.contentId, id));
                if (catIds.length > 0) {
                    await db.insert(contentCategories).values(catIds.map((cid: number) => ({ contentId: id, categoryId: cid })));
                }
            }
        } else {
            updateData.status = 'draft';
            const [newPost] = await db.insert(content).values(updateData).returning();
            id = newPost.id;
        }

        return c.json({ success: true, id: id });
    } catch (error: any) {
        console.error("Autosave error:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /posts/new - New post form
 */
contentRouter.get("/posts/new", async (c) => {
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
            console.error("Error loading notifications:", error);
        }

        const [categoriesData, tagsData] = await Promise.all([
            db.query.categories.findMany({
                where: eq(categories.contentTypeId, postType.id),
                orderBy: (categories, { asc }) => [asc(categories.name)],
            }),
            db.query.tags.findMany({
                orderBy: (tags, { asc }) => [asc(tags.name)],
            }),
        ]);

        return c.html(PostFormNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            categories: categoriesData,
            tags: tagsData,
            selectedCategories: [],
            selectedTags: [],
            seo: {},
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error rendering new post form:", error);
        return c.text("Error al cargar el formulario", 500);
    }
});

/**
 * POST /posts/new - Create post
 */
contentRouter.post("/posts/new", async (c) => {
    try {
        const user = c.get("user");
        const body = await c.req.parseBody();
        const postType = await getContentTypeBySlug("post");

        const categoryIds = parseIds(
            (body as any).categories ?? (body as any)["categories[]"],
        );
        const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

        const title = parseStringField(body.title);
        const slug = parseStringField(body.slug);
        const bodyContent = parseStringField(body.body);

        if (!title || !slug || !bodyContent) {
            return c.text("Título, slug y contenido son obligatorios", 400);
        }

        const status = parseStringField(body.status) as
            | "draft"
            | "published"
            | "archived"
            | undefined;

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
        console.error("Error creating post:", error);
        return c.text("Error al crear la entrada", 500);
    }
});

/**
 * GET /posts/edit/:id - Edit post form
 */
contentRouter.get("/posts/edit/:id", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));
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
            console.error("Error loading notifications:", error);
        }

        const [categoriesData, tagsData, seoData] = await Promise.all([
            db.query.categories.findMany({
                where: eq(categories.contentTypeId, postType.id),
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

        const seo = seoData
            ? {
                metaTitle: seoData.metaTitle,
                metaDescription: seoData.metaDescription,
                canonicalUrl: seoData.canonicalUrl,
                ogTitle: seoData.ogTitle,
                ogDescription: seoData.ogDescription,
                ogImage: seoData.ogImage,
                ogType: seoData.ogType,
                twitterCard: seoData.twitterCard,
                twitterTitle: seoData.twitterTitle,
                twitterDescription: seoData.twitterDescription,
                twitterImage: seoData.twitterImage,
                focusKeyword: seoData.focusKeyword,
                schemaJson: seoData.schemaJson,
                noIndex: seoData.noIndex,
                noFollow: seoData.noFollow,
            }
            : {};

        return c.html(PostFormNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            post: {
                id: postItem.id,
                title: postItem.title,
                slug: postItem.slug,
                excerpt: postItem.excerpt,
                body: postItem.body,
                status: postItem.status,
            },
            categories: categoriesData,
            tags: tagsData,
            selectedCategories,
            selectedTags,
            seo,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading post for edit:", error);
        return c.text("Error al cargar la entrada", 500);
    }
});

/**
 * POST /posts/edit/:id - Update post
 */
contentRouter.post("/posts/edit/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const body = await c.req.parseBody();
        const postType = await getContentTypeBySlug("post");

        const post = await db.query.content.findFirst({
            where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
        });

        if (!post) {
            return c.text("Entrada no encontrada", 404);
        }

        const categoryIds = parseIds(
            (body as any).categories ?? (body as any)["categories[]"],
        );
        const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

        const title = parseStringField(body.title) || post.title;
        const slug = parseStringField(body.slug) || post.slug;
        const status = parseStringField(body.status) as
            | "draft"
            | "published"
            | "archived"
            | undefined;

        await contentService.updateContent(id, {
            title,
            slug,
            excerpt: parseNullableField(body.excerpt),
            body: parseStringField(body.body) || post.body || undefined,
            status: status && ["draft", "published", "archived"].includes(status)
                ? status
                : post.status,
            categoryIds,
            tagIds,
            seo: extractSeoPayload(body as Record<string, unknown>),
        });

        return c.redirect(`${env.ADMIN_PATH}/posts`);
    } catch (error: any) {
        console.error("Error updating post:", error);
        return c.text("Error al actualizar la entrada", 500);
    }
});

/**
 * POST /posts/delete/:id - Delete post
 */
contentRouter.post("/posts/delete/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const postType = await getContentTypeBySlug("post");

        const post = await db.query.content.findFirst({
            where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
        });

        if (!post) {
            return c.json({ success: false, error: "Entrada no encontrada" }, 404);
        }

        await contentService.deleteContent(id);
        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting post:", error);
        return c.json({ success: false }, 500);
    }
});

/**
 * GET /pages - Pages list
 */
contentRouter.get("/pages", async (c) => {
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
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            contents: pages.map((item) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                status: item.status,
                contentType: { name: item.contentType.name },
                author: { name: item.author.name || "", email: item.author.email },
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
        console.error("Error rendering pages list:", error);
        return c.text("Error al cargar las páginas", 500);
    }
});

/**
 * GET /pages/new - New page form
 */
contentRouter.get("/pages/new", async (c) => {
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
            console.error("Error loading notifications:", error);
        }

        return c.html(PageFormNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            seo: {},
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error rendering new page form:", error);
        return c.text("Error al cargar el formulario", 500);
    }
});

/**
 * POST /pages/new - Create page
 */
contentRouter.post("/pages/new", async (c) => {
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

        const status = parseStringField(body.status) as
            | "draft"
            | "published"
            | "archived"
            | undefined;

        await contentService.createContent({
            contentTypeId: pageType.id,
            title,
            slug,
            excerpt: parseNullableField(body.excerpt) ?? undefined,
            body: bodyContent,
            status: status && ["draft", "published", "archived"].includes(status)
                ? status
                : "draft",
            template: parseNullableField(body.template) ?? undefined,
            authorId: user.userId,
            seo: extractSeoPayload(body as Record<string, unknown>),
        });

        return c.redirect(`${env.ADMIN_PATH}/pages`);
    } catch (error: any) {
        console.error("Error creating page:", error);
        return c.text("Error al crear la página", 500);
    }
});

/**
 * GET /pages/edit/:id - Edit page form
 */
contentRouter.get("/pages/edit/:id", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));
        const pageType = await getContentTypeBySlug("page");

        const pageItem = await db.query.content.findFirst({
            where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
        });

        if (!pageItem) {
            return c.text("Página no encontrada", 404);
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
            console.error("Error loading notifications:", error);
        }

        const seoData = await db.query.contentSeo.findFirst({
            where: eq(contentSeo.contentId, id),
        });

        const seo = seoData
            ? {
                metaTitle: seoData.metaTitle,
                metaDescription: seoData.metaDescription,
                canonicalUrl: seoData.canonicalUrl,
                ogTitle: seoData.ogTitle,
                ogDescription: seoData.ogDescription,
                ogImage: seoData.ogImage,
                ogType: seoData.ogType,
                twitterCard: seoData.twitterCard,
                twitterTitle: seoData.twitterTitle,
                twitterDescription: seoData.twitterDescription,
                twitterImage: seoData.twitterImage,
                focusKeyword: seoData.focusKeyword,
                schemaJson: seoData.schemaJson,
                noIndex: seoData.noIndex,
                noFollow: seoData.noFollow,
            }
            : {};

        return c.html(PageFormNexusPage({
            user: {
                id: user.userId,
                name: user.name || user.email,
                email: user.email,
            },
            page: {
                id: pageItem.id,
                title: pageItem.title,
                slug: pageItem.slug,
                excerpt: pageItem.excerpt,
                body: pageItem.body,
                status: pageItem.status,
                template: pageItem.template,
            },
            seo,
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading page for edit:", error);
        return c.text("Error al cargar la página", 500);
    }
});

/**
 * POST /pages/edit/:id - Update page
 */
contentRouter.post("/pages/edit/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
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
        const status = parseStringField(body.status) as
            | "draft"
            | "published"
            | "archived"
            | undefined;

        await contentService.updateContent(id, {
            title,
            slug,
            excerpt: parseNullableField(body.excerpt),
            body: parseStringField(body.body) || pageItem.body || undefined,
            status: status && ["draft", "published", "archived"].includes(status)
                ? status
                : pageItem.status,
            template: parseNullableField(body.template),
            seo: extractSeoPayload(body as Record<string, unknown>),
        });

        return c.redirect(`${env.ADMIN_PATH}/pages`);
    } catch (error: any) {
        console.error("Error updating page:", error);
        return c.text("Error al actualizar la página", 500);
    }
});

/**
 * POST /pages/delete/:id - Delete page
 */
contentRouter.post("/pages/delete/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const pageType = await getContentTypeBySlug("page");

        const pageItem = await db.query.content.findFirst({
            where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
        });

        if (!pageItem) {
            return c.json({ success: false, error: "Página no encontrada" }, 404);
        }

        await contentService.deleteContent(id);
        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting page:", error);
        return c.json({ success: false }, 500);
    }
});
