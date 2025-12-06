/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

export default function (ctx: any) {
    console.log("[lexslider] Plugin starting...");

    // Register Sidebar Slot - FIXED: use registerUiSlot
    ctx.registerUiSlot("sidebar", "LexSlider", "plugin/lexslider/index.html", "ui:slot:sidebar");

    // Register Widget (for embedding)
    ctx.registerWidget("lexslider_widget", "LexSlider", "/plugins-runtime/lexslider/render", "ui:widget:lexslider_widget");

    // Register Assets - FIXED: use registerAsset
    ctx.registerAsset("css", "/plugins-runtime/plugins-static/lexslider/styles.css", "ui:asset:css");
    ctx.registerAsset("js", "/plugins-runtime/plugins-static/lexslider/lexslider-embed.js", "ui:asset:js");

    // Register Shortcode [lexslider id="X"]
    if (ctx.registerShortcode) {
        ctx.registerShortcode("lexslider", async (attrs: any, _content: string, { db }: any) => {
            const id = attrs.id;
            if (!id) return "<!-- LexSlider: Missing id attribute -->";

            const html = await renderSliderHTML(id, db);
            return html;
        });
    }

    // NOTE: Public embed is available via /render/:id route which already exists
    // The embed script (lexslider-embed.js) will use that route instead

    // --- API Routes ---

    // GET /sliders - List all sliders
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders",
        permission: "route:GET:/sliders",
        handler: async ({ db }: any) => {
            const result = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_sliders",
                orderBy: "created_at DESC"
            });
            const rows = result.rows || result;
            return rows.map((r: any) => ({ ...r, title: r.name }));
        }
    });

    // POST /sliders - Create new slider
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders",
        permission: "route:POST:/sliders",
        handler: async ({ req, db }: any) => {
            const body = req.body;
            if (!body.title) throw new Error("Title is required");

            const result = await db.query({
                operation: "insert",
                table: "plugin_lexslider_sliders",
                data: {
                    name: body.title,
                    width: body.width || 1200,
                    height: body.height || 600,
                    type: body.type || 'simple'
                }
            });
            const row = result.rows?.[0] || result[0];
            return { ...row, title: row.name };
        }
    });

    // GET /sliders/:id - Get slider details (with slides)
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id",
        permission: "route:GET:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const sliderRes = await db.query({
                operation: "findOne",
                table: "plugin_lexslider_sliders",
                where: { id }
            });
            const slider = (sliderRes.rows && sliderRes.rows.length > 0) ? sliderRes.rows[0] : sliderRes;
            if (slider) slider.title = slider.name;

            if (!slider) throw new Error("Slider not found");

            const slides = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            // Fetch layers for each slide
            const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
                const layers = await db.query({
                    operation: "findMany",
                    table: "plugin_lexslider_layers",
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
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/sliders/:id",
        permission: "route:PUT:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            const result = await db.query({
                operation: "update",
                table: "plugin_lexslider_sliders",
                where: { id },
                data: {
                    name: body.title,
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
    ctx.registerRoute(ctx.sandbox, {
        method: "DELETE",
        path: "/sliders/:id",
        permission: "route:DELETE:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_lexslider_sliders",
                where: { id }
            });
            return { success: true };
        }
    });

    // --- SLIDES API ---

    // GET /sliders/:id/slides - List slides for a slider
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id/slides",
        permission: "route:GET:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            // Extract slider ID from path: /sliders/123/slides -> 123
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];

            return await db.query({
                operation: "findMany",
                table: "plugin_lexslider_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });
        }
    });

    // POST /sliders/:id/slides - Create a new slide
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders/:id/slides",
        permission: "route:POST:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const sliderId = parts[parts.length - 2];
            const body = req.body;

            const result = await db.query({
                operation: "insert",
                table: "plugin_lexslider_slides",
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
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/slides/:id",
        permission: "route:PUT:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            // 1. Update Slide Props
            await db.query({
                operation: "update",
                table: "plugin_lexslider_slides",
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
                    table: "plugin_lexslider_layers",
                    where: { slide_id: id }
                });

                for (const layer of body.layers) {
                    await db.query({
                        operation: "insert",
                        table: "plugin_lexslider_layers",
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
    ctx.registerRoute(ctx.sandbox, {
        method: "DELETE",
        path: "/slides/:id",
        permission: "route:DELETE:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_lexslider_slides",
                where: { id }
            });
            return { success: true };
        }
    });

    // --- GLOBAL LAYERS API ---

    // GET /sliders/:id/global-layers
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id/global-layers",
        permission: "route:GET:/sliders/:id/global-layers",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];

            const result = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_global_layers",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            const rows = result.rows || result;
            return rows.map((l: any) => ({
                ...l,
                content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
            }));
        }
    });

    // PUT /sliders/:id/global-layers - Batch update global layers
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/sliders/:id/global-layers",
        permission: "route:PUT:/sliders/:id/global-layers",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];
            const body = req.body;

            if (body.layers && Array.isArray(body.layers)) {
                // Delete existing global layers for this slider
                await db.query({
                    operation: "delete",
                    table: "plugin_lexslider_global_layers",
                    where: { slider_id: id }
                });

                // Insert new ones
                for (const layer of body.layers) {
                    await db.query({
                        operation: "insert",
                        table: "plugin_lexslider_global_layers",
                        data: {
                            slider_id: id,
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

    // --- LAYERS API ---
    // (Simplified for MVP: Layers are managed as part of the slide update or separate endpoints if needed)
    // For now, we'll assume layers are loaded with the slide or we can add endpoints later.

    // GET /render/:id - Get HTML for embedding (Enhanced)
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/render/:id",
        permission: "route:GET:/render/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const slider = await db.query({
                operation: "findOne",
                table: "plugin_lexslider_sliders",
                where: { id }
            });

            if (!slider) return { html: "<!-- Slider not found -->" };

            const slides = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            // Fetch layers for each slide
            const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
                const layers = await db.query({
                    operation: "findMany",
                    table: "plugin_lexslider_layers",
                    where: { slide_id: slide.id },
                    orderBy: "ordering ASC"
                });
                return { ...slide, layers: layers.rows || layers };
            }));

            // Fetch Global Layers
            const globalLayersRes = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_global_layers",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });
            const globalLayers = globalLayersRes.rows || globalLayersRes;

            let css = `
                .ss3-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.5s; }
                .ss3-slide.active { opacity: 1; z-index: 1; }
                
                /* Transitions */
                .ss3-slide.transition-fade { transition: opacity var(--duration, 0.5s); }
                .ss3-slide.transition-slide-horizontal { transform: translateX(100%); transition: transform var(--duration, 0.5s), opacity var(--duration, 0.5s); }
                .ss3-slide.transition-slide-horizontal.active { transform: translateX(0); }
                .ss3-slide.transition-slide-horizontal.prev { transform: translateX(-100%); }
                
                .ss3-slide.transition-slide-vertical { transform: translateY(100%); transition: transform var(--duration, 0.5s), opacity var(--duration, 0.5s); }
                .ss3-slide.transition-slide-vertical.active { transform: translateY(0); }
                .ss3-slide.transition-slide-vertical.prev { transform: translateY(-100%); }

                .ss3-slide.transition-zoom { transform: scale(1.2); transition: transform var(--duration, 0.5s), opacity var(--duration, 0.5s); }
                .ss3-slide.transition-zoom.active { transform: scale(1); }

                /* Ken Burns */
                @keyframes kenburns {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.1); }
                }
                .ss3-ken-burns { animation: kenburns 10s infinite alternate linear; }

                .ss3-layer { position: absolute; }
                .ss3-controls button { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px; cursor: pointer; }
                .ss3-prev { left: 10px; }
                .ss3-next { right: 10px; }
            `;

            const renderLayer = (layer: any, isGlobal = false) => {
                const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style;
                const content = typeof layer.content === 'string' ? JSON.parse(layer.content) : layer.content;
                const layerId = `layer-${layer.id}`;
                const globalClass = isGlobal ? 'ss3-global-layer' : 'ss3-layer';

                // Helper to convert style obj to string
                const styleToString = (s: any) => Object.entries(s).map(([k, v]) => {
                    if (typeof v === 'object' && v !== null) return '';
                    const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                    return `${key}:${v}`;
                }).join(';');

                // Base Styles
                css += `.${layerId} { ${styleToString(style)} } `;

                // Tablet Styles
                if (style.tablet) {
                    css += `@media (max-width: 768px) { .${layerId} { ${styleToString({ ...style, ...style.tablet })} } } `;
                }

                // Mobile Styles
                if (style.mobile) {
                    css += `@media (max-width: 480px) { .${layerId} { ${styleToString({ ...style, ...style.tablet, ...style.mobile })} } } `;
                }

                let inner = '';
                if (layer.type === 'heading') inner = `<h1>${content.text}</h1>`;
                else if (layer.type === 'text') inner = `<p>${content.text}</p>`;
                else if (layer.type === 'button') inner = `<a href="${content.link || '#'}">${content.text}</a>`;
                else if (layer.type === 'image') inner = `<img src="${content.src}" alt="" loading="lazy">`;
                else if (layer.type === 'video') {
                    inner = `<iframe width="100%" height="100%" src="${content.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
                }
                else if (layer.type === 'icon') {
                    inner = `<span class="material-icons-round" style="font-size: inherit; color: inherit;">${content.icon}</span>`;
                }

                return `<div class="${globalClass} ${layerId}">${inner}</div>`;
            };

            const slidesHtml = slidesWithLayers.map((slide: any) => {
                const duration = (slide.duration || 500) + 'ms';
                const transitionClass = `transition-${slide.transition || 'fade'}`;
                const kenBurnsClass = slide.ken_burns ? 'ss3-ken-burns' : '';

                // We apply Ken Burns to a background div, not the slide container itself, to avoid affecting layers
                const bgStyle = `background-image: url('${slide.background_image || ''}');`;

                const layersHtml = slide.layers.map((l: any) => renderLayer(l)).join('');

                return `
                <div class="ss3-slide ${transitionClass}" style="--duration: ${duration};">
                    <div class="ss3-slide-bg ${kenBurnsClass}" style="${bgStyle} position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center;"></div>
                    <div class="ss3-slide-content" style="position: relative; width: 100%; height: 100%; z-index: 2;">
                        ${layersHtml}
                    </div>
                </div>
                `;
            }).join("");

            const globalLayersHtml = globalLayers.map((l: any) => renderLayer(l, true)).join('');

            return {
                html: `
                <div class="lexslider" id="lexslider-${id}" data-id="${id}" style="width: 100%; max-width: ${slider.width}px; aspect-ratio: ${slider.width}/${slider.height}; position: relative; overflow: hidden;">
                    <style>${css}
                        .ss3-global-layer { position: absolute; z-index: 100; pointer-events: auto; }
                    </style>
                    <div class="ss3-track" style="position: relative; width: 100%; height: 100%;">
                        ${slidesHtml}
                    </div>
                    <div class="ss3-global-layers" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50;">
                        ${globalLayersHtml}
                    </div>
                    <div class="ss3-controls">
                        <button class="ss3-prev" onclick="document.querySelector('#lexslider-${id}').dispatchEvent(new CustomEvent('ss3:prev'))">❮</button>
                        <button class="ss3-next" onclick="document.querySelector('#lexslider-${id}').dispatchEvent(new CustomEvent('ss3:next'))">❯</button>
                    </div>
                </div>
                <script>
                    (function() {
                        const id = "lexslider-${id}";
                        const container = document.getElementById(id);
                        if(!container) return;
                        
                        let current = 0;
                        const slides = container.querySelectorAll('.ss3-slide');
                        if(slides.length > 0) slides[0].classList.add('active');
                        
                        const show = (index) => {
                            // Handle 'prev' class for exit animations
                            slides.forEach(s => {
                                s.classList.remove('active');
                                s.classList.remove('prev');
                            });
                            
                            // Set previous slide for exit animation
                            if (slides[current]) {
                                slides[current].classList.add('prev');
                            }
                            
                            slides[index].classList.add('active');
                            current = index;

                            // Lazy Loading: Preload next slide's images
                            const nextIndex = (current + 1) % slides.length;
                            const nextSlide = slides[nextIndex];
                            const images = nextSlide.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]');
                            images.forEach(img => {
                                if (img.dataset.src) {
                                    img.src = img.dataset.src;
                                    img.removeAttribute('loading');
                                }
                            });
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

// Helper function to render slider HTML (used by shortcode and embed route)
async function renderSliderHTML(id: string, db: any): Promise<string> {
    const slider = await db.query({
        operation: "findOne",
        table: "plugin_lexslider_sliders",
        where: { id }
    });

    if (!slider) return "<!-- Slider not found -->";

    const slides = await db.query({
        operation: "findMany",
        table: "plugin_lexslider_slides",
        where: { slider_id: id },
        orderBy: "ordering ASC"
    });

    const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
        const layers = await db.query({
            operation: "findMany",
            table: "plugin_lexslider_layers",
            where: { slide_id: slide.id },
            orderBy: "ordering ASC"
        });
        return { ...slide, layers: layers.rows || layers };
    }));

    const globalLayersRes = await db.query({
        operation: "findMany",
        table: "plugin_lexslider_global_layers",
        where: { slider_id: id },
        orderBy: "ordering ASC"
    });
    const globalLayers = globalLayersRes.rows || globalLayersRes;

    // Generate CSS
    let css = `
        .lexslider { font-family: sans-serif; }
        .ss3-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.5s; }
        .ss3-slide.active { opacity: 1; z-index: 1; }
        .ss3-slide.transition-fade { transition: opacity var(--duration, 0.5s); }
        .ss3-slide.transition-slide-horizontal { transform: translateX(100%); transition: transform var(--duration, 0.5s), opacity var(--duration, 0.5s); }
        .ss3-slide.transition-slide-horizontal.active { transform: translateX(0); }
        .ss3-slide.transition-slide-horizontal.prev { transform: translateX(-100%); }
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .ss3-ken-burns { animation: kenburns 10s infinite alternate linear; }
        .ss3-layer { position: absolute; }
        .ss3-global-layer { position: absolute; z-index: 100; pointer-events: auto; }
        .ss3-controls button { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: white; border: none; padding: 15px 10px; cursor: pointer; font-size: 18px; border-radius: 4px; }
        .ss3-prev { left: 10px; }
        .ss3-next { right: 10px; }
        .ss3-controls button:hover { background: rgba(0,0,0,0.8); }
    `;

    const styleToString = (s: any) => Object.entries(s).map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return '';
        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${key}:${v}`;
    }).join(';');

    const renderLayer = (layer: any, isGlobal = false) => {
        const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style;
        const content = typeof layer.content === 'string' ? JSON.parse(layer.content) : layer.content;
        const layerId = `layer-${layer.id}`;
        const globalClass = isGlobal ? 'ss3-global-layer' : 'ss3-layer';

        css += `.${layerId} { ${styleToString(style)} } `;
        if (style.tablet) css += `@media (max-width: 768px) { .${layerId} { ${styleToString({ ...style, ...style.tablet })} } } `;
        if (style.mobile) css += `@media (max-width: 480px) { .${layerId} { ${styleToString({ ...style, ...style.tablet, ...style.mobile })} } } `;

        let inner = '';
        if (layer.type === 'heading') inner = `<h1 style="margin:0">${content.text}</h1>`;
        else if (layer.type === 'text') inner = `<p style="margin:0">${content.text}</p>`;
        else if (layer.type === 'button') inner = `<a href="${content.link || '#'}" style="display:inline-block;padding:10px 20px;background:var(--btn-bg,#0069ff);color:var(--btn-color,white);text-decoration:none;border-radius:4px">${content.text}</a>`;
        else if (layer.type === 'image') inner = `<img src="${content.src}" alt="" style="max-width:100%;height:auto">`;
        else if (layer.type === 'video') inner = `<iframe width="100%" height="100%" src="${content.src}" frameborder="0" allowfullscreen></iframe>`;
        else if (layer.type === 'icon') inner = `<span class="material-icons-round" style="font-size:inherit;color:inherit">${content.icon}</span>`;

        return `<div class="${globalClass} ${layerId}">${inner}</div>`;
    };

    const slidesHtml = slidesWithLayers.map((slide: any) => {
        const duration = (slide.duration || 500) + 'ms';
        const transitionClass = `transition-${slide.transition || 'fade'}`;
        const kenBurnsClass = slide.ken_burns ? 'ss3-ken-burns' : '';
        const bgStyle = `background-image: url('${slide.background_image || ''}');`;
        const layersHtml = slide.layers.map((l: any) => renderLayer(l)).join('');

        return `
        <div class="ss3-slide ${transitionClass}" style="--duration: ${duration};">
            <div class="ss3-slide-bg ${kenBurnsClass}" style="${bgStyle} position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center;"></div>
            <div class="ss3-slide-content" style="position: relative; width: 100%; height: 100%; z-index: 2;">
                ${layersHtml}
            </div>
        </div>
        `;
    }).join("");

    const globalLayersHtml = globalLayers.map((l: any) => renderLayer(l, true)).join('');

    return `
    <div class="lexslider" id="lexslider-${id}" data-lexslider="${id}" style="width: 100%; max-width: ${slider.width}px; aspect-ratio: ${slider.width}/${slider.height}; position: relative; overflow: hidden; background: #000;">
        <style>${css}</style>
        <div class="ss3-track" style="position: relative; width: 100%; height: 100%;">
            ${slidesHtml}
        </div>
        <div class="ss3-global-layers" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50;">
            ${globalLayersHtml}
        </div>
        <div class="ss3-controls">
            <button class="ss3-prev" onclick="this.closest('.lexslider').dispatchEvent(new CustomEvent('ss3:prev'))">❮</button>
            <button class="ss3-next" onclick="this.closest('.lexslider').dispatchEvent(new CustomEvent('ss3:next'))">❯</button>
        </div>
    </div>
    <script>
        (function() {
            const container = document.querySelector('[data-lexslider="${id}"]');
            if(!container || container.dataset.initialized) return;
            container.dataset.initialized = 'true';
            
            let current = 0;
            const slides = container.querySelectorAll('.ss3-slide');
            if(slides.length > 0) slides[0].classList.add('active');
            
            const show = (index) => {
                slides.forEach(s => { s.classList.remove('active', 'prev'); });
                if (slides[current]) slides[current].classList.add('prev');
                slides[index].classList.add('active');
                current = index;
            };
            
            const next = () => show((current + 1) % slides.length);
            const prev = () => show((current - 1 + slides.length) % slides.length);
            
            container.addEventListener('ss3:next', next);
            container.addEventListener('ss3:prev', prev);
            
            if(slides.length > 1) setInterval(next, 5000);
        })();
    </script>
    `;
}
