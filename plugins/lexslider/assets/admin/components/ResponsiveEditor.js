/**
 * ResponsiveEditor - Device-specific settings editor
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { selectedLayer, uiState, actions } from '../services/state.js';

export function ResponsiveEditor() {
    const layer = selectedLayer.value;
    const device = uiState.value.device;
    const [deviceSettings, setDeviceSettings] = useState({});

    useEffect(() => {
        if (layer) {
            const responsive = layer.responsiveSettings || {};
            setDeviceSettings(responsive[device] || {});
        }
    }, [layer?.id, device]);

    if (!layer) {
        return html`
            <div class="responsive-editor-empty">
                <p>Select a layer to edit responsive settings</p>
            </div>
        `;
    }

    const handleSettingChange = async (key, value) => {
        const newDeviceSettings = { ...deviceSettings, [key]: value };
        setDeviceSettings(newDeviceSettings);

        const responsive = layer.responsiveSettings || {};
        const newResponsive = {
            ...responsive,
            [device]: newDeviceSettings,
        };

        await actions.updateLayer(layer.id, {
            responsiveSettings: newResponsive,
        });
    };

    const handleVisibilityToggle = async () => {
        const newVisible = deviceSettings.visible === false ? true : false;
        handleSettingChange('visible', newVisible);
    };

    const handleReset = async () => {
        const responsive = { ...layer.responsiveSettings };
        delete responsive[device];

        await actions.updateLayer(layer.id, {
            responsiveSettings: responsive,
        });

        setDeviceSettings({});
    };

    const isVisible = deviceSettings.visible !== false;
    const hasCustomSettings = Object.keys(deviceSettings).length > 0;

    return html`
        <div class="responsive-editor">
            <div class="responsive-header">
                <h4>Responsive Settings</h4>
                <span class="device-badge">${device}</span>
            </div>

            <div class="responsive-content">
                <div class="setting-row">
                    <label>Visible on ${device}</label>
                    <button
                        class=${`toggle-btn ${isVisible ? 'active' : ''}`}
                        onClick=${handleVisibilityToggle}
                    >
                        ${isVisible ? 'Visible' : 'Hidden'}
                    </button>
                </div>

                ${isVisible && html`
                    <div class="setting-section">
                        <h5>Position Override</h5>
                        
                        <div class="setting-row">
                            <label>X Position</label>
                            <input
                                type="number"
                                value=${deviceSettings.x ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('x', parseFloat(e.target.value) || undefined)}
                            />
                        </div>

                        <div class="setting-row">
                            <label>Y Position</label>
                            <input
                                type="number"
                                value=${deviceSettings.y ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('y', parseFloat(e.target.value) || undefined)}
                            />
                        </div>

                        <div class="setting-row">
                            <label>Width</label>
                            <input
                                type="number"
                                value=${deviceSettings.width ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('width', parseFloat(e.target.value) || undefined)}
                            />
                        </div>

                        <div class="setting-row">
                            <label>Height</label>
                            <input
                                type="number"
                                value=${deviceSettings.height ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('height', parseFloat(e.target.value) || undefined)}
                            />
                        </div>
                    </div>

                    <div class="setting-section">
                        <h5>Style Override</h5>
                        
                        <div class="setting-row">
                            <label>Font Size</label>
                            <input
                                type="number"
                                value=${deviceSettings.fontSize ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('fontSize', parseFloat(e.target.value) || undefined)}
                            />
                        </div>

                        <div class="setting-row">
                            <label>Padding</label>
                            <input
                                type="number"
                                value=${deviceSettings.padding ?? ''}
                                placeholder="Inherit"
                                onInput=${(e) => handleSettingChange('padding', parseFloat(e.target.value) || undefined)}
                            />
                        </div>
                    </div>
                `}

                ${hasCustomSettings && html`
                    <button class="reset-btn" onClick=${handleReset}>
                        Reset to Default
                    </button>
                `}
            </div>
        </div>
    `;
}
