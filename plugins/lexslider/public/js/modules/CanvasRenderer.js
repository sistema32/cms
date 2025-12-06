
import { state, elements } from './EditorCore.js?v=3.0.28';

let showGrid = false;
let snapToGrid = false;
const gridSize = 20; // px

export function toggleGrid() {
    showGrid = !showGrid;
    renderCanvas();
}

export function toggleSnap() {
    snapToGrid = !snapToGrid;
}

let previewLayerId = null;
let previewAnimationName = null;
let previewStartTime = 0;

export function setPreviewAnimation(layerId, animationName) {
    previewLayerId = layerId;
    previewAnimationName = animationName;
    previewStartTime = Date.now();

    if (animationName) {
        requestAnimationFrame(previewLoop);
    } else {
        renderCanvas();
    }
}

function previewLoop() {
    if (!previewLayerId) return;
    renderCanvas();
    requestAnimationFrame(previewLoop);
}

export function renderCanvas() {
    // Guard: ensure elements are ready
    if (!elements.editor?.canvasContent || !elements.editor?.canvas) {
        console.warn('[CanvasRenderer] Elements not ready, skipping render');
        return;
    }

    const canvas = elements.editor.canvasContent;
    const wrapper = elements.editor.canvas.parentElement;
    const slide = state.currentSlide;

    // Ensure Grid Overlay Exists
    if (!elements.editor.canvas.querySelector('.canvas-grid')) {
        const grid = document.createElement('div');
        grid.className = 'canvas-grid';
        elements.editor.canvas.appendChild(grid);
    }

    // Update Rulers
    updateRulers();

    // Update Grid
    const gridEl = elements.editor.canvas.querySelector('.canvas-grid');
    if (gridEl) {
        gridEl.style.display = showGrid ? 'block' : 'none';
        gridEl.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    }

    if (!slide && state.mode === 'slide') {
        canvas.innerHTML = '';
        return;
    }

    // Set Canvas Size
    const slider = state.currentSlider;
    if (slider && state.device === 'desktop') {
        elements.editor.canvas.style.width = `${slider.width}px`;
        elements.editor.canvas.style.height = `${slider.height}px`;
    } else if (slider) {
        elements.editor.canvas.style.height = `${slider.height}px`;
    }

    // Ensure Background Element Exists
    let bgEl = elements.editor.canvas.querySelector('.canvas-background');
    if (!bgEl) {
        bgEl = document.createElement('div');
        bgEl.className = 'canvas-background';
        bgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;background-size:cover;background-position:center;';
        elements.editor.canvas.insertBefore(bgEl, elements.editor.canvas.firstChild);
    }

    // Background
    if (state.mode === 'slide' && slide) {
        bgEl.style.backgroundImage = slide.background_image ? `url(${slide.background_image})` : 'none';
        bgEl.style.backgroundColor = slide.background_image ? 'transparent' : (slide.background_color || '#ffffff');

        if (slide.ken_burns) {
            bgEl.style.animation = 'kenBurns 20s ease-in-out infinite alternate';
        } else {
            bgEl.style.animation = 'none';
        }
    } else {
        bgEl.style.backgroundImage = 'none';
        bgEl.style.backgroundColor = '#ffffff';
        bgEl.style.animation = 'none';
    }

    // Clear Content Container Background (it was previously set here)
    canvas.style.background = 'transparent';

    // Clear Content
    canvas.innerHTML = '';

    // Render Layers
    const layersToRender = state.mode === 'global' ? (state.globalLayers || []) : (slide ? (slide.layers || []) : []);

    // Sort layers by z-index for rendering
    layersToRender.sort((a, b) => {
        const zA = parseInt(a.style.zIndex || 1);
        const zB = parseInt(b.style.zIndex || 1);
        return zA - zB;
    });

    layersToRender.forEach(layer => {
        if (layer.hidden) return;

        // Timeline Visibility & Animation Logic
        let computedStyle = { ...layer.style };
        let opacityMultiplier = 1;
        let transform = '';

        if (state.mode === 'slide' && slide) {
            const startTime = layer.startTime || 0;
            const duration = layer.duration || (slide.duration || 5000);
            const endTime = startTime + duration;
            const localTime = state.currentTime - startTime;

            // Visibility Check
            if (state.currentTime < startTime || state.currentTime > endTime) {
                if (state.selectedLayer !== layer) {
                    return; // Hide if not selected
                } else {
                    opacityMultiplier = 0.5; // Ghost if selected but out of time
                }
            }

            // Entrance Animation
            let animName = layer.style.animationIn;
            let currentLocalTime = localTime;

            // Preview Override
            if (layer.id === previewLayerId && previewAnimationName) {
                animName = previewAnimationName;
                currentLocalTime = Date.now() - previewStartTime;
            }

            if (currentLocalTime >= 0 && currentLocalTime <= duration) {
                if (animName && animName !== 'none') {
                    const animDuration = (parseFloat(layer.style.animationDuration) || 1.0) * 1000;
                    const animDelay = (parseFloat(layer.style.animationDelay) || 0.0) * 1000;

                    // For preview, ignore delay? Or keep it? Let's keep it but maybe user wants instant feedback.
                    // Let's ignore delay for preview to make it snappy.
                    const effectiveDelay = (layer.id === previewLayerId) ? 0 : animDelay;

                    if (currentLocalTime < effectiveDelay) {
                        opacityMultiplier = 0;
                    } else if (currentLocalTime < effectiveDelay + animDuration) {
                        const progress = (currentLocalTime - effectiveDelay) / animDuration;
                        const entrance = getEntranceTransform(animName, progress);
                        opacityMultiplier *= entrance.opacity;
                        transform += ` ${entrance.transform}`;
                    }
                }
            }

            // Keyframe Interpolation
            if (layer.keyframes && layer.keyframes.length > 0) {
                const keyframes = [...layer.keyframes].sort((a, b) => a.time - b.time);

                let k1 = null;
                let k2 = null;

                for (let i = 0; i < keyframes.length; i++) {
                    if (keyframes[i].time <= state.currentTime) {
                        k1 = keyframes[i];
                    } else {
                        k2 = keyframes[i];
                        break;
                    }
                }

                if (k1 && k2) {
                    const duration = k2.time - k1.time;
                    const progress = (state.currentTime - k1.time) / duration;

                    // Interpolate properties
                    for (const prop in k2.properties) {
                        const startVal = k1.properties[prop] !== undefined ? k1.properties[prop] : computedStyle[prop];
                        const endVal = k2.properties[prop];

                        if (startVal !== undefined && endVal !== undefined) {
                            computedStyle[prop] = interpolateValue(prop, startVal, endVal, progress, k2.easing);
                        }
                    }
                } else if (k1) {
                    // After last keyframe, hold state
                    computedStyle = { ...computedStyle, ...k1.properties };
                }
            }
        }

        // Device Specific Overrides
        if (state.device === 'tablet' || state.device === 'mobile') {
            if (layer.style.tablet) computedStyle = { ...computedStyle, ...layer.style.tablet };
        }
        if (state.device === 'mobile') {
            if (layer.style.mobile) computedStyle = { ...computedStyle, ...layer.style.mobile };
        }

        const el = document.createElement('div');
        el.className = `layer-item ${state.selectedLayer === layer ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`;

        el.style.cssText = styleObjectToString(computedStyle);
        el.style.opacity = (parseFloat(computedStyle.opacity || 1) * opacityMultiplier).toString();
        if (transform) {
            // Append to existing transform if any
            const existingTransform = computedStyle.transform || '';
            el.style.transform = `${existingTransform} ${transform}`.trim();
        }

        el.dataset.id = layer.id;

        // Content
        if (layer.type === 'heading') el.innerHTML = `<h1>${layer.content.text}</h1>`;
        else if (layer.type === 'text') el.innerHTML = `<p>${layer.content.text}</p>`;
        else if (layer.type === 'button') el.innerHTML = `<a href="${layer.content.link || '#'}">${layer.content.text}</a>`;
        else if (layer.type === 'image') el.innerHTML = `<img src="${layer.content.src}" alt="Layer" style="width:100%;height:100%;object-fit:cover;">`;
        else if (layer.type === 'video') {
            el.innerHTML = `<iframe width="100%" height="100%" src="${layer.content.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;cursor:move;';
            el.appendChild(overlay);
        }
        else if (layer.type === 'icon') el.innerHTML = `<span class="material-icons-round" style="font-size: inherit; color: inherit;">${layer.content.icon}</span>`;

        // Drag Interaction
        if (!layer.locked) {
            el.onmousedown = (e) => startDrag(e, layer, el);
        }

        el.onclick = (e) => {
            e.stopPropagation();
            selectLayer(layer);
        };

        if (state.selectedLayer === layer && !layer.locked) {
            // Add resize handles
            const handles = ['nw', 'ne', 'sw', 'se'];
            handles.forEach(h => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${h}`;
                handle.onmousedown = (e) => {
                    e.stopPropagation(); // Prevent drag
                    startResize(e, layer, el, h);
                };
                el.appendChild(handle);
            });
        }

        canvas.appendChild(el);
    });

    // Deselect on canvas click
    elements.editor.canvas.onclick = (e) => {
        if (e.target === elements.editor.canvas || e.target === canvas || e.target.classList.contains('canvas-grid')) {
            state.selectedLayer = null;
            renderCanvas();
            if (window.LexSlider && window.LexSlider.renderLayerList) window.LexSlider.renderLayerList();
            if (window.LexSlider && window.LexSlider.renderProperties) window.LexSlider.renderProperties();
        }
    };
}

