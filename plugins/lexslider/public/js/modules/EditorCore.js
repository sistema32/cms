
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
    Object.assign(elements, {
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
    });
    console.log("[LexSlider 3.0] Elements initialized:", elements);
}

export async function loadSliders() {
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
        elements.dashboard.list.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
}

export function renderDashboard() {
    if (!elements.dashboard.list) return;

    if (state.sliders.length === 0) {
        elements.dashboard.list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                <span class="material-icons-round" style="font-size: 64px; opacity: 0.2; display: block; margin-bottom: 1rem;">slideshow</span>
                <p style="font-size: 14px; margin: 0;">No sliders yet. Create your first one!</p>
            </div>
        `;
        return;
    }

    elements.dashboard.list.innerHTML = state.sliders.map(slider => `
        <div class="slider-card" onclick="window.openSlider(${slider.id})">
            <div class="slider-preview">
                <span class="material-icons-round" style="font-size: 48px; color: rgba(255,255,255,0.1);">collections</span>
            </div>
            <div class="slider-info">
                <h3>${slider.title || slider.name || 'Untitled'}</h3>
                <div class="meta">
                    <span>${slider.width || 1200}x${slider.height || 600}</span>
                    <span>•</span>
                    <span>${slider.type || 'simple'}</span>
                </div>
            </div>
        </div>
    `).join('');
}


export function switchView(viewName) {
    state.view = viewName;
    Object.values(elements.views).forEach(el => el.classList.add('hidden'));
    elements.views[viewName].classList.remove('hidden');

    if (viewName === 'dashboard') {
        loadSliders();
        const basePath = window.location.pathname.split('/plugin/lexslider')[0]; // Adjust path if needed
        // history.pushState({ view: 'dashboard' }, '', `${basePath}/plugin/lexslider/`);
    }
}
