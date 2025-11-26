import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { env } from "../config/env.ts";
import { adminAuth, authRouter } from "./admin/auth.ts";
import { dashboardRouter } from "./admin/dashboard.ts";
import { contentRouter } from "./admin/content.ts";
import { settingsRouter } from "./admin/settings.ts";
import { themesRouter } from "./admin/themes.ts";
import { pluginsRouter } from "./admin/plugins.ts";
import { securityPagesRouter } from "./admin/security-pages.ts";
import { usersRouter } from "./admin/users.ts";
import { commentsRouter } from "./admin/comments.ts";
import { formsRouter } from "./admin/forms.ts";
import { toolsRouter } from "./admin/tools.ts";
import { widgetsRouter } from "./admin/widgets.ts";

const adminRouter = new Hono();

// Serve admin static assets
adminRouter.get(
  "/assets/*",
  serveStatic({
    root: "./src/admin",
    rewriteRequestPath: (path) => path.replace(new RegExp(`^${env.ADMIN_PATH}`), ""),
  })
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
  if (
    c.req.path === "/admincp/login" ||
    c.req.path === "/admincp/login/verify-2fa" ||
    c.req.path === "/admincp/logout"
  ) {
    await next();
    return;
  }
  await adminAuth(c, next);

  // Trigger admin:init hook after authentication
  try {
    const { hookManager } = await import("../lib/plugin-system/HookManager.ts");
    await hookManager.doAction("admin:init", c.get("user"));
  } catch (error) {
    console.error("Error in admin:init hook:", error);
  }
});

// Mount protected routes
adminRouter.route("/", dashboardRouter);
adminRouter.route("/", contentRouter);
adminRouter.route("/", settingsRouter);
adminRouter.route("/", themesRouter);
adminRouter.route("/", pluginsRouter);
adminRouter.route("/", securityPagesRouter);
adminRouter.route("/", usersRouter);
adminRouter.route("/", commentsRouter);
adminRouter.route("/", formsRouter);
adminRouter.route("/", toolsRouter);
adminRouter.route("/", widgetsRouter);

// Plugin admin panels (dynamic routes)
import { renderPluginPanel } from "./admin/pluginPanels.ts";
adminRouter.get("/plugins/:pluginName/:panelId", renderPluginPanel);
adminRouter.get("/plugins/:pluginName", renderPluginPanel);

// Admin Panel API - Menu endpoint
import { getAdminMenu, renderPluginAdminPage } from "../controllers/adminPanelController.ts";
adminRouter.get("/api/menu", getAdminMenu);

// Plugin admin pages (catch-all for plugin-registered pages)
// This should be near the end to not override other routes
adminRouter.get("/*", renderPluginAdminPage);

export default adminRouter;
