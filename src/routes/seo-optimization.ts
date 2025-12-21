/**
 * SEO Optimization API Routes
 * Routes for content analysis, web vitals tracking, and SEO monitoring
 */

import { Hono } from "hono";
import { z } from "zod";
import { contentOptimizer } from "../lib/seo-optimization/ContentOptimizer.ts";
import { seoMonitoring } from "../lib/seo-optimization/SEOMonitoring.ts";
import { imageOptimizer } from "../lib/seo-optimization/ImageOptimizer.ts";
import { advancedSchemaGenerator } from "../lib/seo-optimization/AdvancedSchema.ts";
import { hreflangManager } from "../lib/seo-optimization/HreflangManager.ts";
import { urlOptimizer } from "../lib/seo-optimization/URLOptimizer.ts";
import { pwaOptimizer } from "../lib/seo-optimization/PWAOptimizer.ts";
import { isSafePublicUrl } from "@/utils/validation.ts";
import { assertSafePublicUrl } from "@/lib/security/urlPolicy.ts";
import { isAppError } from "@/platform/errors.ts";

const app = new Hono();

/**
 * POST /api/seo-optimization/analyze-content
 * Analyze content for SEO optimization
 */
const analyzeContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  body: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  url: z.string().optional().refine(
    (url) => !url || isSafePublicUrl(url),
    { message: "URL no permitida" },
  ),
});

