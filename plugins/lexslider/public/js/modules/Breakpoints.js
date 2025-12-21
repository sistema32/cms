/**
 * Breakpoints.js - Responsive breakpoint editor
 * Control slider behavior and layer styles per device
 */

// Default breakpoints matching common devices
export const DEFAULT_BREAKPOINTS = [
    { id: 'desktop', label: 'Desktop', icon: 'computer', minWidth: 1200, maxWidth: null },
    { id: 'laptop', label: 'Laptop', icon: 'laptop', minWidth: 992, maxWidth: 1199 },
    { id: 'tablet', label: 'Tablet', icon: 'tablet_mac', minWidth: 768, maxWidth: 991 },
    { id: 'mobile', label: 'Mobile', icon: 'smartphone', minWidth: 0, maxWidth: 767 }
];

// Layer properties that can be overridden per breakpoint
export const RESPONSIVE_PROPERTIES = [
    // Position
    { key: 'left', label: 'Left', type: 'dimension' },
    { key: 'top', label: 'Top', type: 'dimension' },
    { key: 'right', label: 'Right', type: 'dimension' },
    { key: 'bottom', label: 'Bottom', type: 'dimension' },

    // Size
    { key: 'width', label: 'Width', type: 'dimension' },
    { key: 'height', label: 'Height', type: 'dimension' },
    { key: 'maxWidth', label: 'Max Width', type: 'dimension' },

    // Typography
    { key: 'fontSize', label: 'Font Size', type: 'dimension' },
    { key: 'lineHeight', label: 'Line Height', type: 'number' },
    { key: 'letterSpacing', label: 'Letter Spacing', type: 'dimension' },

    // Spacing
    { key: 'padding', label: 'Padding', type: 'dimension' },
    { key: 'margin', label: 'Margin', type: 'dimension' },

    // Visibility
    { key: 'display', label: 'Display', type: 'select', options: ['block', 'none', 'flex', 'inline-block'] },
    { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden'] },
    { key: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.1 },

    // Alignment
    { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'] },

    // Transform
    { key: 'scale', label: 'Scale', type: 'number' }
];

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(breakpoints = DEFAULT_BREAKPOINTS) {
    const width = window.innerWidth;

    return breakpoints.find(bp => {
        const minMatch = bp.minWidth === null || width >= bp.minWidth;
        const maxMatch = bp.maxWidth === null || width <= bp.maxWidth;
        return minMatch && maxMatch;
    }) || breakpoints[0];
}

/**
 * Get responsive value for a property
 */
export function getResponsiveValue(layer, property, breakpointId) {
    // Check for breakpoint-specific value
    if (layer.responsive && layer.responsive[breakpointId] && layer.responsive[breakpointId][property] !== undefined) {
        return layer.responsive[breakpointId][property];
    }

    // Fall back to default value
    return layer.style?.[property];
}

/**
 * Set responsive value for a property
 */
export function setResponsiveValue(layer, property, value, breakpointId) {
    if (!layer.responsive) {
        layer.responsive = {};
    }

    if (!layer.responsive[breakpointId]) {
        layer.responsive[breakpointId] = {};
    }

    layer.responsive[breakpointId][property] = value;
    return layer;
}

/**
 * Generate responsive CSS for slider
 */
export function generateResponsiveCSS(slider, breakpoints = DEFAULT_BREAKPOINTS) {
    let css = '';

    breakpoints.forEach(bp => {
        let mediaQuery = '';

        if (bp.minWidth !== null && bp.maxWidth !== null) {
            mediaQuery = `@media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px)`;
        } else if (bp.minWidth !== null) {
            mediaQuery = `@media (min-width: ${bp.minWidth}px)`;
        } else if (bp.maxWidth !== null) {
            mediaQuery = `@media (max-width: ${bp.maxWidth}px)`;
        }

        if (!mediaQuery) return;

        let breakpointCSS = '';

        // Slider-level responsive settings
        if (slider.responsive?.[bp.id]) {
            const settings = slider.responsive[bp.id];
            breakpointCSS += `
                [data-lexslider="${slider.id}"] {
                    ${settings.width ? `width: ${settings.width};` : ''}
                    ${settings.height ? `height: ${settings.height};` : ''}
                }
            `;
        }

        // Layer-level responsive settings
        slider.slides?.forEach((slide, slideIndex) => {
            slide.layers?.forEach((layer, layerIndex) => {
                if (layer.responsive?.[bp.id]) {
                    const layerSettings = layer.responsive[bp.id];
                    const selector = `[data-lexslider="${slider.id}"] .ss3-slide:nth-child(${slideIndex + 1}) .ss3-layer:nth-child(${layerIndex + 1})`;

                    let layerCSS = '';

                    Object.entries(layerSettings).forEach(([prop, value]) => {
                        if (value !== undefined && value !== null && value !== '') {
                            // Convert camelCase to kebab-case
                            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                            layerCSS += `${cssProp}: ${value};`;
                        }
                    });

                    if (layerCSS) {
                        breakpointCSS += `${selector} { ${layerCSS} }`;
                    }
                }
            });
        });

        if (breakpointCSS) {
            css += `${mediaQuery} { ${breakpointCSS} }`;
        }
    });

    return css;
}

/**
 * Generate breakpoint editor HTML
 */
export function generateBreakpointEditorHTML(currentBreakpoint = 'desktop') {
    const breakpointsHTML = DEFAULT_BREAKPOINTS.map(bp => `
        <button class="breakpoint-btn ${bp.id === currentBreakpoint ? 'active' : ''}" 
                data-breakpoint="${bp.id}" 
                title="${bp.label} (${bp.minWidth || 0}px - ${bp.maxWidth || '∞'}px)">
            <span class="material-icons-round">${bp.icon}</span>
        </button>
    `).join('');

    return `
        <div class="breakpoint-editor">
            <div class="breakpoint-selector">
                ${breakpointsHTML}
            </div>
            <div class="breakpoint-preview">
                <span class="breakpoint-label">${currentBreakpoint}</span>
                <span class="breakpoint-range"></span>
            </div>
        </div>
    `;
}

/**
 * Generate breakpoint CSS for editor
 */
export function generateBreakpointEditorCSS() {
    return `
        .breakpoint-editor {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px 15px;
            background: #1a1a1a;
            border-radius: 8px;
        }
        
        .breakpoint-selector {
            display: flex;
            gap: 4px;
        }
        
        .breakpoint-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #222;
            border: 1px solid #333;
            border-radius: 6px;
            color: #666;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .breakpoint-btn:hover {
            border-color: #8470ff;
            color: #8470ff;
        }
        
        .breakpoint-btn.active {
            background: #8470ff;
            border-color: #8470ff;
            color: white;
        }
        
        .breakpoint-btn .material-icons-round {
            font-size: 18px;
        }
        
        .breakpoint-preview {
            display: flex;
            flex-direction: column;
            font-size: 12px;
        }
        
        .breakpoint-label {
            font-weight: 600;
            color: #ddd;
            text-transform: capitalize;
        }
        
        .breakpoint-range {
            color: #666;
        }
        
        /* Responsive property indicator */
        .property-row.has-responsive::after {
            content: '';
            width: 6px;
            height: 6px;
            background: #8470ff;
            border-radius: 50%;
            position: absolute;
            top: 5px;
            right: 5px;
        }
        
        /* Canvas preview sizes */
        .canvas-preview-desktop { width: 100%; }
        .canvas-preview-laptop { width: 1024px; max-width: 100%; }
        .canvas-preview-tablet { width: 768px; max-width: 100%; }
        .canvas-preview-mobile { width: 375px; max-width: 100%; }
    `;
}

/**
 * Initialize breakpoint listener
 */
export function initBreakpointListener(callback) {
    let currentBreakpoint = getCurrentBreakpoint();

    const handleResize = () => {
        const newBreakpoint = getCurrentBreakpoint();
        if (newBreakpoint.id !== currentBreakpoint.id) {
            currentBreakpoint = newBreakpoint;
            callback(currentBreakpoint);
        }
    };

    window.addEventListener('resize', handleResize);

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
    };
}

/**
 * Generate responsive script for frontend
 */
export function generateResponsiveScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const breakpoints = ${JSON.stringify(DEFAULT_BREAKPOINTS)};
            
            function getCurrentBreakpoint() {
                const width = window.innerWidth;
                return breakpoints.find(function(bp) {
                    const minMatch = bp.minWidth === null || width >= bp.minWidth;
                    const maxMatch = bp.maxWidth === null || width <= bp.maxWidth;
                    return minMatch && maxMatch;
                }) || breakpoints[0];
            }
            
            let current = getCurrentBreakpoint();
            container.dataset.breakpoint = current.id;
            
            window.addEventListener('resize', function() {
                const bp = getCurrentBreakpoint();
                if (bp.id !== current.id) {
                    current = bp;
                    container.dataset.breakpoint = bp.id;
                    container.dispatchEvent(new CustomEvent('ss3:breakpointChange', { 
                        detail: { breakpoint: bp } 
                    }));
                }
            });
        })();
    `;
}

export default {
    DEFAULT_BREAKPOINTS,
    RESPONSIVE_PROPERTIES,
    getCurrentBreakpoint,
    getResponsiveValue,
    setResponsiveValue,
    generateResponsiveCSS,
    generateBreakpointEditorHTML,
    generateBreakpointEditorCSS,
    initBreakpointListener,
    generateResponsiveScript
};
