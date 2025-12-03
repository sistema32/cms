
import { state, elements } from './EditorCore.js?v=3.0.10';
import { renderCanvas, selectLayer } from './CanvasRenderer.js';
import { renderProperties } from './PropertyInspector.js';
import { renderTimelineTracks } from './TimelineManager.js';

// renderLayerList is deprecated. The layer list is now part of the Timeline Tree View.
// We export an empty function just in case some other module calls it, to prevent crash.
export function renderLayerList() {
    // No-op
    renderTimelineTracks();
}

export function addLayer(type) {
    if (state.mode === 'slide' && !state.currentSlide) return;

    const newLayer = {
        id: Date.now(),
        type: type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
        content: getDefaultContent(type),
        style: getDefaultStyle(type),
        // Default timeline properties
        startTime: 0,
        duration: state.currentSlide ? (state.currentSlide.duration || 5000) : 5000,
        hidden: false,
        locked: false
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
    renderTimelineTracks(); // Updates the tree view and tracks
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
    renderTimelineTracks(); // Updates the tree view and tracks
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
        case 'shape': return {};
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

    if (type === 'heading') return { ...base, fontSize: '32px', color: '#ffffff', fontWeight: 'bold' };
    if (type === 'text') return { ...base, fontSize: '16px', color: '#cccccc' };
    if (type === 'button') return { ...base, background: '#8470ff', color: '#ffffff', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none' };
    if (type === 'image') return { ...base, width: '200px' };
    if (type === 'video') return { ...base, width: '400px', height: '225px' };
    if (type === 'icon') return { ...base, fontSize: '48px', color: '#ffcc00' };
    if (type === 'shape') return { ...base, width: '100px', height: '100px', background: '#8470ff' };

    return base;
}