function getEntranceTransform(type, progress) {
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);

    if (type === 'fadeIn') {
        return { opacity: ease, transform: '' };
    }
    if (type === 'slideInLeft') {
        const x = -100 * (1 - ease);
        return { opacity: ease, transform: `translateX(${x}%)` };
    }
    if (type === 'slideInRight') {
        const x = 100 * (1 - ease);
        return { opacity: ease, transform: `translateX(${x}%)` };
    }
    if (type === 'slideInUp') {
        const y = 100 * (1 - ease);
        return { opacity: ease, transform: `translateY(${y}%)` };
    }
    if (type === 'slideInDown') {
        const y = -100 * (1 - ease);
        return { opacity: ease, transform: `translateY(${y}%)` };
    }
    if (type === 'zoomIn') {
        const scale = ease;
        return { opacity: ease, transform: `scale(${scale})` };
    }
    if (type === 'bounceIn') {
        // Simple bounce effect
        let scale = 1;
        if (progress < 0.2) scale = progress * 5; // 0 -> 1
        else if (progress < 0.4) scale = 1 + (0.4 - progress) * 0.5; // 1 -> 1.1
        else if (progress < 0.6) scale = 1.1 - (0.6 - progress) * 0.5; // 1.1 -> 1
        else scale = 1;

        // Better bounce:
        // c1 = 1.70158; c3 = c1 + 1; 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        // Let's just use a simple overshoot
        const backOut = (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        return { opacity: Math.min(progress * 2, 1), transform: `scale(${backOut(progress)})` };
    }
    if (type === 'rotateIn') {
        const deg = -200 * (1 - ease);
        return { opacity: ease, transform: `rotate(${deg}deg)` };
    }
    if (type === 'flipInX') {
        const deg = 90 * (1 - ease);
        return { opacity: ease, transform: `perspective(400px) rotateX(${deg}deg)` };
    }
    if (type === 'flipInY') {
        const deg = 90 * (1 - ease);
        return { opacity: ease, transform: `perspective(400px) rotateY(${deg}deg)` };
    }

    return { opacity: 1, transform: '' };
}

