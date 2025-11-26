import { WorkerPluginAPI } from '../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { migrations } from './migrations.ts';

export async function loadLexSlider(api: WorkerPluginAPI) {
    api.logger.info("Loading LexSlider...");

    try {
        // Run database migrations
        api.logger.info("Running database migrations...");
        // Note: We need to expose a migration API in HostAPI
        // For now, migrations will be handled by HostServices
        // TODO: Implement api.db.runMigrations(migrations)

        // Migrations are handled by the core PluginMigration system
        // No need to run them here

        // Register API routes
        // Add cache busting to force reload of API modules
        const ts = Date.now();
        const slidersAPI = await import(`./api/sliders.ts?v=${ts}`);
        const slidesAPI = await import(`./api/slides.ts?v=${ts}`);
        const layersAPI = await import(`./api/layers.ts?v=${ts}`);
        const renderAPI = await import(`./api/render.ts?v=${ts}`);
        const exportAPI = await import(`./api/export.ts?v=${ts}`);

        // Slider routes
        api.routes.register("GET", "/sliders", slidersAPI.listSliders);
        api.routes.register("POST", "/sliders", slidersAPI.createSlider);
        api.routes.register("GET", "/sliders/:id", slidersAPI.getSlider);
        api.routes.register("PUT", "/sliders/:id", slidersAPI.updateSlider);
        api.routes.register("DELETE", "/sliders/:id", slidersAPI.deleteSlider);
        api.routes.register("POST", "/sliders/:id/duplicate", slidersAPI.duplicateSlider);

        // Slide routes
        api.routes.register("GET", "/sliders/:sliderId/slides", slidesAPI.listSlides);
        api.routes.register("POST", "/sliders/:sliderId/slides", slidesAPI.createSlide);
        api.routes.register("PUT", "/slides/:id", slidesAPI.updateSlide);
        api.routes.register("DELETE", "/slides/:id", slidesAPI.deleteSlide);
        api.routes.register("PUT", "/slides/:id/reorder", slidesAPI.reorderSlide);

        // Layer routes (NEW)
        api.routes.register("GET", "/slides/:slideId/layers", layersAPI.listLayers);
        api.routes.register("POST", "/slides/:slideId/layers", layersAPI.createLayer);
        api.routes.register("GET", "/layers/:id", layersAPI.getLayer);
        api.routes.register("PUT", "/layers/:id", layersAPI.updateLayer);
        api.routes.register("DELETE", "/layers/:id", layersAPI.deleteLayer);
        api.routes.register("PUT", "/layers/:id/reorder", layersAPI.reorderLayer);
        api.routes.register("POST", "/layers/:id/duplicate", layersAPI.duplicateLayer);

        // Render route (public)
        const { renderSlider } = await import("./api/render.ts");
        api.routes.register("GET", "/render/:sliderIdOrAlias", renderSlider);

        // Export/Import routes (NEW)
        api.routes.register("GET", "/sliders/:id/export", exportAPI.exportSlider);
        api.routes.register("POST", "/import", exportAPI.importSlider);

        // Register admin routes using new Admin Panel API
        const { registerAdminRoutes } = await import(`./admin/routes.ts?v=${ts}`);
        registerAdminRoutes(api);

        // Register shortcode
        const { wp } = await import("../../src/lib/plugin-system/compat/WPCompat.ts");

        wp.add_shortcode("lexslider", async (attrs: Record<string, string>) => {
            const sliderId = attrs.id || attrs.alias;
            if (!sliderId) {
                return '<p style="color: red;">[LexSlider Error: Missing id or alias]</p>';
            }

            try {
                const response = await fetch(`http://localhost:8000/api/lexslider/render/${sliderId}`);
                if (!response.ok) {
                    return `<p style="color: red;">[LexSlider Error: Slider not found]</p>`;
                }
                return await response.text();
            } catch (error: any) {
                return `<p style="color: red;">[LexSlider Error: ${error.message}]</p>`;
            }
        });

        wp.add_filter("the_content", async (content: string) => {
            return await wp.do_shortcode(content);
        });

        api.logger.info("LexSlider loaded successfully");
    } catch (error: any) {
        api.logger.error("LexSlider error: " + error.message);
    }
}
