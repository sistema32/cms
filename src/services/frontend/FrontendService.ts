import * as settingsService from "@/services/system/settingsService.ts";
import { env } from "@/config/env.ts";
import { TemplateService } from "@/services/themes/TemplateService.ts";
import { SEOHelper } from "@/lib/seo/SEOHelper.ts";
import { StructuredDataGenerator } from "@/lib/seo/StructuredDataGenerator.ts";
import { URLOptimizer } from "@/lib/seo-optimization/URLOptimizer.ts";

/**
 * Service responsible for frontend common data and SEO.
 * Implements Singleton pattern.
 */
export class FrontendService {
    private static instance: FrontendService;
    private templateService: TemplateService;
    private seoHelper: SEOHelper;
    private structuredDataGenerator: StructuredDataGenerator;
    private urlOptimizer: URLOptimizer;

    private commonDataCache = new Map<string, {
        data: any;
        timestamp: number;
    }>();

    private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    private constructor() {
        this.templateService = TemplateService.getInstance();
        this.seoHelper = SEOHelper.getInstance();
        this.structuredDataGenerator = StructuredDataGenerator.getInstance();
        this.urlOptimizer = new URLOptimizer();
    }

    public static getInstance(): FrontendService {
        if (!FrontendService.instance) {
            FrontendService.instance = new FrontendService();
        }
        return FrontendService.instance;
    }

    /**
     * Invalida el cache de common data
     */
    public invalidateCommonDataCache() {
        this.commonDataCache.clear();
        console.log("✅ Common data cache invalidated");
    }

    /**
     * Get blog base path from settings
     */
    public async getBlogBase(): Promise<string> {
        return await settingsService.getSetting("blog_base", "blog");
    }

