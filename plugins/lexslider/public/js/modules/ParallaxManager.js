/**
 * ParallaxManager.js - Parallax effects for layers
 * Creates depth effect by moving layers at different speeds on scroll
 */

// Active parallax configurations
const parallaxLayers = new Map();
let scrollHandler = null;
let isEnabled = false;

/**
 * Initialize parallax for a slider container
 * @param {HTMLElement} container - Slider container
 * @param {Array} layers - Layer configurations with parallaxSpeed
 */
export function initParallax(container, layers) {
    if (!container) return;

    // Reset
    destroyParallax();

    // Filter layers with parallax enabled
    layers.forEach(layer => {
        const speed = layer.style?.parallaxSpeed;
        if (speed && speed !== 0) {
            parallaxLayers.set(layer.id, {
                speed: parseFloat(speed) || 0,
                direction: layer.style?.parallaxDirection || 'vertical', // vertical, horizontal, both
                element: null
            });
        }
    });

    if (parallaxLayers.size === 0) return;

    isEnabled = true;

    // Create scroll handler
    scrollHandler = () => {
        if (!isEnabled) return;

        const containerRect = container.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;

        // Calculate how far container is from center of viewport
        const containerCenter = containerRect.top + containerRect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const offset = (containerCenter - viewportCenter) / viewportHeight;

        parallaxLayers.forEach((config, layerId) => {
            const element = document.querySelector(`[data-id="${layerId}"]`);
            if (!element) return;

            const translateY = offset * config.speed * 100;
            const translateX = config.direction === 'horizontal' || config.direction === 'both'
                ? offset * config.speed * 50 : 0;

            if (config.direction === 'horizontal') {
                element.style.transform = `translateX(${translateX}px)`;
            } else if (config.direction === 'both') {
                element.style.transform = `translate(${translateX}px, ${translateY}px)`;
            } else {
                element.style.transform = `translateY(${translateY}px)`;
            }
        });
    };

    // Attach with passive listener for performance
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Initial calculation
    scrollHandler();
}

/**
 * Destroy parallax effects
 */
export function destroyParallax() {
    if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
    }
    parallaxLayers.clear();
    isEnabled = false;
}

/**
 * Toggle parallax on/off
 */
export function toggleParallax(enabled) {
    isEnabled = enabled;
}

/**
 * Update parallax speed for a layer
 */
export function setParallaxSpeed(layerId, speed, direction = 'vertical') {
    if (parallaxLayers.has(layerId)) {
        parallaxLayers.set(layerId, {
            ...parallaxLayers.get(layerId),
            speed,
            direction
        });
    }
}

/**
 * Generate CSS for parallax (for frontend render)
 */
export function generateParallaxCSS(layers) {
    let css = '';

    layers.forEach(layer => {
        const speed = layer.style?.parallaxSpeed;
        if (speed && speed !== 0) {
            // Add will-change for GPU acceleration
            css += `
                [data-layer-id="${layer.id}"] {
                    will-change: transform;
                    transition: transform 0.1s ease-out;
                }
            `;
        }
    });

    return css;
}

/**
 * Generate frontend parallax JavaScript
 */
export function generateParallaxScript(sliderId, layers) {
    const parallaxConfigs = layers
        .filter(l => l.style?.parallaxSpeed && l.style.parallaxSpeed !== 0)
        .map(l => ({
            id: l.id,
            speed: l.style.parallaxSpeed,
            direction: l.style.parallaxDirection || 'vertical'
        }));

    if (parallaxConfigs.length === 0) return '';

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const configs = ${JSON.stringify(parallaxConfigs)};
            
            function updateParallax() {
                const rect = container.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const containerCenter = rect.top + rect.height / 2;
                const offset = (containerCenter - viewportHeight / 2) / viewportHeight;
                
                configs.forEach(config => {
                    const el = container.querySelector('[data-layer-id="' + config.id + '"]');
                    if (!el) return;
                    
                    const translateY = offset * config.speed * 100;
                    const translateX = config.direction !== 'vertical' ? offset * config.speed * 50 : 0;
                    
                    if (config.direction === 'horizontal') {
                        el.style.transform = 'translateX(' + translateX + 'px)';
                    } else if (config.direction === 'both') {
                        el.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px)';
                    } else {
                        el.style.transform = 'translateY(' + translateY + 'px)';
                    }
                });
            }
            
            window.addEventListener('scroll', updateParallax, { passive: true });
            updateParallax();
        })();
    `;
}

export default {
    initParallax,
    destroyParallax,
    toggleParallax,
    setParallaxSpeed,
    generateParallaxCSS,
    generateParallaxScript
};
