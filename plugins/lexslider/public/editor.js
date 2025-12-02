/**
 * Smart Slider 3 - Advanced Editor Logic
 * A robust SPA for managing sliders, slides, and layers.
 */

const API_BASE = '/plugins-runtime/lexslider';

// --- STATE MANAGEMENT ---
const state = {
    view: 'dashboard', // 'dashboard' | 'editor'
    sliders: [],
    currentSlider: null,
    currentSlide: null,
    selectedLayer: null,
    device: 'desktop', // desktop, tablet, mobile
    mode: 'slide', // 'slide' or 'global'
    globalLayers: [],
    isDirty: false
};

// --- DOM ELEMENTS ---
let elements = {};

function initElements() {
    elements = {
        app: document.getElementById('app'),
        views: {
            dashboard: document.getElementById('view-dashboard'),
            editor: document.getElementById('view-editor')
        },
        dashboard: {
            list: document.getElementById('slider-list'),
            btnNew: document.getElementById('btn-new-slider'),
            modalNew: document.getElementById('modal-new-slider'),
            formNew: document.getElementById('form-new-slider'),
            btnCancelNew: document.getElementById('btn-cancel')
        },
        editor: {
            sliderName: document.getElementById('editor-slider-name'),
            btnBack: document.getElementById('btn-back-dashboard'),
            btnSave: document.getElementById('btn-save-slider'),
            btnAddSlide: document.getElementById('btn-add-slide'),
            canvas: document.getElementById('editor-canvas'),
            canvasContent: document.getElementById('canvas-content'),
            layerList: document.getElementById('layer-list'),
            slideList: document.getElementById('slide-list'),
            propertyInspector: document.getElementById('property-inspector'),
            deviceButtons: document.querySelectorAll('.device-switcher button'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            panels: document.querySelectorAll('.sidebar-panel')
        }
    };
    console.log("[SmartSlider3] Elements initialized:", elements);
}

// --- INITIALIZATION ---
async function init() {
    console.log("[SmartSlider3] Initializing...");
    initElements();
    setupEventListeners();

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);

    // Route based on current URL
    await routeFromURL();
}

async function routeFromURL() {
    const path = window.location.pathname;
    const pathAfterPlugin = path.split('/plugin/smart-slider-3/')[1] || '';

    if (pathAfterPlugin.startsWith('editor/')) {
        const sliderIdStr = pathAfterPlugin.split('/')[1];
        const sliderId = parseInt(sliderIdStr);

        if (sliderIdStr && sliderIdStr !== 'new' && !isNaN(sliderId)) {
            await openSlider(sliderId);
        } else {
            // Invalid ID, go to dashboard
            const basePath = window.location.pathname.split('/plugin/smart-slider-3')[0];
            history.replaceState({ view: 'dashboard' }, '', `${basePath}/plugin/smart-slider-3/`);
            await loadSliders();
        }
    } else {
        // Default: Dashboard
        await loadSliders();
    }
}

function handlePopState(event) {
    routeFromURL();
}

function setupEventListeners() {
    // Dashboard
    if (elements.dashboard.btnNew) {
        elements.dashboard.btnNew.onclick = () => {
            console.log("New Slider button clicked");
            elements.dashboard.modalNew.classList.remove('hidden');
        };
    } else {
        console.error("btn-new-slider not found");
    }

    if (elements.dashboard.btnCancelNew) {
        elements.dashboard.btnCancelNew.onclick = () => {
            console.log("Cancel button clicked");
            elements.dashboard.modalNew.classList.add('hidden');
        };
    }

    if (elements.dashboard.formNew) {
        elements.dashboard.formNew.onsubmit = (e) => {
            console.log("Form submitted");
            handleCreateSlider(e);
        };
    }

    // Editor
    if (elements.editor.btnBack) {
        elements.editor.btnBack.onclick = () => switchView('dashboard');
    }
    if (elements.editor.btnSave) {
        elements.editor.btnSave.onclick = saveSlider;
    }
    if (elements.editor.btnAddSlide) {
        elements.editor.btnAddSlide.onclick = () => {
            console.log("Add Slide clicked (listener)");
            addSlide();
        };
    } else {
        console.error("btn-add-slide not found");
    }

    // Device Switcher
    elements.editor.deviceButtons.forEach(btn => {
        btn.onclick = () => {
            elements.editor.deviceButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setDevice(btn.dataset.device);
        };
    });

    // Tabs
    elements.editor.tabButtons.forEach(btn => {
        btn.onclick = () => {
            elements.editor.tabButtons.forEach(b => b.classList.remove('active'));
            elements.editor.panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        };
    });
}

// --- DASHBOARD LOGIC ---

