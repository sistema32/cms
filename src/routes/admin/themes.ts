import { Hono } from "hono";
import { env } from "../../config/env.ts";
import { ThemeController } from "../../controllers/admin/themeController.ts";

export const themesRouter = new Hono();

// Browser
themesRouter.get("/appearance/themes", (c) => c.redirect(`${env.ADMIN_PATH}/appearance/themes/browser`));
themesRouter.get("/appearance/themes/browser", ThemeController.browser);

// Settings
themesRouter.get("/appearance/themes/settings", ThemeController.settings);
themesRouter.post("/appearance/themes/settings/save", ThemeController.saveSettings);
themesRouter.post("/appearance/themes/custom-settings", ThemeController.saveCustomSettings);

// Activation
themesRouter.post("/appearance/themes/activate", ThemeController.activate);

// Editor
themesRouter.get("/appearance/themes/editor", ThemeController.editor);
themesRouter.post("/api/admin/themes/editor/save", ThemeController.saveEditorFile);

// Preview
themesRouter.get("/appearance/themes/preview", ThemeController.preview);
themesRouter.post("/api/admin/themes/preview/create", ThemeController.createPreviewSession);
themesRouter.post("/api/admin/themes/preview/activate", ThemeController.activatePreviewTheme);
themesRouter.delete("/api/admin/themes/preview/:token", ThemeController.endPreviewSession);

// Customizer
themesRouter.get("/appearance/themes/customize", ThemeController.customizer);
themesRouter.post("/api/admin/themes/customizer/session", ThemeController.createCustomizerSession);

// API Misc
themesRouter.post("/api/admin/themes/cache/warmup", ThemeController.warmupCache);
themesRouter.get("/api/admin/themes/config/export", ThemeController.exportConfig);
themesRouter.post("/api/admin/themes/config/import", ThemeController.importConfig);
themesRouter.post("/api/admin/themes/config/validate", ThemeController.validateConfig);
