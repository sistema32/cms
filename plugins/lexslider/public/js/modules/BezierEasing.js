/**
 * BezierEasing.js - Custom easing curve editor
 * Visual cubic bezier editor for animation timing
 */

// Preset easing curves
export const EASING_PRESETS = {
    // Basic
    linear: { cp1: [0, 0], cp2: [1, 1], label: 'Linear' },
    ease: { cp1: [0.25, 0.1], cp2: [0.25, 1], label: 'Ease' },
    easeIn: { cp1: [0.42, 0], cp2: [1, 1], label: 'Ease In' },
    easeOut: { cp1: [0, 0], cp2: [0.58, 1], label: 'Ease Out' },
    easeInOut: { cp1: [0.42, 0], cp2: [0.58, 1], label: 'Ease In Out' },

    // Smooth
    easeInSine: { cp1: [0.12, 0], cp2: [0.39, 0], label: 'Ease In Sine' },
    easeOutSine: { cp1: [0.61, 1], cp2: [0.88, 1], label: 'Ease Out Sine' },
    easeInOutSine: { cp1: [0.37, 0], cp2: [0.63, 1], label: 'Ease In Out Sine' },

    // Quad
    easeInQuad: { cp1: [0.11, 0], cp2: [0.5, 0], label: 'Ease In Quad' },
    easeOutQuad: { cp1: [0.5, 1], cp2: [0.89, 1], label: 'Ease Out Quad' },
    easeInOutQuad: { cp1: [0.45, 0], cp2: [0.55, 1], label: 'Ease In Out Quad' },

    // Cubic
    easeInCubic: { cp1: [0.32, 0], cp2: [0.67, 0], label: 'Ease In Cubic' },
    easeOutCubic: { cp1: [0.33, 1], cp2: [0.68, 1], label: 'Ease Out Cubic' },
    easeInOutCubic: { cp1: [0.65, 0], cp2: [0.35, 1], label: 'Ease In Out Cubic' },

    // Bounce/Back
    easeInBack: { cp1: [0.36, 0], cp2: [0.66, -0.56], label: 'Ease In Back' },
    easeOutBack: { cp1: [0.34, 1.56], cp2: [0.64, 1], label: 'Ease Out Back' },
    easeInOutBack: { cp1: [0.68, -0.6], cp2: [0.32, 1.6], label: 'Ease In Out Back' },

    // Custom presets
    snappy: { cp1: [0.17, 0.67], cp2: [0.83, 0.67], label: 'Snappy' },
    smooth: { cp1: [0.4, 0], cp2: [0.2, 1], label: 'Smooth' },
    bouncy: { cp1: [0.68, -0.55], cp2: [0.27, 1.55], label: 'Bouncy' }
};

/**
 * Get all preset options for UI dropdown
 */
export function getEasingOptions() {
    return Object.entries(EASING_PRESETS).map(([key, preset]) => ({
        value: key,
        label: preset.label
    }));
}

/**
 * Get CSS cubic-bezier string from preset name or control points
 */
export function getCubicBezier(easing) {
    if (typeof easing === 'string') {
        const preset = EASING_PRESETS[easing];
        if (!preset) return 'ease';
        return `cubic-bezier(${preset.cp1[0]}, ${preset.cp1[1]}, ${preset.cp2[0]}, ${preset.cp2[1]})`;
    }

    // Custom control points
    if (easing.cp1 && easing.cp2) {
        return `cubic-bezier(${easing.cp1[0]}, ${easing.cp1[1]}, ${easing.cp2[0]}, ${easing.cp2[1]})`;
    }

    return 'ease';
}

/**
 * Create bezier curve function from control points
 */