    /**
     * Load common data needed by all templates (menus, categories, etc.)
     * Con caching para mejorar performance
     */
    public async loadCommonTemplateData() {
        const cacheKey = "common_template_data";
        const cached = this.commonDataCache.get(cacheKey);

        // Retornar desde cache si es válido
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        // Cargar datos frescos
        const themeHelpers = await this.templateService.getThemeHelpers();

        // Usar Promise.all para cargar en paralelo
        const [headerMenu, footerMenu, categories] = await Promise.all([
            themeHelpers.getMenu("main"),
            themeHelpers.getMenu("footer"),
            themeHelpers.getCategories(6),
        ]);

        const data = {
            headerMenu,
            footerMenu,
            categories,
        };

        // Guardar en cache
        this.commonDataCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        });

        return data;
    }

    /**
     * Genera todos los meta tags SEO completos para una página
     */
    public async generateSEOMetaTags(options: {
        content?: any;
        url: string;
        pageType?: "article" | "website" | "blog";
        title?: string;
        description?: string;
        image?: string;
        author?: { name: string; email?: string };
        categories?: Array<{ name: string; slug: string }>;
        tags?: Array<{ name: string; slug: string }>;
        breadcrumbs?: Array<{ label: string; url: string }>;
        pagination?: { prev?: string; next?: string };
    }): Promise<string> {
        const {
            content: contentData,
            url,
            pageType = "website",
            title: defaultTitle,
            description: defaultDescription,
            image: defaultImage,
            author,
            categories,
            tags,
            breadcrumbs,
            pagination,
        } = options;

        const site = await settingsService.getSetting("site_name", "LexCMS");
        const siteUrl = await settingsService.getSetting(
            "site_url",
            env.BASE_URL,
        );
        const twitterHandle = await settingsService.getSetting(
            "twitter_handle",
            "@lexcms",
        );

        let metadata: any = {
            title: defaultTitle || site,
            description: defaultDescription || "",
            canonical: `${siteUrl}${url}`,
            robots: "index,follow",
            openGraph: {
                title: defaultTitle || site,
                type: pageType,
                url: `${siteUrl}${url}`,
                siteName: site,
                locale: "es_ES",
            },
            twitterCard: {
                card: "summary_large_image",
                title: defaultTitle || site,
                site: twitterHandle,
            },
        };

        // Si hay contenido, usar datos SEO personalizados si existen
        if (contentData) {
            const seoData = contentData.contentSeo || contentData.seo; // Support both structures if needed

            // Título
            const finalTitle = seoData?.metaTitle || contentData.title ||
                defaultTitle || site;
            metadata.title = finalTitle;
            metadata.openGraph.title = seoData?.ogTitle || finalTitle;
            metadata.twitterCard.title = seoData?.twitterTitle || finalTitle;

            // Descripción
            const finalDescription = seoData?.metaDescription || contentData.excerpt ||
                defaultDescription || "";
            metadata.description = finalDescription;
            metadata.openGraph.description = seoData?.ogDescription || finalDescription;
            metadata.twitterCard.description = seoData?.twitterDescription ||
                finalDescription;

            // Imagen
            const finalImage = seoData?.ogImage || contentData.featuredImage?.url ||
                contentData.featureImage || defaultImage;
            if (finalImage) {
                metadata.openGraph.image = finalImage.startsWith("http")
                    ? finalImage
                    : `${siteUrl}${finalImage}`;
                metadata.twitterCard.image = metadata.openGraph.image;
                metadata.twitterCard.imageAlt = seoData?.twitterImageAlt ||
                    contentData.title;
            }

            // Canonical
            if (seoData?.canonicalUrl) {
                metadata.canonical = seoData.canonicalUrl;
            }

            // Robots
            const noIndex = seoData?.noIndex || false;
            const noFollow = seoData?.noFollow || false;
            if (noIndex || noFollow) {
                const robots = [];
                if (noIndex) robots.push("noindex");
                else robots.push("index");
                if (noFollow) robots.push("nofollow");
                else robots.push("follow");
                metadata.robots = robots.join(",");
            }

            // Open Graph type para artículos
            if (pageType === "article" && seoData?.ogType) {
                metadata.openGraph.type = seoData.ogType;
            } else if (pageType === "article") {
                metadata.openGraph.type = "article";
                metadata.openGraph.publishedTime = contentData.publishedAt?.toISOString
                    ? contentData.publishedAt.toISOString()
                    : contentData.publishedAt;
                metadata.openGraph.modifiedTime = contentData.updatedAt?.toISOString
                    ? contentData.updatedAt.toISOString()
                    : contentData.updatedAt;
                if (author) {
                    metadata.openGraph.author = author.name;
                }
                if (categories && categories.length > 0) {
                    metadata.openGraph.section = categories[0].name;
                }
                if (tags && tags.length > 0) {
                    metadata.openGraph.tags = tags.map((t: any) => t.name);
                }
            }

            // Structured Data (Schema.org)
            if (pageType === "article") {
                const articleSchema = this.structuredDataGenerator.generateArticle(
                    contentData as any,
                    {
                        name: author?.name || "Unknown",
                        url: author ? `${siteUrl}/author/${author.email}` : undefined,
                    },
                    { name: site },
                );
                metadata.schema = articleSchema;
            } else if (seoData?.schemaJson) {
                // Usar schema personalizado si existe
                try {
                    metadata.schema = JSON.parse(seoData.schemaJson);
                } catch (e) {
                    console.error("Error parsing custom schema JSON:", e);
                }
            }
        }

        // Generar meta tags HTML
        let metaTags = this.seoHelper.generateAllMetaTags(metadata);

        // Agregar breadcrumbs si existen
        if (breadcrumbs && breadcrumbs.length > 0) {
            const breadcrumbItems = breadcrumbs.map((b, index) => ({
                name: b.label,
                url: b.url,
                position: index + 1,
            }));
            const breadcrumbSchema = this.urlOptimizer.generateBreadcrumbSchema(breadcrumbItems);
            metaTags += `\n<script type="application/ld+json">\n${JSON.stringify(breadcrumbSchema, null, 2)
                }\n</script>`;
        }

        // Agregar pagination links
        if (pagination) {
            if (pagination.prev) {
                metaTags += `\n<link rel="prev" href="${siteUrl}${pagination.prev}" />`;
            }
            if (pagination.next) {
                metaTags += `\n<link rel="next" href="${siteUrl}${pagination.next}" />`;
            }
        }

        // Preload de recursos críticos
        metaTags += "\n<!-- Preload Critical Resources -->";
        metaTags += `\n<link rel="preconnect" href="${siteUrl}" />`;
        metaTags +=
            '\n<link rel="dns-prefetch" href="https://fonts.googleapis.com" />';

        return metaTags;
    }
}
