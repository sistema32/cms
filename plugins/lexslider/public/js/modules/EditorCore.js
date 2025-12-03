console.log("Loading EditorCore v3.0.10");
export const API_BASE = '/plugins-runtime/lexslider';

export const state = {
    view: 'dashboard', // 'dashboard' | 'editor'
    sliders: [],
    currentSlider: null,
    currentSlide: null,
    selectedLayer: null,
    device: 'desktop', // desktop, tablet, mobile
    mode: 'slide', // 'slide' or 'global'
    globalLayers: [],
    currentTime: 0,
    isDirty: false
};

export const elements = {};

export function initElements() {
    // Re-bind all elements since DOM has changed
    Object.assign(elements, {
        app: document.getElementById('app'),
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
            btnAddSlide: document.getElementById('btn-new-slide'),
            btnPreview: document.getElementById('btn-preview'),
            canvas: document.getElementById('editor-canvas'),
            canvasContent: document.getElementById('canvas-content'),
            propertyInspector: document.getElementById('property-inspector'),
            deviceButtons: document.querySelectorAll('[data-device]'),
        }
    });
}

export async function loadView(viewName) {
    const app = document.getElementById('app');
    console.log(`[EditorCore] Loading view: ${viewName}`, app);
    try {
        const res = await fetch(`views/${viewName}.html`);
        if (!res.ok) throw new Error(`Failed to load view: ${viewName}`);
        const html = await res.text();
        app.innerHTML = html;

        state.view = viewName;
        initElements();

        // Setup View-Specific Logic
        if (viewName === 'dashboard') {
            loadSliders();
            // Re-attach dashboard listeners
            if (elements.dashboard.btnNew) {
                elements.dashboard.btnNew.onclick = () => elements.dashboard.modalNew.showModal();
            }
        } else if (viewName === 'editor') {
            // Initialize Resizing Logic
            initResizing();
            // Re-attach editor listeners
            if (elements.editor.btnBack) elements.editor.btnBack.onclick = () => switchView('dashboard');
            if (elements.editor.btnSave) elements.editor.btnSave.onclick = window.saveSlider; // Assuming exposed
            if (elements.editor.btnAddSlide) elements.editor.btnAddSlide.onclick = window.LexSlider.addSlide;

            // Device Switcher
            elements.editor.deviceButtons.forEach(btn => {
                btn.onclick = () => setDevice(btn.dataset.device);
            });
        }

    } catch (err) {
        console.error(err);
        app.innerHTML = `<p class="text-error p-4">Error loading view: ${err.message}</p>`;
    }
}

export async function switchView(viewName) {
    await loadView(viewName);
}

function initResizing() {
    const splitterV = document.getElementById('splitter-timeline');
    const timelinePanel = document.getElementById('timeline-panel');
    const splitterH = document.getElementById('splitter-sidebar');
    const sidebarPanel = document.getElementById('sidebar-panel');

    if (!splitterV || !timelinePanel || !splitterH || !sidebarPanel) return;

    let isDraggingV = false;
    let isDraggingH = false;

    splitterV.onmousedown = (e) => {
        isDraggingV = true;
        splitterV.classList.add('dragging');
        document.body.style.cursor = 'row-resize';
    };

    splitterH.onmousedown = (e) => {
        isDraggingH = true;
        splitterH.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
    };

    document.onmousemove = (e) => {
        if (isDraggingV) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 100 && newHeight < window.innerHeight - 100) {
                timelinePanel.style.height = `${newHeight}px`;
            }
        }
        if (isDraggingH) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 200 && newWidth < 600) {
                sidebarPanel.style.width = `${newWidth}px`;
            }
        }
    };

    document.onmouseup = () => {
        isDraggingV = false;
        isDraggingH = false;
        if (splitterV) splitterV.classList.remove('dragging');
        if (splitterH) splitterH.classList.remove('dragging');
        document.body.style.cursor = 'default';
    };
}

export function setDevice(mode) {
    state.device = mode;

    // Update Buttons
    elements.editor.deviceButtons.forEach(btn => {
        if (btn.dataset.device === mode) {
            btn.classList.add('active', 'text-primary');
        } else {
            btn.classList.remove('active', 'text-primary');
        }
    });

    // Resize Canvas
    const canvas = elements.editor.canvas;
    canvas.classList.remove('desktop', 'tablet', 'mobile');
    canvas.classList.add(mode);

    // Apply specific widths via style
    if (mode === 'desktop') {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = 'none';
    } else if (mode === 'tablet') {
        canvas.style.width = '770px';
        canvas.style.height = '100%'; // Or specific height if needed
        canvas.style.maxWidth = '100%';
    } else if (mode === 'mobile') {
        canvas.style.width = '360px';
        canvas.style.height = '100%';
        canvas.style.maxWidth = '100%';
    }

    // Re-render to update layer properties if they have device-specific overrides
    // We need to import renderProperties dynamically or ensure circular deps are handled
    // For now, we assume window.LexSlider.renderProperties exists or we dispatch an event
    if (window.LexSlider && window.LexSlider.renderProperties) {
        window.LexSlider.renderProperties();
    }
}

export async function loadSliders() {
    if (!elements.dashboard.list) return;
    elements.dashboard.list.innerHTML = '<p class="loading">Loading sliders...</p>';
    try {
        const res = await fetch(`${API_BASE}/sliders`);
        const data = await res.json();

        if (Array.isArray(data)) {
            state.sliders = data;
        } else if (data && Array.isArray(data.rows)) {
            state.sliders = data.rows;
        } else {
            state.sliders = [];
        }

        renderDashboard();
    } catch (err) {
        if (elements.dashboard.list) elements.dashboard.list.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
}

export function renderDashboard() {
    if (!elements.dashboard.list) return;

    if (state.sliders.length === 0) {
        elements.dashboard.list.innerHTML = `
            <div class="col-span-full text-center p-16 text-base-content/30">
                <span class="material-icons-round text-6xl mb-4 opacity-20">slideshow</span>
                <p class="text-sm">No sliders yet. Create your first one!</p>
            </div>
        `;
        return;
    }

    elements.dashboard.list.innerHTML = state.sliders.map(slider => `
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer group" onclick="window.openSlider(${slider.id})">
            <figure class="h-48 bg-base-200 flex items-center justify-center group-hover:bg-base-300 transition-colors">
                <span class="material-icons-round text-6xl opacity-10">collections</span>
            </figure>
            <div class="card-body p-6">
                <h2 class="card-title text-sm">${slider.title || slider.name || 'Untitled'}</h2>
                <div class="flex gap-2 text-xs opacity-50 mt-2">
                    <span class="badge badge-ghost badge-xs">${slider.width || 1200}x${slider.height || 600}</span>
                    <span class="badge badge-ghost badge-xs">${slider.type || 'simple'}</span>
                </div>
            </div>
        </div>
    `).join('');
}