export function createBezierFunction(cp1x, cp1y, cp2x, cp2y) {
    // Simple approximation using pre-calculated samples
    const PRECISION = 100;
    const samples = [];

    for (let i = 0; i <= PRECISION; i++) {
        const t = i / PRECISION;
        const x = bezierPoint(t, 0, cp1x, cp2x, 1);
        const y = bezierPoint(t, 0, cp1y, cp2y, 1);
        samples.push({ x, y });
    }

    return function (progress) {
        if (progress <= 0) return 0;
        if (progress >= 1) return 1;

        // Find the two samples that bracket the progress value
        for (let i = 0; i < samples.length - 1; i++) {
            if (samples[i + 1].x >= progress) {
                const t = (progress - samples[i].x) / (samples[i + 1].x - samples[i].x);
                return samples[i].y + t * (samples[i + 1].y - samples[i].y);
            }
        }

        return 1;
    };
}

function bezierPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Generate visual bezier curve editor HTML
 */
export function generateBezierEditorHTML(currentEasing = 'ease') {
    const preset = EASING_PRESETS[currentEasing] || EASING_PRESETS.ease;

    const presetsHTML = Object.entries(EASING_PRESETS).map(([key, p]) => `
        <button class="bezier-preset ${key === currentEasing ? 'active' : ''}" 
                data-easing="${key}" title="${p.label}">
            <svg viewBox="0 0 24 24" width="100%" height="100%">
                <path d="M 2,22 C ${2 + p.cp1[0] * 20},${22 - p.cp1[1] * 20} ${2 + p.cp2[0] * 20},${22 - p.cp2[1] * 20} 22,2"
                      fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `).join('');

    return `
        <div class="bezier-editor">
            <div class="bezier-canvas-container">
                <svg class="bezier-canvas" viewBox="0 0 100 100">
                    <!-- Grid -->
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#333" stroke-dasharray="2,2"/>
                    
                    <!-- Curve -->
                    <path class="bezier-curve" 
                          d="M 0,100 C ${preset.cp1[0] * 100},${100 - preset.cp1[1] * 100} ${preset.cp2[0] * 100},${100 - preset.cp2[1] * 100} 100,0"
                          fill="none" stroke="#8470ff" stroke-width="2"/>
                    
                    <!-- Control point lines -->
                    <line class="bezier-line-1" x1="0" y1="100" 
                          x2="${preset.cp1[0] * 100}" y2="${100 - preset.cp1[1] * 100}" 
                          stroke="#8470ff" stroke-opacity="0.5"/>
                    <line class="bezier-line-2" x1="100" y1="0" 
                          x2="${preset.cp2[0] * 100}" y2="${100 - preset.cp2[1] * 100}" 
                          stroke="#8470ff" stroke-opacity="0.5"/>
                    
                    <!-- Control points -->
                    <circle class="bezier-cp bezier-cp1" 
                            cx="${preset.cp1[0] * 100}" cy="${100 - preset.cp1[1] * 100}" r="6"/>
                    <circle class="bezier-cp bezier-cp2" 
                            cx="${preset.cp2[0] * 100}" cy="${100 - preset.cp2[1] * 100}" r="6"/>
                    
                    <!-- Start/End points -->
                    <circle cx="0" cy="100" r="4" fill="#888"/>
                    <circle cx="100" cy="0" r="4" fill="#888"/>
                </svg>
                
                <!-- Preview ball -->
                <div class="bezier-preview-ball"></div>
            </div>
            
            <div class="bezier-presets">
                ${presetsHTML}
            </div>
            
            <div class="bezier-values">
                <code class="bezier-output">cubic-bezier(${preset.cp1[0]}, ${preset.cp1[1]}, ${preset.cp2[0]}, ${preset.cp2[1]})</code>
            </div>
        </div>
    `;
}

/**
 * Generate bezier editor CSS
 */