app.post("/analyze-content", async (c) => {
  try {
    const body = await c.req.json();
    const data = analyzeContentSchema.parse(body);

    const analysis = contentOptimizer.analyzeContent(
      data.title,
      data.description || "",
      data.body,
      data.keywords
    );

    return c.json({
      success: true,
      analysis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to analyze content" }, 500);
  }
});

/**
 * POST /api/seo-optimization/optimize-content
 * Get optimization suggestions for content
 */
app.post("/optimize-content", async (c) => {
  try {
    const body = await c.req.json();
    const data = analyzeContentSchema.parse(body);

    const analysis = contentOptimizer.analyzeContent(
      data.title,
      data.description || "",
      data.body,
      data.keywords,
    );

    return c.json({
      success: true,
      suggestions: analysis.suggestions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate suggestions" }, 500);
  }
});

/**
 * POST /api/seo-optimization/track-vitals
 * Track Core Web Vitals metrics
 */
const trackVitalsSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.string(),
  url: z.string(),
});

app.post("/track-vitals", async (c) => {
  try {
    const body = await c.req.json();
    const metric = trackVitalsSchema.parse(body);

    await seoMonitoring.trackWebVitals(metric);

    return c.json({
      success: true,
      message: "Web vitals tracked successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid metric data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to track web vitals" }, 500);
  }
});

/**
 * POST /api/seo-optimization/health-score
 * Calculate SEO health score
 */
const healthScoreSchema = z.object({
  indexedPages: z.number().min(0),
  totalPages: z.number().min(1),
  avgLCP: z.number().min(0),
  avgFID: z.number().min(0),
  avgCLS: z.number().min(0),
  crawlErrors: z.number().min(0),
  brokenLinks: z.number().min(0),
  avgLoadTime: z.number().min(0),
});

app.post("/health-score", async (c) => {
  try {
    const body = await c.req.json();
    const metrics = healthScoreSchema.parse(body);

    const result = seoMonitoring.calculateHealthScore(metrics);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid metrics data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to calculate health score" }, 500);
  }
});

/**
 * POST /api/seo-optimization/check-links
 * Check for broken links
 */
const checkLinksSchema = z.object({
  urls: z.array(z.string().url()).min(1),
});

app.post("/check-links", async (c) => {
  try {
    const body = await c.req.json();
    const { urls } = checkLinksSchema.parse(body);

    const results = await seoMonitoring.checkBrokenLinks(urls);

    const brokenLinks = results.filter((r) => r.error || r.status >= 400);

    return c.json({
      success: true,
      totalChecked: results.length,
      brokenCount: brokenLinks.length,
      results: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to check links" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-report
 * Generate SEO performance report
 */
const generateReportSchema = z.object({
  period: z.string(),
  rankings: z.array(z.object({
    keyword: z.string(),
    position: z.number(),
    url: z.string(),
    change: z.number().optional(),
  })),
  webVitals: z.array(z.object({
    url: z.string(),
    lcp: z.number(),
    fid: z.number(),
    cls: z.number(),
    fcp: z.number(),
    ttfb: z.number(),
    deviceType: z.enum(["mobile", "desktop"]),
    timestamp: z.string(),
  })),
  organicTraffic: z.object({
    sessions: z.number(),
    pageviews: z.number(),
    avgDuration: z.number(),
  }),
  topPages: z.array(z.object({
    url: z.string(),
    views: z.number(),
    avgPosition: z.number(),
  })),
  topKeywords: z.array(z.object({
    keyword: z.string(),
    position: z.number(),
    clicks: z.number(),
    impressions: z.number(),
  })),
});

app.post("/generate-report", async (c) => {
  try {
    const body = await c.req.json();
    const data = generateReportSchema.parse(body);

    const report = seoMonitoring.generateReport({
      ...data,
      rankings: data.rankings.map((r) => ({
        ...r,
        date: new Date(),
      })),
      webVitals: data.webVitals.map((v) => ({
        ...v,
        timestamp: new Date(v.timestamp),
      })),
    });

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid report data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate report" }, 500);
  }
});

/**
 * POST /api/seo-optimization/optimize-images
 * Get optimized image HTML
 */
const optimizeImagesSchema = z.object({
  images: z.array(z.object({
    path: z.string(),
    alt: z.string(),
    lazy: z.boolean().optional(),
    priority: z.boolean().optional(),
  })),
});

app.post("/optimize-images", async (c) => {
  try {
    const body = await c.req.json();
    const { images } = optimizeImagesSchema.parse(body);

    const optimizedImages = await Promise.all(
      images.map(async (img) => {
        const optimized = await imageOptimizer.optimizeImage(img.path);
        const loading = img.lazy === false ? "eager" : "lazy";

        return {
          original: img,
          srcset: optimized.srcset,
          picture: imageOptimizer.generatePictureElement(img.path, img.alt, {
            loading,
            decoding: "async",
            sizes: "100vw",
          }),
        };
      }),
    );

    return c.json({
      success: true,
      images: optimizedImages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to optimize images" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-schema
 * Generate Schema.org structured data
 */
const generateSchemaSchema = z.object({
  type: z.enum(["howto", "review", "recipe", "event", "product", "searchbox"]),
  data: z.record(z.any()),
});

app.post("/generate-schema", async (c) => {
  try {
    const body = await c.req.json();
    const { type, data } = generateSchemaSchema.parse(body);

    let schema;
    const payload = data as any;
    switch (type) {
      case "howto":
        schema = advancedSchemaGenerator.generateHowTo(payload);
        break;
      case "review":
        schema = advancedSchemaGenerator.generateReview(payload);
        break;
      case "recipe":
        schema = advancedSchemaGenerator.generateRecipe(payload);
        break;
      case "event":
        schema = advancedSchemaGenerator.generateEvent(payload);
        break;
      case "product":
        schema = advancedSchemaGenerator.generateProduct(payload);
        break;
      case "searchbox":
        schema = advancedSchemaGenerator.generateSitelinksSearchBox(
          String(data.url || ""),
        );
        break;
    }

    return c.json({
      success: true,
      schema,
      scriptTag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate schema" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-hreflang
 * Generate hreflang tags
 */
const generateHreflangSchema = z.object({
  baseUrl: z.string().url().refine(isSafePublicUrl, { message: "URL no permitida" }),
  slug: z.string(),
  translations: z.array(z.object({
    lang: z.string(),
    slug: z.string(),
  })),
});

app.post("/generate-hreflang", async (c) => {
  try {
    const body = await c.req.json();
    const { baseUrl, slug, translations } = generateHreflangSchema.parse(body);
    const safeBaseUrl = assertSafePublicUrl(baseUrl, "seo.hreflang.baseUrl");

    const hreflangTags = hreflangManager.generateContentHreflang(
      safeBaseUrl,
      slug,
      translations
    );

    return c.json({
      success: true,
      hreflangTags,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate hreflang tags" }, 500);
  }
});

/**
 * GET /api/seo-optimization/search-console-url
 * Generate Google Search Console URL
 */
app.get("/search-console-url", async (c) => {
  const siteUrl = c.req.query("siteUrl");
  const page = c.req.query("page");
  const query = c.req.query("query");
  const dateRange = c.req.query("dateRange");

  if (!siteUrl) {
    return c.json({ error: "siteUrl parameter is required" }, 400);
  }

  try {
    const safeSiteUrl = assertSafePublicUrl(siteUrl, "seo.searchConsole.siteUrl");
    const url = seoMonitoring.generateSearchConsoleUrl(safeSiteUrl, {
    page,
    query,
    dateRange,
  });

  return c.json({
    success: true,
    url,
  });
  } catch (error) {
    if (isAppError(error)) {
      return c.json(error.toResponse(), error.status as any);
    }
    throw error;
  }
});

/**
 * POST /api/seo-optimization/generate-slug
 * Generate SEO-friendly slug
 */
const generateSlugSchema = z.object({
  text: z.string().min(1),
  lowercase: z.boolean().optional(),
  separator: z.string().optional(),
  maxLength: z.number().optional(),
  removeStopWords: z.boolean().optional(),
});

app.post("/generate-slug", async (c) => {
  try {
    const body = await c.req.json();
    const { text, ...options } = generateSlugSchema.parse(body);

    const slug = urlOptimizer.generateSlug(text, options);

    return c.json({
      success: true,
      slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate slug" }, 500);
  }
});

/**
 * POST /api/seo-optimization/analyze-url
 * Analyze URL structure
 */
const analyzeUrlSchema = z.object({
  url: z.string().url().refine(isSafePublicUrl, { message: "URL no permitida" }),
});

app.post("/analyze-url", async (c) => {
  try {
    const body = await c.req.json();
    const { url } = analyzeUrlSchema.parse(body);
    assertSafePublicUrl(url, "seo.analyzeUrl");

    const analysis = urlOptimizer.analyzeURL(url);
    const validation = urlOptimizer.validateURL(url);

    return c.json({
      success: true,
      analysis,
      validation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to analyze URL" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-breadcrumbs
 * Generate breadcrumb navigation
 */
const generateBreadcrumbsSchema = z.object({
  baseUrl: z.string().url().refine(isSafePublicUrl, { message: "URL no permitida" }),
  path: z.string(),
  labels: z.record(z.string()).optional(),
  format: z.enum(["html", "schema"]).optional(),
});

app.post("/generate-breadcrumbs", async (c) => {
  try {
    const body = await c.req.json();
    const { baseUrl, path, labels, format = "html" } = generateBreadcrumbsSchema.parse(body);
    const safeBaseUrl = assertSafePublicUrl(baseUrl, "seo.breadcrumbs.baseUrl");

    const items = urlOptimizer.buildBreadcrumbsFromPath(safeBaseUrl, path, labels);

    const result: any = {
      success: true,
      items,
    };

    if (format === "html") {
      result.html = urlOptimizer.generateBreadcrumbs(items);
    } else {
      result.schema = urlOptimizer.generateBreadcrumbSchema(items);
    }

    return c.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate breadcrumbs" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-canonical
 * Generate canonical URL
 */
const generateCanonicalSchema = z.object({
  baseUrl: z.string().url().refine(isSafePublicUrl, { message: "URL no permitida" }),
  path: z.string(),
  params: z.record(z.string()).optional(),
});

app.post("/generate-canonical", async (c) => {
  try {
    const body = await c.req.json();
    const { baseUrl, path, params } = generateCanonicalSchema.parse(body);
    const safeBaseUrl = assertSafePublicUrl(baseUrl, "seo.canonical.baseUrl");

    const url = urlOptimizer.generateCanonicalURL(safeBaseUrl, path, params);
    const tag = urlOptimizer.generateCanonicalTag(url);

    return c.json({
      success: true,
      url,
      tag,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate canonical URL" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-manifest
 * Generate PWA manifest
 */
const generateManifestSchema = z.object({
  name: z.string(),
  short_name: z.string(),
  description: z.string().optional(),
  start_url: z.string(),
  display: z.enum(["standalone", "fullscreen", "minimal-ui", "browser"]),
  background_color: z.string(),
  theme_color: z.string(),
  icons: z.array(z.object({
    src: z.string(),
    sizes: z.string(),
    type: z.string(),
    purpose: z.string().optional(),
  })),
  categories: z.array(z.string()).optional(),
  lang: z.string().optional(),
});

app.post("/generate-manifest", async (c) => {
  try {
    const body = await c.req.json();
    const config = generateManifestSchema.parse(body);

    const manifest = pwaOptimizer.generateManifest(config);

    return c.json({
      success: true,
      manifest: JSON.parse(manifest),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

/**
 * POST /api/seo-optimization/generate-service-worker
 * Generate service worker
 */
const generateServiceWorkerSchema = z.object({
  version: z.string(),
  cacheStrategies: z.array(z.object({
    name: z.string(),
    pattern: z.string(),
    strategy: z.enum(["cacheFirst", "networkFirst", "staleWhileRevalidate", "networkOnly", "cacheOnly"]),
    cacheName: z.string().optional(),
    maxAge: z.number().optional(),
    maxEntries: z.number().optional(),
  })).optional(),
  offlinePageUrl: z.string().optional(),
  precacheUrls: z.array(z.string()).optional(),
});

app.post("/generate-service-worker", async (c) => {
  try {
    const body = await c.req.json();
    const { version, cacheStrategies, offlinePageUrl, precacheUrls } = generateServiceWorkerSchema.parse(body);

    // Convert string patterns back to RegExp
    const strategies = (cacheStrategies || pwaOptimizer.getDefaultCacheStrategies()).map((s: any) => ({
      ...s,
      pattern: new RegExp(s.pattern),
    }));

    const serviceWorker = pwaOptimizer.generateServiceWorker({
      version,
      cacheStrategies: strategies,
      offlinePageUrl,
      precacheUrls,
    });

    return c.json({
      success: true,
      serviceWorker,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400);
    }
    return c.json({ error: "Failed to generate service worker" }, 500);
  }
});

/**
 * GET /api/seo-optimization/pwa-requirements
 * Check PWA requirements
 */
app.get("/pwa-requirements", async (c) => {
  const hasManifest = c.req.query("hasManifest") === "true";
  const hasServiceWorker = c.req.query("hasServiceWorker") === "true";
  const hasHTTPS = c.req.query("hasHTTPS") === "true";
  const hasIcons = c.req.query("hasIcons") === "true";
  const hasStartUrl = c.req.query("hasStartUrl") === "true";

  const result = pwaOptimizer.checkPWARequirements({
    hasManifest,
    hasServiceWorker,
    hasHTTPS,
    hasIcons,
    hasStartUrl,
  });

  return c.json({
    success: true,
    ...result,
  });
});

/**
 * GET /api/seo-optimization/default-cache-strategies
 * Get default cache strategies
 */
app.get("/default-cache-strategies", async (c) => {
  const strategies = pwaOptimizer.getDefaultCacheStrategies();

  return c.json({
    success: true,
    strategies,
  });
});

export default app;
// @ts-nocheck
