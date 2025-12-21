/**
 * LazyLoading.js - Lazy load images and videos
 * Performance optimization for large sliders
 */

// Configuration
const DEFAULT_CONFIG = {
    rootMargin: '200px',        // Load images 200px before they enter viewport
    threshold: 0,               // Trigger as soon as any part is visible
    loadAdjacentSlides: 2,      // Pre-load N slides ahead and behind
    placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3C/svg%3E',
    fadeIn: true,               // Fade in images when loaded
    fadeInDuration: 300,        // Fade in duration in ms
    retryOnError: true,         // Retry loading on error
    maxRetries: 3               // Maximum retry attempts
};

/**
 * Check if native lazy loading is supported
 */
export function supportsNativeLazyLoad() {
    return 'loading' in HTMLImageElement.prototype;
}

/**
 * LazyLoader class
 */
export class LazyLoader {
    constructor(container, config = {}) {
        this.container = container;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.observer = null;
        this.loadedImages = new Set();
        this.retryCount = new Map();

        this.init();
    }

    init() {
        // Use IntersectionObserver for lazy loading
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                root: this.container,
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );

        // Observe all lazy elements
        this.observeElements();

        // Listen for slide changes to preload adjacent
        this.container.addEventListener('ss3:slideChange', this.handleSlideChange.bind(this));
    }

    observeElements() {
        const lazyElements = this.container.querySelectorAll('[data-lazy-src], [data-src]');

        lazyElements.forEach(el => {
            if (!this.loadedImages.has(el)) {
                // Set placeholder
                if (el.tagName === 'IMG' && !el.src) {
                    el.src = this.config.placeholder;
                }

                this.observer.observe(el);
            }
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadElement(entry.target);
            }
        });
    }

    handleSlideChange(e) {
        const currentIndex = e.detail.index;
        const slides = this.container.querySelectorAll('.ss3-slide');

        // Preload adjacent slides
        for (let i = -this.config.loadAdjacentSlides; i <= this.config.loadAdjacentSlides; i++) {
            const slideIndex = currentIndex + i;
            if (slideIndex >= 0 && slideIndex < slides.length) {
                const slide = slides[slideIndex];
                const lazyElements = slide.querySelectorAll('[data-lazy-src], [data-src]');
                lazyElements.forEach(el => this.loadElement(el));
            }
        }
    }

    loadElement(element) {
        if (this.loadedImages.has(element)) return;

        const src = element.dataset.lazySrc || element.dataset.src;
        if (!src) return;

        if (element.tagName === 'IMG') {
            this.loadImage(element, src);
        } else if (element.tagName === 'VIDEO') {
            this.loadVideo(element, src);
        } else if (element.style) {
            // Background image
            this.loadBackgroundImage(element, src);
        }
    }

    loadImage(img, src) {
        const tempImg = new Image();

        tempImg.onload = () => {
            if (this.config.fadeIn) {
                img.style.opacity = '0';
                img.style.transition = `opacity ${this.config.fadeInDuration}ms ease`;
            }

            img.src = src;
            img.removeAttribute('data-lazy-src');
            img.removeAttribute('data-src');
            this.loadedImages.add(img);
            this.observer.unobserve(img);

            if (this.config.fadeIn) {
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            }

            // Dispatch loaded event
            img.dispatchEvent(new CustomEvent('ss3:imageLoaded'));
        };

        tempImg.onerror = () => {
            this.handleError(img, src);
        };

        tempImg.src = src;
    }

    loadVideo(video, src) {
        const source = video.querySelector('source') || document.createElement('source');
        source.src = src;

        if (!video.querySelector('source')) {
            video.appendChild(source);
        }

        video.load();
        video.removeAttribute('data-lazy-src');
        this.loadedImages.add(video);
        this.observer.unobserve(video);
    }

    loadBackgroundImage(element, src) {
        const tempImg = new Image();

        tempImg.onload = () => {
            if (this.config.fadeIn) {
                element.style.opacity = '0';
                element.style.transition = `opacity ${this.config.fadeInDuration}ms ease`;
            }

            element.style.backgroundImage = `url('${src}')`;
            element.removeAttribute('data-lazy-src');
            this.loadedImages.add(element);
            this.observer.unobserve(element);

            if (this.config.fadeIn) {
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                });
            }
        };

        tempImg.onerror = () => {
            this.handleError(element, src);
        };

        tempImg.src = src;
    }

    handleError(element, src) {
        if (!this.config.retryOnError) return;

        const retries = this.retryCount.get(element) || 0;
        if (retries < this.config.maxRetries) {
            this.retryCount.set(element, retries + 1);

            // Retry after delay
            setTimeout(() => {
                this.loadElement(element);
            }, 1000 * (retries + 1));
        } else {
            console.warn('[LazyLoader] Failed to load:', src);
            element.dispatchEvent(new CustomEvent('ss3:imageError', { detail: { src } }));
        }
    }

    /**
     * Load all images immediately
     */
    loadAll() {
        const lazyElements = this.container.querySelectorAll('[data-lazy-src], [data-src]');
        lazyElements.forEach(el => this.loadElement(el));
    }

    /**
     * Destroy the lazy loader
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Initialize lazy loading
 */