export function generateBezierEditorCSS() {
    return `
        .bezier-editor {
            background: #1a1a1a;
            border-radius: 8px;
            padding: 15px;
        }
        
        .bezier-canvas-container {
            position: relative;
            width: 200px;
            height: 200px;
            margin: 0 auto 15px;
            background: #111;
            border-radius: 4px;
            overflow: visible;
        }
        
        .bezier-canvas {
            width: 100%;
            height: 100%;
        }
        
        .bezier-cp {
            fill: #8470ff;
            cursor: grab;
            transition: r 0.1s;
        }
        
        .bezier-cp:hover {
            r: 8;
        }
        
        .bezier-cp:active {
            cursor: grabbing;
        }
        
        .bezier-preview-ball {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 12px;
            height: 12px;
            background: #ff6b6b;
            border-radius: 50%;
            transform: translate(-50%, 50%);
        }
        
        .bezier-presets {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .bezier-preset {
            aspect-ratio: 1;
            background: #222;
            border: 1px solid #333;
            border-radius: 4px;
            cursor: pointer;
            padding: 3px;
            color: #666;
            transition: all 0.2s;
        }
        
        .bezier-preset:hover {
            border-color: #8470ff;
            color: #8470ff;
        }
        
        .bezier-preset.active {
            background: #8470ff20;
            border-color: #8470ff;
            color: #8470ff;
        }
        
        .bezier-output {
            display: block;
            text-align: center;
            font-size: 11px;
            color: #888;
            padding: 8px;
            background: #0a0a0a;
            border-radius: 4px;
        }
    `;
}

/**
 * Initialize bezier editor interactivity
 */
export function initBezierEditor(container, onChange) {
    const canvas = container.querySelector('.bezier-canvas');
    const cp1 = container.querySelector('.bezier-cp1');
    const cp2 = container.querySelector('.bezier-cp2');
    const curve = container.querySelector('.bezier-curve');
    const line1 = container.querySelector('.bezier-line-1');
    const line2 = container.querySelector('.bezier-line-2');
    const output = container.querySelector('.bezier-output');
    const presetBtns = container.querySelectorAll('.bezier-preset');

    let dragging = null;

    function updateCurve(p1x, p1y, p2x, p2y) {
        curve.setAttribute('d', `M 0,100 C ${p1x * 100},${100 - p1y * 100} ${p2x * 100},${100 - p2y * 100} 100,0`);
        cp1.setAttribute('cx', p1x * 100);
        cp1.setAttribute('cy', 100 - p1y * 100);
        cp2.setAttribute('cx', p2x * 100);
        cp2.setAttribute('cy', 100 - p2y * 100);
        line1.setAttribute('x2', p1x * 100);
        line1.setAttribute('y2', 100 - p1y * 100);
        line2.setAttribute('x2', p2x * 100);
        line2.setAttribute('y2', 100 - p2y * 100);
        output.textContent = `cubic-bezier(${p1x.toFixed(2)}, ${p1y.toFixed(2)}, ${p2x.toFixed(2)}, ${p2y.toFixed(2)})`;

        if (onChange) {
            onChange({ cp1: [p1x, p1y], cp2: [p2x, p2y] });
        }
    }

    // Dragging control points
    [cp1, cp2].forEach((cp, index) => {
        cp.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = index;
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (dragging === null) return;

        const rect = canvas.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width;
        let y = 1 - (e.clientY - rect.top) / rect.height;

        // Clamp x to 0-1
        x = Math.max(0, Math.min(1, x));
        // Allow y to go beyond for overshoot effects
        y = Math.max(-0.5, Math.min(1.5, y));

        const p1x = parseFloat(cp1.getAttribute('cx')) / 100;
        const p1y = 1 - parseFloat(cp1.getAttribute('cy')) / 100;
        const p2x = parseFloat(cp2.getAttribute('cx')) / 100;
        const p2y = 1 - parseFloat(cp2.getAttribute('cy')) / 100;

        if (dragging === 0) {
            updateCurve(x, y, p2x, p2y);
        } else {
            updateCurve(p1x, p1y, x, y);
        }
    });

    document.addEventListener('mouseup', () => {
        dragging = null;
    });

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const easingName = btn.dataset.easing;
            const preset = EASING_PRESETS[easingName];
            if (!preset) return;

            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            updateCurve(preset.cp1[0], preset.cp1[1], preset.cp2[0], preset.cp2[1]);
        });
    });
}

export default {
    EASING_PRESETS,
    getEasingOptions,
    getCubicBezier,
    createBezierFunction,
    generateBezierEditorHTML,
    generateBezierEditorCSS,
    initBezierEditor
};
