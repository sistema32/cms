/**
 * ClipMasks.js - Clip paths and masks for layers
 * Creates visual masking effects for images and content
 */

// Preset clip paths
export const CLIP_PRESETS = {
    none: { label: 'None', path: 'none' },
    circle: { label: 'Circle', path: 'circle(50% at 50% 50%)' },
    ellipse: { label: 'Ellipse', path: 'ellipse(50% 35% at 50% 50%)' },
    inset: { label: 'Inset', path: 'inset(10% 10% 10% 10% round 10px)' },
    triangle: { label: 'Triangle', path: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
    triangleUp: { label: 'Triangle Up', path: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
    triangleDown: { label: 'Triangle Down', path: 'polygon(0% 0%, 100% 0%, 50% 100%)' },
    triangleLeft: { label: 'Triangle Left', path: 'polygon(100% 0%, 0% 50%, 100% 100%)' },
    triangleRight: { label: 'Triangle Right', path: 'polygon(0% 0%, 100% 50%, 0% 100%)' },
    rhombus: { label: 'Rhombus', path: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    pentagon: { label: 'Pentagon', path: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
    hexagon: { label: 'Hexagon', path: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
    heptagon: { label: 'Heptagon', path: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)' },
    octagon: { label: 'Octagon', path: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },
    star: { label: 'Star', path: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
    cross: { label: 'Cross', path: 'polygon(10% 25%, 35% 25%, 35% 0%, 65% 0%, 65% 25%, 90% 25%, 90% 50%, 65% 50%, 65% 100%, 35% 100%, 35% 50%, 10% 50%)' },
    arrow: { label: 'Arrow', path: 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)' },
    chevron: { label: 'Chevron', path: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)' },
    frame: { label: 'Frame', path: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 10% 10%, 10% 90%, 90% 90%, 90% 10%, 10% 10%)' },
    parallelogram: { label: 'Parallelogram', path: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)' },
    trapezoid: { label: 'Trapezoid', path: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' },
    bevel: { label: 'Bevel', path: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' },
    rabbet: { label: 'Rabbet', path: 'polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%)' },
    message: { label: 'Message', path: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)' },
    blob1: { label: 'Blob 1', path: 'polygon(30% 0%, 70% 10%, 100% 35%, 95% 70%, 70% 100%, 25% 90%, 0% 60%, 5% 25%)' },
    blob2: { label: 'Blob 2', path: 'polygon(20% 5%, 80% 0%, 95% 25%, 90% 70%, 75% 95%, 35% 100%, 5% 75%, 10% 30%)' }
};

/**
 * Get clip path options for UI
 */
export function getClipPathOptions() {
    return Object.entries(CLIP_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.label
    }));
}

/**
 * Get CSS clip-path value
 */
export function getClipPath(presetName) {
    const preset = CLIP_PRESETS[presetName];
    return preset ? preset.path : 'none';
}

/**
 * Apply clip path to element style
 */
export function applyClipPath(style, presetName) {
    const clipPath = getClipPath(presetName);
    if (clipPath && clipPath !== 'none') {
        style.clipPath = clipPath;
        style.WebkitClipPath = clipPath;
    }
    return style;
}

/**
 * Generate clip path gallery HTML for editor
 */
export function generateClipPathGalleryHTML() {
    return Object.entries(CLIP_PRESETS).map(([key, preset]) => `
        <button class="clip-preset-btn" data-clip="${key}" title="${preset.label}">
            <div class="clip-preview" style="clip-path: ${preset.path}; -webkit-clip-path: ${preset.path};"></div>
        </button>
    `).join('');
}

/**
 * Generate clip path gallery CSS
 */
export function generateClipPathGalleryCSS() {
    return `
        .clip-preset-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            padding: 10px;
        }
        
        .clip-preset-btn {
            aspect-ratio: 1;
            border: 1px solid #333;
            border-radius: 6px;
            background: #1a1a1a;
            cursor: pointer;
            padding: 8px;
            transition: all 0.2s;
        }
        
        .clip-preset-btn:hover {
            border-color: #8470ff;
            background: #222;
        }
        
        .clip-preset-btn.active {
            border-color: #8470ff;
            background: rgba(132, 112, 255, 0.2);
        }
        
        .clip-preview {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #8470ff, #ff6b6b);
        }
    `;
}

// ==================== IMAGE MASKS ====================

export const MASK_PRESETS = {
    none: { label: 'None', gradient: null },
    fadeBottom: {
        label: 'Fade Bottom',
        gradient: 'linear-gradient(to bottom, black 60%, transparent 100%)'
    },
    fadeTop: {
        label: 'Fade Top',
        gradient: 'linear-gradient(to top, black 60%, transparent 100%)'
    },
    fadeLeft: {
        label: 'Fade Left',
        gradient: 'linear-gradient(to left, black 60%, transparent 100%)'
    },
    fadeRight: {
        label: 'Fade Right',
        gradient: 'linear-gradient(to right, black 60%, transparent 100%)'
    },
    fadeEdges: {
        label: 'Fade Edges',
        gradient: 'radial-gradient(ellipse at center, black 50%, transparent 100%)'
    },
    vignette: {
        label: 'Vignette',
        gradient: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
    },
    spotlight: {
        label: 'Spotlight',
        gradient: 'radial-gradient(circle at center, black 20%, transparent 60%)'
    },
    diagonal: {
        label: 'Diagonal',
        gradient: 'linear-gradient(135deg, black 40%, transparent 100%)'
    },
    split: {
        label: 'Split',
        gradient: 'linear-gradient(to right, black 45%, transparent 50%, black 55%)'
    }
};

/**
 * Apply mask to element style
 */
export function applyMask(style, presetName) {
    const preset = MASK_PRESETS[presetName];
    if (preset && preset.gradient) {
        style.maskImage = preset.gradient;
        style.WebkitMaskImage = preset.gradient;
    }
    return style;
}

/**
 * Get mask options for UI
 */
export function getMaskOptions() {
    return Object.entries(MASK_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.label
    }));
}

export default {
    CLIP_PRESETS,
    getClipPathOptions,
    getClipPath,
    applyClipPath,
    generateClipPathGalleryHTML,
    generateClipPathGalleryCSS,
    MASK_PRESETS,
    applyMask,
    getMaskOptions
};
