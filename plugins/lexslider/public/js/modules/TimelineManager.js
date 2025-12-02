import { state, elements } from './EditorCore.js';
import { renderCanvas } from './CanvasRenderer.js';
import { renderLayerList } from './LayerManager.js';

let isPlaying = false;
let animationFrameId = null;
let startTime = 0;
let zoomLevel = 1; // pixels per 100ms
let currentTime = 0;

function getDuration() {
    return (state.currentSlide && state.currentSlide.duration) ? state.currentSlide.duration : 5000;
}

export function updateSlideDuration(value) {
    if (!state.currentSlide) return;
    state.currentSlide.duration = parseInt(value) || 5000;
    renderTimelineTracks();
}

export function initTimeline() {
    const timelinePanel = document.getElementById('timeline-panel');
    if (!timelinePanel) return;

    // RevSlider-style Timeline UI
    timelinePanel.innerHTML = `
        <div class="timeline-header">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="material-icons-round" style="font-size: 16px;">movie</span>
                <span>Timeline</span>
            </div>
            <div class="timeline-controls">
                <button class="btn-icon-sm" id="tl-btn-play" title="Play"><span class="material-icons-round">play_arrow</span></button>
                <button class="btn-icon-sm" id="tl-btn-pause" style="display:none;" title="Pause"><span class="material-icons-round">pause</span></button>
                <button class="btn-icon-sm" id="tl-btn-stop" title="Stop"><span class="material-icons-round">stop</span></button>
                
                <span class="time-display" id="tl-time-display">00:00.00</span>
                
                <div style="display: flex; align-items: center; gap: 4px; margin: 0 8px; border-left: 1px solid #333; padding-left: 8px;">
                    <span style="font-size: 10px; color: #777;">DUR:</span>
                    <input type="number" id="tl-duration-input" value="5000" step="100" 
                           style="width: 50px; background: #111; border: 1px solid #333; color: #ccc; font-size: 10px; padding: 2px;"
                           onchange="window.LexSlider.updateSlideDuration(this.value)">
                    <span style="font-size: 10px; color: #777;">ms</span>
                </div>

                <div style="width: 1px; height: 20px; background: var(--border); margin: 0 8px;"></div>
                <button class="btn-icon-sm" onclick="window.LexSlider.timelineZoom(-0.5)" title="Zoom Out"><span class="material-icons-round">zoom_out</span></button>
                <button class="btn-icon-sm" onclick="window.LexSlider.timelineZoom(0.5)" title="Zoom In"><span class="material-icons-round">zoom_in</span></button>
            </div>
        </div>
        <div class="timeline-body">
            <div class="timeline-ruler-container">
                <div class="timeline-layer-headers" id="tl-layer-headers">
                    <div class="timeline-ruler-header">Time</div>
                </div>
                <div class="timeline-ruler-wrapper">
                    <div class="timeline-ruler" id="tl-ruler"></div>
                    <div class="timeline-playhead" id="tl-playhead" style="left: 0px;"></div>
                </div>
            </div>
            <div class="timeline-tracks-wrapper">
                <div class="timeline-layer-headers-fixed" id="tl-layer-names"></div>
                <div class="timeline-tracks-scroll" id="tl-tracks-scroll">
                    <div class="timeline-tracks" id="tl-tracks"></div>
                </div>
            </div>
        </div>
    `;

    // Bind Events
    document.getElementById('tl-btn-play').onclick = playTimeline;
    document.getElementById('tl-btn-pause').onclick = pauseTimeline;
    document.getElementById('tl-btn-stop').onclick = stopTimeline;

    // Sync scroll between ruler and tracks
    const tracksScroll = document.getElementById('tl-tracks-scroll');
    const rulerWrapper = document.querySelector('.timeline-ruler-wrapper');
    tracksScroll.addEventListener('scroll', () => {
        rulerWrapper.scrollLeft = tracksScroll.scrollLeft;
    });

    // Initial Render
    renderTimelineTracks();
}

