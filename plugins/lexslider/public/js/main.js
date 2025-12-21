
console.log("[LexSlider] Loading main.js...");

import { initElements, loadSliders, switchView, loadView, state, API_BASE, elements, setDevice } from './modules/EditorCore.js?v=3.0.28';
import { renderCanvas, selectLayer, setPreviewAnimation } from './modules/CanvasRenderer.js?v=3.0.28';
import { renderLayerList, addLayer, deleteLayer, groupLayers } from './modules/LayerManager.js?v=3.0.28';
import { renderProperties, updateLayerStyle, updateLayerContent, updateLayerProp, updateSlideProperty, toggleTextDecoration, applyCustomCSS, formatText, setActiveTab, deselectKeyframe, updateKeyframeEasing } from './modules/PropertyInspector.js?v=3.0.28';
import { initTimeline, renderTimelineTracks, timelineZoom, addKeyframe, startBarDrag, onLayerDragStart, onLayerDragOver, onLayerDragLeave, onLayerDrop, updateSlideDuration, startKeyframeDrag, toggleTimelineSnap, setPlaybackSpeed, toggleGroupExpand } from './modules/TimelineManager.js?v=3.0.28';
import { getAnimationCSS } from './modules/AnimationPresets.js?v=3.0.28';
import { pushState, undo, redo, canUndo, canRedo, clearHistory, beginBatch, endBatch } from './modules/HistoryManager.js?v=3.0.28';
import {
    toggleHistoryPanel, renderHistoryPanel, historyUndo, historyRedo, historyGoTo
} from './modules/EditorPanels.js';


// Global Namespace for HTML event handlers
let assetCallback = null;

