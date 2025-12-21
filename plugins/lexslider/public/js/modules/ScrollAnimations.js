/**
 * ScrollAnimations.js - Scroll-triggered animations
 * Uses IntersectionObserver to trigger animations when slides enter viewport
 */

// Configuration
const defaultConfig = {
    threshold: 0.2,        // 20% visible to trigger
    rootMargin: '0px',
    once: true,            // Animate only once
    delay: 0               // Delay before animation starts
};

// Observer instances per slider
const observers = new Map();

/**
 * Initialize scroll animations for a slider
 */
export function initScrollAnimations(container, slides, config = {}) {
    if (!container || !('IntersectionObserver' in window)) return;

    const options = { ...defaultConfig, ...config };

    // Destroy existing observer if any
    destroyScrollAnimations(container);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slide = entry.target;
                const delay = parseInt(slide.dataset.scrollDelay) || options.delay;

                setTimeout(() => {
                    slide.classList.add('scroll-visible');
                    slide.classList.remove('scroll-hidden');

                    // Trigger layer animations
                    const layers = slide.querySelectorAll('[data-scroll-animate]');
                    layers.forEach((layer, index) => {
                        const layerDelay = (index * 100) + delay;
                        setTimeout(() => {
                            layer.classList.add('animate-in');
                        }, layerDelay);
                    });

                    // Fire custom event
                    slide.dispatchEvent(new CustomEvent('scrollAnimationStart'));
                }, delay);

                if (options.once) {
                    observer.unobserve(entry.target);
                }
            } else if (!options.once) {
                entry.target.classList.remove('scroll-visible');
                entry.target.classList.add('scroll-hidden');
            }
        });
    }, {
        threshold: options.threshold,
        rootMargin: options.rootMargin
    });

    // Observe all slides
    slides.forEach(slide => {
        slide.classList.add('scroll-hidden');
        observer.observe(slide);
    });

    observers.set(container, observer);
}

/**
 * Destroy scroll animations for a container
 */
export function destroyScrollAnimations(container) {
    const observer = observers.get(container);
    if (observer) {
        observer.disconnect();
        observers.delete(container);
    }
}

/**
 * Generate CSS for scroll animations
 */
export function generateScrollAnimationCSS() {
    return `
        /* Scroll Animation States */
        .scroll-hidden {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .scroll-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Layer scroll animations */
        [data-scroll-animate] {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        
        [data-scroll-animate].animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Scroll animation variants */
        [data-scroll-animate="fadeIn"] {
            transform: none;
        }
        
        [data-scroll-animate="slideUp"] {
            transform: translateY(40px);
        }
        
        [data-scroll-animate="slideDown"] {
            transform: translateY(-40px);
        }
        
        [data-scroll-animate="slideLeft"] {
            transform: translateX(40px);
        }
        
        [data-scroll-animate="slideRight"] {
            transform: translateX(-40px);
        }
        
        [data-scroll-animate="zoomIn"] {
            transform: scale(0.8);
        }
        
        [data-scroll-animate="zoomOut"] {
            transform: scale(1.2);
        }
        
        [data-scroll-animate].animate-in {
            opacity: 1;
            transform: none;
        }
    `;
}

/**
 * Generate frontend scroll animation script
 */
export function generateScrollAnimationScript(sliderId, config = {}) {
    const options = { ...defaultConfig, ...config };

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container || !('IntersectionObserver' in window)) return;
            
            const slides = container.querySelectorAll('.ss3-slide');
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const slide = entry.target;
                        const delay = parseInt(slide.dataset.scrollDelay) || ${options.delay};
                        
                        setTimeout(function() {
                            slide.classList.add('scroll-visible');
                            slide.classList.remove('scroll-hidden');
                            
                            const layers = slide.querySelectorAll('[data-scroll-animate]');
                            layers.forEach(function(layer, index) {
                                setTimeout(function() {
                                    layer.classList.add('animate-in');
                                }, (index * 100) + delay);
                            });
                        }, delay);
                        
                        ${options.once ? 'observer.unobserve(entry.target);' : ''}
                    } ${!options.once ? `else {
                        entry.target.classList.remove('scroll-visible');
                        entry.target.classList.add('scroll-hidden');
                    }` : ''}
                });
            }, {
                threshold: ${options.threshold},
                rootMargin: '${options.rootMargin}'
            });
            
            slides.forEach(function(slide) {
                slide.classList.add('scroll-hidden');
                observer.observe(slide);
            });
        })();
    `;
}

/**
 * Available scroll animation types for layers
 */
export const SCROLL_ANIMATION_TYPES = [
    { value: 'none', label: 'None' },
    { value: 'fadeIn', label: 'Fade In' },
    { value: 'slideUp', label: 'Slide Up' },
    { value: 'slideDown', label: 'Slide Down' },
    { value: 'slideLeft', label: 'Slide Left' },
    { value: 'slideRight', label: 'Slide Right' },
    { value: 'zoomIn', label: 'Zoom In' },
    { value: 'zoomOut', label: 'Zoom Out' }
];

export default {
    initScrollAnimations,
    destroyScrollAnimations,
    generateScrollAnimationCSS,
    generateScrollAnimationScript,
    SCROLL_ANIMATION_TYPES
};
