import { Hono } from "hono";
import authRoutes from "./auth.ts";
import userRoutes from "./users.ts";
import roleRoutes from "./roles.ts";
import permissionRoutes from "./permissions.ts";
import contentTypeRoutes from "./contentTypes.ts";
import categoryRoutes from "./categories.ts";
import tagRoutes from "./tags.ts";
import contentRoutes from "./contents.ts";
import contentSeoRoutes from "./contentSeo.ts";
import contentMetaRoutes from "./contentMeta.ts";
import mediaRoutes from "./media.ts";
import * as mediaController from "../controllers/mediaController.ts";
import { menus as menuRoutes, menuItems as menuItemRoutes } from "./menus.ts";
import commentRoutes from "./comments.ts";
import contentFilterRoutes from "./contentFilters.ts";
import seoRoutes from "./seo.ts";
import settingsRoutes from "./settings.ts";
import pluginRoutes from "./plugins.ts";
import cacheRoutes from "./cache.ts";
import auditRoutes from "./audit.ts";
import webhookRoutes from "./webhooks.ts";
import notificationRoutes from "./notifications.ts";
import backupRoutes from "./backups.ts";
import dashboardRoutes from "./dashboard.ts";
import securityRoutes from "./security.ts";
import seoAdvancedRoutes from "./seo-advanced.ts";
import apiKeysRoutes from "./api-keys.ts";
import apiDocsRoutes from "./api-docs.ts";
import publicAPIRoutes from "./api-public.ts";
import searchRoutes from "./search.ts";
import frontendRouter from "./frontend.ts";
import adminRouter from "./admin.ts";
import { env } from "../config/env.ts";

export function registerRoutes(app: Hono) {
  // API Health check
  app.get("/api", (c) => c.json({
    message: "LexCMS API",
    version: "1.0.0",
    rbac: "enabled",
    cms: "enabled",
    media: "enabled",
    menus: "enabled",
    comments: "enabled",
    captcha: "enabled",
    seoAi: "enabled",
    settings: "enabled",
    themes: "enabled",
    plugins: "enabled",
    cache: "enabled",
    audit: "enabled",
    webhooks: "enabled",
    notifications: "enabled",
    email: "enabled",
    backups: "enabled",
    dashboard: "enabled",
    analytics: "enabled",
    security: "enabled",
    seoAdvanced: "enabled",
    sitemap: "enabled",
    structuredData: "enabled",
    publicAPI: "enabled",
    apiKeys: "enabled",
    openAPI: "enabled",
    search: "enabled"
  }));

  app.get("/api/health", (c) => c.json({
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  // Registrar rutas de autenticación y RBAC
  app.route("/api/auth", authRoutes);
  app.route("/api/users", userRoutes);
  app.route("/api/roles", roleRoutes);
  app.route("/api/permissions", permissionRoutes);

  // Registrar rutas del CMS
  app.route("/api/content-types", contentTypeRoutes);
  app.route("/api/categories", categoryRoutes);
  app.route("/api/tags", tagRoutes);
  app.route("/api/content", contentRoutes);
  app.get("/api/media/serve/*", mediaController.serveMedia);
  app.route("/api/content-seo", contentSeoRoutes);
  app.route("/api/content-meta", contentMetaRoutes);

  // Registrar rutas de Media
  app.route("/api/media", mediaRoutes);

  // Registrar rutas de Menús
  app.route("/api/menus", menuRoutes);
  app.route("/api/menu-items", menuItemRoutes);

  // Registrar rutas de Comentarios
  app.route("/api/comments", commentRoutes);

  // Registrar rutas de Filtros de Contenido
  app.route("/api/content-filters", contentFilterRoutes);

  // Registrar rutas de SEO AI
  app.route("/api/seo", seoRoutes);

  // Registrar rutas de Settings
  app.route("/api/settings", settingsRoutes);

  // Registrar rutas de Plugins
  app.route("/api/plugins", pluginRoutes);

  // Registrar rutas de Cache
  app.route("/api/cache", cacheRoutes);

  // Registrar rutas de Audit
  app.route("/api/audit", auditRoutes);

  // Registrar rutas de Webhooks
  app.route("/api/webhooks", webhookRoutes);

  // Registrar rutas de Notifications
  app.route("/api/notifications", notificationRoutes);

  // Registrar rutas de Backups
  app.route("/api/backups", backupRoutes);

  // Registrar rutas de Dashboard
  app.route("/api/dashboard", dashboardRoutes);

  // Registrar rutas de Security
  app.route("/api/security", securityRoutes);

  // Registrar rutas de API Keys
  app.route("/api/api-keys", apiKeysRoutes);

  // Registrar rutas de API Documentation
  app.route("/api/docs", apiDocsRoutes);

  // Registrar rutas de Public API v1
  app.route("/api/v1", publicAPIRoutes);

  // Registrar rutas de Search
  app.route("/api/search", searchRoutes);

  // Servir archivos estáticos (uploads)
  app.route("/uploads", mediaRoutes);

  // Registrar rutas de SEO Avanzado (sitemap.xml, robots.txt, etc.)
  app.route("/", seoAdvancedRoutes);

  // Registrar rutas del Admin Panel (antes del frontend)
  app.route(env.ADMIN_PATH, adminRouter);
  app.route(`${env.ADMIN_PATH}/`, adminRouter);

  // Registrar rutas del Frontend (ÚLTIMO para que no interfiera con API)
  app.route("/", frontendRouter);
}
