import { state, elements } from './EditorCore.js?v=3.0.10';
import { renderCanvas } from './CanvasRenderer.js';
// import { renderLayerList } from './LayerManager.js';

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
    // Event Listeners for Controls
    const btnPlay = document.getElementById('tl-btn-play');
    const btnPause = document.getElementById('tl-btn-pause');
    const btnStop = document.getElementById('tl-btn-stop');

    if (btnPlay) btnPlay.onclick = playTimeline;
    if (btnPause) btnPause.onclick = pauseTimeline;
    if (btnStop) btnStop.onclick = stopTimeline;

    // Sync scroll between Tree and Tracks (Vertical)
    const treeContainer = document.getElementById('timeline-tree');
    const tracksScroll = document.getElementById('tl-tracks-scroll');

    if (treeContainer && tracksScroll) {
        treeContainer.addEventListener('scroll', () => {
            tracksScroll.scrollTop = treeContainer.scrollTop;
        });
        tracksScroll.addEventListener('scroll', () => {
            treeContainer.scrollTop = tracksScroll.scrollTop;
            // Also sync horizontal ruler
            const rulerWrapper = document.getElementById('tl-ruler-container');
            if (rulerWrapper) rulerWrapper.scrollLeft = tracksScroll.scrollLeft;
        });
    }

    // Initial Render
    renderTimelineTracks();
}

export function renderTimelineTracks() {
    const treeContainer = document.getElementById('timeline-tree');
    const tracksContainer = document.getElementById('tl-tracks');

    if (!treeContainer || !tracksContainer) return;
    if (!state.currentSlider) return;

    // 1. Render Tree View (Slides -> Layers)
    let treeHTML = '';
    let tracksHTML = '';

    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);

    // Iterate Slides
    (state.currentSlider.slides || []).forEach((slide, slideIndex) => {
        const isActiveSlide = state.currentSlide && state.currentSlide.id === slide.id;

        // Slide Row
        treeHTML += `
            <div class="tree-item ${isActiveSlide ? 'bg-base-300 font-bold' : ''}" 
                 onclick="window.LexSlider.switchSlide(${slide.id})">
                <span class="material-icons-round icon text-primary">${isActiveSlide ? 'folder_open' : 'folder'}</span>
                <span class="flex-1 truncate">${slide.title || 'Slide ' + (slideIndex + 1)}</span>
                <div class="actions">
                     <button class="btn btn-ghost btn-xs btn-square" onclick="event.stopPropagation(); window.LexSlider.deleteSlide(${slide.id})">
                        <span class="material-icons-round text-xs">delete</span>
                    </button>
                </div>
            </div>
        `;

        // Slide Track Placeholder (Empty or Summary)
        tracksHTML += `<div class="timeline-track-lane bg-base-300/50" style="width: ${timelineWidth}px;"></div>`;

        // If Active, Render Layers
        if (isActiveSlide && slide.layers) {
            slide.layers.forEach((layer, layerIndex) => {
                const isSelected = state.selectedLayer === layer;

                // Layer Row (Indented)
                treeHTML += `
                    <div class="tree-item pl-8 ${isSelected ? 'active' : ''}"
                         onclick="window.LexSlider.selectLayerById(${layer.id})"
                         draggable="true"
                         ondragstart="window.LexSlider.onLayerDragStart(event, ${layerIndex})"
                         ondragover="window.LexSlider.onLayerDragOver(event)"
                         ondragleave="window.LexSlider.onLayerDragLeave(event)"
                         ondrop="window.LexSlider.onLayerDrop(event, ${layerIndex})">
                        <span class="material-icons-round icon text-xs">${getLayerIcon(layer.type)}</span>
                        <span class="flex-1 truncate text-xs">${layer.name || layer.type}</span>
                        <div class="actions">
                            <button class="btn btn-ghost btn-xs btn-square ${layer.hidden ? 'text-warning' : ''}" 
                                    onclick="event.stopPropagation(); window.LexSlider.toggleLayerVisibility(${layer.id})">
                                <span class="material-icons-round text-xs">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                            </button>
                            <button class="btn btn-ghost btn-xs btn-square ${layer.locked ? 'text-warning' : ''}" 
                                    onclick="event.stopPropagation(); window.LexSlider.toggleLayerLock(${layer.id})">
                                <span class="material-icons-round text-xs">${layer.locked ? 'lock' : 'lock_open'}</span>
                            </button>
                        </div>
                    </div>
                `;

                // Layer Track
                // Ensure defaults
                if (layer.startTime === undefined) layer.startTime = 0;
                if (layer.duration === undefined) layer.duration = currentDuration;

                const left = (layer.startTime / currentDuration) * timelineWidth;
                const width = (layer.duration / currentDuration) * timelineWidth;

                tracksHTML += `
                    <div class="timeline-track-lane ${isSelected ? 'selected' : ''}" 
                         style="width: ${timelineWidth}px;"
                         data-layer-id="${layer.id}"
                         onclick="window.LexSlider.addKeyframe(${layer.id}, event)">
                        
                        <!-- Duration Bar -->
                        <div class="timeline-layer-bar ${isSelected ? 'selected' : ''}"
                             style="left: ${left}px; width: ${width}px;"
                             onmousedown="window.LexSlider.startBarDrag(event, ${layer.id}, 'move')">
                            <div class="bar-handle left" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-left')"></div>
                            <div class="bar-handle right" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-right')"></div>
                        </div>

                        <!-- Keyframes -->
                        ${(layer.keyframes || []).map(kf => `
                            <div class="timeline-keyframe" 
                                 style="left: ${(kf.time / currentDuration) * timelineWidth}px;"
                                 title="Keyframe at ${(kf.time / 1000).toFixed(2)}s">
                            </div>
                        `).join('')}
                    </div>
                `;
            });
        }
    });

    treeContainer.innerHTML = treeHTML;
    tracksContainer.innerHTML = tracksHTML;

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
    document.getElementById('tl-btn-play').classList.add('hidden');
    document.getElementById('tl-btn-pause').classList.remove('hidden');

    startTime = Date.now() - currentTime;
    loop();
}