export function renderTimelineTracks() {
    const tracksContainer = document.getElementById('tl-tracks');
    const layerNames = document.getElementById('tl-layer-names');
    const layerHeaders = document.getElementById('tl-layer-headers');

    if (!tracksContainer || !layerNames) return;

    const layers = state.mode === 'global' ? state.globalLayers : (state.currentSlide ? state.currentSlide.layers : []);

    if (layers.length === 0) {
        tracksContainer.innerHTML = `
            <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">
                <span class="material-icons-round" style="font-size: 48px; opacity: 0.2; margin-bottom: 1rem;">movie_filter</span>
                <p style="font-size: 12px; margin: 0;">Add layers to animate</p>
            </div>
        `;
        layerNames.innerHTML = '';
        layerHeaders.innerHTML = '<div class="timeline-ruler-header">Time</div>';
        renderRuler();
        return;
    }

    // Render layer name column (Draggable for reordering)
    layerNames.innerHTML = layers.map((layer, index) => `
        <div class="timeline-layer-name ${state.selectedLayer === layer ? 'selected' : ''}" 
             draggable="true"
             ondragstart="window.LexSlider.onLayerDragStart(event, ${index})"
             ondragover="window.LexSlider.onLayerDragOver(event)"
             ondragleave="window.LexSlider.onLayerDragLeave(event)"
             ondrop="window.LexSlider.onLayerDrop(event, ${index})"
             title="${layer.name || getLayerTypeName(layer.type)}">
            <div class="layer-controls">
                <button class="btn-icon-xs ${layer.hidden ? 'active' : ''}" onclick="event.stopPropagation(); window.LexSlider.toggleLayerVisibility(${layer.id})" title="Toggle Visibility">
                    <span class="material-icons-round">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button class="btn-icon-xs ${layer.locked ? 'active' : ''}" onclick="event.stopPropagation(); window.LexSlider.toggleLayerLock(${layer.id})" title="Toggle Lock">
                    <span class="material-icons-round">${layer.locked ? 'lock' : 'lock_open'}</span>
                </button>
            </div>
            <span class="material-icons-round icon">${getLayerIcon(layer.type)}</span>
            <span class="name" style="${layer.hidden ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${layer.name || getLayerTypeName(layer.type)}</span>
        </div>
    `).join('');

    // Update header count
    layerHeaders.innerHTML = `<div class="timeline-ruler-header">${layers.length} Layer${layers.length > 1 ? 's' : ''}</div>`;

    // Render tracks with duration bars
    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);
    tracksContainer.innerHTML = layers.map(layer => {
        // Ensure defaults
        if (layer.startTime === undefined) layer.startTime = 0;
        if (layer.duration === undefined) layer.duration = currentDuration;

        const left = (layer.startTime / currentDuration) * timelineWidth;
        const width = (layer.duration / currentDuration) * timelineWidth;

        return `
            <div class="timeline-track-lane ${state.selectedLayer === layer ? 'selected' : ''}" 
                 style="width: ${timelineWidth}px;"
                 data-layer-id="${layer.id}">
                
                <!-- Duration Bar -->
                <div class="timeline-layer-bar ${state.selectedLayer === layer ? 'selected' : ''}"
                     style="left: ${left}px; width: ${width}px;"
                     onmousedown="window.LexSlider.startBarDrag(event, ${layer.id}, 'move')">
                    <div class="bar-handle left" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-left')"></div>
                    <div class="bar-handle right" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-right')"></div>
                </div>

                <!-- Keyframes (Optional, rendered on top of bar or track) -->
                ${(layer.keyframes || []).map(kf => `
                    <div class="timeline-keyframe" 
                         style="left: ${(kf.time / currentDuration) * timelineWidth}px;"
                         data-time="${kf.time}"
                         title="Keyframe at ${(kf.time / 1000).toFixed(2)}s">
                        <div class="keyframe-diamond"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    renderRuler();
}

function renderRuler() {
    const ruler = document.getElementById('tl-ruler');
    if (!ruler) return;

    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);
    ruler.style.width = `${timelineWidth}px`;

    // Update input if exists
    const input = document.getElementById('tl-duration-input');
    if (input && document.activeElement !== input) {
        input.value = currentDuration;
    }

    // Generate time markers every 500ms
    const interval = 500; // milliseconds
    const markers = Math.ceil(currentDuration / interval);

    let html = '';
    for (let i = 0; i <= markers; i++) {
        const time = i * interval;
        const position = (time / currentDuration) * timelineWidth;
        const seconds = (time / 1000).toFixed(1);

        html += `
            <div class="ruler-mark" style="left: ${position}px;">
                <div class="ruler-tick"></div>
                <div class="ruler-label">${seconds}s</div>
            </div>
        `;
    }

    ruler.innerHTML = html;
}

function playTimeline() {
    if (isPlaying) return;
    isPlaying = true;
    document.getElementById('tl-btn-play').style.display = 'none';
    document.getElementById('tl-btn-pause').style.display = 'inline-flex';

    startTime = Date.now() - currentTime;
    loop();
}

function pauseTimeline() {
    isPlaying = false;
    document.getElementById('tl-btn-play').style.display = 'inline-flex';
    document.getElementById('tl-btn-pause').style.display = 'none';
    cancelAnimationFrame(animationFrameId);
}

function stopTimeline() {
    pauseTimeline();
    currentTime = 0;
    updatePlayhead();
}

function loop() {
    if (!isPlaying) return;

    currentTime = Date.now() - startTime;

    if (currentTime > getDuration()) {
        currentTime = 0;
        startTime = Date.now();
    }

    updatePlayhead();
    animationFrameId = requestAnimationFrame(loop);
}