function updateRulers() {
    const canvasEl = elements.editor.canvas;
    const rulerH = document.getElementById('canvas-ruler-h');
    const rulerV = document.getElementById('canvas-ruler-v');

    if (!rulerH || !rulerV || !canvasEl) return;

    const canvasWidth = canvasEl.offsetWidth || 1200;
    const canvasHeight = canvasEl.offsetHeight || 600;
    const step = 100; // Marker every 100px

    // Horizontal Ruler
    let hMarks = '';
    for (let x = 0; x <= canvasWidth; x += step) {
        hMarks += `<span style="position:absolute;left:${x}px;top:2px;font-size:9px;color:#888">${x}</span>`;
        hMarks += `<span style="position:absolute;left:${x}px;bottom:0;width:1px;height:6px;background:#555"></span>`;
    }
    // Add smaller ticks every 50px
    for (let x = 50; x <= canvasWidth; x += 100) {
        hMarks += `<span style="position:absolute;left:${x}px;bottom:0;width:1px;height:4px;background:#444"></span>`;
    }
    rulerH.innerHTML = hMarks;
    rulerH.style.position = 'relative';

    // Vertical Ruler
    let vMarks = '';
    for (let y = 0; y <= canvasHeight; y += step) {
        vMarks += `<span style="position:absolute;top:${y}px;right:4px;font-size:9px;color:#888;writing-mode:vertical-rl;transform:rotate(180deg)">${y}</span>`;
        vMarks += `<span style="position:absolute;top:${y}px;right:0;width:6px;height:1px;background:#555"></span>`;
    }
    // Add smaller ticks every 50px
    for (let y = 50; y <= canvasHeight; y += 100) {
        vMarks += `<span style="position:absolute;top:${y}px;right:0;width:4px;height:1px;background:#444"></span>`;
    }
    rulerV.innerHTML = vMarks;
    rulerV.style.position = 'relative';
}

