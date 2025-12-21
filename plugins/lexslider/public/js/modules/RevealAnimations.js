/**
 * RevealAnimations.js - Directional reveal/mask animations
 * Reveal content with animated masks from different directions
 */

// Reveal directions
export const REVEAL_DIRECTIONS = {
    left: { label: 'From Left', icon: 'arrow_forward' },
    right: { label: 'From Right', icon: 'arrow_back' },
    top: { label: 'From Top', icon: 'arrow_downward' },
    bottom: { label: 'From Bottom', icon: 'arrow_upward' },
    center: { label: 'From Center', icon: 'unfold_more' },
    diagonal: { label: 'Diagonal', icon: 'trending_up' },
    corners: { label: 'Corners', icon: 'fullscreen' }
};

// Reveal styles
export const REVEAL_STYLES = {
    solid: { label: 'Solid', description: 'Clean solid edge' },
    split: { label: 'Split', description: 'Two-part split reveal' },
    wipe: { label: 'Wipe', description: 'Smooth wipe transition' },
    mask: { label: 'Mask', description: 'Custom shape mask' },
    blinds: { label: 'Blinds', description: 'Venetian blinds effect' },
    strips: { label: 'Strips', description: 'Multiple strips' }
};

/**
 * Generate reveal animation CSS
 */
export function generateRevealCSS(direction, style = 'solid', duration = 800) {
    const durationSec = duration / 1000;
    let css = '';

    const baseName = `reveal-${direction}-${style}`;

    switch (style) {
        case 'solid':
            css = generateSolidReveal(direction, baseName, durationSec);
            break;
        case 'split':
            css = generateSplitReveal(direction, baseName, durationSec);
            break;
        case 'wipe':
            css = generateWipeReveal(direction, baseName, durationSec);
            break;
        case 'blinds':
            css = generateBlindsReveal(direction, baseName, durationSec);
            break;
        case 'strips':
            css = generateStripsReveal(direction, baseName, durationSec);
            break;
        default:
            css = generateSolidReveal(direction, baseName, durationSec);
    }

    return css;
}

function generateSolidReveal(direction, baseName, duration) {
    const clipPaths = {
        left: {
            from: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        },
        right: {
            from: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        },
        top: {
            from: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        },
        bottom: {
            from: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        },
        center: {
            from: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        },
        diagonal: {
            from: 'polygon(0 0, 0 0, 0 0)',
            to: 'polygon(0 0, 200% 0, 0 200%)'
        },
        corners: {
            from: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)',
            to: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        }
    };

    const paths = clipPaths[direction] || clipPaths.left;

    return `
        @keyframes ${baseName} {
            0% {
                clip-path: ${paths.from};
            }
            100% {
                clip-path: ${paths.to};
            }
        }
        
        .${baseName} {
            animation: ${baseName} ${duration}s cubic-bezier(0.77, 0, 0.175, 1) forwards;
        }
        
        .${baseName}-out {
            animation: ${baseName} ${duration}s cubic-bezier(0.77, 0, 0.175, 1) reverse forwards;
        }
    `;
}

function generateSplitReveal(direction, baseName, duration) {
    const isHorizontal = ['left', 'right'].includes(direction);

    return `
        .${baseName} {
            position: relative;
            overflow: hidden;
        }
        
        .${baseName}::before,
        .${baseName}::after {
            content: '';
            position: absolute;
            background: inherit;
            z-index: 1;
            transition: transform ${duration}s cubic-bezier(0.77, 0, 0.175, 1);
        }
        
        ${isHorizontal ? `
            .${baseName}::before {
                top: 0; left: 0; right: 0; height: 50%;
                transform: translateY(-100%);
            }
            .${baseName}::after {
                bottom: 0; left: 0; right: 0; height: 50%;
                transform: translateY(100%);
            }
            .${baseName}.revealed::before { transform: translateY(0); }
            .${baseName}.revealed::after { transform: translateY(0); }
        ` : `
            .${baseName}::before {
                top: 0; left: 0; bottom: 0; width: 50%;
                transform: translateX(-100%);
            }
            .${baseName}::after {
                top: 0; right: 0; bottom: 0; width: 50%;
                transform: translateX(100%);
            }
            .${baseName}.revealed::before { transform: translateX(0); }
            .${baseName}.revealed::after { transform: translateX(0); }
        `}
    `;
}

