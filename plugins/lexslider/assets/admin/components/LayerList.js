/**
 * LayerList - Layer hierarchy and management
 * Shows all layers with drag-to-reorder
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import { layers, selectedLayer, actions } from '../services/state.js';

export function LayerList() {
    const [draggedLayer, setDraggedLayer] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, layer, index) => {
        setDraggedLayer({ layer, index });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();

        if (!draggedLayer || draggedLayer.index === targetIndex) {
            setDraggedLayer(null);
            setDragOverIndex(null);
            return;
        }

        // Reorder layers
        const newLayers = [...layers.value];
        const [removed] = newLayers.splice(draggedLayer.index, 1);
        newLayers.splice(targetIndex, 0, removed);

        // Update order values
        newLayers.forEach((layer, idx) => {
            layer.order = idx;
        });

        // Update in backend
        for (const layer of newLayers) {
            await actions.reorderLayer(layer.id, layer.order);
        }

        setDraggedLayer(null);
        setDragOverIndex(null);
    };

    const handleLayerClick = (layer) => {
        actions.selectLayer(layer);
    };

    const toggleVisibility = async (layer) => {
        const newSettings = {
            ...layer.settings,
            visible: !layer.settings?.visible,
        };
        await actions.updateLayer(layer.id, { settings: newSettings });
    };

    const toggleLock = async (layer) => {
        const newSettings = {
            ...layer.settings,
            locked: !layer.settings?.locked,
        };
        await actions.updateLayer(layer.id, { settings: newSettings });
    };

    if (layers.value.length === 0) {
        return html`
            <div class="layer-list-empty">
                <p>No layers yet. Add a layer to get started!</p>
            </div>
        `;
    }

    return html`
        <div class="layer-list">
            <div class="layer-list-header">
                <h4>Layers</h4>
                <span class="layer-count">${layers.value.length}</span>
            </div>

            <div class="layer-items">
                ${layers.value.map((layer, index) => {
        const isSelected = selectedLayer.value?.id === layer.id;
        const isDragOver = dragOverIndex === index;
        const isVisible = layer.settings?.visible !== false;
        const isLocked = layer.settings?.locked === true;

        return html`
                        <div
                            key=${layer.id}
                            class=${`layer-item ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
                            draggable=${!isLocked}
                            onDragStart=${(e) => handleDragStart(e, layer, index)}
                            onDragOver=${(e) => handleDragOver(e, index)}
                            onDrop=${(e) => handleDrop(e, index)}
                            onClick=${() => handleLayerClick(layer)}
                        >
                            <div class="layer-icon">
                                ${getLayerIcon(layer.type)}
                            </div>
                            
                            <div class="layer-info">
                                <div class="layer-name">
                                    ${layer.content?.substring(0, 20) || layer.type}
                                </div>
                                <div class="layer-type">${layer.type}</div>
                            </div>

                            <div class="layer-actions">
                                <button
                                    class=${`icon-btn ${isVisible ? '' : 'inactive'}`}
                                    onClick=${(e) => { e.stopPropagation(); toggleVisibility(layer); }}
                                    title=${isVisible ? 'Hide' : 'Show'}
                                >
                                    ${isVisible ? '👁️' : '👁️‍🗨️'}
                                </button>
                                <button
                                    class=${`icon-btn ${isLocked ? 'active' : ''}`}
                                    onClick=${(e) => { e.stopPropagation(); toggleLock(layer); }}
                                    title=${isLocked ? 'Unlock' : 'Lock'}
                                >
                                    ${isLocked ? '🔒' : '🔓'}
                                </button>
                            </div>
                        </div>
                    `;
    })}
            </div>
        </div>
    `;
}

function getLayerIcon(type) {
    const icons = {
        heading: '📝',
        text: '📄',
        button: '🔘',
        image: '🖼️',
        video: '🎬',
        html: '💻',
        icon: '⭐',
        shape: '⬛',
    };
    return icons[type] || '📦';
}
