
import { state, elements } from './EditorCore.js?v=3.0.28';
import { renderCanvas } from './CanvasRenderer.js';

let isPlaying = false;
let animationFrameId = null;
let startTime = 0;
let zoomLevel = 1; // pixels per 100ms
let currentTime = 0;
let playbackSpeed = 1.0;
let lastFrameTime = 0;

export function setPlaybackSpeed(speed) {
    playbackSpeed = parseFloat(speed);
}

function getDuration() {
    return (state.currentSlide && state.currentSlide.duration) ? state.currentSlide.duration : 5000;
}

export function updateSlideDuration(value) {
    if (!state.currentSlide) return;
    state.currentSlide.duration = parseInt(value) || 5000;
    renderTimelineTracks();
}

export function toggleGroupExpand(layerId) {
    const layer = state.currentSlide.layers.find(l => l.id === layerId);
    if (layer) {
        layer.expanded = !layer.expanded;
        renderTimelineTracks();
    }
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
    const rulerWrapper = document.getElementById('tl-ruler-container');

    if (treeContainer && tracksScroll) {
        let isSyncing = false;

        // Tree -> Tracks
        treeContainer.onscroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            tracksScroll.scrollTop = treeContainer.scrollTop;
            requestAnimationFrame(() => { isSyncing = false; });
        };

        // Tracks -> Tree & Ruler
        tracksScroll.onscroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            treeContainer.scrollTop = tracksScroll.scrollTop;
            if (rulerWrapper) rulerWrapper.scrollLeft = tracksScroll.scrollLeft;
            requestAnimationFrame(() => { isSyncing = false; });
        };
    }

    // Scrubbing on Ruler
    const rulerContainer = document.getElementById('tl-ruler-container');
    if (rulerContainer) {
        rulerContainer.onmousedown = (e) => {
            const rect = rulerContainer.getBoundingClientRect();
            const offsetX = e.clientX - rect.left + rulerContainer.scrollLeft;
            const currentDuration = getDuration();
            const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);

            currentTime = Math.max(0, Math.min((offsetX / timelineWidth) * currentDuration, currentDuration));
            updatePlayhead();

            // Allow dragging
            const onMouseMove = (ev) => {
                const moveX = ev.clientX - rect.left + rulerContainer.scrollLeft;
                currentTime = Math.max(0, Math.min((moveX / timelineWidth) * currentDuration, currentDuration));
                updatePlayhead();
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    }

    // Initial Render
    renderTimelineTracks();
}