async function loadSliders() {
    elements.dashboard.list.innerHTML = '<p class="loading">Loading sliders...</p>';
    try {
        const res = await fetch(`${API_BASE}/sliders`);
        const data = await res.json();
        console.log("[SmartSlider3] /sliders response:", data);

        if (Array.isArray(data)) {
            state.sliders = data;
        } else if (data && Array.isArray(data.rows)) {
            state.sliders = data.rows;
        } else {
            console.error("Unexpected sliders response format:", data);
            state.sliders = [];
        }

        renderSliderList();
    } catch (err) {
        elements.dashboard.list.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
}

function renderSliderList() {
    if (state.sliders.length === 0) {
        elements.dashboard.list.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">view_carousel</span>
                <h3>No sliders yet</h3>
                <p>Create your first slider to get started.</p>
            </div>`;
        return;
    }

    elements.dashboard.list.innerHTML = state.sliders.map(s => `
        <div class="slider-card" onclick="openSlider(${s.id})">
            <div class="slider-preview" style="aspect-ratio: ${s.width}/${s.height}">
                <div class="preview-placeholder">
                    <span class="material-icons-round">image</span>
                </div>
            </div>
            <div class="slider-info">
                <h3>${s.title}</h3>
                <div class="meta">
                    <span>${s.width}x${s.height}px</span>
                    <span>${s.type}</span>
                </div>
            </div>
            <div class="slider-actions">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); deleteSlider(${s.id})">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </div>
    `).join('');
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

        const newSlider = await res.json(); // Assuming API returns the created object
        // If API returns array or something else, we might need to fetch list again.
        // But let's assume we reload list.
    } catch (err) {
        alert(err.message);
    }
}

async function deleteSlider(id) {
    if (!confirm('Are you sure you want to delete this slider?')) return;
    try {
        await fetch(`${API_BASE}/sliders/${id}`, { method: 'DELETE' });
        await loadSliders();
    } catch (err) {
        alert(err.message);
    }
}

// --- EDITOR LOGIC ---

async function openSlider(id) {
    try {
        // Fetch full slider details including slides
        const res = await fetch(`${API_BASE}/sliders/${id}`);
        const slider = await res.json();
        console.log("[SmartSlider3] openSlider loaded:", slider);

        state.currentSlider = slider;
        if (!state.currentSlider.slides) {
            state.currentSlider.slides = [];
        }
        state.currentSlide = state.currentSlider.slides.length > 0 ? state.currentSlider.slides[0] : null;
        state.selectedLayer = null;

        // Initialize Editor UI
        elements.editor.sliderName.textContent = slider.title;
        renderSlideList();

        if (state.currentSlide) {
            loadSlide(state.currentSlide);
        } else {
            // Create a default slide if none exist
            await addSlide();
        }

        switchView('editor');

        // Update URL without reload
        const basePath = window.location.pathname.split('/plugin/smart-slider-3')[0];
        history.pushState({ view: 'editor', sliderId: id }, '', `${basePath}/plugin/smart-slider-3/editor/${id}`);
    } catch (err) {
        console.error(err);
        alert('Failed to load slider');
    }
}

function switchView(viewName) {
    state.view = viewName;
    Object.values(elements.views).forEach(el => el.classList.add('hidden'));
    elements.views[viewName].classList.remove('hidden');

    if (viewName === 'dashboard') {
        loadSliders();
        const basePath = window.location.pathname.split('/plugin/smart-slider-3')[0];
        history.pushState({ view: 'dashboard' }, '', `${basePath}/plugin/smart-slider-3/`);
    }
}

function setDevice(device) {
    state.device = device;
    elements.editor.canvas.className = `editor-canvas ${device}`;
}

// --- SLIDE MANAGEMENT ---

async function addSlide() {
    console.log("Add Slide button clicked");
    if (!state.currentSlider) {
        console.error("No current slider");
        return;
    }

    try {
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
        console.log("New slide created:", newSlide);

        if (!state.currentSlider.slides) state.currentSlider.slides = [];
        state.currentSlider.slides.push(newSlide);

        renderSlideList();
        loadSlide(newSlide);
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function renderSlideList() {
    const list = elements.editor.slideList;
    list.innerHTML = state.currentSlider.slides.map((slide, index) => `
        <div class="slide-item ${state.currentSlide && state.currentSlide.id === slide.id ? 'active' : ''}" 
             onclick="editor.loadSlideById(${slide.id})">
            <div class="slide-thumb">
                ${index + 1}
            </div>
            <div class="slide-name">${slide.title || 'Untitled Slide'}</div>
        </div>
    `).join('');
}

function loadSlideById(id) {
    const slide = state.currentSlider.slides.find(s => s.id === id);
    if (slide) loadSlide(slide);
}

function loadSlide(slide) {
    state.currentSlide = slide;
    state.selectedLayer = null;

    // Parse layers if they are stored as JSON string, or init empty
    // For MVP/Demo, we'll store layers in a temporary 'layers' property on the slide object
    // In a real app, this would come from the DB 'plugin_smart_slider_3_layers' table
    if (!slide.layers) slide.layers = [];

    renderSlideList(); // Update active state
    renderCanvas();
    renderLayerList();
    renderProperties();
}

// --- LAYER MANAGEMENT ---

const editor = {
    addLayer: (type) => {
        if (state.mode === 'slide' && !state.currentSlide) return;

        const newLayer = {
            id: Date.now(), // Temp ID
            type: type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
            content: getDefaultContent(type),
            style: getDefaultStyle(type)
        };

        if (state.mode === 'global') {
            state.globalLayers.push(newLayer);
        } else {
            state.currentSlide.layers.push(newLayer);
        }

        selectLayer(newLayer);
        renderCanvas();
        renderLayerList();
    },

    loadSlideById: loadSlideById
};

function getDefaultContent(type) {
    switch (type) {
        case 'heading': return { text: 'New Heading' };
        case 'text': return { text: 'Lorem ipsum dolor sit amet.' };
        case 'button': return { text: 'Click Me', link: '#' };
        case 'image': return { src: 'https://via.placeholder.com/300x200' };
        case 'video': return { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', type: 'youtube' };
        case 'icon': return { icon: 'star', size: '48px', color: '#ffcc00' };
        default: return {};
    }
}

function getDefaultStyle(type) {
    const base = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        padding: '10px'
    };

    if (type === 'heading') return { ...base, fontSize: '32px', color: '#333333', fontWeight: 'bold' };
    if (type === 'text') return { ...base, fontSize: '16px', color: '#666666' };
    if (type === 'button') return { ...base, background: '#2563eb', color: '#ffffff', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none' };
    if (type === 'image') return { ...base, width: '200px' };
    if (type === 'video') return { ...base, width: '400px', height: '225px' };
    if (type === 'icon') return { ...base, fontSize: '48px', color: '#ffcc00' };

    return base;
}

function selectLayer(layer) {
    state.selectedLayer = layer;
    renderCanvas(); // Re-render to show selection box
    renderLayerList(); // Update active item
    renderProperties();
    renderTimeline(); // Update timeline
}

// --- CANVAS RENDERING ---

function renderCanvas() {
    const canvas = elements.editor.canvasContent;
    const slide = state.currentSlide;

    // Set Canvas Size
    const slider = state.currentSlider;
    elements.editor.canvas.style.width = `${slider.width}px`;
    elements.editor.canvas.style.height = `${slider.height}px`;

    // Background
    canvas.style.backgroundImage = slide.background_image ? `url(${slide.background_image})` : 'none';
    canvas.style.backgroundColor = slide.background_image ? 'transparent' : '#ffffff';

    // Clear
    canvas.innerHTML = '';

    // Render Layers
    const layersToRender = state.mode === 'global' ? state.globalLayers : state.currentSlide.layers;

    // If in slide mode, we might want to show global layers as semi-transparent or locked?
    // For now, let's just render the active set.

    layersToRender.forEach(layer => {
        if (layer.hidden) return; // Skip hidden layers

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
        else if (layer.type === 'button') el.innerHTML = `<a href="#">${layer.content.text}</a>`;
        else if (layer.type === 'image') el.innerHTML = `<img src="${layer.content.src}" alt="Layer">`;
        else if (layer.type === 'video') {
            el.innerHTML = `<iframe width="100%" height="100%" src="${layer.content.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            // Add overlay to allow dragging over iframe
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
                    e.stopPropagation();
                    // startResize(e, layer, el, h); 
                };
                el.appendChild(handle);
            });
        }

        canvas.appendChild(el);
    });

    // Deselect on canvas click
    elements.editor.canvas.onclick = (e) => {
        if (e.target === elements.editor.canvas || e.target === canvas) {
            state.selectedLayer = null;
            renderCanvas();
            renderLayerList();
            renderProperties();
        }
    };
}

