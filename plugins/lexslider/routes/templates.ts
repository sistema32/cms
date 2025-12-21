/**
 * Templates and Export/Import Routes
 */

import { TemplateService } from '../services/TemplateService.ts';
import { ExportService } from '../services/ExportService.ts';
import { sliderCache } from '../services/CacheService.ts';

export const registerTemplateRoutes = (ctx: any) => {
    // GET /templates - List all templates
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/templates",
        permission: "route:GET:/templates",
        handler: async ({ db }: any) => {
            try {
                const templateService = new TemplateService(db);
                const templates = await templateService.findAll();
                return { success: true, data: templates };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // POST /templates - Create template from slider
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/templates",
        permission: "route:POST:/templates",
        handler: async ({ req, db }: any) => {
            try {
                const body = req.body;
                if (!body.slider_id || !body.name) {
                    throw new Error("slider_id and name are required");
                }

                const templateService = new TemplateService(db);
                const template = await templateService.createFromSlider(body.slider_id, {
                    name: body.name,
                    description: body.description,
                    thumbnail_url: body.thumbnail_url
                });

                return { success: true, data: template };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // POST /sliders/from-template/:id - Create slider from template
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders/from-template/:id",
        permission: "route:POST:/sliders/from-template/:id",
        handler: async ({ req, db }: any) => {
            try {
                const templateId = req.path.split("/").pop();
                const body = req.body;

                const templateService = new TemplateService(db);
                const newSliderId = await templateService.createSliderFromTemplate(
                    templateId,
                    body.title || "New Slider"
                );

                return { success: true, data: { id: newSliderId } };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // DELETE /templates/:id
    ctx.registerRoute(ctx.sandbox, {
        method: "DELETE",
        path: "/templates/:id",
        permission: "route:DELETE:/templates/:id",
        handler: async ({ req, db }: any) => {
            try {
                const id = req.path.split("/").pop();
                const templateService = new TemplateService(db);
                await templateService.delete(id);
                return { success: true, message: "Template deleted" };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // GET /sliders/:id/export - Export slider as JSON
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id/export",
        permission: "route:GET:/sliders/:id/export",
        handler: async ({ req, db }: any) => {
            try {
                const parts = req.path.split("/");
                const id = parts[parts.length - 2];

                const exportService = new ExportService(db);
                const exportData = await exportService.exportSlider(id);

                return { success: true, data: exportData };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // POST /sliders/import - Import slider from JSON
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders/import",
        permission: "route:POST:/sliders/import",
        handler: async ({ req, db }: any) => {
            try {
                const body = req.body;
                if (!body.data) {
                    throw new Error("Export data is required");
                }

                const exportService = new ExportService(db);
                const newSliderId = await exportService.importSlider(body.data, body.name);

                return { success: true, data: { id: newSliderId } };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });

    // POST /sliders/:id/duplicate - Duplicate slider
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders/:id/duplicate",
        permission: "route:POST:/sliders/:id/duplicate",
        handler: async ({ req, db }: any) => {
            try {
                const parts = req.path.split("/");
                const id = parts[parts.length - 2];
                const body = req.body;

                const exportService = new ExportService(db);
                const newSliderId = await exportService.duplicateSlider(id, body.name);

                // Invalidate cache for new slider
                sliderCache.invalidate(newSliderId);

                return { success: true, data: { id: newSliderId } };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    });
};