export function renderTimelineTracks() {
    const treeContainer = document.getElementById('timeline-tree');
    const tracksContainer = document.getElementById('tl-tracks');

    if (!treeContainer || !tracksContainer) return;
    if (!state.currentSlider) return;

    // Preserve Scroll Position
    const savedScrollTop = treeContainer.scrollTop;
    const tracksScroll = document.getElementById('tl-tracks-scroll');
    const savedScrollLeft = tracksScroll ? tracksScroll.scrollLeft : 0;

    // 1. Render Tree View (Slides -> Layers)
    let treeHTML = '';
    let tracksHTML = '';

    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);

    // Helper to render layers recursively
    const renderLayerRecursive = (layer, depth = 0) => {
        const isSelected = state.selectedLayer === layer;
        const paddingLeft = 8 + (depth * 16); // Indent
        const isGroup = layer.type === 'group' || (layer.children && layer.children.length > 0);
        const expandIcon = layer.expanded ? 'expand_more' : 'chevron_right';

        // Layer Row
        treeHTML += `
            <div class="tree-item h-9 flex items-center px-2 border-b border-base-300 ${isSelected ? 'bg-base-200' : ''}"
                 style="padding-left: ${paddingLeft}px;"
                 data-layer-id="${layer.id}"
                 data-layer-type="${layer.type}"
                 onclick="window.LexSlider.selectLayerById(${layer.id})"
                 draggable="true"
                 ondragstart="window.LexSlider.onLayerDragStart(event, ${layer.id})"
                 ondragover="window.LexSlider.onLayerDragOver(event)"
                 ondragleave="window.LexSlider.onLayerDragLeave(event)"
                 ondrop="window.LexSlider.onLayerDrop(event, ${layer.id})">
                
                ${isGroup ?
                `<span class="material-icons-round icon text-xs mr-2 cursor-pointer hover:text-white" onclick="event.stopPropagation(); window.LexSlider.toggleGroupExpand(${layer.id})">${expandIcon}</span>` :
                `<span class="material-icons-round icon text-xs mr-2">${getLayerIcon(layer.type)}</span>`
            }
                
                <span class="flex-1 truncate text-xs">${layer.name || layer.type}</span>
                <div class="actions flex">
                    <button class="btn btn-ghost btn-xs btn-square ${layer.hidden ? 'text-warning' : ''}" 
                            onclick="event.stopPropagation(); window.LexSlider.toggleLayerVisibility(${layer.id})">
                        <span class="material-icons-round text-xs">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square ${layer.locked ? 'text-warning' : ''}" 
                            onclick="event.stopPropagation(); window.LexSlider.toggleLayerLock(${layer.id})">
                        <span class="material-icons-round text-xs">${layer.locked ? 'lock' : 'lock_open'}</span>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square text-error" 
                            onclick="event.stopPropagation(); window.LexSlider.deleteLayer(${layer.id})">
                        <span class="material-icons-round text-xs">delete</span>
                    </button>
                </div>
            </div>
        `;

        // Layer Track
        if (layer.startTime === undefined) layer.startTime = 0;
        if (layer.duration === undefined) layer.duration = currentDuration;

        const left = (layer.startTime / currentDuration) * timelineWidth;
        const width = (layer.duration / currentDuration) * timelineWidth;

        tracksHTML += `
            <div class="timeline-track-lane h-9 border-b border-base-300 relative ${isSelected ? 'bg-base-100' : ''}" 
                 style="width: ${timelineWidth}px;"
                 data-layer-id="${layer.id}"
                 onclick="window.LexSlider.addKeyframe(${layer.id}, event)">
                
                <!-- Duration Bar -->
                <div class="timeline-layer-bar ${isSelected ? 'selected' : ''}"
                     style="left: ${left}px; width: ${width}px;"
                     onmousedown="window.LexSlider.startBarDrag(event, ${layer.id}, 'move')">
                    <div class="bar-handle left" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-left')"></div>
                    <span class="text-[10px] px-1 truncate select-none text-base-content/70 font-mono" style="pointer-events: none;">
                        ${(layer.startTime / 1000).toFixed(1)}s - ${((layer.startTime + layer.duration) / 1000).toFixed(1)}s
                    </span>
                    <div class="bar-handle right" onmousedown="event.stopPropagation(); window.LexSlider.startBarDrag(event, ${layer.id}, 'resize-right')"></div>
                </div>

                <!-- Keyframes -->
                ${(layer.keyframes || []).map((kf, kfIndex) => `
                    <div class="timeline-keyframe ${state.selectedKeyframe === kf ? 'selected' : ''}" 
                         style="left: ${(kf.time / currentDuration) * timelineWidth}px;"
                         title="Keyframe at ${(kf.time / 1000).toFixed(2)}s"
                         onmousedown="window.LexSlider.startKeyframeDrag(event, ${layer.id}, ${kfIndex})"
                         onclick="event.stopPropagation()">
                    </div>
                `).join('')}
            </div>
        `;

        // Render Children
        if (layer.expanded && layer.children && layer.children.length > 0) {
            layer.children.forEach(childId => {
                const childLayer = state.currentSlide.layers.find(l => l.id === childId);
                if (childLayer) renderLayerRecursive(childLayer, depth + 1);
            });
        }
    };

    // Iterate Slides
    (state.currentSlider.slides || []).forEach((slide, slideIndex) => {
        const isActiveSlide = state.currentSlide && state.currentSlide.id === slide.id;

        // Slide Row
        treeHTML += `
            <div class="tree-item h-9 flex items-center px-2 border-b border-base-300 ${isActiveSlide ? 'bg-base-300 font-bold' : ''}" 
                 onclick="window.LexSlider.switchSlide(${slide.id})">
                <span class="material-icons-round icon text-primary mr-2">${isActiveSlide ? 'folder_open' : 'folder'}</span>
                <span class="flex-1 truncate text-xs">${slide.title || 'Slide ' + (slideIndex + 1)}</span>
                <div class="actions flex">
                     <button class="btn btn-ghost btn-xs btn-square" onclick="event.stopPropagation(); window.LexSlider.deleteSlide(${slide.id})">
                        <span class="material-icons-round text-xs">delete</span>
                    </button>
                </div>
            </div>
        `;

        // Slide Track Placeholder
        tracksHTML += `<div class="timeline-track-lane h-9 border-b border-base-300 bg-base-300/50" style="width: ${timelineWidth}px;"></div>`;

        // If Active, Render Root Layers (layers with no parentId)
        if (isActiveSlide && slide.layers) {
            const rootLayers = slide.layers.filter(l => !l.parentId);
            rootLayers.forEach(layer => renderLayerRecursive(layer, 1));
        }
    });

    treeContainer.innerHTML = treeHTML;
    tracksContainer.innerHTML = tracksHTML;

    // Restore Scroll Position
    treeContainer.scrollTop = savedScrollTop;
    if (tracksScroll) {
        tracksScroll.scrollTop = savedScrollTop;
        tracksScroll.scrollLeft = savedScrollLeft;
    }

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

    startTime = Date.now();
    lastFrameTime = Date.now();
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

    const now = Date.now();
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    currentTime += dt * playbackSpeed;

    if (currentTime > getDuration()) {
        currentTime = 0;
    }

    updatePlayhead();
    animationFrameId = requestAnimationFrame(loop);
}

