/**
 * TextEffects.js - Advanced text effects
 * Includes: gradient text, masked text, split text animations
 */

// ==================== GRADIENT TEXT ====================

export const GRADIENT_PRESETS = {
    none: { label: 'None', gradient: null },
    rainbow: {
        label: 'Rainbow',
        gradient: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)'
    },
    sunset: {
        label: 'Sunset',
        gradient: 'linear-gradient(90deg, #ff512f, #f09819)'
    },
    ocean: {
        label: 'Ocean',
        gradient: 'linear-gradient(90deg, #2193b0, #6dd5ed)'
    },
    purple: {
        label: 'Purple Dream',
        gradient: 'linear-gradient(90deg, #8e2de2, #4a00e0)'
    },
    fire: {
        label: 'Fire',
        gradient: 'linear-gradient(90deg, #f12711, #f5af19)'
    },
    neon: {
        label: 'Neon',
        gradient: 'linear-gradient(90deg, #00f5d4, #00bbf9, #9b5de5, #f15bb5)'
    },
    gold: {
        label: 'Gold',
        gradient: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)'
    },
    silver: {
        label: 'Silver',
        gradient: 'linear-gradient(90deg, #bdc3c7, #2c3e50, #bdc3c7)'
    }
};

/**
 * Generate gradient text CSS
 */
export function getGradientTextStyle(gradientName) {
    const preset = GRADIENT_PRESETS[gradientName];
    if (!preset || !preset.gradient) return {};

    return {
        background: preset.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    };
}

export function generateGradientTextCSS() {
    let css = '';

    Object.entries(GRADIENT_PRESETS).forEach(([key, preset]) => {
        if (preset.gradient) {
            css += `
                .text-gradient-${key} {
                    background: ${preset.gradient};
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `;
        }
    });

    return css;
}

// ==================== SPLIT TEXT ANIMATION ====================

export const SPLIT_MODES = [
    { value: 'none', label: 'None' },
    { value: 'chars', label: 'By Character' },
    { value: 'words', label: 'By Word' },
    { value: 'lines', label: 'By Line' }
];

export const SPLIT_ANIMATIONS = [
    { value: 'fadeUp', label: 'Fade Up' },
    { value: 'fadeDown', label: 'Fade Down' },
    { value: 'fadeLeft', label: 'Fade Left' },
    { value: 'fadeRight', label: 'Fade Right' },
    { value: 'scale', label: 'Scale' },
    { value: 'rotate', label: 'Rotate' },
    { value: 'blur', label: 'Blur' },
    { value: 'wave', label: 'Wave' },
    { value: 'typewriter', label: 'Typewriter' }
];

/**
 * Split text into animated spans
 */
export function splitText(text, mode = 'chars') {
    if (mode === 'chars') {
        return text.split('').map((char, i) =>
            char === ' '
                ? `<span class="split-char split-space" style="--char-index: ${i};">&nbsp;</span>`
                : `<span class="split-char" style="--char-index: ${i};">${char}</span>`
        ).join('');
    }

    if (mode === 'words') {
        return text.split(' ').map((word, i) =>
            `<span class="split-word" style="--word-index: ${i};">${word}</span>`
        ).join(' ');
    }

    if (mode === 'lines') {
        return text.split('\n').map((line, i) =>
            `<span class="split-line" style="--line-index: ${i};">${line}</span>`
        ).join('<br>');
    }

    return text;
}

/**
 * Generate split text animation CSS
 */
