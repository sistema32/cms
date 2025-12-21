/**
 * AutoHeight.js - Automatic slider height adjustment
 * Dynamically adjusts slider height based on content
 */

// Height modes
export const HEIGHT_MODES = {
    fixed: { label: 'Fixed Height', description: 'Use a specific height' },
    auto: { label: 'Auto', description: 'Adjust to content height' },
    ratio: { label: 'Aspect Ratio', description: 'Maintain specific ratio' },
    viewport: { label: 'Viewport', description: 'Percentage of viewport height' },
    minMax: { label: 'Min/Max', description: 'Between minimum and maximum' }
};

// Common aspect ratios
export const ASPECT_RATIOS = {
    '16:9': { label: '16:9 (Widescreen)', value: 16 / 9 },
    '4:3': { label: '4:3 (Standard)', value: 4 / 3 },
    '21:9': { label: '21:9 (Ultrawide)', value: 21 / 9 },
    '1:1': { label: '1:1 (Square)', value: 1 },
    '3:2': { label: '3:2 (Photo)', value: 3 / 2 },
    '2:1': { label: '2:1 (Panoramic)', value: 2 }
};

// Default configuration
const DEFAULT_CONFIG = {
    mode: 'fixed',
    height: 500,              // For fixed mode
    aspectRatio: '16:9',      // For ratio mode
    viewportHeight: 100,      // For viewport mode (vh)
    minHeight: 300,           // For minMax mode
    maxHeight: 800,           // For minMax mode
    padding: 0,               // Extra padding
    transition: true,         // Animate height changes
    transitionDuration: 300,  // ms
    recalcOnResize: true,     // Recalculate on window resize
    recalcOnSlideChange: true, // Recalculate when slide changes
    debounceMs: 100
};

/**
 * AutoHeight class
 */
export class AutoHeight {
    constructor(sliderElement, config = {}) {
        this.slider = sliderElement;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.currentHeight = 0;
        this.resizeTimeout = null;

        this.init();
    }

    init() {
        // Set initial height
        this.calculate();

        // Apply transition
        if (this.config.transition) {
            this.slider.style.transition = `height ${this.config.transitionDuration}ms ease`;
        }

        // Resize listener
        if (this.config.recalcOnResize) {
            window.addEventListener('resize', () => this.handleResize());
        }

        // Slide change listener
        if (this.config.recalcOnSlideChange) {
            this.slider.addEventListener('ss3:slidechange', () => this.calculate());
        }
    }

    handleResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.calculate(), this.config.debounceMs);
    }

    calculate() {
        let newHeight;

        switch (this.config.mode) {
            case 'fixed':
                newHeight = this.config.height;
                break;

            case 'auto':
                newHeight = this.calculateAutoHeight();
                break;

            case 'ratio':
                newHeight = this.calculateRatioHeight();
                break;

            case 'viewport':
                newHeight = this.calculateViewportHeight();
                break;

            case 'minMax':
                newHeight = this.calculateMinMaxHeight();
                break;

            default:
                newHeight = this.config.height;
        }

        // Add padding
        newHeight += this.config.padding;

        // Apply height
        this.setHeight(newHeight);
    }

    calculateAutoHeight() {
        // Get active slide
        const activeSlide = this.slider.querySelector('.slide.active, .slide:first-child');
        if (!activeSlide) return this.config.height;

        // Calculate content height
        let maxHeight = 0;
        const layers = activeSlide.querySelectorAll('.layer');

        layers.forEach(layer => {
            const rect = layer.getBoundingClientRect();
            const bottom = layer.offsetTop + rect.height;
            if (bottom > maxHeight) maxHeight = bottom;
        });

        return Math.max(maxHeight, this.config.minHeight || 200);
    }

    calculateRatioHeight() {
        const ratio = ASPECT_RATIOS[this.config.aspectRatio]?.value || (16 / 9);
        const width = this.slider.offsetWidth;
        return Math.round(width / ratio);
    }

    calculateViewportHeight() {
        return Math.round(window.innerHeight * (this.config.viewportHeight / 100));
    }

    calculateMinMaxHeight() {
        // Calculate auto height first
        let height = this.calculateAutoHeight();

        // Clamp between min and max
        if (this.config.minHeight) {
            height = Math.max(height, this.config.minHeight);
        }
        if (this.config.maxHeight) {
            height = Math.min(height, this.config.maxHeight);
        }

        return height;
    }

    setHeight(height) {
        if (height !== this.currentHeight) {
            this.currentHeight = height;
            this.slider.style.height = `${height}px`;

            // Dispatch event
            this.slider.dispatchEvent(new CustomEvent('ss3:heightchange', {
                detail: { height }
            }));
        }
    }

    refresh() {
        this.calculate();
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.slider.removeEventListener('ss3:slidechange', this.calculate);
    }
}

/**
 * Initialize AutoHeight
 */
