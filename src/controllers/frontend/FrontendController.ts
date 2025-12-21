import { Context } from "hono";
import { db } from "@/config/db.ts";
import {
    comments,
    content,
} from "@/db/schema.ts";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import * as themeService from "@/services/themes/themeService.ts";
import * as settingsService from "@/services/system/settingsService.ts";
import * as contentTypeService from "@/services/content/contentTypeService.ts";
import { TemplateService } from "@/services/themes/TemplateService.ts";
import { FrontendService } from "@/services/frontend/FrontendService.ts";
import { doAction } from "@/lib/hooks/index.ts";

export class FrontendController {
    private templateService: TemplateService;
    private frontendService: FrontendService;

    constructor() {
        this.templateService = TemplateService.getInstance();
        this.frontendService = FrontendService.getInstance();
    }

    /**
     * Renderiza la lista de posts (blog)
     */
    private async renderBlogTemplate(c: Context, page = 1) {
        const activeTheme = await themeService.getActiveTheme();
        const themeHelpers = await this.templateService.getThemeHelpers();
        const BlogTemplate = await this.templateService.getThemeTemplate("blog");
        const blogBase = await this.frontendService.getBlogBase();

        const site = await themeHelpers.getSiteData();
        const custom = await themeHelpers.getCustomSettings();
        const commonData = await this.frontendService.loadCommonTemplateData();

        const { posts, total, totalPages } = await themeHelpers.getPaginatedPosts(
            page,
        );

        // Si la página no existe, 404
        if (page > totalPages && totalPages > 0) {
            return c.text("Página no encontrada", 404);
        }

        const pagination = await themeHelpers.getPagination(page, total);
        const recentPosts = await themeHelpers.getRecentPosts(5);
        const tags = await themeHelpers.getPopularTags(20);

        // Generar pagination links
        const paginationLinks: { prev?: string; next?: string } = {};
        if (page > 1) {
            paginationLinks.prev = page === 2
                ? `/${blogBase}`
                : `/${blogBase}/page/${page - 1}`;
        }
        if (page < totalPages) {
            paginationLinks.next = `/${blogBase}/page/${page + 1}`;
        }

        // Generar breadcrumbs
        const breadcrumbs = [
            { label: "Inicio", url: "/" },
            { label: "Blog", url: `/${blogBase}` },
        ];
        if (page > 1) {
            breadcrumbs.push({
                label: `Página ${page}`,
                url: `/${blogBase}/page/${page}`,
            });
        }

        // Generar meta tags SEO completos
        const blogTitle = page > 1 ? `Blog - Página ${page}` : "Blog";
        const blogDescription = await settingsService.getSetting(
            "blog_description",
            "Todos nuestros artículos",
        );
        const seoMetaTags = await this.frontendService.generateSEOMetaTags({
            url: page === 1 ? `/${blogBase}` : `/${blogBase}/page/${page}`,
            pageType: "blog",
            title: blogTitle,
            description: blogDescription,
            breadcrumbs,
            pagination: paginationLinks,
        });

        return c.html(
            BlogTemplate({
                site,
                custom,
                activeTheme,
                posts,
                pagination,
                recentPosts,
                categories: commonData.categories,
                tags,
                blogBase,
                menu: commonData.headerMenu,
                footerMenu: commonData.footerMenu,
                seoMetaTags,
            }),
        );
    }