function updatePlayhead() {
    const playhead = document.getElementById('tl-playhead');
    const timeDisplay = document.getElementById('tl-time-display');

    // Sync state
    state.currentTime = currentTime;

    // Trigger Canvas Update to reflect visibility
    if (window.LexSlider && window.LexSlider.renderCanvas) {
        window.LexSlider.renderCanvas();
    }

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
    const offsetX = event.offsetX;

    const timelineWidth = Math.max(getDuration() * zoomLevel / 100, 800);
    const time = (offsetX / timelineWidth) * getDuration();

    const layer = state.currentSlide.layers.find(l => l.id === layerId);
    if (!layer) return;

    if (!layer.keyframes) layer.keyframes = [];

    // Check if keyframe exists at this time (within small tolerance)
    const existingIndex = layer.keyframes.findIndex(kf => Math.abs(kf.time - time) < 50);
    if (existingIndex !== -1) {
        // Update existing
        layer.keyframes[existingIndex].properties = { ...layer.style };
        selectKeyframe(layerId, existingIndex);
    } else {
        const newKf = {
            time: Math.round(time),
            properties: { ...layer.style } // Copy current style
        };
        layer.keyframes.push(newKf);

        // Sort keyframes by time
        layer.keyframes.sort((a, b) => a.time - b.time);

        // Find index of new kf to select it
        const newIndex = layer.keyframes.indexOf(newKf);
        selectKeyframe(layerId, newIndex);
    }

    renderTimelineTracks();
}

// --- INTERACTION LOGIC ---

let dragItem = null;
let dragStartX = 0;
let dragStartLeft = 0;
let dragStartWidth = 0;
let dragLayerId = null;
let dragAction = null; // 'move', 'resize-left', 'resize-right'
let snapEnabled = false;

export function toggleTimelineSnap() {
    snapEnabled = !snapEnabled;
    const btn = document.getElementById('tl-btn-snap');
    if (btn) {
        const icon = btn.querySelector('span');
        if (snapEnabled) {
            btn.classList.add('text-primary');
            icon.classList.remove('opacity-50');
        } else {
            btn.classList.remove('text-primary');
            icon.classList.add('opacity-50');
        }
    }
}