window.LexSlider = {
    setDevice, // Expose Device Switcher
    addLayer,
    deleteLayer,
    groupLayers,
    renderProperties,
    updateKeyframeEasing,
    toggleGroupExpand,
    previewAnimation: setPreviewAnimation,
    renderLayerList,
    renderCanvas,
    selectLayerById: (id) => {
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            selectLayer(layer);
            renderTimelineTracks(); // Highlight track
        }
    },
    toggleLayerVisibility: (id) => {
        pushState('Toggle Visibility');
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            layer.hidden = !layer.hidden;
            renderCanvas();
            renderLayerList();
            renderTimelineTracks();
        }
    },
    toggleLayerLock: (id) => {
        pushState('Toggle Lock');
        const layer = state.mode === 'global'
            ? state.globalLayers.find(l => l.id === id)
            : state.currentSlide.layers.find(l => l.id === id);
        if (layer) {
            layer.locked = !layer.locked;
            renderLayerList();
        }
    },
    updateLayerStyle,
    updateLayerContent,
    updateLayerProp,
    updateSlideProperty,
    toggleTextDecoration,
    applyCustomCSS,
    formatText,
    setActiveTab,
    deselectKeyframe,
    timelineZoom,

    // Video URL helper - parses YouTube/Vimeo URLs
    updateVideoUrl: (url) => {
        if (!state.selectedLayer) return;

        let embedUrl = url;
        let videoId = '';

        // YouTube
        if (url.includes('youtube.com/watch')) {
            const match = url.match(/v=([^&]+)/);
            if (match) {
                videoId = match[1];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        // Vimeo
        else if (url.includes('vimeo.com/')) {
            videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }

        updateLayerContent('src', embedUrl);
        renderProperties();
    },
    addKeyframe,
    startBarDrag,
    startKeyframeDrag,
    toggleTimelineSnap,
    onLayerDragStart,
    onLayerDragOver,
    onLayerDragLeave,
    onLayerDrop,
    updateSlideDuration,
    setPlaybackSpeed,

    // History (Undo/Redo)
    undo,
    redo,
    canUndo,
    canRedo,
    pushState,
    beginBatch,
    endBatch,

    // History Panel
    toggleHistoryPanel,
    renderHistoryPanel,
    historyUndo,
    historyRedo,
    historyGoTo,

    // Sidebar Tab Switcher
    switchSidebarTab: (tab) => {
        const layersTab = document.getElementById('sidebar-tab-layers');
        const historyTab = document.getElementById('sidebar-tab-history');
        const layersContent = document.getElementById('sidebar-content-layers');
        const historyContent = document.getElementById('sidebar-content-history');

        if (tab === 'layers') {
            layersTab?.classList.add('tab-active');
            historyTab?.classList.remove('tab-active');
            layersContent?.classList.remove('hidden');
            historyContent?.classList.add('hidden');
        } else if (tab === 'history') {
            layersTab?.classList.remove('tab-active');
            historyTab?.classList.add('tab-active');
            layersContent?.classList.add('hidden');
            historyContent?.classList.remove('hidden');
            // Initialize history panel if needed
            window.LexSlider.renderHistoryPanel?.();
        }
    },


    // Layer Type Handlers
    updateCountdownStyle: (style) => {
        if (!state.selectedLayer) return;
        pushState('Change Countdown Style', 'change-style');
        if (!state.selectedLayer.content.countdownConfig) state.selectedLayer.content.countdownConfig = {};
        state.selectedLayer.content.countdownConfig.style = style;
        renderCanvas();
    },
    updateCountdownOption: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.countdownConfig) state.selectedLayer.content.countdownConfig = {};
        state.selectedLayer.content.countdownConfig[key] = value;
        renderCanvas();
    },
    updateTypingTexts: (value) => {
        if (!state.selectedLayer) return;
        pushState('Edit Typing Texts', 'edit-text');
        if (!state.selectedLayer.content.typingConfig) state.selectedLayer.content.typingConfig = {};
        state.selectedLayer.content.typingConfig.texts = value.split('\n').filter(t => t.trim());
        renderCanvas();
    },
    updateTypingPreset: (preset) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.typingConfig) state.selectedLayer.content.typingConfig = {};
        state.selectedLayer.content.typingConfig.preset = preset;
        renderCanvas();
    },
    updateTypingOption: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.typingConfig) state.selectedLayer.content.typingConfig = {};
        state.selectedLayer.content.typingConfig[key] = value;
        renderCanvas();
    },
    toggleShareNetwork: (network, enabled) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.shareConfig) state.selectedLayer.content.shareConfig = { networks: ['facebook', 'twitter', 'whatsapp'] };
        const networks = state.selectedLayer.content.shareConfig.networks || [];
        if (enabled && !networks.includes(network)) {
            networks.push(network);
        } else if (!enabled) {
            const idx = networks.indexOf(network);
            if (idx > -1) networks.splice(idx, 1);
        }
        state.selectedLayer.content.shareConfig.networks = networks;
        renderCanvas();
    },
    updateShareOption: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.shareConfig) state.selectedLayer.content.shareConfig = {};
        state.selectedLayer.content.shareConfig[key] = value;
        renderCanvas();
    },
    updateLottieOption: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.lottieConfig) state.selectedLayer.content.lottieConfig = {};
        state.selectedLayer.content.lottieConfig[key] = value;
        renderCanvas();
    },
    setEmbedType: (type) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.embedConfig) state.selectedLayer.content.embedConfig = {};
        state.selectedLayer.content.embedConfig.type = type;
        renderProperties();
    },
    updateEmbedOption: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.content.embedConfig) state.selectedLayer.content.embedConfig = {};
        state.selectedLayer.content.embedConfig[key] = value;
        renderCanvas();
    },
    addHotspot: () => {
        if (!state.selectedLayer) return;
        pushState('Add Hotspot', 'add-layer');
        if (!state.selectedLayer.content.hotspots) state.selectedLayer.content.hotspots = [];
        state.selectedLayer.content.hotspots.push({
            id: `hotspot_${Date.now()}`,
            x: 50, y: 50,
            icon: 'plus', style: 'pulse',
            tooltip: { title: '', content: '' }
        });
        renderProperties();
        renderCanvas();
    },
    removeHotspot: (index) => {
        if (!state.selectedLayer) return;
        pushState('Remove Hotspot', 'delete-layer');
        state.selectedLayer.content.hotspots.splice(index, 1);
        renderProperties();
        renderCanvas();
    },
    updateHotspot: (index, key, value) => {
        if (!state.selectedLayer?.content?.hotspots?.[index]) return;
        state.selectedLayer.content.hotspots[index][key] = value;
        renderCanvas();
    },
    updateHotspotTooltip: (index, key, value) => {
        if (!state.selectedLayer?.content?.hotspots?.[index]) return;
        if (!state.selectedLayer.content.hotspots[index].tooltip) {
            state.selectedLayer.content.hotspots[index].tooltip = {};
        }
        state.selectedLayer.content.hotspots[index].tooltip[key] = value;
        renderCanvas();
    },

    // Parallax & Effects
    updateParallax: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.style) state.selectedLayer.style = {};
        if (!state.selectedLayer.style.parallax) state.selectedLayer.style.parallax = {};
        state.selectedLayer.style.parallax[key] = value;
        renderCanvas();
        renderProperties();
    },
    updateKenBurns: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.style) state.selectedLayer.style = {};
        if (!state.selectedLayer.style.kenBurns) state.selectedLayer.style.kenBurns = {};
        state.selectedLayer.style.kenBurns[key] = value;
        renderCanvas();
        renderProperties();
    },
    updateImageFilter: (filterName, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.style) state.selectedLayer.style = {};
        const current = state.selectedLayer.style.filter || '';
        const regex = new RegExp(`${filterName}\\([^)]+\\)`, 'g');
        let newFilter = current.replace(regex, '').trim();
        if (value && value !== '0' && value !== '100%' && value !== '0deg' && value !== '0px') {
            newFilter = `${newFilter} ${filterName}(${value})`.trim();
        }
        state.selectedLayer.style.filter = newFilter || 'none';
        renderCanvas();
        renderProperties();
    },
    resetImageFilters: () => {
        if (!state.selectedLayer) return;
        pushState('Reset Filters', 'change-style');
        if (!state.selectedLayer.style) state.selectedLayer.style = {};
        state.selectedLayer.style.filter = 'none';
        renderCanvas();
        renderProperties();
    },

    // Slide Handlers
    updateSlideVideo: (key, value) => {
        if (!state.currentSlide) return;
        if (!state.currentSlide.backgroundVideo) state.currentSlide.backgroundVideo = {};
        state.currentSlide.backgroundVideo[key] = value;
        renderCanvas();
    },
    updateSlideParticles: (key, value) => {
        if (!state.currentSlide) return;
        if (!state.currentSlide.particles) state.currentSlide.particles = {};
        state.currentSlide.particles[key] = value;
        renderCanvas();
    },
    updateAutoHeight: (key, value) => {
        if (!state.currentSlider?.settings) {
            if (!state.currentSlider) return;
            state.currentSlider.settings = {};
        }
        if (!state.currentSlider.settings.autoHeight) state.currentSlider.settings.autoHeight = {};
        state.currentSlider.settings.autoHeight[key] = value;
        renderCanvas();
    },
    updateNavigation: (key, value) => {
        if (!state.currentSlider?.settings) {
            if (!state.currentSlider) return;
            state.currentSlider.settings = {};
        }
        if (!state.currentSlider.settings.navigation) state.currentSlider.settings.navigation = {};
        state.currentSlider.settings.navigation[key] = value;
    },
    updateLayerAction: (key, value) => {
        if (!state.selectedLayer) return;
        if (!state.selectedLayer.action) state.selectedLayer.action = { type: 'none' };
        state.selectedLayer.action[key] = value;
        renderProperties();
    },

    openAssetManager: (callback) => {
        // Use global CMS MediaPicker
        if (window.CMS?.MediaPicker) {
            window.CMS.MediaPicker.open({
                filter: 'image',
                multiple: false,
                onSelect: (media) => {
                    if (media && media.url) {
                        callback(media.url);
                    }
                }
            });
        } else {
            console.error('CMS MediaPicker not available');
            alert('Media Library permissions required');
        }
    },

    // Copy to Clipboard utility
    copyToClipboard: (text, buttonEl) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const icon = buttonEl.querySelector('.material-icons-round');
            if (icon) {
                const originalText = icon.textContent;
                icon.textContent = 'check';
                icon.classList.add('text-success');
                setTimeout(() => {
                    icon.textContent = originalText;
                    icon.classList.remove('text-success');
                }, 1500);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    },

    preview: () => {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-container');
        modal.classList.remove('hidden');

        container.innerHTML = '';

        const previewFrame = document.createElement('iframe');
        previewFrame.style.width = '100%';
        previewFrame.style.height = '100%';
        previewFrame.style.border = 'none';
        container.appendChild(previewFrame);

        // Prepare Content
        const slide = state.currentSlide;
        if (!slide) return;

        const layersToRender = state.mode === 'global' ? (state.globalLayers || []) : (slide.layers || []);

        // Sort by z-index
        layersToRender.sort((a, b) => {
            const zA = parseInt(a.style.zIndex || 1);
            const zB = parseInt(b.style.zIndex || 1);
            return zA - zB;
        });

        let layersHTML = '';
        layersToRender.forEach(layer => {
            if (layer.hidden) return;

            // Calculate styles
            let style = { ...layer.style };
            // Apply device specific overrides if needed (default to desktop for preview or use current device?)
            // Let's use current device state for WYSIWYG
            if (state.device === 'tablet' || state.device === 'mobile') {
                if (layer.style.tablet) style = { ...style, ...layer.style.tablet };
            }
            if (state.device === 'mobile') {
                if (layer.style.mobile) style = { ...style, ...layer.style.mobile };
            }

            // Convert style object to string (exclude animation properties)
            const styleString = Object.entries(style).map(([k, v]) => {
                if (typeof v === 'object' && v !== null) return '';
                // Skip animation props here, we apply them separately
                if (['animationIn', 'animationDuration', 'animationDelay', 'loopAnimation', 'loopDuration', 'loopIntensity'].includes(k)) return '';
                const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${key}:${v}`;
            }).join(';');

            // Entrance Animation Styles
            let animStyle = '';
            if (style.animationIn && style.animationIn !== 'none') {
                animStyle = `animation: ${style.animationIn} ${style.animationDuration || '1s'} ease-out ${style.animationDelay || '0s'} both;`;
            }

            // Loop Animation Styles  
            let loopStyle = '';
            if (style.loopAnimation && style.loopAnimation !== 'none') {
                const duration = style.loopDuration || 2;
                loopStyle = `animation: ${style.loopAnimation} ${duration}s ease-in-out infinite;`;
            }

            // Combine animations (entrance first, then loop)
            let finalAnimStyle = animStyle || loopStyle;

            let content = '';
            if (layer.type === 'heading') content = `<h1>${layer.content.text}</h1>`;
            else if (layer.type === 'text') content = `<p>${layer.content.text}</p>`;
            else if (layer.type === 'button') content = `<a href="${layer.content.link || '#'}">${layer.content.text}</a>`;
            else if (layer.type === 'image') content = `<img src="${layer.content.src}" style="width:100%;height:100%;object-fit:cover;">`;
            else if (layer.type === 'video') content = `<iframe width="100%" height="100%" src="${layer.content.src}" frameborder="0" allowfullscreen></iframe>`;
            else if (layer.type === 'icon') content = `<span class="material-icons-round" style="font-size: inherit; color: inherit;">${layer.content.icon}</span>`;
            else if (layer.type === 'shape') content = `<div style="width:100%;height:100%;background:${layer.content?.fill || '#666'};border-radius:${layer.content?.borderRadius || '0'}"></div>`;
            else if (layer.type === 'divider') content = `<hr style="border:none;height:${layer.content?.thickness || '2px'};background:${layer.content?.color || '#333'}">`;
            else if (layer.type === 'countdown') content = `<div class="countdown-preview">00:00:00</div>`;
            else if (layer.type === 'social') content = `<div class="social-preview">Social Icons</div>`;

            layersHTML += `<div style="position:absolute; ${styleString} ${finalAnimStyle}">${content}</div>`;
        });

        // Collect Styles
        let css = '';
        document.querySelectorAll('style').forEach(s => css += s.innerHTML);

        const animationCSS = `
            ${getAnimationCSS()}
            @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
            body { margin: 0; overflow: hidden; }
        `;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
                <style>${animationCSS}</style>
                <!-- Import Google Fonts if needed, or rely on parent -->
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
            </head>
            <body>
                <div style="width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; background:#000;">
                    <div style="position:relative; width:${state.currentSlider.width}px; height:${state.currentSlider.height}px; overflow:hidden;">
                        <!-- Background -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; 
                                    background:${slide.background_image ? `url(${slide.background_image})` : (slide.background_color || '#fff')}; 
                                    background-size: cover; background-position: center;
                                    animation: ${slide.ken_burns ? 'kenBurns 20s ease-in-out infinite alternate' : 'none'};">
                        </div>
                        <!-- Layers -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;">
                            ${layersHTML}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const doc = previewFrame.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();
    }
};

// Helper to update undo/redo button states
function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) {
        btnUndo.disabled = !canUndo();
        btnUndo.classList.toggle('btn-disabled', !canUndo());
    }
    if (btnRedo) {
        btnRedo.disabled = !canRedo();
        btnRedo.classList.toggle('btn-disabled', !canRedo());
    }
}

// Expose for external use
window.LexSlider.updateUndoRedoButtons = updateUndoRedoButtons;

// --- INITIALIZATION ---
async function init() {
    console.log("[LexSlider 3.0] Initializing Modular Editor...");

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
        // Skip if in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Delete Layer
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedLayer) {
                window.LexSlider.deleteLayer(state.selectedLayer.id);
            }
        }

        // Undo: Ctrl+Z
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            window.LexSlider.undo();
            updateUndoRedoButtons();
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
            (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            e.preventDefault();
            window.LexSlider.redo();
            updateUndoRedoButtons();
        }
    });

    // Check URL for slider ID
    const path = window.location.pathname;
    const match = path.match(/\/slider\/(\d+)/);

    if (match && match[1]) {
        await openSlider(match[1]);
    } else {
        await loadView('dashboard');
    }

    initTimeline();

    // Reveal App
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
}

function setupEventListeners() {
    // Global Listeners (Modals)
    if (elements.dashboard.btnCancelNew) {
        elements.dashboard.btnCancelNew.onclick = () => {
            elements.dashboard.modalNew.close();
        };
    }

    if (elements.dashboard.formNew) {
        elements.dashboard.formNew.onsubmit = handleCreateSlider;
    }
}

async function handleCreateSlider(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(`${API_BASE}/sliders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create');

        elements.dashboard.modalNew.classList.add('hidden');
        e.target.reset();
        await loadSliders();
    } catch (err) {
        alert(err.message);
    }
}

async function saveSlider() {
    if (!state.currentSlider) return;

    const btn = elements.editor.btnSave;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-icons-round spin">sync</span> Saving...';
    btn.disabled = true;

    try {
        // 1. Save Slider Properties
        await fetch(`${API_BASE}/sliders/${state.currentSlider.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.currentSlider)
        });

        // 2. Save Global Layers
        await fetch(`${API_BASE}/sliders/${state.currentSlider.id}/global-layers`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layers: state.globalLayers })
        });

        // 3. Save Slides
        for (const slide of state.currentSlider.slides) {
            await fetch(`${API_BASE}/slides/${slide.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slide)
            });
        }

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 500);

    } catch (err) {
        console.error(err);
        alert('Failed to save');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function addSlide() {
    console.log("Add Slide Clicked");
    if (!state.currentSlider) {
        console.error("No current slider in state");
        alert("Error: No slider selected");
        return;
    }

    try {
        console.log("Creating slide for slider:", state.currentSlider.id);
        const res = await fetch(`${API_BASE}/sliders/${state.currentSlider.id}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Slide ${state.currentSlider.slides ? state.currentSlider.slides.length + 1 : 1}`,
                background_image: '',
                ordering: state.currentSlider.slides ? state.currentSlider.slides.length : 0
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to add slide: ${errText}`);
        }

        const newSlide = await res.json();
        newSlide.layers = []; // Initialize layers array
        console.log("Slide created:", newSlide);

        if (!state.currentSlider.slides) state.currentSlider.slides = [];
        state.currentSlider.slides.push(newSlide);

        // Refresh slide list
        renderSlideList();

        state.currentSlide = newSlide;
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}


// We need to expose init to window or run it
// Run init immediately (module is deferred)
init();

// --- SLIDE MANAGEMENT ---
function renderSlideList() {
    const list = document.getElementById('slide-list'); // Ensure this ID exists in index.html
    if (!list) return;

    if (!state.currentSlider || !state.currentSlider.slides) {
        list.innerHTML = '<p style="padding:10px; color:#666;">No slides</p>';
        return;
    }

    list.innerHTML = state.currentSlider.slides.map((slide, index) => `
        <div class="layer-tree-item ${state.currentSlide && state.currentSlide.id === slide.id ? 'active' : ''}" 
             onclick="window.LexSlider.switchSlide(${slide.id})">
            <span class="material-icons-round icon">web_asset</span>
            <span style="flex:1;">${slide.title || 'Slide ' + (index + 1)}</span>
            <div class="layer-actions">
                <button class="btn-icon-xs" title="Delete" onclick="event.stopPropagation(); window.LexSlider.deleteSlide(${slide.id})">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function switchSlide(id) {
    const slide = state.currentSlider.slides.find(s => s.id === id);
    if (slide) {
        state.currentSlide = slide;
        state.mode = 'slide';
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();
        renderSlideList(); // Update active state
    }
}

async function deleteSlide(id) {
    console.log("Deleting slide:", id);
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
        await fetch(`${API_BASE}/slides/${id}`, { method: 'DELETE' });

        state.currentSlider.slides = state.currentSlider.slides.filter(s => s.id !== id);

        if (state.currentSlide && state.currentSlide.id === id) {
            state.currentSlide = state.currentSlider.slides[0] || null;
        }

        renderSlideList();
        renderCanvas();
        renderLayerList();
        renderProperties();
        renderTimelineTracks();

    } catch (e) {
        alert('Failed to delete slide');
    }
}

async function openSlider(id) {
    try {
        const res = await fetch(`${API_BASE}/sliders/${id}`);
        const slider = await res.json();
        state.currentSlider = slider;

        // Fetch Global Layers
        const glRes = await fetch(`${API_BASE}/sliders/${id}/global-layers`);
        if (glRes.ok) state.globalLayers = await glRes.json();

        if (!state.currentSlider.slides) state.currentSlider.slides = [];
        state.currentSlide = state.currentSlider.slides[0] || null;

        // Update URL
        const basePath = window.location.pathname.split('/plugin/lexslider')[0];
        window.history.pushState({ sliderId: id }, '', `${basePath}/plugin/lexslider/slider/${id}`);

        await switchView('editor');

        // Note: loadView() now handles waiting for DOM and calling initElements()

        // Re-initialize timeline events (scroll sync, buttons) since DOM was replaced
        initTimeline();

        // Update editor title with current slider name
        const titleEl = document.getElementById('editor-slider-name');
        if (titleEl && state.currentSlider) {
            titleEl.textContent = state.currentSlider.title || state.currentSlider.name || 'Untitled';
        }

        renderCanvas();
        renderLayerList();
        renderSlideList(); // Render slides
        renderProperties();
        renderTimelineTracks();
    } catch (e) {
        console.error(e);
    }
}

// Expose critical functions to window for HTML onclick handlers
window.openSlider = openSlider;
window.editor = {
    addLayer: (type) => {
        // Use imported addLayer from LayerManager.js which handles MediaPicker integration
        addLayer(type);
    }
};

// Add to LexSlider global object
window.LexSlider.addSlide = addSlide;
window.LexSlider.switchSlide = switchSlide;
window.LexSlider.deleteSlide = deleteSlide;

// Dashboard Quick Actions
window.LexSlider.duplicateSlider = async (id) => {
    if (!confirm('¿Duplicar este slider?')) return;

    try {
        const res = await fetch(`${API_BASE}/sliders/${id}/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!res.ok) throw new Error('Failed to duplicate');

        const data = await res.json();
        if (data.success) {
            await loadSliders();
            alert('Slider duplicado correctamente');
        }
    } catch (err) {
        console.error('[LexSlider] Duplicate error:', err);
        alert('Error al duplicar slider');
    }
};

window.LexSlider.exportSlider = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/sliders/${id}/export`);
        if (!res.ok) throw new Error('Failed to export');

        const data = await res.json();
        if (data.success) {
            // Download as JSON file
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slider-${id}-export.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('[LexSlider] Export error:', err);
        alert('Error al exportar slider');
    }
};

window.LexSlider.deleteSlider = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
        const res = await fetch(`${API_BASE}/sliders/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');

        await loadSliders();
    } catch (err) {
        console.error('[LexSlider] Delete error:', err);
        alert('Error al eliminar slider');
    }
};

window.LexSlider.importSlider = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const res = await fetch(`${API_BASE}/sliders/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data })
            });

            if (!res.ok) throw new Error('Failed to import');

            await loadSliders();
            alert('Slider importado correctamente');
        } catch (err) {
            console.error('[LexSlider] Import error:', err);
            alert('Error al importar slider. Verifica el formato del archivo.');
        }
    };

    input.click();
};