    /**
     * Renderiza una página estática por ID
     */
    private async renderPageById(c: Context, pageId: number) {
        const activeTheme = await themeService.getActiveTheme();
        const themeHelpers = await this.templateService.getThemeHelpers();

        // Buscar la página por ID
        const page = await db.query.content.findFirst({
            where: eq(content.id, pageId),
            with: {
                author: true,
                featuredImage: true,
                seo: true,
            },
        });

        if (!page) {
            return c.text("Página no encontrada", 404);
        }

        // Cargar template con sistema de fallback multinivel
        const PageTemplate = await this.templateService.loadPageTemplate(page.template, activeTheme);

        const site = await themeHelpers.getSiteData();
        const custom = await themeHelpers.getCustomSettings();
        const commonData = await this.frontendService.loadCommonTemplateData();
        const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

        const pageData = {
            id: page.id,
            title: page.title,
            slug: page.slug,
            body: page.body || "",
            featureImage: page.featuredImage?.url || undefined,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            author: {
                id: page.author.id,
                name: page.author.name || page.author.email,
                email: page.author.email,
            },
        };

        // Generar breadcrumbs para página
        const breadcrumbs = [
            { label: "Inicio", url: "/" },
            { label: page.title, url: `/${page.slug}` },
        ];

        // Generar meta tags SEO completos
        const seoMetaTags = await this.frontendService.generateSEOMetaTags({
            content: page,
            url: `/${page.slug}`,
            pageType: "website",
            author: pageData.author,
            breadcrumbs,
        });

        await doAction("frontend:rendered", pageData);

        return c.html(
            PageTemplate({
                site,
                custom,
                activeTheme,
                page: pageData,
                blogUrl,
                menu: commonData.headerMenu,
                footerMenu: commonData.footerMenu,
                categories: commonData.categories,
                seoMetaTags,
            }),
        );
    }

    /**
     * Renderiza el template home.tsx tradicional
     */
    private async renderHomeTemplate(c: Context) {
        const activeTheme = await themeService.getActiveTheme();
        const themeHelpers = await this.templateService.getThemeHelpers();
        const HomeTemplate = await this.templateService.getThemeTemplate("home");

        const site = await themeHelpers.getSiteData();
        const custom = await themeHelpers.getCustomSettings();
        const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);
        const commonData = await this.frontendService.loadCommonTemplateData();

        const featuredPosts = await themeHelpers.getFeaturedPosts(
            custom.homepage_featured_count || 6,
        );

