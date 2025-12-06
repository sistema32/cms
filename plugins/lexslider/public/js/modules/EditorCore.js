console.log("Loading EditorCore v3.0.28");
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
    console.log(`[EditorCore] Loading v3.0.28 view: ${viewName}`, app);
    try {
        // Get base path for plugin (handles both /admincp/plugin/lexslider and /admincp/plugin/lexslider/slider/:id)
        const basePath = window.location.pathname.split('/plugin/lexslider')[0] + '/plugin/lexslider';
        const res = await fetch(`${basePath}/views/${viewName}.html`);
        if (!res.ok) throw new Error(`Failed to load view: ${viewName}`);
        const html = await res.text();
        app.innerHTML = html;

        // Wait for DOM to be fully processed
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

        state.view = viewName;
        initElements();

        console.log(`[EditorCore] View ${viewName} loaded, elements.editor exists:`, !!elements.editor?.canvas);

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
    // Guard: ensure elements are ready
    if (!elements.editor?.canvas || !elements.editor?.deviceButtons) {
        console.warn('[EditorCore] Elements not ready for setDevice');
        return;
    }

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
    const slider = state.currentSlider;
    if (mode === 'desktop') {
        canvas.style.width = slider ? `${slider.width}px` : '100%';
        canvas.style.height = slider ? `${slider.height}px` : '100%';
        canvas.style.maxWidth = 'none';
        canvas.style.margin = '0 auto';
    } else if (mode === 'tablet') {
        canvas.style.width = '768px';
        canvas.style.height = slider ? `${slider.height}px` : '500px';
        canvas.style.maxWidth = '100%';
        canvas.style.margin = '0 auto';
    } else if (mode === 'mobile') {
        canvas.style.width = '375px';
        canvas.style.height = slider ? `${slider.height}px` : '500px';
        canvas.style.maxWidth = '100%';
        canvas.style.margin = '0 auto';
    }

    // Re-render canvas and properties
    if (window.LexSlider) {
        if (window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
        if (window.LexSlider.renderProperties) window.LexSlider.renderProperties();
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
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all group">
            <figure class="h-40 bg-base-200 flex items-center justify-center group-hover:bg-base-300 transition-colors cursor-pointer" onclick="window.openSlider(${slider.id})">
                <span class="material-icons-round text-6xl opacity-10">collections</span>
            </figure>
            <div class="card-body p-4">
                <div class="flex items-center justify-between">
                    <h2 class="card-title text-sm cursor-pointer hover:text-primary" onclick="window.openSlider(${slider.id})">${slider.title || slider.name || 'Untitled'}</h2>
                    <div class="flex gap-1">
                        <button class="btn btn-ghost btn-xs" onclick="window.openSlider(${slider.id})" title="Edit">
                            <span class="material-icons-round text-sm">edit</span>
                        </button>
                    </div>
                </div>
                <div class="flex gap-2 text-xs opacity-50 mt-1">
                    <span class="badge badge-ghost badge-xs">${slider.width || 1200}x${slider.height || 600}</span>
                    <span class="badge badge-ghost badge-xs">${slider.type || 'simple'}</span>
                </div>
                
                <!-- Embed Shortcuts -->
                <div class="mt-3 pt-3 border-t border-base-300 space-y-2">
                    <div class="text-xs opacity-60 uppercase tracking-wider font-semibold">Embed</div>
                    
                    <!-- Shortcode -->
                    <div class="flex items-center gap-2" title="Use in WordPress/CMS posts">
                        <span class="text-xs opacity-50 w-16">Shortcode:</span>
                        <code class="flex-1 bg-base-200 px-2 py-1 rounded text-xs font-mono truncate">[lexslider id="${slider.id}"]</code>
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window.LexSlider.copyToClipboard('[lexslider id=\\'${slider.id}\\']', this)" title="Copy">
                            <span class="material-icons-round text-sm">content_copy</span>
                        </button>
                    </div>
                    
                    <!-- HTML Embed -->
                    <div class="flex items-center gap-2" title="Add to any HTML page">
                        <span class="text-xs opacity-50 w-16">HTML:</span>
                        <code class="flex-1 bg-base-200 px-2 py-1 rounded text-xs font-mono truncate">&lt;div data-lexslider="${slider.id}"&gt;&lt;/div&gt;</code>
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window.LexSlider.copyToClipboard('<div data-lexslider=\\'${slider.id}\\'></div>', this)" title="Copy">
                            <span class="material-icons-round text-sm">content_copy</span>
                        </button>
                    </div>
                    
                    <!-- Script (for external sites) -->
                    <div class="mt-2 pt-2 border-t border-base-300/50">
                        <div class="text-[10px] opacity-40">Include script once per page:</div>
                        <code class="block bg-base-200 px-2 py-1 rounded text-[10px] font-mono truncate opacity-60">&lt;script src="/plugins-runtime/plugins-static/lexslider/lexslider-embed.js"&gt;&lt;/script&gt;</code>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}