function calculateSnap(time, currentDuration) {
    const snapLine = document.getElementById('tl-snap-line');
    if (!snapEnabled) {
        if (snapLine) snapLine.classList.add('hidden');
        return time;
    }

    const snapThreshold = 100; // ms
    const gridInterval = 500; // ms
    let snappedTime = time;
    let isSnapped = false;

    // Snap to Grid
    const distToGrid = time % gridInterval;
    if (distToGrid < snapThreshold) {
        snappedTime = time - distToGrid;
        isSnapped = true;
    } else if (gridInterval - distToGrid < snapThreshold) {
        snappedTime = time + (gridInterval - distToGrid);
        isSnapped = true;
    }

    // Snap to other layers (start/end)
    if (time < snapThreshold) {
        snappedTime = 0;
        isSnapped = true;
    }
    if (Math.abs(time - currentDuration) < snapThreshold) {
        snappedTime = currentDuration;
        isSnapped = true;
    }

    // Update Visuals
    if (snapLine) {
        if (isSnapped) {
            const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);
            const position = (snappedTime / currentDuration) * timelineWidth;
            snapLine.style.left = `${position}px`;
            snapLine.classList.remove('hidden');
        } else {
            snapLine.classList.add('hidden');
        }
    }

    return snappedTime;
}

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
    const snapLine = document.getElementById('tl-snap-line');
    if (snapLine) snapLine.classList.add('hidden');
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
        newLeft = Math.max(0, Math.min(newLeft, timelineWidth - dragStartWidth));
        let newStartTime = (newLeft / timelineWidth) * currentDuration;
        newStartTime = calculateSnap(newStartTime, currentDuration);
        layer.startTime = Math.round(newStartTime);
        renderTimelineTracks();
    } else if (dragAction === 'resize-right') {
        let newWidth = dragStartWidth + deltaX;
        newWidth = Math.max(10, Math.min(newWidth, timelineWidth - dragStartLeft));
        let newDuration = (newWidth / timelineWidth) * currentDuration;
        const endTime = layer.startTime + newDuration;
        const snappedEndTime = calculateSnap(endTime, currentDuration);
        newDuration = snappedEndTime - layer.startTime;
        layer.duration = Math.round(newDuration);
        renderTimelineTracks();
    } else if (dragAction === 'resize-left') {
        let newLeft = dragStartLeft + deltaX;
        let newWidth = dragStartWidth - deltaX;
        if (newLeft >= 0 && newWidth >= 10) {
            let newStartTime = (newLeft / timelineWidth) * currentDuration;
            newStartTime = calculateSnap(newStartTime, currentDuration);
            const oldEndTime = layer.startTime + layer.duration;
            const newDuration = oldEndTime - newStartTime;
            if (newDuration > 0) {
                layer.startTime = Math.round(newStartTime);
                layer.duration = Math.round(newDuration);
                renderTimelineTracks();
            }
        }
    }
}

// --- KEYFRAME INTERACTION ---

let dragKeyframeIndex = null;

export function startKeyframeDrag(event, layerId, index) {
    event.stopPropagation();
    dragLayerId = layerId;
    dragKeyframeIndex = index;
    dragStartX = event.clientX;

    // Select keyframe
    selectKeyframe(layerId, index);

    document.addEventListener('mousemove', onKeyframeDrag);
    document.addEventListener('mouseup', endKeyframeDrag);
}

function onKeyframeDrag(event) {
    if (dragLayerId === null || dragKeyframeIndex === null) return;

    const layer = state.currentSlide.layers.find(l => l.id === dragLayerId);
    if (!layer || !layer.keyframes) return;

    const currentDuration = getDuration();
    const timelineWidth = Math.max(currentDuration * zoomLevel / 100, 800);

    const track = document.querySelector(`.timeline-track-lane[data-layer-id="${dragLayerId}"]`);
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const offsetX = event.clientX - rect.left + track.scrollLeft;

    let newTime = (offsetX / timelineWidth) * currentDuration;
    newTime = Math.max(0, Math.min(newTime, currentDuration));

    // Snap
    newTime = calculateSnap(newTime, currentDuration);

    layer.keyframes[dragKeyframeIndex].time = Math.round(newTime);

    renderTimelineTracks();
}

function endKeyframeDrag() {
    if (dragLayerId !== null && dragKeyframeIndex !== null) {
        const layer = state.currentSlide.layers.find(l => l.id === dragLayerId);
        if (layer && layer.keyframes) {
            layer.keyframes.sort((a, b) => a.time - b.time);
            // Re-select based on new index after sort?
            // For now, just deselect or keep as is (reference might be lost if we don't track it)
            // But since we store object reference in state.selectedKeyframe, it should be fine.
        }
    }

    document.removeEventListener('mousemove', onKeyframeDrag);
    document.removeEventListener('mouseup', endKeyframeDrag);
    dragLayerId = null;
    dragKeyframeIndex = null;
    const snapLine = document.getElementById('tl-snap-line');
    if (snapLine) snapLine.classList.add('hidden');
    renderTimelineTracks();
}

