/**
 * RenderService - Generates HTML/CSS for slider embedding
 */

import { escapeHtml, sanitizeUrl } from '../utils/escapeHtml.ts';
import { styleToString, generateLayerCSS, generateSliderCSS } from '../utils/cssGenerator.ts';
import { NotFoundError } from '../utils/errors.ts';

export interface SliderData {
    id: number;
    title: string;
    width: number;
    height: number;
    settings: string | Record<string, unknown>;
}

export interface SlideData {
    id: number;
    slider_id: number;
    background_image?: string;
    background_color?: string;
    transition?: string;
    duration?: number;
    sort_order: number;
    ken_burns?: boolean;
    layers: LayerData[];
}

export interface LayerData {
    id: number;
    slide_id?: number;
    slider_id?: number;
    type: string;
    content: string | Record<string, unknown>;
    style: string | Record<string, unknown>;
    animations?: string | Record<string, unknown>;
    sort_order: number;
    is_global?: boolean;
}

/**
 * Parse JSON string or return object as-is
 */
function parseJson(data: string | Record<string, unknown>): Record<string, unknown> {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
    return data || {};
}

/**
 * Render a single layer to HTML
 */
function renderLayer(
    layer: LayerData,
    escape: (s: string) => string,
    isGlobal = false
): { html: string; css: string } {
    const style = parseJson(layer.style);
    const content = parseJson(layer.content);
    const layerId = `layer-${layer.id}`;
    const globalClass = isGlobal ? 'ss3-global-layer' : 'ss3-layer';

    const css = generateLayerCSS(layerId, style);

    let inner = '';
    const type = layer.type;
    const text = content.text as string || '';
    const link = content.link as string || '#';
    const src = content.src as string || '';
    const icon = content.icon as string || '';

    switch (type) {
        case 'heading':
            inner = `<h1 style="margin:0">${escape(text)}</h1>`;
            break;
        case 'text':
            inner = `<p style="margin:0">${escape(text)}</p>`;
            break;
        case 'button':
            inner = `<a href="${sanitizeUrl(link)}" style="display:inline-block;padding:10px 20px;background:var(--btn-bg,#0069ff);color:var(--btn-color,white);text-decoration:none;border-radius:4px">${escape(text)}</a>`;
            break;
        case 'image':
            inner = `<img src="${sanitizeUrl(src)}" alt="" style="max-width:100%;height:auto">`;
            break;
        case 'video':
            inner = `<iframe width="100%" height="100%" src="${sanitizeUrl(src)}" frameborder="0" allowfullscreen></iframe>`;
            break;
        case 'icon':
            inner = `<span class="material-icons-round" style="font-size:inherit;color:inherit">${escape(icon)}</span>`;
            break;
    }

    const html = `<div class="${globalClass} ${layerId}">${inner}</div>`;

    return { html, css };
}

/**
 * Render complete slider HTML
 */
