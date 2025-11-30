/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

export default function (ctx: any) {
    console.log("[smart-slider-3] Plugin starting...");

    // Register Sidebar Slot
    // URL relative to admin path: plugin/smart-slider-3/index.html
    // AdminLayoutNexus prepends ADMIN_PATH, so it becomes /admincp/plugin/smart-slider-3/index.html
    ctx.ui.registerSlot("sidebar", "Smart Slider 3", "plugin/smart-slider-3/index.html");

    // Register Widget (for embedding)
    ctx.ui.registerWidget("smart_slider", "Smart Slider", "/plugins-runtime/smart-slider-3/render");

    // Register Assets
    ctx.ui.registerAsset("css", "/plugins-runtime/plugins-static/smart-slider-3/styles.css");
    ctx.ui.registerAsset("js", "/plugins-runtime/plugins-static/smart-slider-3/renderer.js");

    // --- API Routes ---

    // GET /sliders - List all sliders
    ctx.registerRoute(null, {
        method: "GET",
        path: "/sliders",
        permission: "route:GET:/sliders",
        handler: async ({ db }: any) => {
            const result = await db.query({
                operation: "findMany",
                table: "plugin_smart_slider_3_sliders",
                orderBy: "created_at DESC"
            });
            return result.rows || result;
        }
    });

    // POST /sliders - Create new slider
    ctx.registerRoute(null, {
        method: "POST",
        path: "/sliders",
        permission: "route:POST:/sliders",
        handler: async ({ req, db }: any) => {
            const body = req.body;
            if (!body.title) throw new Error("Title is required");

            const result = await db.query({
                operation: "insert",
                table: "plugin_smart_slider_3_sliders",
                data: {
                    title: body.title,
                    width: body.width || 1200,
                    height: body.height || 600,
                    type: body.type || 'simple'
                }
            });
            return result.rows?.[0] || result[0];
        }
    });

    // GET /sliders/:id - Get slider details (with slides)
    ctx.registerRoute(null, {
        method: "GET",
        path: "/sliders/:id",
        permission: "route:GET:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const sliderRes = await db.query({
                operation: "findOne",
                table: "plugin_smart_slider_3_sliders",
                where: { id }
            });
            const slider = (sliderRes.rows && sliderRes.rows.length > 0) ? sliderRes.rows[0] : sliderRes;

            if (!slider) throw new Error("Slider not found");

            const slides = await db.query({
                operation: "findMany",
                table: "plugin_smart_slider_3_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            // Fetch layers for each slide
            const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
                const layers = await db.query({
                    operation: "findMany",
                    table: "plugin_smart_slider_3_layers",
                    where: { slide_id: slide.id },
                    orderBy: "ordering ASC"
                });

                // Parse JSON content/style
                const parsedLayers = (layers.rows || layers).map((l: any) => ({
                    ...l,
                    content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                    style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
                }));

                return { ...slide, layers: parsedLayers };
            }));

            return { ...slider, slides: slidesWithLayers };
        }
    });

    // PUT /sliders/:id - Update slider properties
    ctx.registerRoute(null, {
        method: "PUT",
        path: "/sliders/:id",
        permission: "route:PUT:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            const result = await db.query({
                operation: "update",
                table: "plugin_smart_slider_3_sliders",
                where: { id },
                data: {
                    title: body.title,
                    width: body.width,
                    height: body.height,
                    type: body.type,
                    updated_at: new Date().toISOString()
                }
            });
            return { success: true, result };
        }
    });

    // DELETE /sliders/:id - Delete slider
    ctx.registerRoute(null, {
        method: "DELETE",
        path: "/sliders/:id",
        permission: "route:DELETE:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_smart_slider_3_sliders",
                where: { id }
            });
            return { success: true };
        }
    });

    // --- SLIDES API ---

    // GET /sliders/:id/slides - List slides for a slider
    ctx.registerRoute(null, {
        method: "GET",
        path: "/sliders/:id/slides",
        permission: "route:GET:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            // Extract slider ID from path: /sliders/123/slides -> 123
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];

            return await db.query({
                operation: "findMany",
                table: "plugin_smart_slider_3_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });
        }
    });

    // POST /sliders/:id/slides - Create a new slide
    ctx.registerRoute(null, {
        method: "POST",
        path: "/sliders/:id/slides",
        permission: "route:POST:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const sliderId = parts[parts.length - 2];
            const body = req.body;

            const result = await db.query({
                operation: "insert",
                table: "plugin_smart_slider_3_slides",
                data: {
                    slider_id: sliderId,
                    title: body.title || "New Slide",
                    background_image: body.background_image || "",
                    ordering: body.ordering || 0
                }
            });
            return result.rows?.[0] || result[0];
        }
    });

    // PUT /slides/:id - Update a slide (and its layers)
    ctx.registerRoute(null, {
        method: "PUT",
        path: "/slides/:id",
        permission: "route:PUT:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            // 1. Update Slide Props
            await db.query({
                operation: "update",
                table: "plugin_smart_slider_3_slides",
                where: { id },
                data: {
                    title: body.title,
                    background_image: body.background_image,
                    ordering: body.ordering
                }
            });

            // 2. Update Layers (Delete all and re-insert for simplicity in this MVP+)
            // In a real production app, we would diff them, but this ensures consistency.
            if (body.layers && Array.isArray(body.layers)) {
                await db.query({
                    operation: "delete",
                    table: "plugin_smart_slider_3_layers",
                    where: { slide_id: id }
                });

                for (const layer of body.layers) {
                    await db.query({
                        operation: "insert",
                        table: "plugin_smart_slider_3_layers",
                        data: {
                            slide_id: id,
                            type: layer.type,
                            content: JSON.stringify(layer.content),
                            style: JSON.stringify(layer.style),
                            ordering: layer.ordering || 0
                        }
                    });
                }
            }

            return { success: true };
        }
    });

    // DELETE /slides/:id - Delete a slide
    ctx.registerRoute(null, {
        method: "DELETE",
        path: "/slides/:id",
        permission: "route:DELETE:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_smart_slider_3_slides",
                where: { id }
            });
            return { success: true };
        }
    });

    // --- LAYERS API ---
    // (Simplified for MVP: Layers are managed as part of the slide update or separate endpoints if needed)
    // For now, we'll assume layers are loaded with the slide or we can add endpoints later.

    // GET /render/:id - Get HTML for embedding (Enhanced)
    ctx.registerRoute(null, {
        method: "GET",
        path: "/render/:id",
        permission: "route:GET:/render/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const slider = await db.query({
                operation: "findOne",
                table: "plugin_smart_slider_3_sliders",
                where: { id }
            });

            if (!slider) return { html: "<!-- Slider not found -->" };

            const slides = await db.query({
                operation: "findMany",
                table: "plugin_smart_slider_3_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            // Fetch layers for each slide
            const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
                const layers = await db.query({
                    operation: "findMany",
                    table: "plugin_smart_slider_3_layers",
                    where: { slide_id: slide.id },
                    orderBy: "ordering ASC"
                });
                return { ...slide, layers: layers.rows || layers };
            }));

            const slidesHtml = slidesWithLayers.map((slide: any) => {
                const layersHtml = slide.layers.map((layer: any) => {
                    const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style;
                    const content = typeof layer.content === 'string' ? JSON.parse(layer.content) : layer.content;

                    const styleStr = Object.entries(style).map(([k, v]) => {
                        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                        return `${key}:${v}`;
                    }).join(';');

                    let inner = '';
                    if (layer.type === 'heading') inner = `<h1>${content.text}</h1>`;
                    else if (layer.type === 'text') inner = `<p>${content.text}</p>`;
                    else if (layer.type === 'button') inner = `<a href="${content.link || '#'}">${content.text}</a>`;
                    else if (layer.type === 'image') inner = `<img src="${content.src}" alt="">`;

                    return `<div class="ss3-layer" style="${styleStr}">${inner}</div>`;
                }).join('');

                return `
                <div class="ss3-slide" style="background-image: url('${slide.background_image || ''}');">
                    <div class="ss3-slide-content">
                        ${layersHtml}
                    </div>
                </div>
                `;
            }).join("");

            return {
                html: `
                <div class="smart-slider" id="smart-slider-${id}" data-id="${id}" style="width: 100%; max-width: ${slider.width}px; aspect-ratio: ${slider.width}/${slider.height}; position: relative; overflow: hidden;">
                    <style>
                        .ss3-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.5s; }
                        .ss3-slide.active { opacity: 1; z-index: 1; }
                        .ss3-layer { position: absolute; }
                        .ss3-controls button { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px; cursor: pointer; }
                        .ss3-prev { left: 10px; }
                        .ss3-next { right: 10px; }
                    </style>
                    <div class="ss3-track" style="position: relative; width: 100%; height: 100%;">
                        ${slidesHtml}
                    </div>
                    <div class="ss3-controls">
                        <button class="ss3-prev" onclick="document.querySelector('#smart-slider-${id}').dispatchEvent(new CustomEvent('ss3:prev'))">❮</button>
                        <button class="ss3-next" onclick="document.querySelector('#smart-slider-${id}').dispatchEvent(new CustomEvent('ss3:next'))">❯</button>
                    </div>
                </div>
                <script>
                    (function() {
                        const id = "smart-slider-${id}";
                        const container = document.getElementById(id);
                        if(!container) return;
                        
                        let current = 0;
                        const slides = container.querySelectorAll('.ss3-slide');
                        if(slides.length > 0) slides[0].classList.add('active');
                        
                        const show = (index) => {
                            slides.forEach(s => s.classList.remove('active'));
                            slides[index].classList.add('active');
                            current = index;
                        };
                        
                        const next = () => show((current + 1) % slides.length);
                        const prev = () => show((current - 1 + slides.length) % slides.length);
                        
                        container.addEventListener('ss3:next', next);
                        container.addEventListener('ss3:prev', prev);
                        
                        // Auto play
                        setInterval(next, 5000);
                    })();
                </script>
                `
            };
        }
    });
}
