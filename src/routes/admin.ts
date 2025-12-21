import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { env } from "../config/env.ts";
import { adminAuth, authRouter } from "./admin/auth.ts";
import { dashboardRouter } from "./admin/dashboard.ts";
import { contentRouter } from "./admin/content.ts";
import { settingsRouter } from "./admin/settings.ts";
import { themesRouter } from "./admin/themes.ts";
import { securityPagesRouter } from "./admin/security-pages.ts";
import { usersRouter } from "./admin/users.ts";
import { commentsRouter } from "./admin/comments.ts";
import { formsRouter } from "./admin/forms.ts";
import { mediaRouter } from "./admin/media.ts";
import { toolsRouter } from "./admin/tools.ts";
import { widgetsRouter } from "./admin/widgets.ts";
import { categoriesRouter } from "./admin/categories.ts";
import { tagsRouter } from "./admin/tags.ts";
import { menusRouter } from "./admin/menus.ts";

// Security posture: destructive actions and database access live inside nested routers.
// They already rely on db.query patterns with parseInt(...) + Number.isFinite guards for IDs.
const adminRouter = new Hono();
// Rate limit sensitive endpoints like '/login' explicitly
const LOGIN_ROUTE = '/login'; // Literal para recordatorios de rate limiting

// Serve admin static assets
adminRouter.get(
  "/assets/*",
  serveStatic({
    root: "./src/admin",
    rewriteRequestPath: (path) =>
      path.replace(new RegExp(`^${env.ADMIN_PATH}`), ""),
  }),
);

// Mount Auth routes (Login, Logout, 2FA)
// These routes handle their own authentication state (or lack thereof)
adminRouter.route("/", authRouter);

// Apply adminAuth middleware to all other routes
// Note: This middleware will run for all routes matched by the subsequent routers
adminRouter.use("*", async (c, next) => {
  // Skip auth for login/logout routes if they are matched here
  // (Although they should be handled by authRouter above, Hono might continue matching if next() is called or if not fully handled)
  // But authRouter routes don't call next() if they handle the request.
  // However, to be safe and explicit:
  const adminPath = env.ADMIN_PATH;
  if (
    c.req.path === `${adminPath}${LOGIN_ROUTE}` ||
    c.req.path === `${adminPath}${LOGIN_ROUTE}/verify-2fa` ||
    c.req.path === `${adminPath}/logout`
  ) {
    await next();
    return;
  }
  const res = await adminAuth(c, next);
  if (res instanceof Response) {
    return res;
  }

  // Trigger admin:init hook after authentication
  try {
    const { doAction } = await import("../lib/hooks/index.ts");
    await doAction("admin:init", c.get("user"));
  } catch (error) {
    console.error("Error in admin:init hook:", error);
  }
});

// Mount protected routes
adminRouter.route("/", dashboardRouter);
adminRouter.route("/", contentRouter);
adminRouter.route("/", settingsRouter);
adminRouter.route("/", themesRouter);
adminRouter.route("/", securityPagesRouter);
adminRouter.route("/", usersRouter);
adminRouter.route("/", commentsRouter);
adminRouter.route("/", formsRouter);
adminRouter.route("/", mediaRouter);
adminRouter.route("/", toolsRouter);
adminRouter.route("/", widgetsRouter);
adminRouter.route("/", categoriesRouter);
adminRouter.route("/", tagsRouter);
adminRouter.route("/appearance/menus", menusRouter);

// Plugin Static Files (Admin Dashboard)
// Maps /admincp/plugin/:pluginName/* -> plugins/:pluginName/public/*
import { servePluginStaticFile } from "@/controllers/adminPluginController.ts";

adminRouter.get("/plugin/:pluginName", servePluginStaticFile);
adminRouter.get("/plugin/:pluginName/*", servePluginStaticFile);

// Admin Panel API - Menu endpoint (placeholder, legacy controller removed)
// import { getAdminMenu, renderPluginAdminPage } from "@/controllers/adminPanelController.ts";
// adminRouter.get("/api/menu", getAdminMenu);

// Plugins page
import PluginsDbNexus from "../admin/pages/system/PluginsDbNexus.tsx";
import AdminDemoNexus from "../admin/pages/system/AdminDemoNexus.tsx";
adminRouter.get("/plugins/db", (c) => {
  const user = c.get("user");
  return c.html(PluginsDbNexus({ user }));
});

// Admin Demo (Focus Mode)
adminRouter.get("/admindemo", (c) => {
  const user = c.get("user");
  return c.html(AdminDemoNexus({ user }));
});

export default adminRouter;
