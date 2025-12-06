
console.log("[LexSlider] Loading main.js...");

import { initElements, loadSliders, switchView, loadView, state, API_BASE, elements, setDevice } from './modules/EditorCore.js?v=3.0.28';
import { renderCanvas, selectLayer, setPreviewAnimation } from './modules/CanvasRenderer.js?v=3.0.28';
import { renderLayerList, addLayer, deleteLayer, groupLayers } from './modules/LayerManager.js?v=3.0.28';
import { renderProperties, updateLayerStyle, updateLayerContent, updateLayerProp, updateSlideProperty, toggleTextDecoration, applyCustomCSS, formatText, setActiveTab, deselectKeyframe, updateKeyframeEasing } from './modules/PropertyInspector.js?v=3.0.28';
import { initTimeline, renderTimelineTracks, timelineZoom, addKeyframe, startBarDrag, onLayerDragStart, onLayerDragOver, onLayerDragLeave, onLayerDrop, updateSlideDuration, startKeyframeDrag, toggleTimelineSnap, setPlaybackSpeed, toggleGroupExpand } from './modules/TimelineManager.js?v=3.0.28';
import { getAnimationCSS } from './modules/AnimationPresets.js?v=3.0.28';
import { pushState, undo, redo, canUndo, canRedo, clearHistory, beginBatch, endBatch } from './modules/HistoryManager.js?v=3.0.28';

// Global Namespace for HTML event handlers
let assetCallback = null;