function styleObjectToString(style) {
    return Object.entries(style).map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return ''; // Ignore nested objects (responsive overrides)
        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${key}:${v}`;
    }).join(';');
}

// --- DRAG AND DROP ---
let isDragging = false;
function startDrag(e, layer, element) {
    if (state.selectedLayer !== layer) selectLayer(layer);
    isDragging = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(element.style.left) || 0; // Assuming % or px, simplified for now
    const startTop = parseFloat(element.style.top) || 0;

    // We need to handle units properly. For now, let's assume absolute positioning in % for responsiveness
    // But for dragging, px is easier. Let's stick to style.left/top being updated directly.

    // Actually, let's use a simpler approach: update the layer style object on mousemove
    // and re-render is too expensive. Update DOM directly, then save on mouseup.

    const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        // Convert to percentage of canvas size for responsive scaling
        const canvasRect = elements.editor.canvas.getBoundingClientRect();
        const leftPercent = ((ev.clientX - canvasRect.left) / canvasRect.width) * 100;
        const topPercent = ((ev.clientY - canvasRect.top) / canvasRect.height) * 100;

        element.style.left = `${leftPercent}%`;
        element.style.top = `${topPercent}%`;
        element.style.transform = 'translate(-50%, -50%)'; // Keep centered anchor
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Save final position to state
        layer.style.left = element.style.left;
        layer.style.top = element.style.top;
        layer.style.transform = element.style.transform;

        renderProperties(); // Update property inputs
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// --- LAYER LIST ---

function renderLayerList() {
    const list = elements.editor.layerList;
    const layers = state.mode === 'global' ? state.globalLayers : (state.currentSlide ? state.currentSlide.layers : []);

    if (layers.length === 0) {
        list.innerHTML = '<p class="empty-text">No layers</p>';
        return;
    }

    // Sort by ordering (z-index) descending for display if needed, but usually list order = z-index
    // We'll display them in reverse order (top on top)
    const layersReversed = [...layers].reverse();

    list.innerHTML = layersReversed.map(layer => `
        <div class="layer-tree-item ${state.selectedLayer === layer ? 'active' : ''}" 
             onclick="selectLayerById(${layer.id})">
            <div class="layer-status">
                <button class="btn-icon-sm ${layer.hidden ? 'active' : ''}" onclick="event.stopPropagation(); toggleLayerVisibility(${layer.id})">
                    <span class="material-icons-round" style="font-size: 12px;">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button class="btn-icon-sm ${layer.locked ? 'active' : ''}" onclick="event.stopPropagation(); toggleLayerLock(${layer.id})">
                    <span class="material-icons-round" style="font-size: 12px;">${layer.locked ? 'lock' : 'lock_open'}</span>
                </button>
            </div>
            <span class="material-icons-round icon">${getLayerIcon(layer.type)}</span>
            <span class="name" style="${layer.hidden ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${layer.name}</span>
            <div class="layer-actions">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); moveLayer(${layer.id}, 'up')" title="Bring Forward">
                    <span class="material-icons-round">arrow_upward</span>
                </button>
                <button class="btn-icon-sm" onclick="event.stopPropagation(); moveLayer(${layer.id}, 'down')" title="Send Backward">
                    <span class="material-icons-round">arrow_downward</span>
                </button>
                <button class="btn-icon-sm" onclick="event.stopPropagation(); deleteLayer(${layer.id})" title="Delete">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
        </div>
    `).join('');
}

window.moveLayer = (id, direction) => {
    const layers = state.currentSlide.layers;
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;

    if (direction === 'up' && index < layers.length - 1) {
        // Swap with next (higher z-index)
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
    } else if (direction === 'down' && index > 0) {
        // Swap with prev (lower z-index)
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
    }

    // Update ordering property
    layers.forEach((l, i) => l.ordering = i);

    renderCanvas();
    renderLayerList();
};

function getLayerIcon(type) {
    if (type === 'heading') return 'title';
    if (type === 'text') return 'text_fields';
    if (type === 'image') return 'image';
    if (type === 'video') return 'play_circle';
    if (type === 'icon') return 'star';
    if (type === 'button') return 'smart_button';
    return 'layers';
}

window.selectLayerById = (id) => {
    const layer = state.currentSlide.layers.find(l => l.id === id);
    if (layer) selectLayer(layer);
};

window.deleteLayer = (id) => {
    if (!confirm('Delete layer?')) return;
    state.currentSlide.layers = state.currentSlide.layers.filter(l => l.id !== id);
    if (state.selectedLayer && state.selectedLayer.id === id) state.selectedLayer = null;
    renderCanvas();
    renderLayerList();
    renderProperties();
};

// --- PROPERTY INSPECTOR ---

function renderProperties() {
    const props = elements.editor.propertyInspector;

    // If no layer selected, show Slide Properties
    if (!state.selectedLayer) {
        if (!state.currentSlide) {
            props.innerHTML = '<p class="empty-text">Select a slide to edit properties</p>';
            return;
        }

        const slide = state.currentSlide;
        let html = `
            <div class="prop-header">
                <h3>Slide Properties</h3>
            </div>
        `;

        // 1. Background
        const bgHtml = `
            <div class="prop-group">
                <label>Background Image URL</label>
                <input type="text" value="${slide.background_image || ''}" onchange="updateSlideProperty('background_image', this.value)">
            </div>
            <div class="prop-group">
                <label>Ken Burns Effect</label>
                <div class="toggle-wrapper">
                    <label class="switch">
                        <input type="checkbox" ${slide.ken_burns ? 'checked' : ''} onchange="updateSlideProperty('ken_burns', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        `;
        html += renderSection('Background', bgHtml);

        // 2. Animation
        const animHtml = `
            <div class="prop-group">
                <label>Transition</label>
                <select onchange="updateSlideProperty('transition', this.value)">
                    <option value="fade" ${!slide.transition || slide.transition === 'fade' ? 'selected' : ''}>Fade</option>
                    <option value="slide-horizontal" ${slide.transition === 'slide-horizontal' ? 'selected' : ''}>Slide Horizontal</option>
                    <option value="slide-vertical" ${slide.transition === 'slide-vertical' ? 'selected' : ''}>Slide Vertical</option>
                    <option value="zoom" ${slide.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
                </select>
            </div>
            <div class="prop-group">
                <label>Duration (ms)</label>
                <input type="number" value="${slide.duration || 500}" onchange="updateSlideProperty('duration', parseInt(this.value))">
            </div>
        `;
        html += renderSection('Animation', animHtml);

        props.innerHTML = html;
        return;
    }

    const layer = state.selectedLayer;

    // Calculate effective style for inputs
    let effectiveStyle = { ...layer.style };
    if (state.device === 'tablet' || state.device === 'mobile') {
        if (layer.style.tablet) effectiveStyle = { ...effectiveStyle, ...layer.style.tablet };
    }
    if (state.device === 'mobile') {
        if (layer.style.mobile) effectiveStyle = { ...effectiveStyle, ...layer.style.mobile };
    }

    // Ensure style objects exist
    if (!effectiveStyle.padding) effectiveStyle.padding = '0px';
    if (!effectiveStyle.borderRadius) effectiveStyle.borderRadius = '0px';
    if (!effectiveStyle.opacity) effectiveStyle.opacity = '1';
    if (!effectiveStyle.transform) effectiveStyle.transform = '';
    if (!effectiveStyle.boxShadow) effectiveStyle.boxShadow = 'none';

    // Helper for sections
    const renderSection = (title, content, isOpen = true) => `
        <div class="prop-section ${isOpen ? '' : 'collapsed'}">
            <div class="prop-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <h4>${title}</h4>
                <span class="material-icons-round icon">expand_more</span>
            </div>
            <div class="prop-content">
                ${content}
            </div>
        </div>
    `;

    // 1. General Section
    let html = renderSection('General', `
        <div class="prop-group">
            <label>Name</label>
            <input type="text" value="${layer.name}" onchange="updateLayerProp('name', this.value)">
        </div>
    `);

    // 2. Content Section
    let contentHtml = '';
    if (layer.type === 'heading' || layer.type === 'text' || layer.type === 'button') {
        contentHtml += `
            <div class="prop-group">
                <label>Text</label>
                <textarea rows="3" oninput="updateLayerContent('text', this.value)">${layer.content.text}</textarea>
            </div>
        `;
    }
    if (layer.type === 'image') {
        contentHtml += `
            <div class="prop-group">
                <label>Image URL</label>
                <input type="text" value="${layer.content.src}" onchange="updateLayerContent('src', this.value)">
            </div>
        `;
    }
    if (layer.type === 'button') {
        contentHtml += `
            <div class="prop-group">
                <label>Link</label>
                <input type="text" value="${layer.content.link}" onchange="updateLayerContent('link', this.value)">
            </div>
        `;
    }
    if (layer.type === 'video') {
        contentHtml += `
            <div class="prop-group">
                <label>Video URL (Embed)</label>
                <input type="text" value="${layer.content.src}" onchange="updateLayerContent('src', this.value)">
            </div>
        `;
    }
    if (layer.type === 'icon') {
        contentHtml += `
            <div class="prop-group">
                <label>Icon Name (Material)</label>
                <input type="text" value="${layer.content.icon}" onchange="updateLayerContent('icon', this.value)">
                <small style="font-size:10px; color:var(--text-muted);">e.g. star, home, person</small>
            </div>
        `;
    }
    html += renderSection('Content', contentHtml);

    // 3. Layout & Position
    html += renderSection('Layout', `
        <div class="prop-row compact">
            <div class="prop-group">
                <label>X (%)</label>
                <input type="text" value="${effectiveStyle.left}" onchange="updateLayerStyle('left', this.value)">
            </div>
            <div class="prop-group">
                <label>Y (%)</label>
                <input type="text" value="${effectiveStyle.top}" onchange="updateLayerStyle('top', this.value)">
            </div>
        </div>
        <div class="prop-row compact">
            <div class="prop-group">
                <label>Padding</label>
                <input type="text" value="${effectiveStyle.padding}" onchange="updateLayerStyle('padding', this.value)">
            </div>
            <div class="prop-group">
                <label>Rotation (deg)</label>
                <input type="number" value="${getRotation(effectiveStyle.transform)}" onchange="updateLayerTransform('rotate', this.value + 'deg')">
            </div>
        </div>
    `);

    // 4. Typography
    if (layer.type !== 'image') {
        html += renderSection('Typography', `
            <div class="prop-group">
                <label>Font Family</label>
                <select onchange="updateLayerStyle('fontFamily', this.value)">
                    <option value="Inter, sans-serif" ${effectiveStyle.fontFamily?.includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="Arial, sans-serif" ${effectiveStyle.fontFamily?.includes('Arial') ? 'selected' : ''}>Arial</option>
                    <option value="'Times New Roman', serif" ${effectiveStyle.fontFamily?.includes('Times') ? 'selected' : ''}>Times New Roman</option>
                    <option value="'Courier New', monospace" ${effectiveStyle.fontFamily?.includes('Courier') ? 'selected' : ''}>Courier New</option>
                    <option value="Georgia, serif" ${effectiveStyle.fontFamily?.includes('Georgia') ? 'selected' : ''}>Georgia</option>
                </select>
            </div>
            <div class="prop-row">
                <div class="prop-group">
                    <label>Color</label>
                    <div class="color-picker-wrapper">
                        <input type="color" value="${effectiveStyle.color || '#000000'}" onchange="updateLayerStyle('color', this.value); this.nextElementSibling.value = this.value">
                        <input type="text" value="${effectiveStyle.color || '#000000'}" onchange="updateLayerStyle('color', this.value); this.previousElementSibling.value = this.value">
                    </div>
                </div>
                <div class="prop-group">
                    <label>Size</label>
                    <input type="text" value="${effectiveStyle.fontSize || '16px'}" onchange="updateLayerStyle('fontSize', this.value)">
                </div>
            </div>
            <div class="prop-group">
                <label>Style</label>
                <div class="icon-toggles">
                    <button class="icon-toggle ${effectiveStyle.fontWeight === 'bold' ? 'active' : ''}" onclick="updateLayerStyle('fontWeight', effectiveStyle.fontWeight === 'bold' ? 'normal' : 'bold')" title="Bold">
                        <span class="material-icons-round">format_bold</span>
                    </button>
                    <button class="icon-toggle ${effectiveStyle.fontStyle === 'italic' ? 'active' : ''}" onclick="updateLayerStyle('fontStyle', effectiveStyle.fontStyle === 'italic' ? 'normal' : 'italic')" title="Italic">
                        <span class="material-icons-round">format_italic</span>
                    </button>
                    <button class="icon-toggle ${effectiveStyle.textDecoration === 'underline' ? 'active' : ''}" onclick="updateLayerStyle('textDecoration', effectiveStyle.textDecoration === 'underline' ? 'none' : 'underline')" title="Underline">
                        <span class="material-icons-round">format_underlined</span>
                    </button>
                </div>
            </div>
            <div class="prop-group">
                <label>Align</label>
                <div class="icon-toggles">
                    <button class="icon-toggle ${effectiveStyle.textAlign === 'left' ? 'active' : ''}" onclick="updateLayerStyle('textAlign', 'left')">
                        <span class="material-icons-round">format_align_left</span>
                    </button>
                    <button class="icon-toggle ${effectiveStyle.textAlign === 'center' ? 'active' : ''}" onclick="updateLayerStyle('textAlign', 'center')">
                        <span class="material-icons-round">format_align_center</span>
                    </button>
                    <button class="icon-toggle ${effectiveStyle.textAlign === 'right' ? 'active' : ''}" onclick="updateLayerStyle('textAlign', 'right')">
                        <span class="material-icons-round">format_align_right</span>
                    </button>
                </div>
            </div>
        `);
    }

    // 5. Appearance (Border, Background, Effects)
    html += renderSection('Appearance', `
        <div class="prop-group">
            <label>Background</label>
             <div class="color-picker-wrapper">
                <input type="color" value="${effectiveStyle.backgroundColor || (layer.type === 'button' ? effectiveStyle.background : '#ffffff')}" onchange="updateLayerStyle('backgroundColor', this.value); this.nextElementSibling.value = this.value">
                <input type="text" value="${effectiveStyle.backgroundColor || (layer.type === 'button' ? effectiveStyle.background : 'transparent')}" onchange="updateLayerStyle('backgroundColor', this.value); this.previousElementSibling.value = this.value">
            </div>
        </div>
        <div class="prop-row">
            <div class="prop-group">
                <label>Radius</label>
                <input type="text" value="${effectiveStyle.borderRadius}" onchange="updateLayerStyle('borderRadius', this.value)">
            </div>
            <div class="prop-group">
                <label>Opacity</label>
                <input type="number" min="0" max="1" step="0.1" value="${effectiveStyle.opacity}" onchange="updateLayerStyle('opacity', this.value)">
            </div>
        </div>
        <div class="prop-group">
            <label>Border</label>
            <input type="text" placeholder="1px solid #000" value="${effectiveStyle.border || 'none'}" onchange="updateLayerStyle('border', this.value)">
        </div>
        <div class="prop-group">
            <label>Box Shadow</label>
            <input type="text" placeholder="0 2px 4px rgba(0,0,0,0.1)" value="${effectiveStyle.boxShadow || 'none'}" onchange="updateLayerStyle('boxShadow', this.value)">
        </div>
    `);

    container.innerHTML = html;
}

