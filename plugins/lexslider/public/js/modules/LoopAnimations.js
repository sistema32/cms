/**
 * LoopAnimations.js - Infinite/Loop animation effects for layers
 * Provides continuous animations like float, pulse, rotate, shimmer
 */

// Predefined loop animation presets
export const LOOP_PRESETS = {
    none: {
        name: 'None',
        keyframes: null
    },
    float: {
        name: 'Float',
        keyframes: `
            @keyframes lexFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `,
        animation: 'lexFloat 3s ease-in-out infinite'
    },
    pulse: {
        name: 'Pulse',
        keyframes: `
            @keyframes lexPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
        `,
        animation: 'lexPulse 2s ease-in-out infinite'
    },
    rotate: {
        name: 'Rotate',
        keyframes: `
            @keyframes lexRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `,
        animation: 'lexRotate 8s linear infinite'
    },
    swing: {
        name: 'Swing',
        keyframes: `
            @keyframes lexSwing {
                0%, 100% { transform: rotate(0deg); transform-origin: top center; }
                25% { transform: rotate(5deg); }
                75% { transform: rotate(-5deg); }
            }
        `,
        animation: 'lexSwing 2s ease-in-out infinite'
    },
    bounce: {
        name: 'Bounce',
        keyframes: `
            @keyframes lexBounce {
                0%, 100% { transform: translateY(0); }
                25% { transform: translateY(-8px); }
                50% { transform: translateY(0); }
                75% { transform: translateY(-4px); }
            }
        `,
        animation: 'lexBounce 1.5s ease-in-out infinite'
    },
    shimmer: {
        name: 'Shimmer',
        keyframes: `
            @keyframes lexShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `,
        animation: 'lexShimmer 2s linear infinite',
        style: 'background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%;'
    },
    glow: {
        name: 'Glow',
        keyframes: `
            @keyframes lexGlow {
                0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
                50% { box-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.6); }
            }
        `,
        animation: 'lexGlow 2s ease-in-out infinite'
    },
    shake: {
        name: 'Shake',
        keyframes: `
            @keyframes lexShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
        `,
        animation: 'lexShake 0.5s ease-in-out infinite'
    },
    wobble: {
        name: 'Wobble',
        keyframes: `
            @keyframes lexWobble {
                0%, 100% { transform: translateX(0) rotate(0); }
                15% { transform: translateX(-5px) rotate(-5deg); }
                30% { transform: translateX(4px) rotate(3deg); }
                45% { transform: translateX(-3px) rotate(-3deg); }
                60% { transform: translateX(2px) rotate(2deg); }
                75% { transform: translateX(-1px) rotate(-1deg); }
            }
        `,
        animation: 'lexWobble 1s ease-in-out infinite'
    },
    zoom: {
        name: 'Zoom',
        keyframes: `
            @keyframes lexZoom {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `,
        animation: 'lexZoom 2s ease-in-out infinite'
    },
    fadeInOut: {
        name: 'Fade In/Out',
        keyframes: `
            @keyframes lexFadeInOut {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `,
        animation: 'lexFadeInOut 2s ease-in-out infinite'
    },
    typewriter: {
        name: 'Typewriter',
        keyframes: `
            @keyframes lexTypewriter {
                0%, 100% { border-right-color: transparent; }
                50% { border-right-color: currentColor; }
            }
        `,
        animation: 'lexTypewriter 1s step-end infinite',
        style: 'border-right: 2px solid; overflow: hidden; white-space: nowrap;'
    }
};

/**
 * Get all available loop animations for UI
 */
export function getLoopAnimationOptions() {
    return Object.entries(LOOP_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.name
    }));
}

/**
 * Generate CSS for all used loop animations
 */
export function generateLoopAnimationCSS(layers) {
    const usedAnimations = new Set();
    let css = '';

    layers.forEach(layer => {
        const loopAnim = layer.style?.loopAnimation;
        if (loopAnim && loopAnim !== 'none' && LOOP_PRESETS[loopAnim]) {
            usedAnimations.add(loopAnim);
        }
    });

    usedAnimations.forEach(animName => {
        const preset = LOOP_PRESETS[animName];
        if (preset?.keyframes) {
            css += preset.keyframes + '\n';
        }
    });

    return css;
}

/**
 * Apply loop animation to a layer element
 */
export function applyLoopAnimation(element, animationName) {
    const preset = LOOP_PRESETS[animationName];

    if (!preset || animationName === 'none') {
        element.style.animation = '';
        return;
    }

    element.style.animation = preset.animation;

    // Apply additional styles if any
    if (preset.style) {
        const styles = preset.style.split(';').filter(s => s.trim());
        styles.forEach(style => {
            const [prop, val] = style.split(':').map(s => s.trim());
            if (prop && val) {
                element.style[prop] = val;
            }
        });
    }
}

/**
 * Get animation style string for inline application
 */
export function getLoopAnimationStyle(animationName) {
    const preset = LOOP_PRESETS[animationName];
    if (!preset || animationName === 'none') return '';

    let style = `animation: ${preset.animation};`;
    if (preset.style) {
        style += preset.style;
    }

    return style;
}

export default {
    LOOP_PRESETS,
    getLoopAnimationOptions,
    generateLoopAnimationCSS,
    applyLoopAnimation,
    getLoopAnimationStyle
};