export function initLazyLoading(container, config = {}) {
    return new LazyLoader(container, config);
}

/**
 * Transform image elements for lazy loading
 */
export function prepareLazyImages(container) {
    const images = container.querySelectorAll('img[src]:not([data-no-lazy])');

    images.forEach(img => {
        const src = img.src;
        if (src && !src.startsWith('data:')) {
            img.dataset.lazySrc = src;
            img.src = DEFAULT_CONFIG.placeholder;
            img.loading = 'lazy'; // Native fallback
        }
    });

    // Background images
    const bgElements = container.querySelectorAll('[style*="background-image"]:not([data-no-lazy])');
    bgElements.forEach(el => {
        const match = el.style.backgroundImage.match(/url\(['"]?(.+?)['"]?\)/);
        if (match && match[1] && !match[1].startsWith('data:')) {
            el.dataset.lazySrc = match[1];
            el.style.backgroundImage = `url('${DEFAULT_CONFIG.placeholder}')`;
        }
    });
}

/**
 * Generate lazy loading script
 */
export function generateLazyLoadingScript(sliderId, config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const config = ${JSON.stringify(settings)};
            const loadedImages = new Set();
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        loadElement(entry.target);
                    }
                });
            }, {
                root: container,
                rootMargin: config.rootMargin,
                threshold: config.threshold
            });
            
            function loadElement(el) {
                if (loadedImages.has(el)) return;
                
                const src = el.dataset.lazySrc || el.dataset.src;
                if (!src) return;
                
                if (el.tagName === 'IMG') {
                    const temp = new Image();
                    temp.onload = function() {
                        if (config.fadeIn) {
                            el.style.opacity = '0';
                            el.style.transition = 'opacity ' + config.fadeInDuration + 'ms ease';
                        }
                        el.src = src;
                        el.removeAttribute('data-lazy-src');
                        loadedImages.add(el);
                        observer.unobserve(el);
                        if (config.fadeIn) {
                            requestAnimationFrame(function() { el.style.opacity = '1'; });
                        }
                    };
                    temp.src = src;
                } else {
                    // Background image
                    el.style.backgroundImage = 'url(' + src + ')';
                    el.removeAttribute('data-lazy-src');
                    loadedImages.add(el);
                    observer.unobserve(el);
                }
            }
            
            // Observe all lazy elements
            container.querySelectorAll('[data-lazy-src], [data-src]').forEach(function(el) {
                observer.observe(el);
            });
            
            // Preload adjacent slides on change
            container.addEventListener('ss3:slideChange', function(e) {
                const slides = container.querySelectorAll('.ss3-slide');
                for (let i = -config.loadAdjacentSlides; i <= config.loadAdjacentSlides; i++) {
                    const idx = e.detail.index + i;
                    if (idx >= 0 && idx < slides.length) {
                        slides[idx].querySelectorAll('[data-lazy-src]').forEach(loadElement);
                    }
                }
            });
        })();
    `;
}

/**
 * Generate lazy loading CSS
 */
export function generateLazyLoadingCSS() {
    return `
        [data-lazy-src] {
            background-color: #1a1a1a;
        }
        
        img[data-lazy-src] {
            min-height: 100px;
        }
        
        .ss3-lazy-loading {
            position: relative;
        }
        
        .ss3-lazy-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 30px;
            height: 30px;
            margin: -15px 0 0 -15px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #8470ff;
            border-radius: 50%;
            animation: lazySpinner 0.8s linear infinite;
        }
        
        @keyframes lazySpinner {
            to { transform: rotate(360deg); }
        }
    `;
}

export default {
    supportsNativeLazyLoad,
    LazyLoader,
    initLazyLoading,
    prepareLazyImages,
    generateLazyLoadingScript,
    generateLazyLoadingCSS
};
