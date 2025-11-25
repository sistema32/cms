/**
 * PropertiesPanel - Right panel for editing layer properties
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { selectedLayer, actions } from '../services/state.js';
import { animationPresets } from '../utils/animations.js';

export function PropertiesPanel() {
    const layer = selectedLayer.value;
    const [localContent, setLocalContent] = useState('');
    const [localSettings, setLocalSettings] = useState({});
    const [localPosition, setLocalPosition] = useState({});

    useEffect(() => {
        if (layer) {
            setLocalContent(layer.content || '');
            setLocalSettings(layer.settings || {});
            setLocalPosition(layer.position || {});
        }
    }, [layer?.id]);

    if (!layer) {
        return html`
            <div class="properties-panel">
                <div class="panel-empty">
                    <p>Select a layer to edit properties</p>
                </div>
            </div>
        `;
    }

    const handleContentChange = (value) => {
        setLocalContent(value);
        actions.updateLayer(layer.id, { content: value });
    };

    const handleSettingChange = (key, value) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        actions.updateLayer(layer.id, { settings: newSettings });
    };

    const handlePositionChange = (key, value) => {
        const newPosition = { ...localPosition, [key]: parseFloat(value) || 0 };
        setLocalPosition(newPosition);
        actions.updateLayer(layer.id, { position: newPosition });
    };

    const handleAnimationChange = (type, value) => {
        const animations = layer.animations || {};
        const newAnimations = { ...animations, [type]: value };
        actions.updateLayer(layer.id, { animations: newAnimations });
    };

    return html`
        <div class="properties-panel">
            <div class="panel-header">
                <h3>Layer Properties</h3>
                <span class="layer-type">${layer.type}</span>
            </div>

            <div class="panel-content">
                <!-- Content Section -->
                <div class="property-section">
                    <h4>📝 Content</h4>
                    ${layer.type === 'image' ? html`
                        <input
                            type="text"
                            placeholder="Image URL"
                            value=${localContent}
                            onInput=${(e) => handleContentChange(e.target.value)}
                        />
                    ` : html`
                        <textarea
                            placeholder="Enter content..."
                            value=${localContent}
                            onInput=${(e) => handleContentChange(e.target.value)}
                            rows="3"
                        />
                    `}
                </div>

                <!-- Style Section -->
                <div class="property-section">
                    <h4>🎨 Style</h4>
                    
                    <div class="property-row">
                        <label>Font Size</label>
                        <input
                            type="number"
                            value=${localSettings.fontSize || 16}
                            onInput=${(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                            min="8"
                            max="200"
                        />
                    </div>

                    <div class="property-row">
                        <label>Color</label>
                        <input
                            type="color"
                            value=${localSettings.color || '#000000'}
                            onInput=${(e) => handleSettingChange('color', e.target.value)}
                        />
                    </div>

                    <div class="property-row">
                        <label>Font Weight</label>
                        <select
                            value=${localSettings.fontWeight || 400}
                            onChange=${(e) => handleSettingChange('fontWeight', parseInt(e.target.value))}
                        >
                            <option value="300">Light</option>
                            <option value="400">Normal</option>
                            <option value="600">Semi-Bold</option>
                            <option value="700">Bold</option>
                        </select>
                    </div>

                    <div class="property-row">
                        <label>Text Align</label>
                        <div class="button-group">
                            ${['left', 'center', 'right'].map(align => html`
                                <button
                                    key=${align}
                                    class=${localSettings.textAlign === align ? 'active' : ''}
                                    onClick=${() => handleSettingChange('textAlign', align)}
                                >
                                    ${align[0].toUpperCase()}
                                </button>
                            `)}
                        </div>
                    </div>
                </div>

                <!-- Position Section -->
                <div class="property-section">
                    <h4>📍 Position</h4>
                    
                    <div class="property-grid">
                        <div class="property-row">
                            <label>X</label>
                            <input
                                type="number"
                                value=${localPosition.x || 0}
                                onInput=${(e) => handlePositionChange('x', e.target.value)}
                            />
                        </div>
                        <div class="property-row">
                            <label>Y</label>
                            <input
                                type="number"
                                value=${localPosition.y || 0}
                                onInput=${(e) => handlePositionChange('y', e.target.value)}
                            />
                        </div>
                    </div>

                    <div class="property-grid">
                        <div class="property-row">
                            <label>Width</label>
                            <input
                                type="number"
                                value=${localPosition.width || 200}
                                onInput=${(e) => handlePositionChange('width', e.target.value)}
                            />
                        </div>
                        <div class="property-row">
                            <label>Height</label>
                            <input
                                type="number"
                                value=${localPosition.height || 100}
                                onInput=${(e) => handlePositionChange('height', e.target.value)}
                            />
                        </div>
                    </div>

                    <div class="property-row">
                        <label>Z-Index</label>
                        <input
                            type="number"
                            value=${localPosition.zIndex || 1}
                            onInput=${(e) => handlePositionChange('zIndex', e.target.value)}
                        />
                    </div>
                </div>

                <!-- Animations Section -->
                <div class="property-section">
                    <h4>🎬 Animations</h4>
                    
                    <div class="property-row">
                        <label>In Animation</label>
                        <select
                            value=${layer.animations?.in?.type || ''}
                            onChange=${(e) => handleAnimationChange('in', e.target.value ? { type: e.target.value, duration: 1000 } : null)}
                        >
                            <option value="">None</option>
                            ${Object.keys(animationPresets.in).map(key => html`
                                <option key=${key} value=${key}>
                                    ${animationPresets.in[key].name}
                                </option>
                            `)}
                        </select>
                    </div>

                    <div class="property-row">
                        <label>Out Animation</label>
                        <select
                            value=${layer.animations?.out?.type || ''}
                            onChange=${(e) => handleAnimationChange('out', e.target.value ? { type: e.target.value, duration: 800 } : null)}
                        >
                            <option value="">None</option>
                            ${Object.keys(animationPresets.out).map(key => html`
                                <option key=${key} value=${key}>
                                    ${animationPresets.out[key].name}
                                </option>
                            `)}
                        </select>
                    </div>

                    <div class="property-row">
                        <label>Loop Animation</label>
                        <select
                            value=${layer.animations?.loop?.type || ''}
                            onChange=${(e) => handleAnimationChange('loop', e.target.value ? { type: e.target.value } : null)}
                        >
                            <option value="">None</option>
                            ${Object.keys(animationPresets.loop).map(key => html`
                                <option key=${key} value=${key}>
                                    ${animationPresets.loop[key].name}
                                </option>
                            `)}
                        </select>
                    </div>
                </div>

                <!-- Actions -->
                <div class="property-actions">
                    <button 
                        class="btn-danger"
                        onClick=${() => {
            if (confirm('Delete this layer?')) {
                actions.deleteLayer(layer.id);
            }
        }}
                    >
                        🗑️ Delete Layer
                    </button>
                    <button onClick=${() => actions.duplicateLayer(layer.id)}>
                        📋 Duplicate
                    </button>
                </div>
            </div>
        </div>
    `;
}
