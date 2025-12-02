
import { state, elements } from './EditorCore.js';
import { renderProperties } from './PropertyInspector.js';
import { renderLayerList } from './LayerManager.js';

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

export function renderCanvas() {
    const canvas = elements.editor.canvasContent;
    const wrapper = elements.editor.canvas.parentElement;
    const slide = state.currentSlide;

    // Ensure Rulers Exist
    if (!wrapper.querySelector('.ruler-h')) {
        const rulerH = document.createElement('div');
        rulerH.className = 'ruler-h';
        wrapper.appendChild(rulerH);

        const rulerV = document.createElement('div');
        rulerV.className = 'ruler-v';
        wrapper.appendChild(rulerV);

        // Grid Overlay
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
    if (slider) {
        elements.editor.canvas.style.width = `${slider.width}px`;
        elements.editor.canvas.style.height = `${slider.height}px`;
    }

    // Background
    if (state.mode === 'slide' && slide) {
        canvas.style.backgroundImage = slide.background_image ? `url(${slide.background_image})` : 'none';
        canvas.style.backgroundColor = slide.background_image ? 'transparent' : (slide.background_color || '#ffffff');
    } else {
        canvas.style.backgroundImage = 'none';
        canvas.style.backgroundColor = '#ffffff';
    }

    // Clear Content
    canvas.innerHTML = '';

    // Render Layers
    const layersToRender = state.mode === 'global' ? (state.globalLayers || []) : (slide ? (slide.layers || []) : []);

    layersToRender.forEach(layer => {
        if (layer.hidden) return;

        const el = document.createElement('div');
        el.className = `layer-item ${state.selectedLayer === layer ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`;

        // Calculate responsive style
        let finalStyle = { ...layer.style };
        if (state.device === 'tablet' || state.device === 'mobile') {
            if (layer.style.tablet) finalStyle = { ...finalStyle, ...layer.style.tablet };
        }
        if (state.device === 'mobile') {
            if (layer.style.mobile) finalStyle = { ...finalStyle, ...layer.style.mobile };
        }

        el.style.cssText = styleObjectToString(finalStyle);
        el.dataset.id = layer.id;

        // Content
        if (layer.type === 'heading') el.innerHTML = `<h1>${layer.content.text}</h1>`;
        else if (layer.type === 'text') el.innerHTML = `<p>${layer.content.text}</p>`;
        else if (layer.type === 'button') el.innerHTML = `<a href="${layer.content.link || '#'}">${layer.content.text}</a>`;
        else if (layer.type === 'image') el.innerHTML = `<img src="${layer.content.src}" alt="Layer">`;
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
            // Add resize handles (simplified for now)
            const handles = ['nw', 'ne', 'sw', 'se'];
            handles.forEach(h => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${h}`;
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
            renderLayerList();
            renderProperties();
        }
    };
}

function updateRulers() {
    const wrapper = elements.editor.canvas.parentElement;
    const rulerH = wrapper.querySelector('.ruler-h');
    const rulerV = wrapper.querySelector('.ruler-v');

    // Simple ruler rendering (ticks every 50px)
    // In a real implementation, this would be more dynamic based on zoom/scroll
    rulerH.style.backgroundSize = '50px 100%';
    rulerV.style.backgroundSize = '100% 50px';
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
    renderLayerList();
    renderProperties();
}

let isDragging = false;
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
        let left = ev.clientX - canvasRect.left; // - offsetX + (rect.width / 2); // Center anchor logic adjustment
        let top = ev.clientY - canvasRect.top; // - offsetY + (rect.height / 2);

        // Snap to Grid
        if (snapToGrid) {
            left = Math.round(left / gridSize) * gridSize;
            top = Math.round(top / gridSize) * gridSize;
        }

        const leftPercent = (left / canvasRect.width) * 100;
        const topPercent = (top / canvasRect.height) * 100;

        element.style.left = `${leftPercent}%`;
        element.style.top = `${topPercent}%`;
        // element.style.transform = 'translate(-50%, -50%)'; // Assuming center anchor
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        layer.style.left = element.style.left;
        layer.style.top = element.style.top;
        // layer.style.transform = element.style.transform;

        renderProperties();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}
