/**
 * FontManager.js - Custom fonts integration
 * Handles Google Fonts and custom font loading
 */

// Popular Google Fonts
export const POPULAR_FONTS = [
    { family: 'Inter', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700] },
    { family: 'Open Sans', category: 'sans-serif', weights: [300, 400, 600, 700] },
    { family: 'Lato', category: 'sans-serif', weights: [300, 400, 700] },
    { family: 'Montserrat', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Poppins', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Outfit', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Raleway', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Nunito', category: 'sans-serif', weights: [300, 400, 600, 700] },
    { family: 'Work Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
    { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700] },
    { family: 'Merriweather', category: 'serif', weights: [300, 400, 700] },
    { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
    { family: 'PT Serif', category: 'serif', weights: [400, 700] },
    { family: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
    { family: 'Source Code Pro', category: 'monospace', weights: [400, 500, 600, 700] },
    { family: 'Fira Code', category: 'monospace', weights: [400, 500, 600, 700] },
    { family: 'JetBrains Mono', category: 'monospace', weights: [400, 500, 600, 700] },
    { family: 'Dancing Script', category: 'cursive', weights: [400, 500, 600, 700] },
    { family: 'Pacifico', category: 'cursive', weights: [400] },
    { family: 'Lobster', category: 'cursive', weights: [400] },
    { family: 'Satisfy', category: 'cursive', weights: [400] },
    { family: 'Bebas Neue', category: 'display', weights: [400] },
    { family: 'Oswald', category: 'display', weights: [300, 400, 500, 600, 700] },
    { family: 'Anton', category: 'display', weights: [400] }
];

// Font categories
export const FONT_CATEGORIES = [
    { id: 'sans-serif', label: 'Sans Serif' },
    { id: 'serif', label: 'Serif' },
    { id: 'monospace', label: 'Monospace' },
    { id: 'cursive', label: 'Handwriting' },
    { id: 'display', label: 'Display' }
];

// Loaded fonts cache
const loadedFonts = new Set();

/**
 * Generate Google Fonts URL
 */
export function getGoogleFontsUrl(fonts) {
    if (!fonts || fonts.length === 0) return '';

    const families = fonts.map(font => {
        const fontData = POPULAR_FONTS.find(f => f.family === font.family) || font;
        const weights = (fontData.weights || [400]).join(';');
        return `family=${encodeURIComponent(font.family)}:wght@${weights}`;
    });

    return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Load fonts dynamically
 */
export async function loadFonts(fontFamilies) {
    const fontsToLoad = fontFamilies.filter(f => !loadedFonts.has(f));

    if (fontsToLoad.length === 0) return;

    const fonts = fontsToLoad.map(family => {
        const fontData = POPULAR_FONTS.find(f => f.family === family);
        return fontData || { family, weights: [400] };
    });

    const url = getGoogleFontsUrl(fonts);

    // Check if already loaded
    if (document.querySelector(`link[href="${url}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    return new Promise((resolve, reject) => {
        link.onload = () => {
            fontsToLoad.forEach(f => loadedFonts.add(f));
            resolve();
        };
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

/**
 * Get fonts by category
 */
export function getFontsByCategory(categoryId) {
    if (categoryId === 'all') return POPULAR_FONTS;
    return POPULAR_FONTS.filter(f => f.category === categoryId);
}

/**
 * Generate font select options
 */
export function getFontOptions() {
    return POPULAR_FONTS.map(font => ({
        value: font.family,
        label: font.family,
        category: font.category
    }));
}

/**
 * Generate font preview style
 */
export function getFontPreviewStyle(fontFamily) {
    return {
        fontFamily: `"${fontFamily}", ${getCategoryFallback(fontFamily)}`
    };
}

function getCategoryFallback(fontFamily) {
    const font = POPULAR_FONTS.find(f => f.family === fontFamily);
    return font ? font.category : 'sans-serif';
}

/**
 * Generate font picker HTML
 */
export function generateFontPickerHTML(currentFont = 'Inter') {
    const categoriesHTML = FONT_CATEGORIES.map(cat => `
        <button class="font-category-btn" data-category="${cat.id}">${cat.label}</button>
    `).join('');

    const fontsHTML = POPULAR_FONTS.map(font => `
        <button class="font-option ${font.family === currentFont ? 'active' : ''}" 
                data-font="${font.family}" 
                data-category="${font.category}"
                style="font-family: '${font.family}', ${font.category};">
            ${font.family}
        </button>
    `).join('');

    return `
        <div class="font-picker">
            <div class="font-search">
                <span class="material-icons-round">search</span>
                <input type="text" placeholder="Search fonts..." class="font-search-input">
            </div>
            <div class="font-categories">${categoriesHTML}</div>
            <div class="font-list">${fontsHTML}</div>
        </div>
    `;
}

/**
 * Generate font picker CSS
 */
export function generateFontPickerCSS() {
    return `
        .font-picker {
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .font-search {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-bottom: 1px solid #333;
        }
        
        .font-search .material-icons-round {
            font-size: 18px;
            color: #666;
        }
        
        .font-search-input {
            flex: 1;
            background: none;
            border: none;
            color: #fff;
            font-size: 13px;
            outline: none;
        }
        
        .font-categories {
            display: flex;
            gap: 4px;
            padding: 10px;
            border-bottom: 1px solid #333;
            overflow-x: auto;
        }
        
        .font-category-btn {
            padding: 4px 10px;
            border: 1px solid #333;
            border-radius: 12px;
            background: transparent;
            color: #888;
            font-size: 11px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        
        .font-category-btn:hover,
        .font-category-btn.active {
            background: #8470ff;
            border-color: #8470ff;
            color: white;
        }
        
        .font-list {
            max-height: 250px;
            overflow-y: auto;
            padding: 8px;
        }
        
        .font-option {
            display: block;
            width: 100%;
            padding: 10px 12px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #ddd;
            font-size: 15px;
            text-align: left;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .font-option:hover {
            background: #222;
        }
        
        .font-option.active {
            background: rgba(132, 112, 255, 0.2);
            color: #8470ff;
        }
    `;
}

/**
 * Extract fonts used in slider
 */
export function extractUsedFonts(slider) {
    const fonts = new Set();

    // Check slider settings
    if (slider.settings?.fontFamily) {
        fonts.add(slider.settings.fontFamily);
    }

    // Check all slides and layers
    slider.slides?.forEach(slide => {
        slide.layers?.forEach(layer => {
            if (layer.style?.fontFamily) {
                fonts.add(layer.style.fontFamily.replace(/["']/g, ''));
            }
        });
    });

    return Array.from(fonts);
}

/**
 * Generate font preload for slider
 */
export function generateFontPreloadHTML(slider) {
    const fonts = extractUsedFonts(slider);
    if (fonts.length === 0) return '';

    const fontData = fonts
        .map(family => POPULAR_FONTS.find(f => f.family === family))
        .filter(Boolean);

    const url = getGoogleFontsUrl(fontData);

    return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${url}" rel="stylesheet">`;
}

export default {
    POPULAR_FONTS,
    FONT_CATEGORIES,
    getGoogleFontsUrl,
    loadFonts,
    getFontsByCategory,
    getFontOptions,
    getFontPreviewStyle,
    generateFontPickerHTML,
    generateFontPickerCSS,
    extractUsedFonts,
    generateFontPreloadHTML
};