function updatePlayhead() {
    const playhead = document.getElementById('tl-playhead');
    const timeDisplay = document.getElementById('tl-time-display');

    if (playhead) {
        const currentDuration = getDuration();
        const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);
        const position = (currentTime / currentDuration) * timelineWidth;
        playhead.style.left = `${position}px`;
    }

    if (timeDisplay) {
        const seconds = Math.floor(currentTime / 1000);
        const ms = Math.floor((currentTime % 1000) / 10);
        timeDisplay.innerText = `${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}.${((currentTime % 10) * 10).toString().padStart(2, '0')}`;
    }
}

export function timelineZoom(delta) {
    zoomLevel = Math.max(0.5, Math.min(5, zoomLevel + delta));
    renderTimelineTracks();
    updatePlayhead();
}

export function addKeyframe(layerId, event) {
    if (!state.currentSlide) return;

    const track = event.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const timelineWidth = Math.max(getDuration() * zoomLevel / 100, 800);
    const time = (clickX / timelineWidth) * getDuration();

    const layer = state.currentSlide.layers.find(l => l.id === layerId);
    if (!layer) return;

    if (!layer.keyframes) layer.keyframes = [];

    // Add keyframe
    layer.keyframes.push({
        time: Math.round(time),
        properties: { ...layer.style } // Copy current style
    });

    // Sort keyframes by time
    layer.keyframes.sort((a, b) => a.time - b.time);

    renderTimelineTracks();
}

// --- INTERACTION LOGIC ---

let dragItem = null;
let dragStartX = 0;
let dragStartLeft = 0;
let dragStartWidth = 0;
let dragLayerId = null;
let dragAction = null; // 'move', 'resize-left', 'resize-right'

export function startBarDrag(event, layerId, action) {
    if (event.button !== 0) return; // Only left click

    dragLayerId = layerId;
    dragAction = action;
    dragStartX = event.clientX;

    const bar = event.currentTarget.closest('.timeline-layer-bar') || event.currentTarget;
    dragStartLeft = parseFloat(bar.style.left) || 0;
    dragStartWidth = parseFloat(bar.style.width) || 0;

    document.addEventListener('mousemove', onBarDrag);
    document.addEventListener('mouseup', endBarDrag);
}

function endBarDrag() {
    document.removeEventListener('mousemove', onBarDrag);
    document.removeEventListener('mouseup', endBarDrag);
    dragLayerId = null;
    dragAction = null;
}

function onBarDrag(event) {
    if (!dragLayerId) return;

    const deltaX = event.clientX - dragStartX;
    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);
    const layer = state.currentSlide.layers.find(l => l.id === dragLayerId);
    if (!layer) return;

    if (dragAction === 'move') {
        let newLeft = dragStartLeft + deltaX;
        // Constrain to timeline bounds
        newLeft = Math.max(0, Math.min(newLeft, timelineWidth - dragStartWidth));

        // Update model
        layer.startTime = Math.round((newLeft / timelineWidth) * currentDuration);

        // Update UI immediately for smoothness
        renderTimelineTracks();
    } else if (dragAction === 'resize-right') {
        let newWidth = dragStartWidth + deltaX;
        newWidth = Math.max(10, Math.min(newWidth, timelineWidth - dragStartLeft)); // Min width 10px

        layer.duration = Math.round((newWidth / timelineWidth) * currentDuration);
        renderTimelineTracks();
    } else if (dragAction === 'resize-left') {
        let newLeft = dragStartLeft + deltaX;
        let newWidth = dragStartWidth - deltaX;

        if (newLeft >= 0 && newWidth >= 10) {
            layer.startTime = Math.round((newLeft / timelineWidth) * currentDuration);
            layer.duration = Math.round((newWidth / timelineWidth) * currentDuration);
            renderTimelineTracks();
        }
    }
}

// --- DRAG AND DROP REORDERING ---
let draggedLayerIndex = null;

export function onLayerDragStart(event, index) {
    draggedLayerIndex = index;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

export function onLayerDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    target.classList.remove('drag-over-top', 'drag-over-bottom');
    if (event.clientY < midY) {
        target.classList.add('drag-over-top');
    } else {
        target.classList.add('drag-over-bottom');
    }
}

export function onLayerDragLeave(event) {
    event.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
}

export function onLayerDrop(event, targetIndex) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging');

    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex) return;

    const layers = state.currentSlide.layers;
    const [movedLayer] = layers.splice(draggedLayerIndex, 1);
    layers.splice(targetIndex, 0, movedLayer);

    // Re-render everything to reflect new order (z-index is implicit by array order)
    renderTimelineTracks();
    renderCanvas();
    renderLayerList(); // Update sidebar list too
}

function getLayerIcon(type) {
    const icons = {
        heading: 'title',
        text: 'text_fields',
        image: 'image',
        video: 'play_circle',
        icon: 'star',
        button: 'smart_button'
    };
    return icons[type] || 'layers';
}

function getLayerTypeName(type) {
    const names = {
        heading: 'Heading',
        text: 'Text',
        image: 'Image',
        video: 'Video',
        icon: 'Icon',
        button: 'Button'
    };
    return names[type] || 'Layer';
}