export function selectKeyframe(layerId, index) {
    const layer = state.currentSlide.layers.find(l => l.id === layerId);
    if (!layer) return;

    state.selectedLayer = layer;
    state.selectedKeyframe = layer.keyframes[index];

    renderTimelineTracks();
    if (window.LexSlider.renderProperties) window.LexSlider.renderProperties();
}

// --- DRAG AND DROP REORDERING ---
// --- DRAG AND DROP REORDERING ---
let draggedLayerId = null;
let dropAction = null; // 'before', 'after', 'inside'

export function onLayerDragStart(event, layerId) {
    draggedLayerId = layerId;
    event.target.classList.add('opacity-50');
    event.dataTransfer.effectAllowed = 'move';
}

export function onLayerDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const relY = event.clientY - rect.top;
    const height = rect.height;
    const layerType = target.dataset.layerType;

    target.classList.remove('border-t-2', 'border-b-2', 'border-primary', 'bg-primary/20');

    // Check if target is a group
    if (layerType === 'group') {
        // Allow 'inside' zone in the middle 50%
        if (relY > height * 0.25 && relY < height * 0.75) {
            target.classList.add('bg-primary/20');
            dropAction = 'inside';
            return;
        }
    }

    if (relY < height / 2) {
        target.classList.add('border-t-2', 'border-primary');
        dropAction = 'before';
    } else {
        target.classList.add('border-b-2', 'border-primary');
        dropAction = 'after';
    }
}

export function onLayerDragLeave(event) {
    event.currentTarget.classList.remove('border-t-2', 'border-b-2', 'border-primary', 'bg-primary/20');
}

export function onLayerDrop(event, targetId) {
    event.preventDefault();
    event.currentTarget.classList.remove('border-t-2', 'border-b-2', 'border-primary', 'bg-primary/20', 'opacity-50');

    if (draggedLayerId === null || draggedLayerId === targetId) return;

    const layers = state.currentSlide.layers;
    const draggedLayer = layers.find(l => l.id === draggedLayerId);
    const targetLayer = layers.find(l => l.id === targetId);

    if (!draggedLayer || !targetLayer) return;

    // Prevent dropping a group into itself or its children
    if (draggedLayer.type === 'group') {
        let parent = targetLayer;
        while (parent) {
            if (parent.id === draggedLayer.id) return; // Cycle detected
            if (parent.parentId) {
                parent = layers.find(l => l.id === parent.parentId);
            } else {
                parent = null;
            }
        }
    }

    // Remove from old parent
    if (draggedLayer.parentId) {
        const oldParent = layers.find(l => l.id === draggedLayer.parentId);
        if (oldParent && oldParent.children) {
            oldParent.children = oldParent.children.filter(id => id !== draggedLayerId);
        }
    }
    draggedLayer.parentId = null;

    if (dropAction === 'inside') {
        // Add to new parent
        if (!targetLayer.children) targetLayer.children = [];
        targetLayer.children.push(draggedLayerId);
        draggedLayer.parentId = targetLayer.id;
        targetLayer.expanded = true;
    } else {
        // Reorder logic
        if (targetLayer.parentId) {
            // Target is a child
            const parent = layers.find(l => l.id === targetLayer.parentId);
            if (parent) {
                draggedLayer.parentId = parent.id;
                if (!parent.children) parent.children = [];
                const idx = parent.children.indexOf(targetId);
                if (dropAction === 'before') {
                    parent.children.splice(idx, 0, draggedLayerId);
                } else {
                    parent.children.splice(idx + 1, 0, draggedLayerId);
                }
            }
        } else {
            // Target is root
            // Move in main array
            const fromIdx = layers.indexOf(draggedLayer);
            if (fromIdx > -1) layers.splice(fromIdx, 1);

            const newToIdx = layers.indexOf(targetLayer);
            if (dropAction === 'before') {
                layers.splice(newToIdx, 0, draggedLayer);
            } else {
                layers.splice(newToIdx + 1, 0, draggedLayer);
            }
        }
    }

    renderTimelineTracks();
    renderCanvas();
    draggedLayerId = null;
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
