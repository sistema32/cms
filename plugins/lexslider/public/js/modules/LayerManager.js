
import { state, elements } from './EditorCore.js?v=3.0.28';
import { renderCanvas, selectLayer } from './CanvasRenderer.js?v=3.0.28';
import { renderProperties } from './PropertyInspector.js?v=3.0.28';
import { renderTimelineTracks } from './TimelineManager.js?v=3.0.28';
import { pushState } from './HistoryManager.js?v=3.0.28';

// renderLayerList is deprecated. The layer list is now part of the Timeline Tree View.
// We export an empty function just in case some other module calls it, to prevent crash.
export function renderLayerList() {
    // No-op
    renderTimelineTracks();
}

export function addLayer(type) {
    if (state.mode === 'slide' && !state.currentSlide) return;

    // For image layers, open the global Media Picker
    if (type === 'image' && window.CMS?.MediaPicker) {
        window.CMS.MediaPicker.open({
            filter: 'image',
            multiple: false,
            onSelect: (media) => {
                createLayerWithContent(type, { src: media.url });
            }
        });
        return;
    }

    // For other layer types, create directly
    createLayerWithContent(type, getDefaultContent(type));
}

function createLayerWithContent(type, content) {
    // Save state before adding
    pushState('Add Layer');

    const newLayer = {
        id: Date.now(),
        type: type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
        content: content,
        style: getDefaultStyle(type),
        // Default timeline properties
        startTime: 0,
        duration: state.currentSlide ? (state.currentSlide.duration || 5000) : 5000,
        hidden: false,
        locked: false,
        parentId: null,
        children: [], // IDs of children if this is a group
        expanded: true
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

    // Update undo/redo buttons
    if (window.LexSlider?.updateUndoRedoButtons) window.LexSlider.updateUndoRedoButtons();
}

export function groupLayers() {
    if (!state.currentSlide) return;
    const layers = state.currentSlide.layers;
    // For now, let's just create a group layer and add the currently selected layer to it
    // Or if multiple selection was supported, group them.
    // Since we only have single selection, let's add a "Group" type layer and maybe drag-drop later?
    // Or simpler: "Add Group" button.
    addLayer('group');
}

export function deleteLayer(id) {
    console.log("Deleting layer:", id);
    if (!confirm('Delete layer?')) return;

    // Save state before deleting
    pushState('Delete Layer');

    if (state.mode === 'global') {
        state.globalLayers = state.globalLayers.filter(l => l.id !== id);
    } else {
        // Also remove children or un-parent them? Let's delete them for now or un-parent.
        // Un-parenting is safer.
        const layerToDelete = state.currentSlide.layers.find(l => l.id === id);
        if (layerToDelete && layerToDelete.children) {
            layerToDelete.children.forEach(childId => {
                const child = state.currentSlide.layers.find(l => l.id === childId);
                if (child) child.parentId = null;
            });
        }

        state.currentSlide.layers = state.currentSlide.layers.filter(l => l.id !== id);

        // Also remove from any parent's children list
        state.currentSlide.layers.forEach(l => {
            if (l.children) {
                l.children = l.children.filter(cid => cid !== id);
            }
        });
    }

    if (state.selectedLayer && state.selectedLayer.id === id) state.selectedLayer = null;
    renderCanvas();
    renderTimelineTracks(); // Updates the tree view and tracks
    renderProperties();

    // Update undo/redo buttons
    if (window.LexSlider?.updateUndoRedoButtons) window.LexSlider.updateUndoRedoButtons();
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
        case 'group': return {};
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
    if (type === 'group') return { ...base, width: '300px', height: '200px', border: '1px dashed rgba(255,255,255,0.3)' };

    return base;
}
