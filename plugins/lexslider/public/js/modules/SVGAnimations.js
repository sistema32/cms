/**
 * SVGAnimations.js - SVG drawing and morphing animations
 * Draw SVG strokes and morph between shapes
 */

// Draw animation presets
export const DRAW_PRESETS = {
    default: { label: 'Default', duration: 2000, easing: 'ease-in-out' },
    fast: { label: 'Fast', duration: 800, easing: 'ease-out' },
    slow: { label: 'Slow', duration: 4000, easing: 'linear' },
    bounce: { label: 'Bounce', duration: 1500, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
    elastic: { label: 'Elastic', duration: 2000, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
};

// Common SVG shapes for morphing
export const SVG_SHAPES = {
    circle: 'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10',
    square: 'M10,10 L90,10 L90,90 L10,90 Z',
    triangle: 'M50,10 L90,90 L10,90 Z',
    star: 'M50,5 L61,40 L98,40 L68,62 L79,97 L50,75 L21,97 L32,62 L2,40 L39,40 Z',
    heart: 'M50,88 C20,55 5,35 5,20 C5,5 20,0 35,15 C50,25 50,25 50,25 C50,25 50,25 65,15 C80,0 95,5 95,20 C95,35 80,55 50,88 Z',
    hexagon: 'M50,5 L90,27.5 L90,72.5 L50,95 L10,72.5 L10,27.5 Z',
    diamond: 'M50,5 L95,50 L50,95 L5,50 Z',
    cross: 'M35,5 L65,5 L65,35 L95,35 L95,65 L65,65 L65,95 L35,95 L35,65 L5,65 L5,35 L35,35 Z'
};

/**
 * Calculate SVG path length
 */
export function getPathLength(path) {
    if (typeof path === 'string') {
        const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        temp.setAttribute('d', path);
        return temp.getTotalLength();
    }
    return path.getTotalLength();
}

/**
 * Setup SVG for drawing animation
 */
export function setupDrawAnimation(svgElement, options = {}) {
    const {
        duration = 2000,
        delay = 0,
        easing = 'ease-in-out',
        direction = 'forward',  // forward, backward, both
        stagger = 0
    } = options;

    const paths = svgElement.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse');

    paths.forEach((path, index) => {
        const length = path.getTotalLength ? path.getTotalLength() : 0;

        if (length > 0) {
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = direction === 'backward' ? -length : length;
            path.style.transition = `stroke-dashoffset ${duration}ms ${easing} ${delay + (stagger * index)}ms`;
        }
    });

    return paths;
}

/**
 * Play draw animation
 */
export function playDrawAnimation(svgElement, direction = 'forward') {
    const paths = svgElement.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse');

    paths.forEach(path => {
        const length = path.getTotalLength ? path.getTotalLength() : 0;
        if (length > 0) {
            path.style.strokeDashoffset = direction === 'forward' ? 0 : length;
        }
    });
}

/**
 * Reset draw animation
 */
export function resetDrawAnimation(svgElement, direction = 'forward') {
    const paths = svgElement.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse');

    paths.forEach(path => {
        const length = path.getTotalLength ? path.getTotalLength() : 0;
        if (length > 0) {
            path.style.strokeDashoffset = direction === 'forward' ? length : 0;
        }
    });
}

/**
 * Generate SVG draw layer HTML
 */
export function generateSVGDrawHTML(svgContent, config = {}) {
    const {
        preset = 'default',
        color = '#8470ff',
        strokeWidth = 2,
        fill = 'none',
        trigger = 'viewport'  // viewport, hover, click
    } = config;

    return `
        <div class="ss3-svg-draw" 
             data-preset="${preset}"
             data-trigger="${trigger}"
             style="--svg-color: ${color}; --stroke-width: ${strokeWidth}px;">
            ${svgContent}
        </div>
    `;
}

/**
 * Create morph animation between shapes
 */
export function createMorphAnimation(fromShape, toShape, duration = 1000) {
    return {
        from: SVG_SHAPES[fromShape] || fromShape,
        to: SVG_SHAPES[toShape] || toShape,
        duration
    };
}

/**
 * Generate morph layer HTML
 */
export function generateMorphHTML(shapes, config = {}) {
    const {
        duration = 1000,
        delay = 500,
        loop = true,
        color = '#8470ff',
        fill = true,
        size = 100
    } = config;

    const shapePaths = shapes.map(s => SVG_SHAPES[s] || s);

    return `
        <div class="ss3-svg-morph" 
             data-shapes='${JSON.stringify(shapePaths)}'
             data-duration="${duration}"
             data-delay="${delay}"
             data-loop="${loop}">
            <svg viewBox="0 0 100 100" width="${size}" height="${size}">
                <path d="${shapePaths[0]}" 
                      fill="${fill ? color : 'none'}" 
                      stroke="${color}" 
                      stroke-width="2"/>
            </svg>
        </div>
    `;
}

/**
 * Generate SVG animations CSS
 */
export function generateSVGAnimationsCSS() {
    return `
        .ss3-svg-draw svg {
            overflow: visible;
        }
        
        .ss3-svg-draw svg path,
        .ss3-svg-draw svg line,
        .ss3-svg-draw svg polyline,
        .ss3-svg-draw svg polygon,
        .ss3-svg-draw svg circle,
        .ss3-svg-draw svg rect,
        .ss3-svg-draw svg ellipse {
            fill: none;
            stroke: var(--svg-color, #8470ff);
            stroke-width: var(--stroke-width, 2px);
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        
        .ss3-svg-morph svg {
            display: block;
        }
        
        .ss3-svg-morph path {
            transition: d 0.5s ease;
        }
    `;
}

/**
 * Generate SVG animations script
 */
export function generateSVGAnimationsScript() {
    return `
        (function() {
            const presets = ${JSON.stringify(DRAW_PRESETS)};
            
            // SVG Draw animations
            document.querySelectorAll('.ss3-svg-draw').forEach(function(container) {
                const preset = presets[container.dataset.preset] || presets.default;
                const trigger = container.dataset.trigger || 'viewport';
                const svg = container.querySelector('svg');
                if (!svg) return;
                
                const paths = svg.querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse');
                
                // Setup paths
                paths.forEach(function(path, i) {
                    if (path.getTotalLength) {
                        const length = path.getTotalLength();
                        path.style.strokeDasharray = length;
                        path.style.strokeDashoffset = length;
                        path.style.transition = 'stroke-dashoffset ' + preset.duration + 'ms ' + preset.easing + ' ' + (i * 100) + 'ms';
                    }
                });
                
                function play() {
                    paths.forEach(function(path) {
                        if (path.getTotalLength) {
                            path.style.strokeDashoffset = '0';
                        }
                    });
                }
                
                function reset() {
                    paths.forEach(function(path) {
                        if (path.getTotalLength) {
                            path.style.strokeDashoffset = path.getTotalLength();
                        }
                    });
                }
                
                // Trigger handlers
                if (trigger === 'viewport') {
                    const observer = new IntersectionObserver(function(entries) {
                        if (entries[0].isIntersecting) {
                            play();
                            observer.disconnect();
                        }
                    }, { threshold: 0.5 });
                    observer.observe(container);
                } else if (trigger === 'hover') {
                    container.addEventListener('mouseenter', play);
                    container.addEventListener('mouseleave', reset);
                } else if (trigger === 'click') {
                    let isDrawn = false;
                    container.addEventListener('click', function() {
                        if (isDrawn) reset(); else play();
                        isDrawn = !isDrawn;
                    });
                }
            });
            
            // SVG Morph animations
            document.querySelectorAll('.ss3-svg-morph').forEach(function(container) {
                const shapes = JSON.parse(container.dataset.shapes || '[]');
                if (shapes.length < 2) return;
                
                const duration = parseInt(container.dataset.duration) || 1000;
                const delay = parseInt(container.dataset.delay) || 500;
                const loop = container.dataset.loop !== 'false';
                const path = container.querySelector('path');
                if (!path) return;
                
                let currentIndex = 0;
                
                function morph() {
                    currentIndex = (currentIndex + 1) % shapes.length;
                    path.setAttribute('d', shapes[currentIndex]);
                }
                
                path.style.transition = 'd ' + duration + 'ms ease';
                
                setInterval(morph, duration + delay);
            });
        })();
    `;
}

/**
 * SVG icon library (simple icons)
 */
export const SVG_ICONS = {
    arrow: '<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
};

export default {
    DRAW_PRESETS,
    SVG_SHAPES,
    SVG_ICONS,
    getPathLength,
    setupDrawAnimation,
    playDrawAnimation,
    resetDrawAnimation,
    generateSVGDrawHTML,
    createMorphAnimation,
    generateMorphHTML,
    generateSVGAnimationsCSS,
    generateSVGAnimationsScript
};