        return c.html(
            HomeTemplate({
                site,
                custom,
                activeTheme,
                featuredPosts,
                categories: commonData.categories,
                blogUrl,
                menu: commonData.headerMenu,
                footerMenu: commonData.footerMenu,
            }),
        );
    }

    // ============= PUBLIC HANDLERS =============

    public home = async (c: Context) => {
        try {
            const homepageConfig = await settingsService.getHomepageConfig();

            // Modo 1: Mostrar lista de posts en la homepage
            if (homepageConfig.type === "posts_list") {
                console.log("📄 Rendering homepage as blog (posts list)");
                return await this.renderBlogTemplate(c, 1);
            }

            // Modo 2: Mostrar página estática específica
            if (homepageConfig.type === "static_page" && homepageConfig.pageId) {
                console.log(`📄 Rendering homepage as static page (ID: ${homepageConfig.pageId})`);
                return await this.renderPageById(c, homepageConfig.pageId);
            }

            // Modo 3: Template home.tsx del tema
            if (homepageConfig.type === "theme_home") {
                console.log("📄 Rendering homepage with theme home.tsx template");
                return await this.renderHomeTemplate(c);
            }

            // Fallback: posts list
            console.log("📄 Fallback: Rendering homepage as posts list");
            return await this.renderBlogTemplate(c, 1);
        } catch (error: any) {
            console.error("Error rendering home:", error);
            return c.text("Error al cargar la página", 500);
        }
    };

    public page = async (c: Context) => {
        try {
            const page = parseInt(c.req.param("page")) || 1;
            const frontPageType = await settingsService.getSetting(
                "front_page_type",
                "posts",
            );

            // Solo funciona si los posts están en la homepage
            if (frontPageType !== "posts") {
                const blogBase = await this.frontendService.getBlogBase();
                return c.redirect(`/${blogBase}/page/${page}`, 301);
            }

            // Redirigir a / si es página 1
            if (page === 1) {
                return c.redirect("/", 301);
            }

            console.log(`📄 Rendering homepage page ${page}`);
            return await this.renderBlogTemplate(c, page);
        } catch (error: any) {
            console.error("Error rendering page:", error);
            return c.text("Error al cargar la página", 500);
        }
    };

    public search = async (c: Context) => {
        try {
            const query = c.req.query("q") || "";
            const page = parseInt(c.req.query("page") || "1");

            const activeTheme = await themeService.getActiveTheme();
            const themeHelpers = await this.templateService.getThemeHelpers();
            const IndexTemplate = await this.templateService.getThemeTemplate("index");

            const site = await themeHelpers.getSiteData();
            const custom = await themeHelpers.getCustomSettings();
            const result = await themeHelpers.searchPosts(query, page);
            const pagination = await themeHelpers.getPagination(page, result.total);

            const commonData = await this.frontendService.loadCommonTemplateData();
            const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

            return c.html(
                IndexTemplate({
                    site,
                    custom,
                    activeTheme,
                    posts: result.posts,
                    pagination,
                    blogUrl,
                    menu: commonData.headerMenu,
                    footerMenu: commonData.footerMenu,
                    categories: commonData.categories,
                }),
            );
        } catch (error: any) {
            console.error("Error rendering search:", error);
            return c.text("Error al realizar la búsqueda", 500);
        }
    };

    public category = async (c: Context) => {
        try {
            const { slug } = c.req.param();
            const page = parseInt(c.req.query("page") || "1");

            const activeTheme = await themeService.getActiveTheme();
            const themeHelpers = await this.templateService.getThemeHelpers();
            const IndexTemplate = await this.templateService.getThemeTemplate("index");

            const site = await themeHelpers.getSiteData();
            const custom = await themeHelpers.getCustomSettings();
            const result = await themeHelpers.getPostsByCategory(slug, page);

            if (!result.category) {
                return c.text("Categoría no encontrada", 404);
            }

            const pagination = await themeHelpers.getPagination(page, result.total);

            const commonData = await this.frontendService.loadCommonTemplateData();
            const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

            return c.html(
                IndexTemplate({
                    site,
                    custom,
                    activeTheme,
                    posts: result.posts,
                    pagination,
                    blogUrl,
                    menu: commonData.headerMenu,
                    footerMenu: commonData.footerMenu,
                    categories: commonData.categories,
                }),
            );
        } catch (error: any) {
            console.error("Error rendering category:", error);
            return c.text("Error al cargar la categoría", 500);
        }
    };

    public tag = async (c: Context) => {
        try {
            const { slug } = c.req.param();
            const page = parseInt(c.req.query("page") || "1");

            const activeTheme = await themeService.getActiveTheme();
            const themeHelpers = await this.templateService.getThemeHelpers();
            const IndexTemplate = await this.templateService.getThemeTemplate("index");

            const site = await themeHelpers.getSiteData();
            const custom = await themeHelpers.getCustomSettings();
            const result = await themeHelpers.getPostsByTag(slug, page);

            if (!result.tag) {
                return c.text("Tag no encontrado", 404);
            }

            const pagination = await themeHelpers.getPagination(page, result.total);

            const commonData = await this.frontendService.loadCommonTemplateData();
            const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

            return c.html(
                IndexTemplate({
                    site,
                    custom,
                    activeTheme,
                    posts: result.posts,
                    pagination,
                    blogUrl,
                    menu: commonData.headerMenu,
                    footerMenu: commonData.footerMenu,
                    categories: commonData.categories,
                }),
            );
        } catch (error: any) {
            console.error("Error rendering tag:", error);
            return c.text("Error al cargar el tag", 500);
        }
    };

    public dynamicRoute = async (c: Context) => {
        try {
            const slug = c.req.param("slug");
            const homepageConfig = await settingsService.getHomepageConfig();

            // Check if this slug is the configured posts page
            if (homepageConfig.postsPage && slug === homepageConfig.postsPage) {
                console.log(`📄 Rendering posts page: /${slug}`);
                return await this.renderBlogTemplate(c, 1);
            }

            const blogBase = await this.frontendService.getBlogBase();

            // Evitar conflicto con la ruta del blog
            if (slug === blogBase) {
                return c.notFound();
            }

            // Obtener el tipo de contenido "page"
            const pageType = await contentTypeService.getContentTypeBySlug("page");
            if (!pageType) {
                console.error("❌ Content type 'page' no encontrado");
                return c.notFound();
            }

            // Buscar la página por slug
            const page = await db.query.content.findFirst({
                where: and(
                    eq(content.slug, slug),
                    eq(content.contentTypeId, pageType.id),
                    eq(content.status, "published"),
                ),
                with: {
                    author: true,
                    featuredImage: true,
                    seo: true,
                },
            });

            if (!page) {
                return c.notFound();
            }

            // Cargar theme y helpers
            const activeTheme = await themeService.getActiveTheme();
            const themeHelpers = await this.templateService.getThemeHelpers();

            // Cargar template con sistema de fallback multinivel
            const PageTemplate = await this.templateService.loadPageTemplate(page.template, activeTheme);

            const site = await themeHelpers.getSiteData();
            const custom = await themeHelpers.getCustomSettings();
            const commonData = await this.frontendService.loadCommonTemplateData();
            const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

            // Transform page data
            const pageData = {
                id: page.id,
                title: page.title,
                slug: page.slug,
                body: page.body || "",
                featureImage: page.featuredImage?.url || null,
                author: {
                    id: page.author.id,
                    name: page.author.name || page.author.email,
                    email: page.author.email,
                    avatar: page.author.avatar || null,
                },
                createdAt: page.createdAt,
                updatedAt: page.updatedAt,
            };

            // SEO Meta Tags
            const seoMetaTags = await this.frontendService.generateSEOMetaTags({
                content: page,
                url: `/${page.slug}`,
                pageType: "website",
                author: pageData.author,
            });

            console.log(
                `📄 Rendering page: ${slug} with template: ${page.template || "default"}`,
            );

            return c.html(
                PageTemplate({
                    site,
                    custom,
                    activeTheme,
                    page: pageData,
                    blogUrl,
                    menu: commonData.headerMenu,
                    footerMenu: commonData.footerMenu,
                    categories: commonData.categories,
                    seoMetaTags,
                }),
            );
        } catch (error: any) {
            console.error("Error rendering page:", error);
            return c.text("Error al cargar la página", 500);
        }
    };

    public dynamicRoutePage = async (c: Context) => {
        try {
            const slug = c.req.param("slug");
            const page = parseInt(c.req.param("page")) || 1;
            const blogBase = await this.frontendService.getBlogBase();

            // Evitar conflicto con la ruta del blog
            if (slug === blogBase) {
                return c.notFound();
            }

            // Obtener el tipo de contenido "page"
            const pageType = await contentTypeService.getContentTypeBySlug("page");
            if (!pageType) {
                console.error("❌ Content type 'page' no encontrado");
                return c.notFound();
            }

            // Buscar la página por slug
            const pageRecord = await db.query.content.findFirst({
                where: and(
                    eq(content.slug, slug),
                    eq(content.contentTypeId, pageType.id),
                    eq(content.status, "published"),
                ),
            });

            if (!pageRecord) {
                return c.notFound();
            }

            // Verificar si esta página está configurada como la página de posts
            const postsPageId = await settingsService.getSetting("posts_page_id", null);
            if (postsPageId && parseInt(postsPageId as string) === pageRecord.id) {
                // Esta página está configurada como la página de posts, mostrar la lista de posts paginada
                console.log(
                    `📄 Rendering blog posts page ${page} at /${slug}/page/${page} (posts page ID: ${pageRecord.id})`,
                );
                return await this.renderBlogTemplate(c, page);
            }

            // Si no es la página de posts, devolver not found
            return c.notFound();
        } catch (error: any) {
            console.error("Error rendering paged posts:", error);
            return c.text("Error al cargar la página", 500);
        }
    };

    public blogIndex = async (c: Context) => {
        const pathSegment = c.req.param("blogBase");
        const blogBase = await this.frontendService.getBlogBase();

        // Verificar si esta ruta es para el blog
        if (pathSegment !== blogBase) {
            return c.notFound();
        }

        try {
            const frontPageType = await settingsService.getSetting(
                "front_page_type",
                "posts",
            );
            const postsPageId = await settingsService.getSetting("posts_page_id", null);

            // Si los posts están en la homepage, redirigir
            if (frontPageType === "posts") {
                console.log(`🔄 Redirecting /${blogBase} to / (posts are on homepage)`);
                return c.redirect("/", 301);
            }

            // Si hay una página específica configurada para los posts, redirigir a esa página
            if (postsPageId) {
                const postsPage = await db.query.content.findFirst({
                    where: and(
                        eq(content.id, parseInt(postsPageId as string)),
                        eq(content.status, "published"),
                    ),
                });
                if (postsPage) {
                    console.log(
                        `🔄 Redirecting /${blogBase} to /${postsPage.slug} (configured posts page)`,
                    );
                    return c.redirect(`/${postsPage.slug}`, 301);
                }
            }

            // Renderizar blog normalmente
            console.log(`📄 Rendering blog at /${blogBase}`);
            return await this.renderBlogTemplate(c, 1);
        } catch (error: any) {
            console.error("Error rendering blog:", error);
            return c.text("Error al cargar el blog", 500);
        }
    };

    public blogPage = async (c: Context) => {
        try {
            const pathSegment = c.req.param("blogBase");
            const blogBase = await this.frontendService.getBlogBase();

            // Verificar si esta ruta es para el blog
            if (pathSegment !== blogBase) {
                return c.notFound();
            }

            const page = parseInt(c.req.param("page")) || 1;
            const frontPageType = await settingsService.getSetting(
                "front_page_type",
                "posts",
            );
            const postsPageId = await settingsService.getSetting("posts_page_id", null);

            // Si los posts están en la homepage
            if (frontPageType === "posts") {
                if (page === 1) {
                    console.log(`🔄 Redirecting /${blogBase}/page/1 to /`);
                    return c.redirect("/", 301);
                }
                console.log(`🔄 Redirecting /${blogBase}/page/${page} to /page/${page}`);
                return c.redirect(`/page/${page}`, 301);
            }

            // Si hay una página específica configurada para los posts, redirigir a esa página
            if (postsPageId) {
                const postsPage = await db.query.content.findFirst({
                    where: and(
                        eq(content.id, parseInt(postsPageId as string)),
                        eq(content.status, "published"),
                    ),
                });
                if (postsPage) {
                    if (page === 1) {
                        console.log(
                            `🔄 Redirecting /${blogBase}/page/1 to /${postsPage.slug} (configured posts page)`,
                        );
                        return c.redirect(`/${postsPage.slug}`, 301);
                    } else {
                        console.log(
                            `🔄 Redirecting /${blogBase}/page/${page} to /${postsPage.slug}/page/${page} (configured posts page)`,
                        );
                        return c.redirect(`/${postsPage.slug}/page/${page}`, 301);
                    }
                }
            }

            // Redirigir a /:blogBase si es página 1
            if (page === 1) {
                return c.redirect(`/${blogBase}`, 301);
            }

            // Renderizar blog con paginación
            console.log(`📄 Rendering blog page ${page} at /${blogBase}/page/${page}`);
            return await this.renderBlogTemplate(c, page);
        } catch (error: any) {
            console.error("Error rendering page:", error);
            return c.text("Error al cargar la página", 500);
        }
    };

    public singlePost = async (c: Context) => {
        try {
            const pathSegment = c.req.param("blogBase");
            const blogBase = await this.frontendService.getBlogBase();

            // Verificar si esta ruta es para el blog
            if (pathSegment !== blogBase) {
                return c.notFound();
            }

            const { slug } = c.req.param();

            // Si slug está vacío o es "page", redirigir al blog principal
            if (!slug || slug === "" || slug === "page") {
                return c.redirect(`/${blogBase}`, 301);
            }

            // Buscar el post por slug
            const post = await db.query.content.findFirst({
                where: eq(content.slug, slug),
                with: {
                    author: true,
                    contentCategories: {
                        with: {
                            category: true,
                        },
                    },
                    contentTags: {
                        with: {
                            tag: true,
                        },
                    },
                    featuredImage: true,
                    seo: true,
                },
            });

            if (!post) {
                return c.text("Post no encontrado", 404);
            }

            const activeTheme = await themeService.getActiveTheme();
            const themeHelpers = await this.templateService.getThemeHelpers();
            const PostTemplate = await this.templateService.getThemeTemplate("post");

            // Formatear datos del post
            const postData = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt || undefined,
                body: post.body || undefined,
                featureImage: post.featuredImage?.url || undefined,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                author: {
                    id: post.author.id,
                    name: post.author.name || post.author.email,
                    email: post.author.email,
                },
                categories: post.contentCategories.map((cc) => ({
                    id: cc.category.id,
                    name: cc.category.name,
                    slug: cc.category.slug,
                })),
                tags: post.contentTags.map((ct) => ({
                    id: ct.tag.id,
                    name: ct.tag.name,
                    slug: ct.tag.slug,
                })),
            };

            // Obtener datos del sitio y custom settings
            const site = await themeHelpers.getSiteData();
            const custom = await themeHelpers.getCustomSettings();

            // Load common data (menus, categories)
            const commonData = await this.frontendService.loadCommonTemplateData();

            // Obtener posts relacionados (por ahora, posts recientes)
            const relatedPosts = await themeHelpers.getRecentPosts(3);

            const blogUrl = await this.frontendService.getBlogBase().then((base) => `/${base}`);

            // Load comments for this post
            const postComments = await db.query.comments.findMany({
                where: and(
                    eq(comments.contentId, post.id),
                    eq(comments.status, "approved"),
                    isNull(comments.deletedAt),
                    isNull(comments.parentId), // Only top-level comments
                ),
                orderBy: [desc(comments.createdAt)],
                limit: 50,
                with: {
                    author: {
                        columns: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            // Get comments stats
            const [approvedCount] = await db
                .select({ count: count() })
                .from(comments)
                .where(
                    and(
                        eq(comments.contentId, post.id),
                        eq(comments.status, "approved"),
                        isNull(comments.deletedAt),
                    ),
                );

            const [pendingCount] = await db
                .select({ count: count() })
                .from(comments)
                .where(
                    and(
                        eq(comments.contentId, post.id),
                        eq(comments.status, "pending"),
                        isNull(comments.deletedAt),
                    ),
                );

            const commentsStats = {
                total: approvedCount.count + pendingCount.count,
                approved: approvedCount.count,
                pending: pendingCount.count,
            };

            // Format comments
            const formattedComments = postComments.map((comment) => ({
                id: comment.id,
                parentId: comment.parentId,
                author: {
                    id: comment.authorId || undefined,
                    name: comment.authorName,
                    email: comment.authorEmail,
                    website: comment.authorWebsite || undefined,
                    avatar: comment.author?.avatar || undefined,
                },
                body: comment.body,
                bodyCensored: comment.bodyCensored,
                createdAt: comment.createdAt,
                status: comment.status as "approved" | "pending" | "spam" | "deleted",
            }));

            // Generar breadcrumbs
            const breadcrumbs = [
                { label: "Inicio", url: "/" },
                { label: "Blog", url: blogUrl },
            ];
            if (postData.categories.length > 0) {
                breadcrumbs.push({
                    label: postData.categories[0].name,
                    url: `/category/${postData.categories[0].slug}`,
                });
            }
            breadcrumbs.push({ label: post.title, url: `${blogUrl}/${post.slug}` });

            // Generar meta tags SEO completos
            const seoMetaTags = await this.frontendService.generateSEOMetaTags({
                content: post,
                url: `${blogUrl}/${post.slug}`,
                pageType: "article",
                author: postData.author,
                categories: postData.categories,
                tags: postData.tags,
                breadcrumbs,
            });

            // Renderizar template
            return c.html(
                PostTemplate({
                    site,
                    custom,
                    activeTheme,
                    post: postData,
                    relatedPosts,
                    blogUrl,
                    menu: commonData.headerMenu,
                    seoMetaTags,
                    footerMenu: commonData.footerMenu,
                    categories: commonData.categories,
                    comments: formattedComments,
                    commentsStats,
                }),
            );
        } catch (error: any) {
            console.error("Error rendering post:", error);
            return c.text("Error al cargar el post", 500);
        }
    };
}
