
import { state, elements } from './EditorCore.js';
import { renderCanvas, selectLayer } from './CanvasRenderer.js';
import { renderProperties } from './PropertyInspector.js';

export function renderLayerList() {
    const list = elements.editor.layerList;
    const layers = state.mode === 'global' ? state.globalLayers : (state.currentSlide ? state.currentSlide.layers : []);

    if (layers.length === 0) {
        list.innerHTML = '<p class="empty-text">No layers</p>';
        return;
    }

    const layersReversed = [...layers].reverse();

    list.innerHTML = layersReversed.map(layer => `
        <div class="layer-tree-item ${state.selectedLayer === layer ? 'active' : ''}" 
             onclick="window.LexSlider.selectLayerById(${layer.id})">
            <div class="layer-status">
                <button class="btn-icon-sm ${layer.hidden ? 'active' : ''}" onclick="event.stopPropagation(); window.LexSlider.toggleLayerVisibility(${layer.id})">
                    <span class="material-icons-round" style="font-size: 12px;">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button class="btn-icon-sm ${layer.locked ? 'active' : ''}" onclick="event.stopPropagation(); window.LexSlider.toggleLayerLock(${layer.id})">
                    <span class="material-icons-round" style="font-size: 12px;">${layer.locked ? 'lock' : 'lock_open'}</span>
                </button>
            </div>
            <span class="material-icons-round icon">${getLayerIcon(layer.type)}</span>
            <span class="name" style="${layer.hidden ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${layer.name}</span>
            <div class="layer-actions">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); window.LexSlider.deleteLayer(${layer.id})" title="Delete">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
        </div>
    `).join('');
}

function getLayerIcon(type) {
    if (type === 'heading') return 'title';
    if (type === 'text') return 'text_fields';
    if (type === 'image') return 'image';
    if (type === 'video') return 'play_circle';
    if (type === 'icon') return 'star';
    if (type === 'button') return 'smart_button';
    return 'layers';
}

export function addLayer(type) {
    if (state.mode === 'slide' && !state.currentSlide) return;

    const newLayer = {
        id: Date.now(),
        type: type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
        content: getDefaultContent(type),
        style: getDefaultStyle(type)
    };

    if (state.mode === 'global') {
        if (!state.globalLayers) state.globalLayers = [];
        state.globalLayers.push(newLayer);
    } else {
        if (!state.currentSlide.layers) state.currentSlide.layers = [];
        state.currentSlide.layers.push(newLayer);
    }

    selectLayer(newLayer);
    renderCanvas();
    renderLayerList();
}

export function deleteLayer(id) {
    if (!confirm('Delete layer?')) return;

    if (state.mode === 'global') {
        state.globalLayers = state.globalLayers.filter(l => l.id !== id);
    } else {
        state.currentSlide.layers = state.currentSlide.layers.filter(l => l.id !== id);
    }

    if (state.selectedLayer && state.selectedLayer.id === id) state.selectedLayer = null;
    renderCanvas();
    renderLayerList();
    renderProperties();
}

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