function styleObjectToString(style) {
    return Object.entries(style).map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return '';
        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${key}:${v}`;
    }).join(';');
}

export function selectLayer(layer) {
    state.selectedLayer = layer;
    renderCanvas();
    if (window.LexSlider && window.LexSlider.renderLayerList) window.LexSlider.renderLayerList();
    if (window.LexSlider && window.LexSlider.renderProperties) window.LexSlider.renderProperties();
}

let isDragging = false;
let isResizing = false;

function startDrag(e, layer, element) {
    if (state.selectedLayer !== layer) selectLayer(layer);
    isDragging = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = element.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    const onMouseMove = (ev) => {
        if (!isDragging) return;

        const canvasRect = elements.editor.canvas.getBoundingClientRect();
        let left = ev.clientX - canvasRect.left;
        let top = ev.clientY - canvasRect.top;

        // Snap to Grid
        if (snapToGrid) {
            left = Math.round(left / gridSize) * gridSize;
            top = Math.round(top / gridSize) * gridSize;
        }

        const leftPercent = (left / canvasRect.width) * 100;
        const topPercent = (top / canvasRect.height) * 100;

        element.style.left = `${leftPercent}%`;
        element.style.top = `${topPercent}%`;
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        layer.style.left = element.style.left;
        layer.style.top = element.style.top;

        if (window.LexSlider && window.LexSlider.renderProperties) window.LexSlider.renderProperties();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startResize(e, layer, element, handle) {
    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = element.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;

    const canvasRect = elements.editor.canvas.getBoundingClientRect();

    const onMouseMove = (ev) => {
        if (!isResizing) return;

        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft - canvasRect.left;
        let newTop = startTop - canvasRect.top;

        if (handle.includes('e')) {
            newWidth = startWidth + deltaX;
        }
        if (handle.includes('w')) {
            newWidth = startWidth - deltaX;
            newLeft = (startLeft - canvasRect.left) + deltaX;
        }
        if (handle.includes('s')) {
            newHeight = startHeight + deltaY;
        }
        if (handle.includes('n')) {
            newHeight = startHeight - deltaY;
            newTop = (startTop - canvasRect.top) + deltaY;
        }

        // Min dimensions
        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;

        // Snap to Grid (Simplified for resize)
        if (snapToGrid) {
            newWidth = Math.round(newWidth / gridSize) * gridSize;
            newHeight = Math.round(newHeight / gridSize) * gridSize;
        }

        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;

        if (handle.includes('w')) {
            const leftPercent = (newLeft / canvasRect.width) * 100;
            element.style.left = `${leftPercent}%`;
        }
        if (handle.includes('n')) {
            const topPercent = (newTop / canvasRect.width) * 100;
            element.style.top = `${topPercent}%`;
        }
    };

    const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        layer.style.width = element.style.width;
        layer.style.height = element.style.height;
        if (handle.includes('w')) layer.style.left = element.style.left;
        if (handle.includes('n')) layer.style.top = element.style.top;

        if (window.LexSlider && window.LexSlider.renderProperties) window.LexSlider.renderProperties();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

import { easingFunctions } from './EasingFunctions.js';

function interpolateValue(prop, start, end, progress, easingName = 'linear') {
    const ease = easingFunctions[easingName] || easingFunctions.linear;
    const easedProgress = ease(progress);

    if (typeof start === 'number' && typeof end === 'number') {
        return start + (end - start) * easedProgress;
    }

    const parse = (val) => {
        const match = String(val).match(/^(-?[\d.]+)(.*)$/);
        return match ? { num: parseFloat(match[1]), unit: match[2] } : { num: 0, unit: '' };
    };

    const s = parse(start);
    const e = parse(end);

    if (s.unit !== e.unit) return start;

    const val = s.num + (e.num - s.num) * easedProgress;
    return `${val}${s.unit}`;
}
