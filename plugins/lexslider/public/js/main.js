console.log("[LexSlider] Loading main.js...");

import { initElements, loadSliders, switchView, loadView, state, API_BASE, elements, setDevice } from './modules/EditorCore.js?v=3.0.10';
import { renderCanvas, selectLayer } from './modules/CanvasRenderer.js';
import { renderLayerList, addLayer, deleteLayer } from './modules/LayerManager.js';
import { renderProperties, updateLayerStyle, updateLayerContent, updateLayerProp, updateSlideProperty, toggleTextDecoration, applyCustomCSS, formatText } from './modules/PropertyInspector.js';
import { initTimeline, renderTimelineTracks, timelineZoom, addKeyframe, startBarDrag, onLayerDragStart, onLayerDragOver, onLayerDragLeave, onLayerDrop, updateSlideDuration } from './modules/TimelineManager.js';

// Global Namespace for HTML event handlers
let assetCallback = null;

window.LexSlider = {
    setDevice, // Expose Device Switcher
    addLayer,
    deleteLayer,
    renderProperties,
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
    timelineZoom,
    addKeyframe,
    startBarDrag,
    onLayerDragStart,
    onLayerDragOver,
    onLayerDragLeave,
    onLayerDrop,
    updateSlideDuration,

    // Asset Manager
    openAssetManager: (callback) => {
        assetCallback = callback;
        document.getElementById('modal-asset-manager').classList.remove('hidden');
    },
    closeAssetManager: () => {
        document.getElementById('modal-asset-manager').classList.add('hidden');
        assetCallback = null;
    },
    switchAssetTab: (tab) => {
        document.getElementById('asset-tab-url').classList.toggle('hidden', tab !== 'url');
        document.getElementById('asset-tab-library').classList.toggle('hidden', tab !== 'library');
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

    // Preview
    preview: () => {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-container');
        modal.classList.remove('hidden');

        // Simple Preview Render (Clone of Canvas)
        // In a real scenario, this would initialize the frontend runtime
        container.innerHTML = '';

        const previewFrame = document.createElement('iframe');
        previewFrame.style.width = '100%';
        previewFrame.style.height = '100%';
        previewFrame.style.border = 'none';
        container.appendChild(previewFrame);

        const doc = previewFrame.contentWindow.document;

        // Inject Styles
        const styles = document.querySelectorAll('link[rel="stylesheet"], style');
        styles.forEach(s => doc.head.appendChild(s.cloneNode(true)));

        // Inject Content
        const canvasContent = document.getElementById('canvas-content').innerHTML;
        doc.body.innerHTML = `
            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000;">
                <div style="position:relative; width:${state.currentSlider.width}px; height:${state.currentSlider.height}px; overflow:hidden; background:${state.currentSlide.background_color || '#fff'};">
                    ${canvasContent}
                </div>
            </div>
        `;
    }
};

// --- INITIALIZATION ---
async function init() {
    console.log("[LexSlider 3.0] Initializing Modular Editor...");

    // Load Dashboard View by default
    await loadView('dashboard');

    // Init Timeline (Logic only, UI attached later)
    initTimeline();
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

        // Reload slider to ensure state consistency (optional, but safer for now)
        // await openSlider(state.currentSlider.id); 
        // Optimization: Don't reload everything, just switch to new slide
        state.currentSlide = newSlide;
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();

        // alert("Slide added successfully!"); // Removed per user request

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
        addLayer(type);
        renderTimelineTracks();
    }
};

// Add to LexSlider global object
window.LexSlider.addSlide = addSlide;
window.LexSlider.switchSlide = switchSlide;
window.LexSlider.deleteSlide = deleteSlide;



