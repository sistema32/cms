/**
 * ImageHotspots.js - Interactive hotspots on images
 * Clickable points with tooltips and actions
 */

// Hotspot styles
export const HOTSPOT_STYLES = {
    pulse: { label: 'Pulse', animation: 'pulse' },
    bounce: { label: 'Bounce', animation: 'bounce' },
    glow: { label: 'Glow', animation: 'glow' },
    wave: { label: 'Wave', animation: 'wave' },
    static: { label: 'Static', animation: 'none' }
};

// Hotspot icons
export const HOTSPOT_ICONS = {
    plus: '+',
    info: 'i',
    question: '?',
    arrow: '→',
    cart: '🛒',
    heart: '❤',
    star: '★',
    pin: '📍',
    custom: ''
};

// Tooltip positions
export const TOOLTIP_POSITIONS = {
    top: { label: 'Top' },
    bottom: { label: 'Bottom' },
    left: { label: 'Left' },
    right: { label: 'Right' },
    auto: { label: 'Auto' }
};

/**
 * Create hotspot configuration
 */
export function createHotspot(config = {}) {
    return {
        id: config.id || `hotspot_${Date.now()}`,
        x: config.x || 50,                  // Percentage position
        y: config.y || 50,
        icon: config.icon || 'plus',
        customIcon: config.customIcon || '',
        style: config.style || 'pulse',
        color: config.color || '#8470ff',
        size: config.size || 'medium',      // small, medium, large
        tooltip: {
            title: config.tooltipTitle || '',
            content: config.tooltipContent || '',
            image: config.tooltipImage || '',
            position: config.tooltipPosition || 'auto',
            width: config.tooltipWidth || 250
        },
        action: {
            type: config.actionType || 'tooltip',  // tooltip, link, slide, custom
            url: config.actionUrl || '',
            target: config.actionTarget || '_self',
            slideIndex: config.slideIndex || 0,
            customJs: config.customJs || ''
        }
    };
}

/**
 * Create hotspot layer
 */
export function createHotspotLayer(imageUrl, hotspots = []) {
    return {
        type: 'hotspot-image',
        id: `hotspot_layer_${Date.now()}`,
        image: imageUrl,
        hotspots: hotspots.map(h => createHotspot(h))
    };
}

/**
 * Generate hotspots HTML
 */
