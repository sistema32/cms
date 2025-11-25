/**
 * EditorHeader - Top bar with controls
 */

import { html } from 'https://esm.sh/htm/preact';
import { uiState, currentSlider, actions } from '../services/state.js';

export function EditorHeader({ onBack, onSave }) {
    const devices = ['desktop', 'tablet', 'mobile'];
    const zoomLevels = [50, 75, 100, 125, 150, 200];

    return html`
        <div class="editor-header">
            <div class="header-left">
                <button class="back-button" onClick=${onBack}>
                    ← Back
                </button>
                <div class="slider-title">
                    <strong>Slider:</strong> ${currentSlider.value?.name || 'Untitled'}
                </div>
            </div>

            <div class="header-center">
                <div class="device-selector">
                    ${devices.map(device => html`
                        <button
                            key=${device}
                            class=${uiState.value.device === device ? 'active' : ''}
                            onClick=${() => actions.setDevice(device)}
                            title=${device.charAt(0).toUpperCase() + device.slice(1)}
                        >
                            ${device === 'desktop' ? '🖥️' : device === 'tablet' ? '📱' : '📱'}
                        </button>
                    `)}
                </div>

                <select 
                    class="zoom-selector"
                    value=${uiState.value.zoom}
                    onChange=${(e) => actions.setZoom(parseInt(e.target.value))}
                >
                    ${zoomLevels.map(zoom => html`
                        <option key=${zoom} value=${zoom}>${zoom}%</option>
                    `)}
                </select>
            </div>

            <div class="header-right">
                <button class="btn-save" onClick=${onSave}>
                    💾 Save
                </button>
                <button class="btn-preview" onClick=${actions.togglePreview}>
                    👁️ Preview
                </button>
            </div>
        </div>
    `;
}