// Helper to extract rotation from transform string
function getRotation(transform) {
    if (!transform) return 0;
    const match = transform.match(/rotate\(([^)]+)deg\)/);
    return match ? parseInt(match[1]) : 0;
}

window.updateLayerTransform = (key, value) => {
    if (!state.selectedLayer) return;
    // Simple handling: assume only rotate for now or append
    // For full transform support we'd need a parser.
    // Let's just set translate(-50%, -50%) + rotate(...)
    state.selectedLayer.style.transform = `translate(-50%, -50%) ${key}(${value})`;
    renderCanvas();
};

window.updateLayerProp = (key, value) => {
    if (!state.selectedLayer) return;
    state.selectedLayer[key] = value;
    renderLayerList();
};

window.updateSlideProperty = (key, value) => {
    if (!state.currentSlide) return;
    state.currentSlide[key] = value;
    renderCanvas();
    renderSlideList(); // Update thumbnails/names if needed
    renderProperties(); // Refresh to show updated state
};

window.updateLayerContent = (key, value) => {
    if (!state.selectedLayer) return;
    state.selectedLayer.content[key] = value;
    renderCanvas();
};

window.updateLayerStyle = (key, value) => {
    if (!state.selectedLayer) return;

    if (state.device === 'desktop') {
        state.selectedLayer.style[key] = value;
    } else {
        // Tablet or Mobile
        if (!state.selectedLayer.style[state.device]) {
            state.selectedLayer.style[state.device] = {};
        }
        state.selectedLayer.style[state.device][key] = value;
    }
    renderCanvas();
};