function generateWipeReveal(direction, baseName, duration) {
    const transforms = {
        left: { from: 'scaleX(0)', to: 'scaleX(1)', origin: 'left center' },
        right: { from: 'scaleX(0)', to: 'scaleX(1)', origin: 'right center' },
        top: { from: 'scaleY(0)', to: 'scaleY(1)', origin: 'center top' },
        bottom: { from: 'scaleY(0)', to: 'scaleY(1)', origin: 'center bottom' }
    };

    const t = transforms[direction] || transforms.left;

    return `
        @keyframes ${baseName} {
            0% { transform: ${t.from}; }
            100% { transform: ${t.to}; }
        }
        
        .${baseName} {
            transform-origin: ${t.origin};
            animation: ${baseName} ${duration}s cubic-bezier(0.77, 0, 0.175, 1) forwards;
        }
    `;
}

function generateBlindsReveal(direction, baseName, duration) {
    const isHorizontal = ['left', 'right'].includes(direction);
    const blindCount = 5;

    let blindsCSS = '';
    for (let i = 0; i < blindCount; i++) {
        const delay = i * (duration / blindCount / 2);
        blindsCSS += `
            .${baseName} .blind-${i} {
                animation: blindReveal ${duration / 2}s ${delay}s cubic-bezier(0.77, 0, 0.175, 1) forwards;
            }
        `;
    }

    return `
        @keyframes blindReveal {
            0% { ${isHorizontal ? 'transform: scaleX(0);' : 'transform: scaleY(0);'} }
            100% { ${isHorizontal ? 'transform: scaleX(1);' : 'transform: scaleY(1);'} }
        }
        
        .${baseName} {
            display: flex;
            ${isHorizontal ? 'flex-direction: row;' : 'flex-direction: column;'}
        }
        
        .${baseName} .blind {
            flex: 1;
            ${isHorizontal ? 'transform: scaleX(0); transform-origin: left;' : 'transform: scaleY(0); transform-origin: top;'}
        }
        
        ${blindsCSS}
    `;
}

function generateStripsReveal(direction, baseName, duration) {
    const stripCount = 8;
    const isHorizontal = ['left', 'right'].includes(direction);

    let stripsCSS = '';
    for (let i = 0; i < stripCount; i++) {
        const delay = i * 0.05;
        stripsCSS += `
            .${baseName} .strip:nth-child(${i + 1}) {
                animation-delay: ${delay}s;
            }
        `;
    }

    return `
        @keyframes stripReveal {
            0% { 
                ${isHorizontal ? 'transform: translateX(-100%);' : 'transform: translateY(-100%);'}
                opacity: 0;
            }
            100% { 
                ${isHorizontal ? 'transform: translateX(0);' : 'transform: translateY(0);'}
                opacity: 1;
            }
        }
        
        .${baseName} {
            display: flex;
            ${isHorizontal ? 'flex-direction: column;' : 'flex-direction: row;'}
            overflow: hidden;
        }
        
        .${baseName} .strip {
            flex: 1;
            animation: stripReveal ${duration}s cubic-bezier(0.77, 0, 0.175, 1) forwards;
        }
        
        ${stripsCSS}
    `;
}

/**
 * Apply reveal animation to element
 */
