/**
 * KenBurns.js - Ken Burns zoom/pan effect for images
 * Documentary-style slow zoom and pan animation
 */

// Ken Burns presets
export const KENBURNS_PRESETS = {
    none: { label: 'None', animation: null },
    zoomIn: {
        label: 'Zoom In',
        from: { scale: 1, x: 0, y: 0 },
        to: { scale: 1.2, x: 0, y: 0 }
    },
    zoomOut: {
        label: 'Zoom Out',
        from: { scale: 1.2, x: 0, y: 0 },
        to: { scale: 1, x: 0, y: 0 }
    },
    zoomInLeft: {
        label: 'Zoom In Left',
        from: { scale: 1, x: 0, y: 0 },
        to: { scale: 1.3, x: -10, y: 0 }
    },
    zoomInRight: {
        label: 'Zoom In Right',
        from: { scale: 1, x: 0, y: 0 },
        to: { scale: 1.3, x: 10, y: 0 }
    },
    zoomInUp: {
        label: 'Zoom In Up',
        from: { scale: 1, x: 0, y: 0 },
        to: { scale: 1.3, x: 0, y: -10 }
    },
    zoomInDown: {
        label: 'Zoom In Down',
        from: { scale: 1, x: 0, y: 0 },
        to: { scale: 1.3, x: 0, y: 10 }
    },
    zoomOutLeft: {
        label: 'Zoom Out Left',
        from: { scale: 1.3, x: 10, y: 0 },
        to: { scale: 1, x: 0, y: 0 }
    },
    zoomOutRight: {
        label: 'Zoom Out Right',
        from: { scale: 1.3, x: -10, y: 0 },
        to: { scale: 1, x: 0, y: 0 }
    },
    panLeft: {
        label: 'Pan Left',
        from: { scale: 1.1, x: 5, y: 0 },
        to: { scale: 1.1, x: -5, y: 0 }
    },
    panRight: {
        label: 'Pan Right',
        from: { scale: 1.1, x: -5, y: 0 },
        to: { scale: 1.1, x: 5, y: 0 }
    },
    panUp: {
        label: 'Pan Up',
        from: { scale: 1.1, x: 0, y: 5 },
        to: { scale: 1.1, x: 0, y: -5 }
    },
    panDown: {
        label: 'Pan Down',
        from: { scale: 1.1, x: 0, y: -5 },
        to: { scale: 1.1, x: 0, y: 5 }
    },
    diagonalZoomIn: {
        label: 'Diagonal Zoom In',
        from: { scale: 1, x: -5, y: -5 },
        to: { scale: 1.3, x: 5, y: 5 }
    },
    diagonalZoomOut: {
        label: 'Diagonal Zoom Out',
        from: { scale: 1.3, x: 5, y: 5 },
        to: { scale: 1, x: -5, y: -5 }
    },
    random: {
        label: 'Random',
        random: true
    }
};

/**
 * Get random Ken Burns effect
 */
export function getRandomKenBurns() {
    const presets = Object.keys(KENBURNS_PRESETS).filter(k => k !== 'none' && k !== 'random');
    const randomKey = presets[Math.floor(Math.random() * presets.length)];
    return KENBURNS_PRESETS[randomKey];
}

/**
 * Get Ken Burns options for UI
 */
export function getKenBurnsOptions() {
    return Object.entries(KENBURNS_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.label
    }));
}

/**
 * Generate Ken Burns CSS for a slide
 */
export function generateKenBurnsCSS(presetName, duration = 10000) {
    let preset = KENBURNS_PRESETS[presetName];

    if (!preset || !preset.from) {
        if (presetName === 'random') {
            preset = getRandomKenBurns();
        } else {
            return '';
        }
    }

    const { from, to } = preset;
    const durationSec = duration / 1000;

    return `
        @keyframes kenburns_${presetName} {
            0% {
                transform: scale(${from.scale}) translate(${from.x}%, ${from.y}%);
            }
            100% {
                transform: scale(${to.scale}) translate(${to.x}%, ${to.y}%);
            }
        }
        
        .kenburns-${presetName} {
            animation: kenburns_${presetName} ${durationSec}s ease-out forwards;
            will-change: transform;
        }
    `;
}

/**
 * Generate all Ken Burns CSS
 */
export function generateAllKenBurnsCSS(duration = 10000) {
    let css = `
        .ss3-kenburns {
            overflow: hidden;
        }
        
        .ss3-kenburns img,
        .ss3-kenburns .ss3-bg {
            will-change: transform;
        }
    `;

    Object.entries(KENBURNS_PRESETS).forEach(([name, preset]) => {
        if (preset.from && preset.to) {
            css += generateKenBurnsCSS(name, duration);
        }
    });

    return css;
}

/**
 * Apply Ken Burns effect to element
 */
export function applyKenBurns(element, presetName, duration = 10000) {
    let preset = KENBURNS_PRESETS[presetName];

    if (presetName === 'random') {
        preset = getRandomKenBurns();
    }

    if (!preset || !preset.from) return;

    const { from, to } = preset;

    // Reset animation
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow

    // Apply animation
    element.style.transform = `scale(${from.scale}) translate(${from.x}%, ${from.y}%)`;
    element.style.transition = `transform ${duration}ms ease-out`;

    requestAnimationFrame(() => {
        element.style.transform = `scale(${to.scale}) translate(${to.x}%, ${to.y}%)`;
    });
}

/**
 * Generate Ken Burns script for frontend
 */
export function generateKenBurnsScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const presets = ${JSON.stringify(KENBURNS_PRESETS)};
            
            function applyKenBurns(slide, duration) {
                const effect = slide.dataset.kenburns;
                if (!effect || effect === 'none') return;
                
                let preset = presets[effect];
                if (effect === 'random') {
                    const keys = Object.keys(presets).filter(k => k !== 'none' && k !== 'random');
                    preset = presets[keys[Math.floor(Math.random() * keys.length)]];
                }
                
                if (!preset || !preset.from) return;
                
                const bg = slide.querySelector('.ss3-bg, img');
                if (!bg) return;
                
                bg.style.transform = 'scale(' + preset.from.scale + ') translate(' + preset.from.x + '%, ' + preset.from.y + '%)';
                bg.style.transition = 'transform ' + duration + 'ms ease-out';
                
                requestAnimationFrame(function() {
                    bg.style.transform = 'scale(' + preset.to.scale + ') translate(' + preset.to.x + '%, ' + preset.to.y + '%)';
                });
            }
            
            function resetKenBurns(slide) {
                const bg = slide.querySelector('.ss3-bg, img');
                if (bg) {
                    bg.style.transform = '';
                    bg.style.transition = '';
                }
            }
            
            // Apply on slide change
            container.addEventListener('ss3:slideChange', function(e) {
                const slides = container.querySelectorAll('.ss3-slide');
                const duration = parseInt(container.dataset.autoplaySpeed) || 5000;
                
                slides.forEach(function(slide, i) {
                    if (i === e.detail.index) {
                        applyKenBurns(slide, duration);
                    } else {
                        resetKenBurns(slide);
                    }
                });
            });
            
            // Initial
            const firstSlide = container.querySelector('.ss3-slide.active');
            if (firstSlide) {
                const duration = parseInt(container.dataset.autoplaySpeed) || 5000;
                applyKenBurns(firstSlide, duration);
            }
        })();
    `;
}

export default {
    KENBURNS_PRESETS,
    getRandomKenBurns,
    getKenBurnsOptions,
    generateKenBurnsCSS,
    generateAllKenBurnsCSS,
    applyKenBurns,
    generateKenBurnsScript
};