export function generateHotspotsHTML(imageUrl, hotspots = []) {
    const hotspotsHTML = hotspots.map(h => {
        const icon = h.customIcon || HOTSPOT_ICONS[h.icon] || '+';
        const tooltip = h.tooltip;

        return `
            <div class="hotspot hotspot-${h.style} hotspot-${h.size}" 
                 style="left: ${h.x}%; top: ${h.y}%; --hotspot-color: ${h.color};"
                 data-hotspot-id="${h.id}"
                 data-action-type="${h.action.type}"
                 data-action-url="${h.action.url || ''}"
                 data-tooltip-position="${tooltip.position}">
                <div class="hotspot-marker">
                    <span class="hotspot-icon">${icon}</span>
                    <div class="hotspot-ring"></div>
                </div>
                ${tooltip.title || tooltip.content ? `
                    <div class="hotspot-tooltip" style="width: ${tooltip.width}px;">
                        ${tooltip.image ? `<img src="${tooltip.image}" class="tooltip-image" alt="">` : ''}
                        ${tooltip.title ? `<div class="tooltip-title">${tooltip.title}</div>` : ''}
                        ${tooltip.content ? `<div class="tooltip-content">${tooltip.content}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="ss3-hotspot-container">
            <img src="${imageUrl}" class="hotspot-image" alt="">
            <div class="hotspots-layer">
                ${hotspotsHTML}
            </div>
        </div>
    `;
}

/**
 * Generate hotspots CSS
 */
export function generateHotspotsCSS() {
    return `
        .ss3-hotspot-container {
            position: relative;
            display: inline-block;
        }
        
        .hotspot-image {
            display: block;
            width: 100%;
            height: auto;
        }
        
        .hotspots-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .hotspot {
            position: absolute;
            transform: translate(-50%, -50%);
            pointer-events: auto;
            z-index: 10;
        }
        
        .hotspot-marker {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--hotspot-color, #8470ff);
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        /* Sizes */
        .hotspot-small .hotspot-marker { width: 24px; height: 24px; font-size: 12px; }
        .hotspot-medium .hotspot-marker { width: 36px; height: 36px; font-size: 16px; }
        .hotspot-large .hotspot-marker { width: 48px; height: 48px; font-size: 20px; }
        
        .hotspot-icon {
            color: white;
            font-weight: bold;
            z-index: 2;
        }
        
        .hotspot-ring {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            border: 2px solid var(--hotspot-color, #8470ff);
            opacity: 0.5;
        }
        
        .hotspot:hover .hotspot-marker {
            transform: scale(1.2);
        }
        
        /* Animations */
        .hotspot-pulse .hotspot-ring {
            animation: hotspotPulse 2s ease-out infinite;
        }
        
        @keyframes hotspotPulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
        }
        
        .hotspot-bounce .hotspot-marker {
            animation: hotspotBounce 2s ease infinite;
        }
        
        @keyframes hotspotBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .hotspot-glow .hotspot-marker {
            animation: hotspotGlow 2s ease-in-out infinite;
        }
        
        @keyframes hotspotGlow {
            0%, 100% { box-shadow: 0 0 10px var(--hotspot-color); }
            50% { box-shadow: 0 0 25px var(--hotspot-color), 0 0 50px var(--hotspot-color); }
        }
        
        .hotspot-wave .hotspot-ring {
            animation: hotspotWave 1.5s ease-out infinite;
        }
        
        @keyframes hotspotWave {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
        }
        
        /* Tooltip */
        .hotspot-tooltip {
            position: absolute;
            background: #1a1a1a;
            border-radius: 10px;
            padding: 15px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            z-index: 100;
            pointer-events: none;
        }
        
        .hotspot:hover .hotspot-tooltip {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
        
        /* Tooltip positions */
        .hotspot[data-tooltip-position="top"] .hotspot-tooltip,
        .hotspot[data-tooltip-position="auto"] .hotspot-tooltip {
            bottom: calc(100% + 15px);
            left: 50%;
            transform: translateX(-50%);
        }
        
        .hotspot[data-tooltip-position="bottom"] .hotspot-tooltip {
            top: calc(100% + 15px);
            left: 50%;
            transform: translateX(-50%);
        }
        
        .hotspot[data-tooltip-position="left"] .hotspot-tooltip {
            right: calc(100% + 15px);
            top: 50%;
            transform: translateY(-50%);
        }
        
        .hotspot[data-tooltip-position="right"] .hotspot-tooltip {
            left: calc(100% + 15px);
            top: 50%;
            transform: translateY(-50%);
        }
        
        .tooltip-image {
            width: 100%;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        
        .tooltip-title {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 5px;
        }
        
        .tooltip-content {
            font-size: 13px;
            color: #aaa;
            line-height: 1.5;
        }
    `;
}

/**
 * Generate hotspots script
 */
export function generateHotspotsScript() {
    return `
        (function() {
            document.querySelectorAll('.ss3-hotspot-container').forEach(function(container) {
                container.querySelectorAll('.hotspot').forEach(function(hotspot) {
                    const actionType = hotspot.dataset.actionType;
                    const actionUrl = hotspot.dataset.actionUrl;
                    
                    hotspot.addEventListener('click', function(e) {
                        switch (actionType) {
                            case 'link':
                                if (actionUrl) {
                                    window.open(actionUrl, hotspot.dataset.actionTarget || '_self');
                                }
                                break;
                            case 'slide':
                                const slideIndex = parseInt(hotspot.dataset.slideIndex) || 0;
                                const slider = hotspot.closest('[data-lexslider]');
                                if (slider) {
                                    slider.dispatchEvent(new CustomEvent('ss3:goto', { detail: { index: slideIndex } }));
                                }
                                break;
                            case 'custom':
                                // Custom JS would be evaluated here
                                break;
                            default:
                                // Tooltip - handled by CSS
                                break;
                        }
                    });
                });
            });
        })();
    `;
}

/**
 * Generate hotspot editor HTML
 */
export function generateHotspotEditorHTML() {
    return `
        <div class="hotspot-editor">
            <div class="hotspot-editor-toolbar">
                <button class="add-hotspot-btn" title="Add Hotspot">
                    <span class="material-icons-round">add_location</span>
                    Add Hotspot
                </button>
            </div>
            <div class="hotspot-list"></div>
            <div class="hotspot-properties" style="display: none;">
                <div class="form-group">
                    <label>Icon</label>
                    <select class="hotspot-icon-select">
                        <option value="plus">Plus (+)</option>
                        <option value="info">Info (i)</option>
                        <option value="question">Question (?)</option>
                        <option value="arrow">Arrow (→)</option>
                        <option value="cart">Cart (🛒)</option>
                        <option value="heart">Heart (❤)</option>
                        <option value="star">Star (★)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Style</label>
                    <select class="hotspot-style-select">
                        <option value="pulse">Pulse</option>
                        <option value="bounce">Bounce</option>
                        <option value="glow">Glow</option>
                        <option value="wave">Wave</option>
                        <option value="static">Static</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tooltip Title</label>
                    <input type="text" class="hotspot-title-input">
                </div>
                <div class="form-group">
                    <label>Tooltip Content</label>
                    <textarea class="hotspot-content-input" rows="3"></textarea>
                </div>
            </div>
        </div>
    `;
}

export default {
    HOTSPOT_STYLES,
    HOTSPOT_ICONS,
    TOOLTIP_POSITIONS,
    createHotspot,
    createHotspotLayer,
    generateHotspotsHTML,
    generateHotspotsCSS,
    generateHotspotsScript,
    generateHotspotEditorHTML
};
