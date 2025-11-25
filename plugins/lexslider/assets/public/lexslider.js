/**
 * LexSlider - Frontend Rendering Engine
 * Public-facing slider with animations, touch support, and responsive behavior
 */

class LexSlider {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            autoplay: options.autoplay !== false,
            duration: options.duration || 5000,
            pauseOnHover: options.pauseOnHover !== false,
            arrows: options.arrows !== false,
            dots: options.dots !== false,
            swipe: options.swipe !== false,
            ...options
        };

        this.currentSlide = 0;
        this.slides = [];
        this.autoplayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.init();
    }

    async init() {
        // Load slider data
        const sliderId = this.element.dataset.slider;
        if (!sliderId) {
            console.error('LexSlider: No slider ID specified');
            return;
        }

        try {
            const response = await fetch(`/api/plugins/lexslider/render/${sliderId}`);
            const data = await response.json();

            this.sliderData = data;
            this.slides = data.slides || [];

            this.render();
            this.attachEvents();

            if (this.options.autoplay) {
                this.startAutoplay();
            }
        } catch (error) {
            console.error('LexSlider: Failed to load slider', error);
        }
    }

    render() {
        const { width, height, mode } = this.sliderData.config || {};

        this.element.className = `lexslider lexslider-${mode || 'boxed'}`;
        this.element.style.maxWidth = `${width || 1200}px`;
        this.element.style.aspectRatio = `${width || 1200}/${height || 600}`;

        // Create slides container
        const slidesContainer = document.createElement('div');
        slidesContainer.className = 'lexslider-slides';

        this.slides.forEach((slide, index) => {
            const slideEl = this.createSlide(slide, index);
            slidesContainer.appendChild(slideEl);
        });

        this.element.appendChild(slidesContainer);

        // Add controls
        if (this.options.arrows) {
            this.addArrows();
        }

        if (this.options.dots) {
            this.addDots();
        }
    }

    createSlide(slide, index) {
        const slideEl = document.createElement('div');
        slideEl.className = `lexslider-slide ${index === 0 ? 'active' : ''}`;
        slideEl.dataset.index = index;

        // Background
        const bg = slide.background || {};
        if (bg.type === 'image' && bg.url) {
            slideEl.style.backgroundImage = `url(${bg.url})`;
            slideEl.style.backgroundSize = 'cover';
            slideEl.style.backgroundPosition = bg.position || 'center';
        } else if (bg.type === 'color' && bg.color) {
            slideEl.style.backgroundColor = bg.color;
        }

        // Layers
        const layersContainer = document.createElement('div');
        layersContainer.className = 'lexslider-layers';

        (slide.layers || []).forEach(layer => {
            const layerEl = this.createLayer(layer);
            layersContainer.appendChild(layerEl);
        });

        slideEl.appendChild(layersContainer);
        return slideEl;
    }

    createLayer(layer) {
        const layerEl = document.createElement('div');
        layerEl.className = `lexslider-layer lexslider-layer-${layer.type}`;

        // Position
        const pos = layer.position || {};
        layerEl.style.left = `${pos.x || 0}px`;
        layerEl.style.top = `${pos.y || 0}px`;
        layerEl.style.width = `${pos.width || 200}px`;
        layerEl.style.height = `${pos.height || 100}px`;
        layerEl.style.zIndex = pos.zIndex || 1;

        // Settings
        const settings = layer.settings || {};
        if (settings.fontSize) layerEl.style.fontSize = `${settings.fontSize}px`;
        if (settings.color) layerEl.style.color = settings.color;
        if (settings.fontWeight) layerEl.style.fontWeight = settings.fontWeight;
        if (settings.textAlign) layerEl.style.textAlign = settings.textAlign;

        // Content
        if (layer.type === 'heading') {
            layerEl.innerHTML = `<h2>${layer.content || ''}</h2>`;
        } else if (layer.type === 'text') {
            layerEl.innerHTML = `<p>${layer.content || ''}</p>`;
        } else if (layer.type === 'button') {
            layerEl.innerHTML = `<button class="lexslider-btn">${layer.content || 'Click'}</button>`;
        } else if (layer.type === 'image') {
            layerEl.innerHTML = `<img src="${layer.content || ''}" alt="" />`;
        }

        // Animations
        const animations = layer.animations || {};
        if (animations.in) {
            layerEl.dataset.animationIn = animations.in.type;
            layerEl.dataset.animationInDuration = animations.in.duration || 1000;
            layerEl.dataset.animationInDelay = animations.in.delay || 0;
        }
        if (animations.out) {
            layerEl.dataset.animationOut = animations.out.type;
        }

        return layerEl;
    }

    addArrows() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'lexslider-arrow lexslider-arrow-prev';
        prevBtn.innerHTML = '‹';
        prevBtn.onclick = () => this.prev();

        const nextBtn = document.createElement('button');
        nextBtn.className = 'lexslider-arrow lexslider-arrow-next';
        nextBtn.innerHTML = '›';
        nextBtn.onclick = () => this.next();

        this.element.appendChild(prevBtn);
        this.element.appendChild(nextBtn);
    }

    addDots() {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'lexslider-dots';

        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `lexslider-dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => this.goTo(index);
            dotsContainer.appendChild(dot);
        });

        this.element.appendChild(dotsContainer);
    }

    attachEvents() {
        // Pause on hover
        if (this.options.pauseOnHover) {
            this.element.addEventListener('mouseenter', () => this.stopAutoplay());
            this.element.addEventListener('mouseleave', () => {
                if (this.options.autoplay) this.startAutoplay();
            });
        }

        // Touch/swipe support
        if (this.options.swipe) {
            this.element.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            });

            this.element.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            });
        }
    }

    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }

    goTo(index) {
        if (index < 0 || index >= this.slides.length) return;

        const slides = this.element.querySelectorAll('.lexslider-slide');
        const dots = this.element.querySelectorAll('.lexslider-dot');

        // Remove active class
        slides[this.currentSlide]?.classList.remove('active');
        dots[this.currentSlide]?.classList.remove('active');

        // Add active class
        this.currentSlide = index;
        slides[this.currentSlide]?.classList.add('active');
        dots[this.currentSlide]?.classList.add('active');

        // Trigger animations
        this.animateSlide(slides[this.currentSlide]);
    }

    animateSlide(slideEl) {
        const layers = slideEl.querySelectorAll('.lexslider-layer');

        layers.forEach(layer => {
            const animIn = layer.dataset.animationIn;
            const duration = layer.dataset.animationInDuration || 1000;
            const delay = layer.dataset.animationInDelay || 0;

            if (animIn) {
                layer.style.animation = 'none';
                setTimeout(() => {
                    layer.style.animation = `${animIn} ${duration}ms ease-out ${delay}ms both`;
                }, 10);
            }
        });
    }

    next() {
        this.goTo((this.currentSlide + 1) % this.slides.length);
    }

    prev() {
        this.goTo((this.currentSlide - 1 + this.slides.length) % this.slides.length);
    }

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.options.duration);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    destroy() {
        this.stopAutoplay();
        this.element.innerHTML = '';
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-slider]').forEach(el => {
        new LexSlider(el);
    });
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LexSlider;
}