window.LexSlider = {
    setDevice, // Expose Device Switcher
    addLayer,
    deleteLayer,
    groupLayers,
    renderProperties,
    updateKeyframeEasing,
    toggleGroupExpand,
    previewAnimation: setPreviewAnimation,
    renderLayerList,
    renderCanvas,
    selectLayerById: (id) => {
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            selectLayer(layer);
            renderTimelineTracks(); // Highlight track
        }
    },
    toggleLayerVisibility: (id) => {
        pushState('Toggle Visibility');
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            layer.hidden = !layer.hidden;
            renderCanvas();
            renderLayerList();
            renderTimelineTracks();
        }
    },
    toggleLayerLock: (id) => {
        pushState('Toggle Lock');
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            layer.locked = !layer.locked;
            renderLayerList();
        }
    },
    updateLayerStyle,
    updateLayerContent,
    updateLayerProp,
    updateSlideProperty,
    toggleTextDecoration,
    applyCustomCSS,
    formatText,
    setActiveTab,
    deselectKeyframe,
    timelineZoom,
    addKeyframe,
    startBarDrag,
    startKeyframeDrag,
    toggleTimelineSnap,
    onLayerDragStart,
    onLayerDragOver,
    onLayerDragLeave,
    onLayerDrop,
    updateSlideDuration,
    setPlaybackSpeed,

    // History (Undo/Redo)
    undo,
    redo,
    canUndo,
    canRedo,
    pushState,
    beginBatch,
    endBatch,
    openAssetManager: (callback) => {
        // Use global CMS MediaPicker with permissions
        if (window.CMS?.MediaPicker) {
            window.CMS.MediaPicker.open({
                filter: 'image',
                multiple: false,
                onSelect: (media) => {
                    // media is { url, id, ... }
                    if (media && media.url) {
                        callback(media.url);
                    }
                }
            });
        } else {
            console.error('CMS MediaPicker not available');
            alert('Media Library permissions required');
        }
    },
    closeAssetManager: () => {
        document.getElementById('modal-asset-manager').classList.add('hidden');
        assetCallback = null;
    },
    switchAssetTab: (tab) => {
        document.getElementById('asset-tab-url').classList.toggle('hidden', tab !== 'url');
        document.getElementById('asset-tab-library').classList.toggle('hidden', tab !== 'library');

        // Update tab active states
        const tabs = document.querySelectorAll('#modal-asset-manager .tab');
        tabs.forEach(t => t.classList.remove('tab-active'));
        if (tab === 'url') tabs[0]?.classList.add('tab-active');
        if (tab === 'library') {
            tabs[1]?.classList.add('tab-active');
            window.LexSlider.loadMediaLibrary();
        }
    },
    loadMediaLibrary: async () => {
        const container = document.getElementById('media-library-content');
        if (!container) return;

        // Show loading
        container.innerHTML = `
            <div class="col-span-4 flex items-center justify-center py-8">
                <span class="loading loading-spinner loading-md"></span>
                <span class="ml-2 text-sm opacity-70">Cargando biblioteca...</span>
            </div>
        `;

        try {
            const res = await fetch('/api/media?limit=50', { credentials: 'include' });
            if (!res.ok) throw new Error('Error al cargar medios');

            const data = await res.json();
            const mediaItems = Array.isArray(data) ? data : (data.media || data.rows || []);

            // Filter only images
            const images = mediaItems.filter(m => m.type === 'image');

            if (images.length === 0) {
                container.innerHTML = `
                    <div class="col-span-4 text-center py-8">
                        <span class="material-icons-round text-4xl opacity-30">image_not_supported</span>
                        <p class="text-xs opacity-50 mt-2">No hay imágenes en la biblioteca</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = images.map(media => `
                <div class="aspect-square bg-[#111] border border-[#333] cursor-pointer hover:border-primary relative group"
                     onclick="window.LexSlider.selectAsset('${media.url}')">
                    <img src="${media.url}" alt="${media.originalFilename || ''}" 
                         class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity">
                    <div class="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        ${media.originalFilename || media.filename}
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error('[LexSlider] Error loading media library:', err);
            container.innerHTML = `
                <div class="col-span-4 text-center py-8 text-error">
                    <span class="material-icons-round text-4xl">error_outline</span>
                    <p class="text-xs mt-2">Error al cargar la biblioteca de medios</p>
                </div>
            `;
        }
    },
    selectAsset: (url) => {
        document.getElementById('asset-url-input').value = url;
    },
    confirmAsset: () => {
        const url = document.getElementById('asset-url-input').value;
        if (url && assetCallback) {
            assetCallback(url);
        }
        window.LexSlider.closeAssetManager();
    },

    // Copy to Clipboard utility
    copyToClipboard: (text, buttonEl) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const icon = buttonEl.querySelector('.material-icons-round');
            if (icon) {
                const originalText = icon.textContent;
                icon.textContent = 'check';
                icon.classList.add('text-success');
                setTimeout(() => {
                    icon.textContent = originalText;
                    icon.classList.remove('text-success');
                }, 1500);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    },

    preview: () => {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-container');
        modal.classList.remove('hidden');

        container.innerHTML = '';

        const previewFrame = document.createElement('iframe');
        previewFrame.style.width = '100%';
        previewFrame.style.height = '100%';
        previewFrame.style.border = 'none';
        container.appendChild(previewFrame);

        // Prepare Content
        const slide = state.currentSlide;
        if (!slide) return;

        const layersToRender = state.mode === 'global' ? (state.globalLayers || []) : (slide.layers || []);

        // Sort by z-index
        layersToRender.sort((a, b) => {
            const zA = parseInt(a.style.zIndex || 1);
            const zB = parseInt(b.style.zIndex || 1);
            return zA - zB;
        });

        let layersHTML = '';
        layersToRender.forEach(layer => {
            if (layer.hidden) return;

            // Calculate styles
            let style = { ...layer.style };
            // Apply device specific overrides if needed (default to desktop for preview or use current device?)
            // Let's use current device state for WYSIWYG
            if (state.device === 'tablet' || state.device === 'mobile') {
                if (layer.style.tablet) style = { ...style, ...layer.style.tablet };
            }
            if (state.device === 'mobile') {
                if (layer.style.mobile) style = { ...style, ...layer.style.mobile };
            }

            // Convert style object to string
            const styleString = Object.entries(style).map(([k, v]) => {
                if (typeof v === 'object' && v !== null) return '';
                // Skip animation props here, we apply them separately to ensure valid CSS
                if (['animationIn', 'animationDuration', 'animationDelay'].includes(k)) return '';
                const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${key}:${v}`;
            }).join(';');

            // Animation Styles
            let animStyle = '';
            if (style.animationIn && style.animationIn !== 'none') {
                animStyle = `animation: ${style.animationIn} ${style.animationDuration || '1s'} ease-out ${style.animationDelay || '0s'} both;`;
            }

            let content = '';
            if (layer.type === 'heading') content = `<h1>${layer.content.text}</h1>`;
            else if (layer.type === 'text') content = `<p>${layer.content.text}</p>`;
            else if (layer.type === 'button') content = `<a href="${layer.content.link || '#'}">${layer.content.text}</a>`;
            else if (layer.type === 'image') content = `<img src="${layer.content.src}" style="width:100%;height:100%;object-fit:cover;">`;
            else if (layer.type === 'video') content = `<iframe width="100%" height="100%" src="${layer.content.src}" frameborder="0" allowfullscreen></iframe>`;
            else if (layer.type === 'icon') content = `<span class="material-icons-round" style="font-size: inherit; color: inherit;">${layer.content.icon}</span>`;

            layersHTML += `<div style="position:absolute; ${styleString} ${animStyle}">${content}</div>`;
        });

        // Collect Styles
        let css = '';
        document.querySelectorAll('style').forEach(s => css += s.innerHTML);

        const animationCSS = `
            ${getAnimationCSS()}
            @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
            body { margin: 0; overflow: hidden; }
        `;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
                <style>${animationCSS}</style>
                <!-- Import Google Fonts if needed, or rely on parent -->
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
            </head>
            <body>
                <div style="width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; background:#000;">
                    <div style="position:relative; width:${state.currentSlider.width}px; height:${state.currentSlider.height}px; overflow:hidden;">
                        <!-- Background -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; 
                                    background:${slide.background_image ? `url(${slide.background_image})` : (slide.background_color || '#fff')}; 
                                    background-size: cover; background-position: center;
                                    animation: ${slide.ken_burns ? 'kenBurns 20s ease-in-out infinite alternate' : 'none'};">
                        </div>
                        <!-- Layers -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;">
                            ${layersHTML}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const doc = previewFrame.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();
    }
};

// Helper to update undo/redo button states
function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) {
        btnUndo.disabled = !canUndo();
        btnUndo.classList.toggle('btn-disabled', !canUndo());
    }
    if (btnRedo) {
        btnRedo.disabled = !canRedo();
        btnRedo.classList.toggle('btn-disabled', !canRedo());
    }
}

// Expose for external use
window.LexSlider.updateUndoRedoButtons = updateUndoRedoButtons;

// --- INITIALIZATION ---
async function init() {
    console.log("[LexSlider 3.0] Initializing Modular Editor...");

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
        // Skip if in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Delete Layer
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedLayer) {
                window.LexSlider.deleteLayer(state.selectedLayer.id);
            }
        }

        // Undo: Ctrl+Z
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            window.LexSlider.undo();
            updateUndoRedoButtons();
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
            (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            e.preventDefault();
            window.LexSlider.redo();
            updateUndoRedoButtons();
        }
    });

    // Check URL for slider ID
    const path = window.location.pathname;
    const match = path.match(/\/slider\/(\d+)/);

    if (match && match[1]) {
        await openSlider(match[1]);
    } else {
        await loadView('dashboard');
    }

    initTimeline();

    // Reveal App
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
}

function setupEventListeners() {
    // Global Listeners (Modals)
    if (elements.dashboard.btnCancelNew) {
        elements.dashboard.btnCancelNew.onclick = () => {
            elements.dashboard.modalNew.close();
        };
    }

    if (elements.dashboard.formNew) {
        elements.dashboard.formNew.onsubmit = handleCreateSlider;
    }
}

async function handleCreateSlider(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(`${API_BASE}/sliders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create');

        elements.dashboard.modalNew.classList.add('hidden');
        e.target.reset();
        await loadSliders();
    } catch (err) {
        alert(err.message);
    }
}

async function saveSlider() {
    if (!state.currentSlider) return;

    const btn = elements.editor.btnSave;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-icons-round spin">sync</span> Saving...';
    btn.disabled = true;

    try {
        // 1. Save Slider Properties
        await fetch(`${API_BASE}/sliders/${state.currentSlider.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.currentSlider)
        });

        // 2. Save Global Layers
        await fetch(`${API_BASE}/sliders/${state.currentSlider.id}/global-layers`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layers: state.globalLayers })
        });

        // 3. Save Slides
        for (const slide of state.currentSlider.slides) {
            await fetch(`${API_BASE}/slides/${slide.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slide)
            });
        }

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 500);

    } catch (err) {
        console.error(err);
        alert('Failed to save');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function addSlide() {
    console.log("Add Slide Clicked");
    if (!state.currentSlider) {
        console.error("No current slider in state");
        alert("Error: No slider selected");
        return;
    }

    try {
        console.log("Creating slide for slider:", state.currentSlider.id);
        const res = await fetch(`${API_BASE}/sliders/${state.currentSlider.id}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Slide ${state.currentSlider.slides ? state.currentSlider.slides.length + 1 : 1}`,
                background_image: '',
                ordering: state.currentSlider.slides ? state.currentSlider.slides.length : 0
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to add slide: ${errText}`);
        }

        const newSlide = await res.json();
        newSlide.layers = []; // Initialize layers array
        console.log("Slide created:", newSlide);

        if (!state.currentSlider.slides) state.currentSlider.slides = [];
        state.currentSlider.slides.push(newSlide);

        // Refresh slide list
        renderSlideList();

        state.currentSlide = newSlide;
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}


// We need to expose init to window or run it
// Run init immediately (module is deferred)
init();

// --- SLIDE MANAGEMENT ---
function renderSlideList() {
    const list = document.getElementById('slide-list'); // Ensure this ID exists in index.html
    if (!list) return;

    if (!state.currentSlider || !state.currentSlider.slides) {
        list.innerHTML = '<p style="padding:10px; color:#666;">No slides</p>';
        return;
    }

    list.innerHTML = state.currentSlider.slides.map((slide, index) => `
        <div class="layer-tree-item ${state.currentSlide && state.currentSlide.id === slide.id ? 'active' : ''}" 
             onclick="window.LexSlider.switchSlide(${slide.id})">
            <span class="material-icons-round icon">web_asset</span>
            <span style="flex:1;">${slide.title || 'Slide ' + (index + 1)}</span>
            <div class="layer-actions">
                <button class="btn-icon-xs" title="Delete" onclick="event.stopPropagation(); window.LexSlider.deleteSlide(${slide.id})">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function switchSlide(id) {
    const slide = state.currentSlider.slides.find(s => s.id === id);
    if (slide) {
        state.currentSlide = slide;
        state.mode = 'slide';
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();
        renderSlideList(); // Update active state
    }
}

async function deleteSlide(id) {
    console.log("Deleting slide:", id);
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
        await fetch(`${API_BASE}/slides/${id}`, { method: 'DELETE' });

        state.currentSlider.slides = state.currentSlider.slides.filter(s => s.id !== id);

        if (state.currentSlide && state.currentSlide.id === id) {
            state.currentSlide = state.currentSlider.slides[0] || null;
        }

        renderSlideList();
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();

    } catch (e) {
        alert('Failed to delete slide');
    }
}

async function openSlider(id) {
    try {
        const res = await fetch(`${API_BASE}/sliders/${id}`);
        const slider = await res.json();
        state.currentSlider = slider;

        // Fetch Global Layers
        const glRes = await fetch(`${API_BASE}/sliders/${id}/global-layers`);
        if (glRes.ok) state.globalLayers = await glRes.json();

        if (!state.currentSlider.slides) state.currentSlider.slides = [];
        state.currentSlide = state.currentSlider.slides[0] || null;

        // Update URL
        const basePath = window.location.pathname.split('/plugin/lexslider')[0];
        window.history.pushState({ sliderId: id }, '', `${basePath}/plugin/lexslider/slider/${id}`);

        await switchView('editor');

        // Note: loadView() now handles waiting for DOM and calling initElements()

        // Re-initialize timeline events (scroll sync, buttons) since DOM was replaced
        initTimeline();

        renderCanvas();
        renderLayerList();
        renderSlideList(); // Render slides
        renderProperties();
        renderTimelineTracks();
    } catch (e) {
        console.error(e);
    }
}

// Expose critical functions to window for HTML onclick handlers
window.openSlider = openSlider;
window.editor = {
    addLayer: (type) => {
        // Use imported addLayer from LayerManager.js which handles MediaPicker integration
        addLayer(type);
    }
};

// Add to LexSlider global object
window.LexSlider.addSlide = addSlide;
window.LexSlider.switchSlide = switchSlide;
window.LexSlider.deleteSlide = deleteSlide;
