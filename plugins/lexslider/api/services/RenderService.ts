import { WorkerPluginAPI } from '../../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { SliderService } from './SliderService.ts';
import { SlideService, Slide, Layer } from './SlideService.ts';

export class RenderService {
    private api: WorkerPluginAPI;
    private sliderService: SliderService;
    private slideService: SlideService;

    constructor(api: WorkerPluginAPI) {
        this.api = api;
        this.sliderService = new SliderService(api);
        this.slideService = new SlideService(api);
    }

    async render(idOrAlias: string): Promise<string> {
        // 1. Resolve Slider
        let slider = await this.sliderService.get(idOrAlias);
        if (!slider) {
            // Try by alias
            const sliders = await this.sliderService.list();
            slider = sliders.find(s => s.alias === idOrAlias) || null;
        }

        if (!slider) {
            throw new Error('Slider not found');
        }

        // 2. Get Slides
        const slides = await this.slideService.getBySlider(slider.id!);

        // 3. Generate HTML
        return this.generateHTML(slider, slides);
    }

    private generateHTML(slider: any, slides: Slide[]): string {
        const sliderId = `lexslider-${slider.id}`;
        const config = slider.config;

        let html = `
        <div id="${sliderId}" class="lexslider mode-${config.mode}" 
             data-autoplay="${config.autoplay.enabled}" 
             data-duration="${config.autoplay.duration}"
             style="max-width: ${config.width}px; aspect-ratio: ${config.width}/${config.height};">
            
            <div class="ls-slides-container">
        `;

        slides.forEach((slide, index) => {
            html += this.renderSlide(slide, index === 0);
        });

        html += `</div>`; // End container

        // Navigation
        if (config.arrows.enabled) {
            html += `
            <button class="ls-arrow ls-prev" aria-label="Previous Slide">❮</button>
            <button class="ls-arrow ls-next" aria-label="Next Slide">❯</button>
            `;
        }

        html += `</div>`; // End slider

        // Inject CSS
        html += `<style>
            #${sliderId} { position: relative; overflow: hidden; margin: 0 auto; background: #f0f0f0; }
            #${sliderId} .ls-slides-container { position: relative; width: 100%; height: 100%; }
            #${sliderId} .ls-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
            #${sliderId} .ls-slide.active { opacity: 1; pointer-events: auto; z-index: 2; }
            #${sliderId} .ls-layer { position: absolute; transform-origin: top left; }
            #${sliderId} .ls-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px; cursor: pointer; }
            #${sliderId} .ls-prev { left: 10px; }
            #${sliderId} .ls-next { right: 10px; }
        </style>`;

        // Inject JS (Minimal Runtime)
        html += `<script>
            (function() {
                const slider = document.getElementById('${sliderId}');
                if(!slider) return;
                const slides = slider.querySelectorAll('.ls-slide');
                let current = 0;
                const total = slides.length;
                
                function show(index) {
                    slides[current].classList.remove('active');
                    current = (index + total) % total;
                    slides[current].classList.add('active');
                }

                slider.querySelector('.ls-next')?.addEventListener('click', () => show(current + 1));
                slider.querySelector('.ls-prev')?.addEventListener('click', () => show(current - 1));
                
                if(slider.dataset.autoplay === 'true') {
                    setInterval(() => show(current + 1), parseInt(slider.dataset.duration));
                }
            })();
        </script>`;

        return html;
    }

    private renderSlide(slide: Slide, isActive: boolean): string {
        let bgStyle = '';
        if (slide.background.type === 'color') {
            bgStyle = `background-color: ${slide.background.color};`;
        } else if (slide.background.type === 'image') {
            bgStyle = `background-image: url('${slide.background.url}'); background-size: cover; background-position: center;`;
        }

        let html = `<article class="ls-slide ${isActive ? 'active' : ''}" style="${bgStyle}">`;

        // Layers
        slide.layers.forEach(layer => {
            html += this.renderLayer(layer);
        });

        html += `</article>`;
        return html;
    }

    private renderLayer(layer: Layer): string {
        const style = Object.entries(layer.style)
            .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`)
            .join('; ');

        let tag = 'div';
        if (layer.type === 'heading') tag = 'h2';
        if (layer.type === 'button') tag = 'a';
        if (layer.type === 'image') return `<img src="${layer.content}" class="ls-layer" style="${style}" alt="Layer">`;

        return `<${tag} class="ls-layer" style="${style}">${layer.content}</${tag}>`;
    }
}
