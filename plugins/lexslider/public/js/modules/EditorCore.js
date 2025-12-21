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

    // Update URL when switching views
    if (viewName === 'dashboard') {
        const basePath = window.location.pathname.split('/plugin/lexslider')[0];
        window.history.pushState({}, '', `${basePath}/plugin/lexslider/index.html`);
    }
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

    // Update count
    const countEl = document.getElementById('slider-count');
    if (countEl) countEl.textContent = state.sliders.length;

    if (state.sliders.length === 0) {
        elements.dashboard.list.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20">
                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                    <span class="material-icons-round text-5xl text-primary/40">slideshow</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">No Sliders Yet</h3>
                <p class="text-sm opacity-60 mb-6 text-center max-w-xs">Create your first slider to start building beautiful presentations</p>
                <button class="btn btn-primary gap-2 shadow-lg" onclick="document.getElementById('modal-new-slider').showModal()">
                    <span class="material-icons-round">add</span>
                    Create Your First Slider
                </button>
            </div>
        `;
        return;
    }

    elements.dashboard.list.innerHTML = state.sliders.map(slider => {
        const slideCount = slider.slides?.length || 0;
        const title = slider.title || slider.name || 'Untitled';

        return `
        <div class="group relative bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/50 hover:-translate-y-1">
            <!-- Thumbnail Area -->
            <div class="relative h-40 bg-gradient-to-br from-base-200 via-base-300 to-base-200 cursor-pointer overflow-hidden" onclick="window.openSlider(${slider.id})">
                <!-- Animated Pattern Background -->
                <div class="absolute inset-0 opacity-10">
                    <div class="absolute top-4 left-4 w-20 h-20 border-2 border-current rounded-lg rotate-12"></div>
                    <div class="absolute bottom-4 right-4 w-16 h-16 border-2 border-current rounded-full"></div>
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-current rotate-45"></div>
                </div>
                
                <!-- Center Icon -->
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-16 h-16 rounded-xl bg-base-100/80 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span class="material-icons-round text-3xl text-primary">collections</span>
                    </div>
                </div>
                
                <!-- Top Badges -->
                <div class="absolute top-3 left-3 flex gap-2">
                    <span class="badge badge-sm bg-black/50 backdrop-blur text-white border-0">${slider.width || 1200}×${slider.height || 600}</span>
                </div>
                <div class="absolute top-3 right-3">
                    <span class="badge badge-sm bg-black/60 backdrop-blur text-white border-0 font-medium">${slideCount} slide${slideCount !== 1 ? 's' : ''}</span>
                </div>
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-primary shadow-lg" onclick="event.stopPropagation(); window.openSlider(${slider.id})">
                            <span class="material-icons-round text-sm">edit</span> Edit
                        </button>
                        <div class="dropdown dropdown-top dropdown-end">
                            <label tabindex="0" class="btn btn-sm btn-ghost bg-white/20 hover:bg-white/30" onclick="event.stopPropagation()">
                                <span class="material-icons-round text-sm">more_vert</span>
                            </label>
                            <ul tabindex="0" class="dropdown-content menu menu-sm bg-base-100 rounded-lg shadow-xl border border-base-300 w-44 z-[100] p-2">
                                <li><a class="flex items-center gap-2" onclick="event.stopPropagation(); window.LexSlider.duplicateSlider(${slider.id})"><span class="material-icons-round text-base">content_copy</span> Duplicate</a></li>
                                <li><a class="flex items-center gap-2" onclick="event.stopPropagation(); window.LexSlider.exportSlider(${slider.id})"><span class="material-icons-round text-base">download</span> Export</a></li>
                                <li class="mt-1 pt-1 border-t border-base-300"><a class="flex items-center gap-2 text-error hover:bg-error/10" onclick="event.stopPropagation(); window.LexSlider.deleteSlider(${slider.id}, '${title.replace(/'/g, "\\'")}')"><span class="material-icons-round text-base">delete</span> Delete</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Card Body -->
            <div class="p-4">
                <h3 class="font-semibold text-sm mb-1 truncate cursor-pointer hover:text-primary transition-colors" onclick="window.openSlider(${slider.id})">${title}</h3>
                <div class="flex items-center justify-between">
                    <span class="badge badge-ghost badge-xs">${slider.type || 'simple'}</span>
                    <span class="text-xs opacity-40">#${slider.id}</span>
                </div>
                
                <!-- Quick Embed -->
                <div class="mt-3 pt-3 border-t border-base-300">
                    <div class="flex items-center gap-2">
                        <code class="flex-1 bg-base-200 px-2 py-1.5 rounded text-[10px] font-mono truncate">[lexslider id="${slider.id}"]</code>
                        <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.copyToClipboard('[lexslider id=\\'${slider.id}\\']', this)" title="Copy Shortcode">
                            <span class="material-icons-round text-sm">content_copy</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

