/**
 * EditorPanels.js - Additional editor panels for LexSlider
 * History Panel, Templates, Presets, and Effects controls
 */

import { state, elements } from './EditorCore.js?v=3.0.28';
import { renderCanvas } from './CanvasRenderer.js?v=3.0.28';
import { renderTimelineTracks } from './TimelineManager.js?v=3.0.28';

// ==================== HISTORY PANEL ====================

import {
    pushState, undo, redo, canUndo, canRedo,
    goToState, getHistoryStatus, initHistory
} from './HistoryPanel.js';

// Use window.LexSlider.renderProperties to avoid circular dependency
const renderProperties = () => window.LexSlider?.renderProperties?.();

let historyPanelVisible = false;
let historyStates = [];
let currentHistoryIndex = -1;

export function toggleHistoryPanel() {
    historyPanelVisible = !historyPanelVisible;
    renderHistoryPanel();
}

export function renderHistoryPanel() {
    const container = document.getElementById('historyPanelContainer');
    if (!container) return;

    if (!historyPanelVisible) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const status = getHistoryStatus();

    container.innerHTML = `
        <div class="bg-base-200 rounded-lg border border-base-300 overflow-hidden">
            <div class="flex items-center justify-between px-3 py-2 bg-base-300">
                <div class="flex items-center gap-2">
                    <span class="material-icons-round text-sm">history</span>
                    <span class="font-bold text-xs">History</span>
                    <span class="badge badge-sm badge-ghost">${status.currentIndex + 1}/${status.totalStates}</span>
                </div>
                <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.historyUndo()" ${!status.canUndo ? 'disabled' : ''}>
                        <span class="material-icons-round text-sm">undo</span>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.historyRedo()" ${!status.canRedo ? 'disabled' : ''}>
                        <span class="material-icons-round text-sm">redo</span>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.toggleHistoryPanel()">
                        <span class="material-icons-round text-sm">close</span>
                    </button>
                </div>
            </div>
            <div class="max-h-60 overflow-y-auto p-2">
                ${status.states.map((s, i) => `
                    <div class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-base-300 ${s.isCurrent ? 'bg-primary/20 border-l-2 border-primary' : ''}"
                         onclick="window.LexSlider.historyGoTo(${i})">
                        <span class="material-icons-round text-xs opacity-60">${getHistoryIcon(s.actionType)}</span>
                        <span class="text-xs flex-1 truncate">${s.actionName}</span>
                        ${s.isCurrent ? '<span class="badge badge-xs badge-primary">Current</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getHistoryIcon(actionType) {
    const icons = {
        'initial': 'flag',
        'add-layer': 'add_box',
        'delete-layer': 'delete',
        'move-layer': 'open_with',
        'edit-text': 'text_fields',
        'change-style': 'palette',
        'default': 'history'
    };
    return icons[actionType] || icons.default;
}

export function historyUndo() {
    if (undo()) {
        renderCanvas();
        renderTimelineTracks();
        renderProperties();
        renderHistoryPanel();
    }
}

export function historyRedo() {
    if (redo()) {
        renderCanvas();
        renderTimelineTracks();
        renderProperties();
        renderHistoryPanel();
    }
}

export function historyGoTo(index) {
    if (goToState(index)) {
        renderCanvas();
        renderTimelineTracks();
        renderProperties();
        renderHistoryPanel();
    }
}

// ==================== LAYER TYPE CONTROLS ====================

// Countdown Timer
export function renderCountdownControls(layer) {
    const config = layer.content?.countdownConfig || {};
    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Target Date/Time</span></label>
            <input type="datetime-local" value="${config.targetDate || ''}" 
                   onchange="window.LexSlider.updateLayerContent('countdownConfig', {...(state.selectedLayer.content.countdownConfig || {}), targetDate: this.value})"
                   class="input input-xs input-bordered w-full">
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Style</span></label>
            <select onchange="window.LexSlider.updateCountdownStyle(this.value)" class="select select-xs select-bordered w-full">
                <option value="minimal" ${config.style === 'minimal' ? 'selected' : ''}>Minimal</option>
                <option value="boxes" ${config.style === 'boxes' || !config.style ? 'selected' : ''}>Boxes</option>
                <option value="circles" ${config.style === 'circles' ? 'selected' : ''}>Circles</option>
                <option value="flip" ${config.style === 'flip' ? 'selected' : ''}>Flip Clock</option>
                <option value="neon" ${config.style === 'neon' ? 'selected' : ''}>Neon</option>
            </select>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.showDays !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateCountdownOption('showDays', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Days</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.showHours !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateCountdownOption('showHours', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Hours</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.showMinutes !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateCountdownOption('showMinutes', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Minutes</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.showSeconds !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateCountdownOption('showSeconds', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Seconds</span>
            </label>
        </div>
    `;
}

// Typing Effect
export function renderTypingControls(layer) {
    const config = layer.content?.typingConfig || {};
    const texts = config.texts || [''];
    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Texts (one per line)</span></label>
            <textarea rows="3" onchange="window.LexSlider.updateTypingTexts(this.value)"
                      class="textarea textarea-xs textarea-bordered w-full">${texts.join('\n')}</textarea>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Preset</span></label>
            <select onchange="window.LexSlider.updateTypingPreset(this.value)" class="select select-xs select-bordered w-full">
                <option value="typewriter" ${config.preset === 'typewriter' || !config.preset ? 'selected' : ''}>Typewriter</option>
                <option value="terminal" ${config.preset === 'terminal' ? 'selected' : ''}>Terminal</option>
                <option value="slow" ${config.preset === 'slow' ? 'selected' : ''}>Slow & Dramatic</option>
                <option value="instant" ${config.preset === 'instant' ? 'selected' : ''}>Word by Word</option>
                <option value="glitch" ${config.preset === 'glitch' ? 'selected' : ''}>Glitch</option>
            </select>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Speed (ms)</span></label>
                <input type="number" value="${config.typingSpeed || 50}" min="10" max="500"
                       onchange="window.LexSlider.updateTypingOption('typingSpeed', parseInt(this.value))"
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Cursor</span></label>
                <input type="text" value="${config.cursor || '|'}" maxlength="2"
                       onchange="window.LexSlider.updateTypingOption('cursor', this.value)"
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
        <label class="label cursor-pointer py-1 justify-start gap-2">
            <input type="checkbox" ${config.loop !== false ? 'checked' : ''} 
                   onchange="window.LexSlider.updateTypingOption('loop', this.checked)"
                   class="checkbox checkbox-xs checkbox-primary">
            <span class="label-text text-xs">Loop</span>
        </label>
    `;
}

// Social Share
export function renderSocialShareControls(layer) {
    const config = layer.content?.shareConfig || {};
    const networks = config.networks || ['facebook', 'twitter', 'whatsapp'];
    const allNetworks = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'pinterest', 'reddit', 'email', 'copy'];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Networks</span></label>
            <div class="grid grid-cols-3 gap-1">
                ${allNetworks.map(n => `
                    <label class="label cursor-pointer py-1 justify-start gap-1 text-[10px]">
                        <input type="checkbox" ${networks.includes(n) ? 'checked' : ''} 
                               onchange="window.LexSlider.toggleShareNetwork('${n}', this.checked)"
                               class="checkbox checkbox-xs checkbox-primary">
                        <span>${n.charAt(0).toUpperCase() + n.slice(1)}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Layout</span></label>
                <select onchange="window.LexSlider.updateShareOption('layout', this.value)" class="select select-xs select-bordered w-full">
                    <option value="horizontal" ${config.layout === 'horizontal' || !config.layout ? 'selected' : ''}>Horizontal</option>
                    <option value="vertical" ${config.layout === 'vertical' ? 'selected' : ''}>Vertical</option>
                    <option value="grid" ${config.layout === 'grid' ? 'selected' : ''}>Grid</option>
                </select>
            </div>
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Style</span></label>
                <select onchange="window.LexSlider.updateShareOption('buttonStyle', this.value)" class="select select-xs select-bordered w-full">
                    <option value="filled" ${config.buttonStyle === 'filled' || !config.buttonStyle ? 'selected' : ''}>Filled</option>
                    <option value="outline" ${config.buttonStyle === 'outline' ? 'selected' : ''}>Outline</option>
                    <option value="ghost" ${config.buttonStyle === 'ghost' ? 'selected' : ''}>Ghost</option>
                    <option value="icon" ${config.buttonStyle === 'icon' ? 'selected' : ''}>Icon Only</option>
                </select>
            </div>
        </div>
    `;
}

// Lottie Animation
export function renderLottieControls(layer) {
    const config = layer.content?.lottieConfig || {};
    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Lottie JSON URL</span></label>
            <input type="text" value="${config.src || ''}" 
                   onchange="window.LexSlider.updateLottieOption('src', this.value)"
                   placeholder="https://assets.lottiefiles.com/..."
                   class="input input-xs input-bordered w-full">
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.autoplay !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateLottieOption('autoplay', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Autoplay</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.loop !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateLottieOption('loop', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Loop</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.hover ? 'checked' : ''} 
                       onchange="window.LexSlider.updateLottieOption('hover', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Play on Hover</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${config.scroll ? 'checked' : ''} 
                       onchange="window.LexSlider.updateLottieOption('scroll', this.checked)"
                       class="checkbox checkbox-xs checkbox-primary">
                <span class="label-text text-xs">Scroll-based</span>
            </label>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs">Speed</span></label>
            <input type="range" min="0.1" max="3" step="0.1" value="${config.speed || 1}"
                   oninput="window.LexSlider.updateLottieOption('speed', parseFloat(this.value))"
                   class="range range-xs range-primary">
        </div>
    `;
}

// HTML/Iframe Embed
export function renderHTMLEmbedControls(layer) {
    const config = layer.content?.embedConfig || {};
    return `
        <div class="tabs tabs-boxed bg-base-100 mb-2">
            <a class="tab tab-xs ${config.type !== 'embed' ? 'tab-active' : ''}" 
               onclick="window.LexSlider.setEmbedType('html')">HTML</a>
            <a class="tab tab-xs ${config.type === 'embed' ? 'tab-active' : ''}"
               onclick="window.LexSlider.setEmbedType('embed')">Embed URL</a>
        </div>
        ${config.type !== 'embed' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">HTML Content</span></label>
                <textarea rows="6" onchange="window.LexSlider.updateEmbedOption('content', this.value)"
                          placeholder="<div>Your HTML here</div>"
                          class="textarea textarea-xs textarea-bordered w-full font-mono text-[10px]">${config.content || ''}</textarea>
            </div>
        ` : `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Embed URL</span></label>
                <input type="text" value="${config.url || ''}" 
                       onchange="window.LexSlider.updateEmbedOption('url', this.value)"
                       placeholder="YouTube, Vimeo, Maps, CodePen..."
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="text-[10px] opacity-60 mb-2">
                Supports: YouTube, Vimeo, Google Maps, CodePen, Spotify
            </div>
        `}
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Width</span></label>
                <input type="text" value="${config.width || '100%'}" 
                       onchange="window.LexSlider.updateEmbedOption('width', this.value)"
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Height</span></label>
                <input type="text" value="${config.height || '400px'}" 
                       onchange="window.LexSlider.updateEmbedOption('height', this.value)"
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
        <label class="label cursor-pointer py-1 justify-start gap-2">
            <input type="checkbox" ${config.lazy !== false ? 'checked' : ''} 
                   onchange="window.LexSlider.updateEmbedOption('lazy', this.checked)"
                   class="checkbox checkbox-xs checkbox-primary">
            <span class="label-text text-xs">Lazy Load</span>
        </label>
    `;
}

// Hotspots (for image layers)
export function renderHotspotsControls(layer) {
    const hotspots = layer.content?.hotspots || [];
    return `
        <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold">Hotspots</span>
            <button class="btn btn-xs btn-primary" onclick="window.LexSlider.addHotspot()">
                <span class="material-icons-round text-xs">add_location</span> Add
            </button>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
            ${hotspots.map((h, i) => `
                <div class="bg-base-300 rounded p-2">
                    <div class="flex justify-between mb-1">
                        <span class="text-xs font-bold">#${i + 1}</span>
                        <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.removeHotspot(${i})">
                            <span class="material-icons-round text-xs">close</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-1">
                        <input type="number" value="${h.x}" min="0" max="100" placeholder="X %"
                               onchange="window.LexSlider.updateHotspot(${i}, 'x', parseFloat(this.value))"
                               class="input input-xs input-bordered w-full">
                        <input type="number" value="${h.y}" min="0" max="100" placeholder="Y %"
                               onchange="window.LexSlider.updateHotspot(${i}, 'y', parseFloat(this.value))"
                               class="input input-xs input-bordered w-full">
                    </div>
                    <input type="text" value="${h.tooltip?.title || ''}" placeholder="Tooltip title"
                           onchange="window.LexSlider.updateHotspotTooltip(${i}, 'title', this.value)"
                           class="input input-xs input-bordered w-full mt-1">
                </div>
            `).join('') || '<div class="text-xs opacity-50 text-center py-4">No hotspots yet</div>'}
        </div>
    `;
}

// ==================== EFFECTS CONTROLS ====================

// Loop Animation selector
export function renderLoopAnimationControls(layer) {
    const loopAnim = layer.style?.loopAnimation || 'none';
    const presets = [
        { value: 'none', label: 'None' },
        { value: 'float', label: 'Float' },
        { value: 'pulse', label: 'Pulse' },
        { value: 'rotate', label: 'Rotate' },
        { value: 'swing', label: 'Swing' },
        { value: 'bounce', label: 'Bounce' },
        { value: 'shake', label: 'Shake' },
        { value: 'wobble', label: 'Wobble' },
        { value: 'wave', label: 'Wave' },
        { value: 'heartbeat', label: 'Heartbeat' },
        { value: 'breathe', label: 'Breathe' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'jello', label: 'Jello' }
    ];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Loop Animation</span></label>
            <div class="grid grid-cols-3 gap-1">
                ${presets.map(p => `
                    <div class="p-1.5 border rounded cursor-pointer text-center text-[10px] hover:bg-base-200 ${loopAnim === p.value ? 'border-primary bg-primary/10' : 'border-base-300'}"
                         onclick="window.LexSlider.updateLayerStyle('loopAnimation', '${p.value}')">
                        ${p.label}
                    </div>
                `).join('')}
            </div>
        </div>
        ${loopAnim !== 'none' ? `
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Duration (s)</span></label>
                    <input type="number" step="0.1" value="${layer.style?.loopDuration || 2}" min="0.1"
                           onchange="window.LexSlider.updateLayerStyle('loopDuration', this.value)"
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Intensity</span></label>
                    <input type="range" min="0.5" max="2" step="0.1" value="${layer.style?.loopIntensity || 1}"
                           oninput="window.LexSlider.updateLayerStyle('loopIntensity', this.value)"
                           class="range range-xs range-primary">
                </div>
            </div>
        ` : ''}
    `;
}

// Parallax controls
export function renderParallaxControls(layer) {
    const parallax = layer.style?.parallax || {};
    return `
        <label class="label cursor-pointer py-1 justify-start gap-2 mb-2">
            <input type="checkbox" ${parallax.enabled ? 'checked' : ''} 
                   onchange="window.LexSlider.updateParallax('enabled', this.checked)"
                   class="toggle toggle-xs toggle-primary">
            <span class="label-text text-xs font-bold">Enable Parallax</span>
        </label>
        ${parallax.enabled ? `
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Speed</span></label>
                    <input type="range" min="0" max="1" step="0.1" value="${parallax.speed || 0.5}"
                           oninput="window.LexSlider.updateParallax('speed', parseFloat(this.value))"
                           class="range range-xs range-primary">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Direction</span></label>
                    <select onchange="window.LexSlider.updateParallax('direction', this.value)" class="select select-xs select-bordered w-full">
                        <option value="vertical" ${parallax.direction !== 'horizontal' ? 'selected' : ''}>Vertical</option>
                        <option value="horizontal" ${parallax.direction === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                    </select>
                </div>
            </div>
        ` : ''}
    `;
}

// Ken Burns controls (for images)
export function renderKenBurnsControls(layer) {
    const kb = layer.style?.kenBurns || {};
    const presets = [
        'none', 'zoomIn', 'zoomOut', 'panLeft', 'panRight',
        'panUp', 'panDown', 'zoomInPanLeft', 'zoomInPanRight',
        'zoomOutPanLeft', 'zoomOutPanRight', 'slowZoom', 'dramaticPan'
    ];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Ken Burns Effect</span></label>
            <select onchange="window.LexSlider.updateKenBurns('preset', this.value)" class="select select-xs select-bordered w-full">
                ${presets.map(p => `
                    <option value="${p}" ${kb.preset === p ? 'selected' : ''}>${p === 'none' ? 'None' : p.replace(/([A-Z])/g, ' $1').trim()}</option>
                `).join('')}
            </select>
        </div>
        ${kb.preset && kb.preset !== 'none' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Duration (s)</span></label>
                <input type="range" min="3" max="20" step="1" value="${kb.duration || 10}"
                       oninput="window.LexSlider.updateKenBurns('duration', parseInt(this.value))"
                       class="range range-xs range-primary">
                <div class="text-xs opacity-60 text-center">${kb.duration || 10}s</div>
            </div>
        ` : ''}
    `;
}

// Clip Mask selector
export function renderClipMaskControls(layer) {
    const clipPath = layer.style?.clipPath || 'none';
    const presets = [
        { value: 'none', label: 'None', icon: 'crop_free' },
        { value: 'circle(45%)', label: 'Circle', icon: 'radio_button_unchecked' },
        { value: 'ellipse(50% 35%)', label: 'Ellipse', icon: 'lens' },
        { value: 'inset(10%)', label: 'Inset', icon: 'crop_square' },
        { value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', label: 'Diamond', icon: 'diamond' },
        { value: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', label: 'Pentagon', icon: 'pentagon' },
        { value: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', label: 'Hexagon', icon: 'hexagon' },
        { value: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', label: 'Star', icon: 'star' }
    ];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Clip Path</span></label>
            <div class="grid grid-cols-4 gap-1">
                ${presets.map(p => `
                    <div class="p-2 border rounded cursor-pointer text-center hover:bg-base-200 ${clipPath === p.value ? 'border-primary bg-primary/10' : 'border-base-300'}"
                         onclick="window.LexSlider.updateLayerStyle('clipPath', '${p.value}')"
                         title="${p.label}">
                        <span class="material-icons-round text-sm">${p.icon}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs">Custom Clip Path</span></label>
            <input type="text" value="${clipPath}" 
                   onchange="window.LexSlider.updateLayerStyle('clipPath', this.value)"
                   placeholder="polygon(...) or circle(...)"
                   class="input input-xs input-bordered w-full font-mono text-[10px]">
        </div>
    `;
}

// Image Filters
export function renderImageFiltersControls(layer) {
    const filters = layer.style?.filter || '';

    // Parse existing filter values
    const parseFilter = (name) => {
        const match = filters.match(new RegExp(`${name}\\((\\d+\\.?\\d*)(%|deg|px)?\\)`));
        return match ? parseFloat(match[1]) : null;
    };

    const brightness = parseFilter('brightness') || 100;
    const contrast = parseFilter('contrast') || 100;
    const saturate = parseFilter('saturate') || 100;
    const blur = parseFilter('blur') || 0;
    const grayscale = parseFilter('grayscale') || 0;
    const sepia = parseFilter('sepia') || 0;
    const hueRotate = parseFilter('hue-rotate') || 0;

    return `
        <div class="space-y-2">
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Brightness</span><span class="text-xs opacity-60">${brightness}%</span></div>
                <input type="range" min="0" max="200" value="${brightness}"
                       oninput="window.LexSlider.updateImageFilter('brightness', this.value + '%')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Contrast</span><span class="text-xs opacity-60">${contrast}%</span></div>
                <input type="range" min="0" max="200" value="${contrast}"
                       oninput="window.LexSlider.updateImageFilter('contrast', this.value + '%')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Saturation</span><span class="text-xs opacity-60">${saturate}%</span></div>
                <input type="range" min="0" max="200" value="${saturate}"
                       oninput="window.LexSlider.updateImageFilter('saturate', this.value + '%')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Blur</span><span class="text-xs opacity-60">${blur}px</span></div>
                <input type="range" min="0" max="20" value="${blur}"
                       oninput="window.LexSlider.updateImageFilter('blur', this.value + 'px')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Grayscale</span><span class="text-xs opacity-60">${grayscale}%</span></div>
                <input type="range" min="0" max="100" value="${grayscale}"
                       oninput="window.LexSlider.updateImageFilter('grayscale', this.value + '%')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Sepia</span><span class="text-xs opacity-60">${sepia}%</span></div>
                <input type="range" min="0" max="100" value="${sepia}"
                       oninput="window.LexSlider.updateImageFilter('sepia', this.value + '%')"
                       class="range range-xs range-primary">
            </div>
            <div class="form-control">
                <div class="flex justify-between"><span class="text-xs">Hue Rotate</span><span class="text-xs opacity-60">${hueRotate}°</span></div>
                <input type="range" min="0" max="360" value="${hueRotate}"
                       oninput="window.LexSlider.updateImageFilter('hue-rotate', this.value + 'deg')"
                       class="range range-xs range-primary">
            </div>
            <button class="btn btn-xs btn-ghost w-full" onclick="window.LexSlider.resetImageFilters()">
                Reset Filters
            </button>
        </div>
    `;
}

// ==================== SLIDE CONTROLS ====================

// Slide Transitions
export function renderSlideTransitionControls(slide) {
    const transition = slide.transition || 'fade';
    const transitions = [
        { value: 'fade', label: 'Fade', icon: 'blur_on' },
        { value: 'slideLeft', label: 'Slide Left', icon: 'arrow_back' },
        { value: 'slideRight', label: 'Slide Right', icon: 'arrow_forward' },
        { value: 'slideUp', label: 'Slide Up', icon: 'arrow_upward' },
        { value: 'slideDown', label: 'Slide Down', icon: 'arrow_downward' },
        { value: 'cube', label: 'Cube', icon: 'view_in_ar' },
        { value: 'flip', label: 'Flip', icon: 'flip' },
        { value: 'zoom', label: 'Zoom', icon: 'zoom_in' },
        { value: 'zoomOut', label: 'Zoom Out', icon: 'zoom_out' },
        { value: 'blur', label: 'Blur', icon: 'blur_circular' },
        { value: 'wipeLeft', label: 'Wipe Left', icon: 'switch_left' },
        { value: 'wipeRight', label: 'Wipe Right', icon: 'switch_right' },
        { value: 'glitch', label: 'Glitch', icon: 'broken_image' }
    ];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Slide Transition</span></label>
            <div class="grid grid-cols-4 gap-1">
                ${transitions.map(t => `
                    <div class="p-2 border rounded cursor-pointer text-center hover:bg-base-200 flex flex-col items-center gap-1 ${transition === t.value ? 'border-primary bg-primary/10' : 'border-base-300'}"
                         onclick="window.LexSlider.updateSlideProperty('transition', '${t.value}')"
                         title="${t.label}">
                        <span class="material-icons-round text-sm">${t.icon}</span>
                        <span class="text-[9px]">${t.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Duration (ms)</span></label>
                <input type="number" value="${slide.transitionDuration || 800}" min="100" step="100"
                       onchange="window.LexSlider.updateSlideProperty('transitionDuration', parseInt(this.value))"
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Easing</span></label>
                <select onchange="window.LexSlider.updateSlideProperty('transitionEasing', this.value)" class="select select-xs select-bordered w-full">
                    <option value="ease" ${slide.transitionEasing === 'ease' ? 'selected' : ''}>Ease</option>
                    <option value="ease-in" ${slide.transitionEasing === 'ease-in' ? 'selected' : ''}>Ease In</option>
                    <option value="ease-out" ${slide.transitionEasing === 'ease-out' ? 'selected' : ''}>Ease Out</option>
                    <option value="ease-in-out" ${slide.transitionEasing === 'ease-in-out' || !slide.transitionEasing ? 'selected' : ''}>Ease In Out</option>
                    <option value="linear" ${slide.transitionEasing === 'linear' ? 'selected' : ''}>Linear</option>
                </select>
            </div>
        </div>
    `;
}

// Background Video
export function renderBackgroundVideoControls(slide) {
    const video = slide.backgroundVideo || {};
    return `
        <label class="label cursor-pointer py-1 justify-start gap-2 mb-2">
            <input type="checkbox" ${video.enabled ? 'checked' : ''} 
                   onchange="window.LexSlider.updateSlideVideo('enabled', this.checked)"
                   class="toggle toggle-xs toggle-primary">
            <span class="label-text text-xs font-bold">Background Video</span>
        </label>
        ${video.enabled ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Video URL</span></label>
                <input type="text" value="${video.src || ''}" 
                       onchange="window.LexSlider.updateSlideVideo('src', this.value)"
                       placeholder="YouTube, Vimeo, or MP4 URL"
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <label class="label cursor-pointer py-1 justify-start gap-2">
                    <input type="checkbox" ${video.muted !== false ? 'checked' : ''} 
                           onchange="window.LexSlider.updateSlideVideo('muted', this.checked)"
                           class="checkbox checkbox-xs checkbox-primary">
                    <span class="label-text text-xs">Muted</span>
                </label>
                <label class="label cursor-pointer py-1 justify-start gap-2">
                    <input type="checkbox" ${video.loop !== false ? 'checked' : ''} 
                           onchange="window.LexSlider.updateSlideVideo('loop', this.checked)"
                           class="checkbox checkbox-xs checkbox-primary">
                    <span class="label-text text-xs">Loop</span>
                </label>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Overlay Color</span></label>
                <div class="join w-full">
                    <input type="color" value="${video.overlay || '#000000'}" 
                           onchange="window.LexSlider.updateSlideVideo('overlay', this.value)"
                           class="input input-xs p-0 w-8 h-8 join-item">
                    <input type="range" min="0" max="100" value="${video.overlayOpacity || 30}"
                           oninput="window.LexSlider.updateSlideVideo('overlayOpacity', parseInt(this.value))"
                           class="range range-xs join-item flex-1 my-auto mx-2">
                </div>
            </div>
        ` : ''}
    `;
}

// Particles Background
export function renderParticlesControls(slide) {
    const particles = slide.particles || {};
    const presets = ['none', 'snow', 'stars', 'bubbles', 'confetti', 'fireflies', 'rain', 'leaves', 'dust'];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Particle Effect</span></label>
            <select onchange="window.LexSlider.updateSlideParticles('preset', this.value)" class="select select-xs select-bordered w-full">
                ${presets.map(p => `
                    <option value="${p}" ${particles.preset === p ? 'selected' : ''}>${p === 'none' ? 'None' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
                `).join('')}
            </select>
        </div>
        ${particles.preset && particles.preset !== 'none' ? `
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Count</span></label>
                    <input type="number" value="${particles.count || 50}" min="10" max="200"
                           onchange="window.LexSlider.updateSlideParticles('count', parseInt(this.value))"
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Color</span></label>
                    <input type="color" value="${particles.color || '#ffffff'}" 
                           onchange="window.LexSlider.updateSlideParticles('color', this.value)"
                           class="input input-xs input-bordered w-full p-0">
                </div>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Speed</span></label>
                <input type="range" min="0.1" max="3" step="0.1" value="${particles.speed || 1}"
                       oninput="window.LexSlider.updateSlideParticles('speed', parseFloat(this.value))"
                       class="range range-xs range-primary">
            </div>
        ` : ''}
    `;
}

// Auto Height
export function renderAutoHeightControls(slider) {
    const autoHeight = slider?.settings?.autoHeight || {};
    const modes = ['fixed', 'auto', 'ratio', 'viewport', 'minMax'];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Height Mode</span></label>
            <select onchange="window.LexSlider.updateAutoHeight('mode', this.value)" class="select select-xs select-bordered w-full">
                ${modes.map(m => `
                    <option value="${m}" ${autoHeight.mode === m ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>
                `).join('')}
            </select>
        </div>
        ${autoHeight.mode === 'fixed' || !autoHeight.mode ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Height (px)</span></label>
                <input type="number" value="${autoHeight.height || 500}" min="100"
                       onchange="window.LexSlider.updateAutoHeight('height', parseInt(this.value))"
                       class="input input-xs input-bordered w-full">
            </div>
        ` : ''}
        ${autoHeight.mode === 'ratio' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Aspect Ratio</span></label>
                <select onchange="window.LexSlider.updateAutoHeight('aspectRatio', this.value)" class="select select-xs select-bordered w-full">
                    <option value="16:9" ${autoHeight.aspectRatio === '16:9' ? 'selected' : ''}>16:9 Widescreen</option>
                    <option value="4:3" ${autoHeight.aspectRatio === '4:3' ? 'selected' : ''}>4:3 Standard</option>
                    <option value="21:9" ${autoHeight.aspectRatio === '21:9' ? 'selected' : ''}>21:9 Ultrawide</option>
                    <option value="1:1" ${autoHeight.aspectRatio === '1:1' ? 'selected' : ''}>1:1 Square</option>
                </select>
            </div>
        ` : ''}
        ${autoHeight.mode === 'viewport' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Viewport Height</span></label>
                <div class="flex items-center gap-2">
                    <input type="range" min="10" max="100" value="${autoHeight.viewportHeight || 100}"
                           oninput="window.LexSlider.updateAutoHeight('viewportHeight', parseInt(this.value))"
                           class="range range-xs range-primary flex-1">
                    <span class="text-xs w-10">${autoHeight.viewportHeight || 100}vh</span>
                </div>
            </div>
        ` : ''}
    `;
}

// Navigation Controls
export function renderNavigationControls(slider) {
    const nav = slider?.settings?.navigation || {};

    return `
        <div class="space-y-3">
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.arrows !== false ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('arrows', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Show Arrows</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.bullets ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('bullets', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Show Bullets</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.thumbnails ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('thumbnails', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Show Thumbnails</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.progressBar ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('progressBar', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Show Progress Bar</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.mousewheel ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('mousewheel', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Mousewheel Navigation</span>
            </label>
            <label class="label cursor-pointer py-1 justify-start gap-2">
                <input type="checkbox" ${nav.deepLinking ? 'checked' : ''} 
                       onchange="window.LexSlider.updateNavigation('deepLinking', this.checked)"
                       class="toggle toggle-xs toggle-primary">
                <span class="label-text text-xs">Deep Linking (URL Hash)</span>
            </label>
        </div>
    `;
}

// Layer Actions
export function renderLayerActionsControls(layer) {
    const action = layer.action || {};
    const actionTypes = [
        { value: 'none', label: 'None' },
        { value: 'link', label: 'Open Link' },
        { value: 'slide', label: 'Go to Slide' },
        { value: 'scroll', label: 'Scroll to Element' },
        { value: 'popup', label: 'Open Popup' },
        { value: 'video', label: 'Play Video' },
        { value: 'custom', label: 'Custom JS' }
    ];

    return `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Click Action</span></label>
            <select onchange="window.LexSlider.updateLayerAction('type', this.value)" class="select select-xs select-bordered w-full">
                ${actionTypes.map(a => `
                    <option value="${a.value}" ${action.type === a.value ? 'selected' : ''}>${a.label}</option>
                `).join('')}
            </select>
        </div>
        ${action.type === 'link' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">URL</span></label>
                <input type="text" value="${action.url || ''}" 
                       onchange="window.LexSlider.updateLayerAction('url', this.value)"
                       placeholder="https://..."
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Target</span></label>
                <select onchange="window.LexSlider.updateLayerAction('target', this.value)" class="select select-xs select-bordered w-full">
                    <option value="_self" ${action.target === '_self' ? 'selected' : ''}>Same Window</option>
                    <option value="_blank" ${action.target === '_blank' ? 'selected' : ''}>New Tab</option>
                </select>
            </div>
        ` : ''}
        ${action.type === 'slide' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Slide Number</span></label>
                <input type="number" value="${action.slideIndex || 1}" min="1"
                       onchange="window.LexSlider.updateLayerAction('slideIndex', parseInt(this.value))"
                       class="input input-xs input-bordered w-full">
            </div>
        ` : ''}
        ${action.type === 'scroll' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">Target Element ID</span></label>
                <input type="text" value="${action.scrollTarget || ''}" 
                       onchange="window.LexSlider.updateLayerAction('scrollTarget', this.value)"
                       placeholder="#section-id"
                       class="input input-xs input-bordered w-full">
            </div>
        ` : ''}
        ${action.type === 'custom' ? `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs">JavaScript Code</span></label>
                <textarea rows="4" onchange="window.LexSlider.updateLayerAction('customJs', this.value)"
                          placeholder="alert('Hello!');"
                          class="textarea textarea-xs textarea-bordered w-full font-mono text-[10px]">${action.customJs || ''}</textarea>
            </div>
        ` : ''}
    `;
}

// Default export
export default {
    toggleHistoryPanel,
    renderHistoryPanel,
    historyUndo,
    historyRedo,
    historyGoTo
};
