
export const registerRenderRoutes = (ctx: any) => {
    // GET /render/:id
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

            const css = generateCSS(slidesWithLayers, globalLayers);
            const html = generateHTML(id, slider, slidesWithLayers, globalLayers, css);

            return { html };
        }
    });
};

function generateCSS(slides: any[], globalLayers: any[]) {
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
        .ss3-global-layer { position: absolute; z-index: 100; pointer-events: auto; }
    `;

    const processLayer = (layer: any, isGlobal: boolean) => {
        const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style;
        const layerId = `layer-${layer.id}`;

        css += `.${layerId} { ${styleToString(style)} } `;
        if (style.tablet) css += `@media (max-width: 768px) { .${layerId} { ${styleToString({ ...style, ...style.tablet })} } } `;
        if (style.mobile) css += `@media (max-width: 480px) { .${layerId} { ${styleToString({ ...style, ...style.tablet, ...style.mobile })} } } `;
    };

    slides.forEach(slide => slide.layers.forEach((l: any) => processLayer(l, false)));
    globalLayers.forEach(l => processLayer(l, true));

    return css;
}

function generateHTML(id: string, slider: any, slides: any[], globalLayers: any[], css: string) {
    const slidesHtml = slides.map((slide: any) => {
        const duration = (slide.duration || 500) + 'ms';
        const transitionClass = `transition-${slide.transition || 'fade'}`;
        const kenBurnsClass = slide.ken_burns ? 'ss3-ken-burns' : '';
        const bgStyle = `background-image: url('${slide.background_image || ''}');`;
        const layersHtml = slide.layers.map((l: any) => renderLayerHTML(l)).join('');

        return `
        <div class="ss3-slide ${transitionClass}" style="--duration: ${duration};">
            <div class="ss3-slide-bg ${kenBurnsClass}" style="${bgStyle} position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center;"></div>
            <div class="ss3-slide-content" style="position: relative; width: 100%; height: 100%; z-index: 2;">
                ${layersHtml}
            </div>
        </div>
        `;
    }).join("");

    const globalLayersHtml = globalLayers.map((l: any) => renderLayerHTML(l, true)).join('');

    return `
    <div class="lexslider" id="lexslider-${id}" data-id="${id}" style="width: 100%; max-width: ${slider.width}px; aspect-ratio: ${slider.width}/${slider.height}; position: relative; overflow: hidden;">
        <style>${css}</style>
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
                slides.forEach(s => {
                    s.classList.remove('active');
                    s.classList.remove('prev');
                });
                if (slides[current]) slides[current].classList.add('prev');
                slides[index].classList.add('active');
                current = index;

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
            
            setInterval(next, 5000);
        })();
    </script>
    `;
}

function renderLayerHTML(layer: any, isGlobal = false) {
    const content = typeof layer.content === 'string' ? JSON.parse(layer.content) : layer.content;
    const layerId = `layer-${layer.id}`;
    const globalClass = isGlobal ? 'ss3-global-layer' : 'ss3-layer';
    let inner = '';

    if (layer.type === 'heading') inner = `<h1>${content.text}</h1>`;
    else if (layer.type === 'text') inner = `<p>${content.text}</p>`;
    else if (layer.type === 'button') inner = `<a href="${content.link || '#'}">${content.text}</a>`;
    else if (layer.type === 'image') inner = `<img src="${content.src}" alt="" loading="lazy">`;
    else if (layer.type === 'video') inner = `<iframe width="100%" height="100%" src="${content.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    else if (layer.type === 'icon') inner = `<span class="material-icons-round" style="font-size: inherit; color: inherit;">${content.icon}</span>`;

    return `<div class="${globalClass} ${layerId}">${inner}</div>`;
}

function styleToString(s: any) {
    return Object.entries(s).map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return '';
        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${key}:${v}`;
    }).join(';');
}
