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

        // Register admin panel
        api.admin.registerPanel({
            id: 'lexslider',
            title: 'LexSlider',
            description: 'Manage responsive sliders',
            icon: 'slider',
            path: 'sliders',
            showInMenu: true,
            order: 50,
            component: async (context: any) => {
                const ts = Date.now();
                const containerId = `lexslider-root-${ts}`;

                return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LexSlider - Panel de Administración</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="importmap">
    {
        "imports": {
            "preact": "/api/plugins/lexslider/assets/vendor/preact.js",
            "preact/hooks": "/api/plugins/lexslider/assets/vendor/hooks.js",
            "htm": "/api/plugins/lexslider/assets/vendor/htm-core.js",
            "htm/preact": "/api/plugins/lexslider/assets/vendor/htm.js"
        }
    }
    </script>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body>
    <div id="${containerId}"></div>
    
    <script type="module">
        import { render } from "preact";
        import { html } from "htm/preact";
        
        const ts = Date.now();
        const { Dashboard } = await import(\`/api/plugins/lexslider/assets/admin/components/Dashboard.js?v=\${ts}\`);
        const { SlideEditor } = await import(\`/api/plugins/lexslider/assets/admin/components/SlideEditor.js?v=\${ts}\`);
        
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'list';
        const id = params.get('id');
        
        const container = document.getElementById("${containerId}");
        
        if (view === 'list') {
            render(html\`<\${Dashboard} />\`, container);
        } else if (view === 'edit' && id) {
            render(html\`<\${SlideEditor} sliderId=\${id} />\`, container);
        } else {
            render(html\`<div class="p-8">Invalid route</div>\`, container);
        }
    </script>
</body>
</html>`;
            }
        });

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