export function applyReveal(element, direction = 'left', style = 'solid', options = {}) {
    const { duration = 800, delay = 0, onComplete } = options;

    const className = `reveal-${direction}-${style}`;

    // Ensure CSS is loaded
    if (!document.querySelector(`style[data-reveal="${className}"]`)) {
        const styleEl = document.createElement('style');
        styleEl.dataset.reveal = className;
        styleEl.textContent = generateRevealCSS(direction, style, duration);
        document.head.appendChild(styleEl);
    }

    // Apply with delay
    setTimeout(() => {
        element.classList.add(className);

        if (onComplete) {
            setTimeout(onComplete, duration);
        }
    }, delay);
}

/**
 * Create reveal layer
 */
export function createRevealLayer(content, direction = 'left', color = '#8470ff') {
    return `
        <div class="ss3-reveal-wrapper" data-reveal-direction="${direction}">
            <div class="ss3-reveal-mask" style="background: ${color};"></div>
            <div class="ss3-reveal-content">${content}</div>
        </div>
    `;
}

/**
 * Generate all reveal CSS
 */
export function generateAllRevealCSS() {
    let css = `
        .ss3-reveal-wrapper {
            position: relative;
            overflow: hidden;
        }
        
        .ss3-reveal-mask {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            transform-origin: left center;
        }
        
        .ss3-reveal-content {
            position: relative;
            z-index: 1;
        }
        
        /* Mask animations */
        @keyframes revealMaskLeft {
            0% { transform: scaleX(1); transform-origin: left; }
            100% { transform: scaleX(0); transform-origin: right; }
        }
        
        @keyframes revealMaskRight {
            0% { transform: scaleX(1); transform-origin: right; }
            100% { transform: scaleX(0); transform-origin: left; }
        }
        
        @keyframes revealMaskTop {
            0% { transform: scaleY(1); transform-origin: top; }
            100% { transform: scaleY(0); transform-origin: bottom; }
        }
        
        @keyframes revealMaskBottom {
            0% { transform: scaleY(1); transform-origin: bottom; }
            100% { transform: scaleY(0); transform-origin: top; }
        }
        
        .ss3-reveal-wrapper.animate .ss3-reveal-mask {
            animation-duration: 0.8s;
            animation-timing-function: cubic-bezier(0.77, 0, 0.175, 1);
            animation-fill-mode: forwards;
        }
        
        .ss3-reveal-wrapper[data-reveal-direction="left"].animate .ss3-reveal-mask {
            animation-name: revealMaskLeft;
        }
        
        .ss3-reveal-wrapper[data-reveal-direction="right"].animate .ss3-reveal-mask {
            animation-name: revealMaskRight;
        }
        
        .ss3-reveal-wrapper[data-reveal-direction="top"].animate .ss3-reveal-mask {
            animation-name: revealMaskTop;
        }
        
        .ss3-reveal-wrapper[data-reveal-direction="bottom"].animate .ss3-reveal-mask {
            animation-name: revealMaskBottom;
        }
    `;

    // Add all direction/style combinations
    Object.keys(REVEAL_DIRECTIONS).forEach(direction => {
        Object.keys(REVEAL_STYLES).forEach(style => {
            css += generateRevealCSS(direction, style, 800);
        });
    });

    return css;
}

/**
 * Generate reveal animation script
 */
export function generateRevealScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const revealElements = container.querySelectorAll('.ss3-reveal-wrapper');
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            
            revealElements.forEach(function(el) {
                observer.observe(el);
            });
            
            // Also trigger on slide change
            container.addEventListener('ss3:slideChange', function(e) {
                const slide = container.querySelectorAll('.ss3-slide')[e.detail.index];
                if (slide) {
                    slide.querySelectorAll('.ss3-reveal-wrapper').forEach(function(el) {
                        el.classList.remove('animate');
                        setTimeout(function() { el.classList.add('animate'); }, 50);
                    });
                }
            });
        })();
    `;
}

export default {
    REVEAL_DIRECTIONS,
    REVEAL_STYLES,
    generateRevealCSS,
    applyReveal,
    createRevealLayer,
    generateAllRevealCSS,
    generateRevealScript
};