// --- SAVING ---

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

// Expose global
window.editor = editor;

// Start
// --- TIMELINE & ANIMATION ---

function renderTimeline() {
    const trackContainer = document.getElementById('timeline-tracks');

    if (!state.currentSlide || !state.currentSlide.layers || state.currentSlide.layers.length === 0) {
        trackContainer.innerHTML = '<p style="color: var(--text-muted); padding: 10px; font-size: 11px;">No layers in this slide.</p>';
        return;
    }

    // Sort layers by ordering (z-index) reversed so top layer is top track
    const layers = [...state.currentSlide.layers].reverse();

    trackContainer.innerHTML = layers.map(layer => {
        // Ensure animation props
        if (!layer.animation) layer.animation = { duration: 1000, delay: 0, type: 'fade' };

        const isSelected = state.selectedLayer === layer;
        const isHidden = layer.hidden;
        const isLocked = layer.locked;

        // 1% = 50ms. Max 5000ms view.
        const left = layer.animation.delay / 50;
        const width = layer.animation.duration / 50;

        return `
        <div class="timeline-track ${isSelected ? 'selected' : ''}" onclick="selectLayerById(${layer.id})">
            <div class="track-label">
                <div class="track-actions">
                    <button class="btn-icon-sm ${isHidden ? 'active' : ''}" onclick="event.stopPropagation(); toggleLayerVisibility(${layer.id})" title="${isHidden ? 'Show' : 'Hide'}">
                        <span class="material-icons-round" style="font-size: 12px;">${isHidden ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    <button class="btn-icon-sm ${isLocked ? 'active' : ''}" onclick="event.stopPropagation(); toggleLayerLock(${layer.id})" title="${isLocked ? 'Unlock' : 'Lock'}">
                        <span class="material-icons-round" style="font-size: 12px;">${isLocked ? 'lock' : 'lock_open'}</span>
                    </button>
                </div>
                <span class="name">${layer.name}</span>
            </div>
            <div class="track-lane" id="track-lane-${layer.id}">
                <div class="track-bar" 
                     style="left: ${left}%; width: ${width}%; background-color: ${isSelected ? 'var(--primary)' : 'var(--border-light)'};" 
                     title="Duration: ${layer.animation.duration}ms, Delay: ${layer.animation.delay}ms"
                     onmousedown="event.stopPropagation(); startTimelineDrag(event, ${layer.id}, 'move')">
                     <div class="track-handle-e" onmousedown="event.stopPropagation(); startTimelineDrag(event, ${layer.id}, 'resize')"></div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // If a layer is selected, show its animation properties below the tracks
    if (state.selectedLayer) {
        const layer = state.selectedLayer;
        trackContainer.innerHTML += `
        <div class="timeline-props" style="padding: 10px; border-top: 1px solid var(--border); margin-top: auto; background: var(--bg-header); position: sticky; bottom: 0;">
            <div class="prop-row compact" style="margin-bottom: 0;">
                <div class="prop-group" style="margin-bottom: 0;">
                    <label>Anim Type</label>
                    <select onchange="updateLayerAnimation('type', this.value)">
                        <option value="fade" ${layer.animation.type === 'fade' ? 'selected' : ''}>Fade In</option>
                        <option value="slide-left" ${layer.animation.type === 'slide-left' ? 'selected' : ''}>Slide Left</option>
                        <option value="slide-right" ${layer.animation.type === 'slide-right' ? 'selected' : ''}>Slide Right</option>
                        <option value="zoom" ${layer.animation.type === 'zoom' ? 'selected' : ''}>Zoom In</option>
                    </select>
                </div>
                <div class="prop-group" style="margin-bottom: 0;">
                    <label>Duration (ms)</label>
                    <input type="number" value="${layer.animation.duration}" step="100" onchange="updateLayerAnimation('duration', parseInt(this.value))">
                </div>
                <div class="prop-group" style="margin-bottom: 0;">
                    <label>Delay (ms)</label>
                    <input type="number" value="${layer.animation.delay}" step="100" onchange="updateLayerAnimation('delay', parseInt(this.value))">
                </div>
            </div>
        </div>
        `;
    }
}

// Timeline Drag Logic
window.startTimelineDrag = (e, layerId, mode) => {
    e.preventDefault();
    const layer = state.currentSlide.layers.find(l => l.id === layerId);
    if (!layer) return;

    // Select layer if not selected
    if (state.selectedLayer !== layer) selectLayer(layer);

    const lane = document.getElementById(`track-lane-${layerId}`);
    const laneRect = lane.getBoundingClientRect();
    const startX = e.clientX;

    // Initial values
    const startDelay = layer.animation.delay;
    const startDuration = layer.animation.duration;

    // Scale: 100% width = 5000ms
    // pixels per ms = laneWidth / 5000
    const msPerPx = 5000 / laneRect.width;

    const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dt = dx * msPerPx;

        if (mode === 'move') {
            let newDelay = startDelay + dt;
            // Snap to 50ms
            newDelay = Math.round(newDelay / 50) * 50;
            if (newDelay < 0) newDelay = 0;
            if (newDelay > 4500) newDelay = 4500; // Max constraint

            layer.animation.delay = newDelay;
        } else if (mode === 'resize') {
            let newDuration = startDuration + dt;
            // Snap to 50ms
            newDuration = Math.round(newDuration / 50) * 50;
            if (newDuration < 100) newDuration = 100; // Min duration
            if (newDuration > 5000) newDuration = 5000; // Max constraint

            layer.animation.duration = newDuration;
        }

        renderTimeline(); // Re-render to show update
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        // Final render/save could happen here
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

window.toggleLayerVisibility = (id) => {
    const layer = state.currentSlide.layers.find(l => l.id === id);
    if (layer) {
        layer.hidden = !layer.hidden;
        renderCanvas();
        renderLayerList();
        renderTimeline();
    }
};

window.toggleLayerLock = (id) => {
    const layer = state.currentSlide.layers.find(l => l.id === id);
    if (layer) {
        layer.locked = !layer.locked;
        renderCanvas();
        renderLayerList();
        renderTimeline();
    }
};

window.updateLayerAnimation = (key, value) => {
    if (!state.selectedLayer) return;
    if (!state.selectedLayer.animation) state.selectedLayer.animation = {};
    state.selectedLayer.animation[key] = value;
    renderTimeline();
};

// --- CONTEXT MENU ---
const contextMenu = document.getElementById('context-menu');

document.addEventListener('click', () => {
    contextMenu.classList.add('hidden');
});

document.addEventListener('contextmenu', (e) => {
    // If clicking on a layer or canvas
    if (e.target.closest('.layer-item') || e.target.closest('#editor-canvas')) {
        e.preventDefault();

        // If on a layer, select it
        const layerEl = e.target.closest('.layer-item');
        if (layerEl) {
            const id = parseInt(layerEl.dataset.id);
            selectLayerById(id);
        }

        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.classList.remove('hidden');
    }
});

// Context Menu Actions
document.getElementById('ctx-duplicate').onclick = () => {
    if (!state.selectedLayer) return;
    const newLayer = JSON.parse(JSON.stringify(state.selectedLayer));
    newLayer.id = Date.now();
    newLayer.name += ' (Copy)';
    newLayer.style.left = (parseFloat(newLayer.style.left) + 2) + '%';
    newLayer.style.top = (parseFloat(newLayer.style.top) + 2) + '%';
    state.currentSlide.layers.push(newLayer);
    selectLayer(newLayer);
    renderCanvas();
    renderLayerList();
};

document.getElementById('ctx-delete').onclick = () => {
    if (state.selectedLayer) deleteLayer(state.selectedLayer.id);
};

document.getElementById('ctx-front').onclick = () => {
    if (state.selectedLayer) moveLayer(state.selectedLayer.id, 'up');
};

document.getElementById('ctx-back').onclick = () => {
    if (state.selectedLayer) moveLayer(state.selectedLayer.id, 'down');
};


// Override selectLayer to update timeline
const originalSelectLayer = selectLayer;
selectLayer = (layer) => {
    originalSelectLayer(layer);
    renderTimeline();
};

// Start
async function init() {
    initElements();
    setupEventListeners();

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);

    // Route based on current URL
    await routeFromURL();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
