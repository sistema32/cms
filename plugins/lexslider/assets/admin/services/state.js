/**
 * State Management for LexSlider Admin UI
 * Simple reactive state management using Preact signals
 */

import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.1';

// Current slider being edited
export const currentSlider = signal(null);

// Current slide being edited
export const currentSlide = signal(null);

// List of layers in current slide
export const layers = signal([]);

// Selected layer
export const selectedLayer = signal(null);

// UI state
export const uiState = signal({
    device: 'desktop', // 'desktop', 'tablet', 'mobile'
    zoom: 100, // percentage
    showGrid: true,
    snapToGrid: true,
    gridSize: 10,
    isPlaying: false, // Animation preview
});

// Computed: Filtered layers by device visibility
export const visibleLayers = computed(() => {
    const device = uiState.value.device;
    return layers.value.filter(layer => {
        const responsive = layer.responsiveSettings || {};
        return responsive[device]?.visible !== false;
    });
});

// Actions
export const actions = {
    // Slider actions
    setCurrentSlider(slider) {
        currentSlider.value = slider;
    },

    // Slide actions
    setCurrentSlide(slide) {
        currentSlide.value = slide;
        if (slide) {
            this.loadLayers(slide.id);
        }
    },

    async loadLayers(slideId) {
        const response = await fetch(`/api/plugins/lexslider/slides/${slideId}/layers`);
        const data = await response.json();
        layers.value = data;
    },

    // Layer actions
    selectLayer(layer) {
        selectedLayer.value = layer;
    },

    async addLayer(type) {
        if (!currentSlide.value) return;

        const response = await fetch(`/api/plugins/lexslider/slides/${currentSlide.value.id}/layers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                content: type === 'heading' ? 'New Heading' : 'New Text',
                settings: {},
                position: { x: 100, y: 100, width: 300, height: 100, zIndex: layers.value.length + 1 },
                animations: {},
                responsiveSettings: {},
            }),
        });

        const newLayer = await response.json();
        layers.value = [...layers.value, newLayer];
        selectedLayer.value = newLayer;
    },

    async updateLayer(layerId, updates) {
        const response = await fetch(`/api/plugins/lexslider/layers/${layerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        const updated = await response.json();
        layers.value = layers.value.map(l => l.id === layerId ? updated : l);

        if (selectedLayer.value?.id === layerId) {
            selectedLayer.value = updated;
        }
    },

    async deleteLayer(layerId) {
        await fetch(`/api/plugins/lexslider/layers/${layerId}`, {
            method: 'DELETE',
        });

        layers.value = layers.value.filter(l => l.id !== layerId);

        if (selectedLayer.value?.id === layerId) {
            selectedLayer.value = null;
        }
    },

    async duplicateLayer(layerId) {
        const response = await fetch(`/api/plugins/lexslider/layers/${layerId}/duplicate`, {
            method: 'POST',
        });

        const duplicated = await response.json();
        layers.value = [...layers.value, duplicated];
    },

    async reorderLayer(layerId, newOrder) {
        await fetch(`/api/plugins/lexslider/layers/${layerId}/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder }),
        });

        await this.loadLayers(currentSlide.value.id);
    },

    // UI actions
    setDevice(device) {
        uiState.value = { ...uiState.value, device };
    },

    setZoom(zoom) {
        uiState.value = { ...uiState.value, zoom };
    },

    toggleGrid() {
        uiState.value = { ...uiState.value, showGrid: !uiState.value.showGrid };
    },

    toggleSnap() {
        uiState.value = { ...uiState.value, snapToGrid: !uiState.value.snapToGrid };
    },

    togglePreview() {
        uiState.value = { ...uiState.value, isPlaying: !uiState.value.isPlaying };
    },
};