export function generateSplitTextCSS() {
    return `
        .split-char,
        .split-word,
        .split-line {
            display: inline-block;
            opacity: 0;
            animation-fill-mode: forwards;
        }
        
        /* Fade Up */
        .split-anim-fadeUp .split-char,
        .split-anim-fadeUp .split-word,
        .split-anim-fadeUp .split-line {
            animation: splitFadeUp 0.5s ease-out forwards;
            animation-delay: calc(var(--char-index, var(--word-index, var(--line-index, 0))) * 0.05s);
        }
        
        @keyframes splitFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Fade Down */
        .split-anim-fadeDown .split-char,
        .split-anim-fadeDown .split-word {
            animation: splitFadeDown 0.5s ease-out forwards;
            animation-delay: calc(var(--char-index, var(--word-index, 0)) * 0.05s);
        }
        
        @keyframes splitFadeDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Scale */
        .split-anim-scale .split-char,
        .split-anim-scale .split-word {
            animation: splitScale 0.5s ease-out forwards;
            animation-delay: calc(var(--char-index, var(--word-index, 0)) * 0.03s);
        }
        
        @keyframes splitScale {
            from { opacity: 0; transform: scale(0); }
            to { opacity: 1; transform: scale(1); }
        }
        
        /* Rotate */
        .split-anim-rotate .split-char {
            animation: splitRotate 0.5s ease-out forwards;
            animation-delay: calc(var(--char-index) * 0.03s);
            transform-origin: center bottom;
        }
        
        @keyframes splitRotate {
            from { opacity: 0; transform: rotateX(90deg); }
            to { opacity: 1; transform: rotateX(0); }
        }
        
        /* Blur */
        .split-anim-blur .split-char,
        .split-anim-blur .split-word {
            animation: splitBlur 0.5s ease-out forwards;
            animation-delay: calc(var(--char-index, var(--word-index, 0)) * 0.03s);
        }
        
        @keyframes splitBlur {
            from { opacity: 0; filter: blur(10px); }
            to { opacity: 1; filter: blur(0); }
        }
        
        /* Wave */
        .split-anim-wave .split-char {
            animation: splitWave 0.8s ease-out forwards;
            animation-delay: calc(var(--char-index) * 0.05s);
        }
        
        @keyframes splitWave {
            0% { opacity: 0; transform: translateY(20px); }
            50% { opacity: 1; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Typewriter */
        .split-anim-typewriter .split-char {
            animation: splitTypewriter 0.1s steps(1) forwards;
            animation-delay: calc(var(--char-index) * 0.08s);
        }
        
        @keyframes splitTypewriter {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
}

// ==================== IMAGE FILTERS ====================

export const IMAGE_FILTERS = [
    { value: 'none', label: 'None', css: '' },
    { value: 'grayscale', label: 'Grayscale', css: 'grayscale(100%)' },
    { value: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
    { value: 'blur', label: 'Blur', css: 'blur(3px)' },
    { value: 'brightness', label: 'Bright', css: 'brightness(1.3)' },
    { value: 'contrast', label: 'Contrast', css: 'contrast(1.4)' },
    { value: 'saturate', label: 'Saturate', css: 'saturate(2)' },
    { value: 'hueRotate', label: 'Hue Rotate', css: 'hue-rotate(90deg)' },
    { value: 'invert', label: 'Invert', css: 'invert(100%)' },
    { value: 'vintage', label: 'Vintage', css: 'sepia(50%) contrast(1.1) brightness(1.1)' },
    { value: 'dramatic', label: 'Dramatic', css: 'contrast(1.5) saturate(1.5)' },
    { value: 'cool', label: 'Cool', css: 'hue-rotate(180deg) saturate(0.8)' },
    { value: 'warm', label: 'Warm', css: 'sepia(30%) saturate(1.3)' }
];

export function getFilterCSS(filterName) {
    const filter = IMAGE_FILTERS.find(f => f.value === filterName);
    return filter ? filter.css : '';
}

// ==================== SHAPE LAYERS ====================

export const SHAPE_TYPES = [
    { value: 'circle', label: 'Circle' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'star', label: 'Star' },
    { value: 'line', label: 'Line' },
    { value: 'arrow', label: 'Arrow' },
    { value: 'blob', label: 'Blob' }
];

/**
 * Generate SVG for shape
 */
export function generateShapeSVG(type, options = {}) {
    const {
        width = 100,
        height = 100,
        fill = '#8470ff',
        stroke = 'none',
        strokeWidth = 2,
        opacity = 1,
        sides = 6, // for polygon
        points = 5  // for star
    } = options;

    let path = '';

    switch (type) {
        case 'circle':
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        case 'rectangle':
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <rect x="5" y="5" width="90" height="90" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        case 'triangle':
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <polygon points="50,5 95,95 5,95" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        case 'star':
            const starPoints = [];
            for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points - Math.PI / 2;
                const radius = i % 2 === 0 ? 45 : 20;
                starPoints.push(`${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`);
            }
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <polygon points="${starPoints.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        case 'polygon':
            const polyPoints = [];
            for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                polyPoints.push(`${50 + 45 * Math.cos(angle)},${50 + 45 * Math.sin(angle)}`);
            }
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <polygon points="${polyPoints.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        case 'line':
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <line x1="10" y1="50" x2="90" y2="50" stroke="${fill}" stroke-width="${strokeWidth * 2}" stroke-linecap="round" opacity="${opacity}"/>
            </svg>`;

        case 'blob':
            return `<svg width="${width}" height="${height}" viewBox="0 0 100 100">
                <path d="M50,5 C80,10 95,35 90,55 C85,75 70,95 50,95 C30,95 15,75 10,55 C5,35 20,10 50,5 Z" 
                      fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            </svg>`;

        default:
            return '';
    }
}

export default {
    GRADIENT_PRESETS,
    getGradientTextStyle,
    generateGradientTextCSS,
    SPLIT_MODES,
    SPLIT_ANIMATIONS,
    splitText,
    generateSplitTextCSS,
    IMAGE_FILTERS,
    getFilterCSS,
    SHAPE_TYPES,
    generateShapeSVG
};