export function initAutoHeight(sliderElement, config = {}) {
    return new AutoHeight(sliderElement, config);
}

/**
 * Generate AutoHeight settings HTML
 */
export function generateAutoHeightSettingsHTML(config = {}) {
    const c = { ...DEFAULT_CONFIG, ...config };

    return `
        <div class="auto-height-settings">
            <div class="form-group">
                <label>Height Mode</label>
                <select class="height-mode-select">
                    ${Object.entries(HEIGHT_MODES).map(([key, mode]) => `
                        <option value="${key}" ${c.mode === key ? 'selected' : ''}>
                            ${mode.label}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="height-fixed-options" style="display: ${c.mode === 'fixed' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Height (px)</label>
                    <input type="number" class="height-input" value="${c.height}" min="100">
                </div>
            </div>
            
            <div class="height-ratio-options" style="display: ${c.mode === 'ratio' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Aspect Ratio</label>
                    <select class="ratio-select">
                        ${Object.entries(ASPECT_RATIOS).map(([key, ratio]) => `
                            <option value="${key}" ${c.aspectRatio === key ? 'selected' : ''}>
                                ${ratio.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="height-viewport-options" style="display: ${c.mode === 'viewport' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Viewport Height (%)</label>
                    <input type="range" class="viewport-slider" value="${c.viewportHeight}" min="10" max="100">
                    <span class="viewport-value">${c.viewportHeight}vh</span>
                </div>
            </div>
            
            <div class="height-minmax-options" style="display: ${c.mode === 'minMax' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Height (px)</label>
                        <input type="number" class="min-height-input" value="${c.minHeight}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Max Height (px)</label>
                        <input type="number" class="max-height-input" value="${c.maxHeight}" min="0">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" class="transition-checkbox" ${c.transition ? 'checked' : ''}>
                    Animate height changes
                </label>
            </div>
        </div>
    `;
}

/**
 * Generate AutoHeight CSS
 */
export function generateAutoHeightCSS() {
    return `
        .auto-height-settings {
            padding: 15px;
        }
        
        .auto-height-settings .form-group {
            margin-bottom: 15px;
        }
        
        .auto-height-settings label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #888;
        }
        
        .auto-height-settings select,
        .auto-height-settings input[type="number"] {
            width: 100%;
            padding: 10px;
            background: #252525;
            border: 1px solid #333;
            border-radius: 6px;
            color: #ddd;
        }
        
        .auto-height-settings input[type="range"] {
            width: calc(100% - 50px);
        }
        
        .viewport-value {
            display: inline-block;
            width: 40px;
            text-align: right;
            font-size: 12px;
            color: #8470ff;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
    `;
}

/**
 * Generate runtime script
 */
export function generateAutoHeightScript() {
    return `
        (function() {
            document.querySelectorAll('[data-auto-height]').forEach(function(slider) {
                const config = JSON.parse(slider.dataset.autoHeight || '{}');
                
                function calculateHeight() {
                    let height;
                    const width = slider.offsetWidth;
                    
                    switch (config.mode) {
                        case 'auto':
                            const activeSlide = slider.querySelector('.slide.active, .slide:first-child');
                            if (activeSlide) {
                                let maxH = 0;
                                activeSlide.querySelectorAll('.layer').forEach(function(layer) {
                                    const bottom = layer.offsetTop + layer.offsetHeight;
                                    if (bottom > maxH) maxH = bottom;
                                });
                                height = Math.max(maxH, config.minHeight || 200);
                            }
                            break;
                            
                        case 'ratio':
                            const ratios = { '16:9': 16/9, '4:3': 4/3, '21:9': 21/9, '1:1': 1, '3:2': 3/2 };
                            const ratio = ratios[config.aspectRatio] || 16/9;
                            height = Math.round(width / ratio);
                            break;
                            
                        case 'viewport':
                            height = Math.round(window.innerHeight * (config.viewportHeight || 100) / 100);
                            break;
                            
                        case 'minMax':
                            height = slider.scrollHeight;
                            if (config.minHeight) height = Math.max(height, config.minHeight);
                            if (config.maxHeight) height = Math.min(height, config.maxHeight);
                            break;
                            
                        default:
                            height = config.height || 500;
                    }
                    
                    slider.style.height = height + 'px';
                }
                
                if (config.transition) {
                    slider.style.transition = 'height ' + (config.transitionDuration || 300) + 'ms ease';
                }
                
                calculateHeight();
                
                window.addEventListener('resize', function() {
                    clearTimeout(slider._resizeTimer);
                    slider._resizeTimer = setTimeout(calculateHeight, 100);
                });
                
                slider.addEventListener('ss3:slidechange', calculateHeight);
            });
        })();
    `;
}

export default {
    HEIGHT_MODES,
    ASPECT_RATIOS,
    AutoHeight,
    initAutoHeight,
    generateAutoHeightSettingsHTML,
    generateAutoHeightCSS,
    generateAutoHeightScript
};