export async function renderSliderHTML(
    id: number | string,
    db: { query: (opts: any) => Promise<any> },
    escape: (s: string) => string = escapeHtml
): Promise<string> {
    const sliderId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Fetch slider
    const slider = await db.query({
        operation: 'findOne',
        table: 'plugin_lexslider_sliders',
        where: { id: sliderId }
    });

    if (!slider) {
        throw new NotFoundError('Slider', sliderId);
    }

    // Fetch slides with layers
    const slides = await db.query({
        operation: 'findMany',
        table: 'plugin_lexslider_slides',
        where: { slider_id: sliderId },
        orderBy: { sort_order: 'asc' }
    }) || [];

    // Fetch layers for each slide
    const slidesWithLayers = await Promise.all(slides.map(async (slide: any) => {
        const layers = await db.query({
            operation: 'findMany',
            table: 'plugin_lexslider_layers',
            where: { slide_id: slide.id, is_global: false },
            orderBy: { sort_order: 'asc' }
        }) || [];
        return { ...slide, layers };
    }));

    // Fetch global layers
    const globalLayers = await db.query({
        operation: 'findMany',
        table: 'plugin_lexslider_layers',
        where: { slider_id: sliderId, is_global: true },
        orderBy: { sort_order: 'asc' }
    }) || [];

    // Parse settings
    const settings = parseJson(slider.settings);
    const autoplay = settings.autoplay !== false;
    const showNav = settings.showNav !== false;
    const showPagination = settings.showPagination !== false;
    const interval = Number(settings.interval) || 5000;

    // Generate CSS
    let css = generateSliderCSS(slider.id, slider.width, slider.height);

    // Render slides
    const slidesHtml = slidesWithLayers.map((slide: any, index: number) => {
        const duration = (slide.duration || 500) + 'ms';
        const transitionClass = `transition-${slide.transition || 'fade'}`;
        const kenBurnsClass = slide.ken_burns ? 'ss3-ken-burns' : '';
        const bgStyle = slide.background_image
            ? `background-image: url('${sanitizeUrl(slide.background_image)}');`
            : '';
        const activeClass = index === 0 ? 'active' : '';

        // Render slide layers
        let layersHtml = '';
        (slide.layers || []).forEach((layer: LayerData) => {
            const { html, css: layerCss } = renderLayer(layer, escape, false);
            layersHtml += html;
            css += ` ${layerCss}`;
        });

        return `
            <div class="ss3-slide ${transitionClass} ${activeClass}" style="--duration: ${duration};">
                <div class="ss3-slide-bg ${kenBurnsClass}" style="${bgStyle} position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center;"></div>
                <div class="ss3-slide-content" style="position: relative; width: 100%; height: 100%; z-index: 2;">
                    ${layersHtml}
                </div>
            </div>
        `;
    }).join('');

    // Render global layers
    let globalLayersHtml = '';
    globalLayers.forEach((layer: LayerData) => {
        const { html, css: layerCss } = renderLayer(layer, escape, true);
        globalLayersHtml += html;
        css += ` ${layerCss}`;
    });

    // Navigation arrows
    const navHtml = showNav ? `
        <button class="ss3-nav ss3-prev" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);z-index:20;background:rgba(0,0,0,0.5);color:white;border:none;padding:12px;cursor:pointer;border-radius:4px;">◀</button>
        <button class="ss3-nav ss3-next" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:20;background:rgba(0,0,0,0.5);color:white;border:none;padding:12px;cursor:pointer;border-radius:4px;">▶</button>
    ` : '';

    // Pagination dots
    const paginationHtml = showPagination ? `
        <div class="ss3-pagination" style="position:absolute;bottom:15px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:20;">
            ${slides.map((_: any, i: number) =>
        `<button class="ss3-dot${i === 0 ? ' active' : ''}" data-index="${i}" style="width:12px;height:12px;border-radius:50%;border:none;background:${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};cursor:pointer;"></button>`
    ).join('')}
        </div>
    ` : '';

    // Complete HTML
    return `
        <style>${css}</style>
        <div class="ss3-${slider.id} ss3-slider" data-autoplay="${autoplay}" data-interval="${interval}">
            <div class="ss3-slides">
                ${slidesHtml}
            </div>
            ${globalLayersHtml}
            ${navHtml}
            ${paginationHtml}
        </div>
        <script>
        (function(){
            const slider = document.querySelector('.ss3-${slider.id}');
            if (!slider) return;
            
            const slides = slider.querySelectorAll('.ss3-slide');
            const dots = slider.querySelectorAll('.ss3-dot');
            const prevBtn = slider.querySelector('.ss3-prev');
            const nextBtn = slider.querySelector('.ss3-next');
            let current = 0;
            let timer = null;
            
            function goTo(index) {
                slides[current].classList.remove('active');
                dots[current]?.classList.remove('active');
                dots[current]?.style.setProperty('background', 'rgba(255,255,255,0.5)');
                
                current = (index + slides.length) % slides.length;
                
                slides[current].classList.add('active');
                dots[current]?.classList.add('active');
                dots[current]?.style.setProperty('background', 'white');
            }
            
            function next() { goTo(current + 1); }
            function prev() { goTo(current - 1); }
            
            if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });
            if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });
            dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetTimer(); }));
            
            const autoplay = slider.dataset.autoplay === 'true';
            const interval = parseInt(slider.dataset.interval) || 5000;
            
            function resetTimer() {
                if (timer) clearInterval(timer);
                if (autoplay) timer = setInterval(next, interval);
            }
            
            resetTimer();
        })();
        </script>
    `.trim();
}
