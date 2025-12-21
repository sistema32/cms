/**
 * BeforeAfter.js - Before/After image comparison slider
 * Creates a draggable divider to compare two images
 */

/**
 * Create before/after comparison layer
 */
export function createBeforeAfterLayer(beforeImage, afterImage, options = {}) {
    return {
        type: 'beforeAfter',
        content: {
            before: beforeImage,
            after: afterImage
        },
        style: {
            ...options,
            width: options.width || '100%',
            height: options.height || '100%'
        },
        settings: {
            orientation: options.orientation || 'horizontal', // horizontal | vertical
            initialPosition: options.initialPosition || 50, // percentage
            dividerColor: options.dividerColor || '#ffffff',
            dividerWidth: options.dividerWidth || 4,
            showLabels: options.showLabels !== false,
            beforeLabel: options.beforeLabel || 'Before',
            afterLabel: options.afterLabel || 'After'
        }
    };
}

/**
 * Generate before/after HTML
 */
export function generateBeforeAfterHTML(layer) {
    const { before, after } = layer.content;
    const settings = layer.settings || {};
    const {
        orientation = 'horizontal',
        initialPosition = 50,
        dividerColor = '#ffffff',
        dividerWidth = 4,
        showLabels = true,
        beforeLabel = 'Before',
        afterLabel = 'After'
    } = settings;

    const isHorizontal = orientation === 'horizontal';

    return `
        <div class="ss3-before-after" 
             data-orientation="${orientation}"
             style="--divider-color: ${dividerColor}; --divider-width: ${dividerWidth}px; --initial-pos: ${initialPosition}%;">
            <div class="ss3-ba-before">
                <img src="${before}" alt="${beforeLabel}" draggable="false">
                ${showLabels ? `<span class="ss3-ba-label ss3-ba-label-before">${beforeLabel}</span>` : ''}
            </div>
            <div class="ss3-ba-after">
                <img src="${after}" alt="${afterLabel}" draggable="false">
                ${showLabels ? `<span class="ss3-ba-label ss3-ba-label-after">${afterLabel}</span>` : ''}
            </div>
            <div class="ss3-ba-divider">
                <div class="ss3-ba-divider-line"></div>
                <div class="ss3-ba-divider-handle">
                    <span class="material-icons-round">${isHorizontal ? 'drag_handle' : 'drag_indicator'}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate before/after CSS
 */
export function generateBeforeAfterCSS() {
    return `
        .ss3-before-after {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            cursor: ew-resize;
            user-select: none;
        }
        
        .ss3-before-after[data-orientation="vertical"] {
            cursor: ns-resize;
        }
        
        .ss3-ba-before,
        .ss3-ba-after {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .ss3-ba-before img,
        .ss3-ba-after img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .ss3-ba-before {
            clip-path: inset(0 calc(100% - var(--initial-pos)) 0 0);
            z-index: 2;
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-before {
            clip-path: inset(0 0 calc(100% - var(--initial-pos)) 0);
        }
        
        .ss3-ba-divider {
            position: absolute;
            z-index: 10;
        }
        
        .ss3-before-after:not([data-orientation="vertical"]) .ss3-ba-divider {
            top: 0;
            bottom: 0;
            left: var(--initial-pos);
            transform: translateX(-50%);
            width: var(--divider-width);
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-divider {
            left: 0;
            right: 0;
            top: var(--initial-pos);
            transform: translateY(-50%);
            height: var(--divider-width);
        }
        
        .ss3-ba-divider-line {
            position: absolute;
            background: var(--divider-color);
        }
        
        .ss3-before-after:not([data-orientation="vertical"]) .ss3-ba-divider-line {
            top: 0;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: var(--divider-width);
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-divider-line {
            left: 0;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            height: var(--divider-width);
        }
        
        .ss3-ba-divider-handle {
            position: absolute;
            width: 40px;
            height: 40px;
            background: var(--divider-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .ss3-before-after:not([data-orientation="vertical"]) .ss3-ba-divider-handle {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-divider-handle {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(90deg);
        }
        
        .ss3-ba-label {
            position: absolute;
            padding: 5px 12px;
            background: rgba(0,0,0,0.6);
            color: white;
            font-size: 12px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .ss3-ba-label-before {
            top: 15px;
            left: 15px;
        }
        
        .ss3-ba-label-after {
            top: 15px;
            right: 15px;
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-label-before {
            top: 15px;
            left: 15px;
        }
        
        .ss3-before-after[data-orientation="vertical"] .ss3-ba-label-after {
            bottom: 15px;
            left: 15px;
            top: auto;
        }
    `;
}

/**
 * Generate before/after interaction script
 */
export function generateBeforeAfterScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            container.querySelectorAll('.ss3-before-after').forEach(ba => {
                const isVertical = ba.dataset.orientation === 'vertical';
                const before = ba.querySelector('.ss3-ba-before');
                const divider = ba.querySelector('.ss3-ba-divider');
                let isDragging = false;
                
                function updatePosition(e) {
                    const rect = ba.getBoundingClientRect();
                    let pos;
                    
                    if (isVertical) {
                        pos = ((e.clientY - rect.top) / rect.height) * 100;
                    } else {
                        pos = ((e.clientX - rect.left) / rect.width) * 100;
                    }
                    
                    pos = Math.max(0, Math.min(100, pos));
                    
                    ba.style.setProperty('--initial-pos', pos + '%');
                    
                    if (isVertical) {
                        before.style.clipPath = 'inset(0 0 ' + (100 - pos) + '% 0)';
                        divider.style.top = pos + '%';
                    } else {
                        before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
                        divider.style.left = pos + '%';
                    }
                }
                
                ba.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    updatePosition(e);
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    updatePosition(e);
                });
                
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });
                
                // Touch support
                ba.addEventListener('touchstart', (e) => {
                    isDragging = true;
                    updatePosition(e.touches[0]);
                });
                
                ba.addEventListener('touchmove', (e) => {
                    if (!isDragging) return;
                    e.preventDefault();
                    updatePosition(e.touches[0]);
                });
                
                ba.addEventListener('touchend', () => {
                    isDragging = false;
                });
            });
        })();
    `;
}

export default {
    createBeforeAfterLayer,
    generateBeforeAfterHTML,
    generateBeforeAfterCSS,
    generateBeforeAfterScript
};