function pauseTimeline() {
    isPlaying = false;
    document.getElementById('tl-btn-play').classList.remove('hidden');
    document.getElementById('tl-btn-pause').classList.add('hidden');
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

    // Prevent adding keyframe when clicking on bar or handle
    if (event.target.classList.contains('timeline-layer-bar') || event.target.classList.contains('bar-handle')) return;

    const track = event.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left + track.scrollLeft; // Adjust for scroll if needed, though track usually doesn't scroll horizontally itself, the container does.
    // Actually, event.offsetX is safer relative to target
    const offsetX = event.offsetX;

    const timelineWidth = Math.max(getDuration() * zoomLevel / 100, 800);
    const time = (offsetX / timelineWidth) * getDuration();

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
    event.target.classList.add('opacity-50');
    event.dataTransfer.effectAllowed = 'move';
}

export function onLayerDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    target.classList.remove('border-t-2', 'border-b-2', 'border-primary');
    if (event.clientY < midY) {
        target.classList.add('border-t-2', 'border-primary');
    } else {
        target.classList.add('border-b-2', 'border-primary');
    }
}

export function onLayerDragLeave(event) {
    event.currentTarget.classList.remove('border-t-2', 'border-b-2', 'border-primary');
}

export function onLayerDrop(event, targetIndex) {
    event.preventDefault();
    event.currentTarget.classList.remove('border-t-2', 'border-b-2', 'border-primary', 'opacity-50');

    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex) return;

    const layers = state.currentSlide.layers;
    const [movedLayer] = layers.splice(draggedLayerIndex, 1);
    layers.splice(targetIndex, 0, movedLayer);

    // Re-render everything to reflect new order (z-index is implicit by array order)
    renderTimelineTracks();
    renderCanvas();
    // renderLayerList(); // Deprecated in favor of tree view
}

function getLayerIcon(type) {
    const icons = {
        heading: 'title',
        text: 'text_fields',
        image: 'image',
        video: 'play_circle',
        icon: 'star',
        button: 'smart_button',
        shape: 'crop_square'
    };
    return icons[type] || 'layers';
}
