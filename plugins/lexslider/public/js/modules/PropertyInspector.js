
import { state, elements } from './EditorCore.js?v=3.0.28';
import { animationPresets } from './AnimationPresets.js';
import { easingOptions } from './EasingFunctions.js';

let activeTab = 'content';

// ... (rest of file)

function renderLayerAnimationTab(layer) {
    let effectiveStyle = { ...layer.style };

    const presetsHtml = animationPresets.map(preset => {
        const isSelected = effectiveStyle.animationIn === preset.value;
        return `
            <div class="p-2 border border-base-300 rounded cursor-pointer hover:bg-base-200 text-center text-xs ${isSelected ? 'border-primary bg-primary/10' : ''}"
                 onmouseenter="window.LexSlider.previewAnimation('${preset.value}')"
                 onmouseleave="window.LexSlider.previewAnimation(null)"
                 onclick="window.LexSlider.updateLayerStyle('animationIn', '${preset.value}')">
                ${preset.label}
            </div>
        `;
    }).join('');

    const animHtml = `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Entrance Animation</span></label>
            <div class="grid grid-cols-2 gap-2 mb-2 max-h-40 overflow-y-auto custom-scrollbar p-1 border border-base-300 rounded bg-base-100">
                ${presetsHtml}
            </div>
        </div>
        <div class="flex gap-2 mb-2">
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Duration (s)</span></label>
                <input type="number" step="0.1" value="${effectiveStyle.animationDuration || '1.0'}" 
                       onchange="window.LexSlider.updateLayerStyle('animationDuration', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Delay (s)</span></label>
                <input type="number" step="0.1" value="${effectiveStyle.animationDelay || '0.0'}" 
                       onchange="window.LexSlider.updateLayerStyle('animationDelay', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
    `;
    return renderSection('Entrance Animation', animHtml);
}

export function renderProperties() {
    // Guard: ensure elements are ready
    if (!elements.editor?.propertyInspector) {
        console.warn('[PropertyInspector] Elements not ready, skipping render');
        return;
    }
    const container = elements.editor.propertyInspector;

    container.innerHTML = '';

    // 1. Render Tabs
    const tabsHtml = `
        <div class="tabs tabs-boxed bg-base-100 p-1 mb-2 gap-1 justify-center">
            <a class="tab tab-xs ${activeTab === 'content' ? 'tab-active' : ''}" onclick="window.LexSlider.setActiveTab('content')">Content</a>
            <a class="tab tab-xs ${activeTab === 'style' ? 'tab-active' : ''}" onclick="window.LexSlider.setActiveTab('style')">Style</a>
            <a class="tab tab-xs ${activeTab === 'animation' ? 'tab-active' : ''}" onclick="window.LexSlider.setActiveTab('animation')">Anim</a>
            <a class="tab tab-xs ${activeTab === 'settings' ? 'tab-active' : ''}" onclick="window.LexSlider.setActiveTab('settings')">Settings</a>
        </div>
    `;
    container.innerHTML = tabsHtml;

    if (state.selectedLayer) {
        renderLayerProperties(container, state.selectedLayer);
    } else if (state.currentSlide) {
        renderSlideProperties(container, state.currentSlide);
    } else {
        container.innerHTML += `
            <div class="h-full flex flex-col items-center justify-center text-base-content/30 p-8 text-center">
                <span class="material-icons-round text-5xl mb-2">touch_app</span>
                <p class="text-xs">Select a layer or slide to edit properties</p>
            </div>
        `;
    }
}

export function setActiveTab(tab) {
    activeTab = tab;
    renderProperties();
}

function renderLayerProperties(container, layer) {
    let html = '';

    // Keyframe Banner
    if (state.selectedKeyframe) {
        const easingHtml = easingOptions.map(opt =>
            `<option value="${opt.value}" ${state.selectedKeyframe.easing === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        html += `
            <div class="alert alert-info py-2 px-2 mb-2 text-xs flex flex-col gap-2">
                <div class="flex justify-between items-center w-full">
                    <span class="font-bold">Keyframe at ${(state.selectedKeyframe.time / 1000).toFixed(2)}s</span>
                    <button class="btn btn-ghost btn-xs btn-square" onclick="window.LexSlider.deselectKeyframe()">
                        <span class="material-icons-round text-xs">close</span>
                    </button>
                </div>
                <div class="flex items-center gap-2 w-full">
                    <span class="opacity-70">Easing:</span>
                    <select class="select select-bordered select-xs flex-1 text-black" 
                            onchange="window.LexSlider.updateKeyframeEasing(this.value)">
                        ${easingHtml}
                    </select>
                </div>
            </div>
        `;
    }

    if (activeTab === 'content') {
        html += renderLayerContentTab(layer);
    } else if (activeTab === 'style') {
        html += renderLayerStyleTab(layer);
    } else if (activeTab === 'animation') {
        html += renderLayerAnimationTab(layer);
    } else if (activeTab === 'settings') {
        html += renderLayerSettingsTab(layer);
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'p-2';
    contentWrapper.innerHTML = html;
    container.appendChild(contentWrapper);
}

function renderSlideProperties(container, slide) {
    let html = '';

    if (activeTab === 'content' || activeTab === 'settings') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Slide Title</span></label>
                <input type="text" value="${slide.title || ''}" 
                       onchange="window.LexSlider.updateSlideProperty('title', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Duration (ms)</span></label>
                <input type="number" value="${slide.duration || 5000}" 
                       onchange="window.LexSlider.updateSlideProperty('duration', parseInt(this.value))" 
                       class="input input-xs input-bordered w-full">
            </div>
        `;
    }

    if (activeTab === 'style') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Background Color</span></label>
                <div class="flex gap-2">
                    <input type="color" value="${slide.background_color || '#ffffff'}" 
                           onchange="window.LexSlider.updateSlideProperty('background_color', this.value)" 
                           class="input input-xs p-0 w-8 h-8 flex-none">
                    <input type="text" value="${slide.background_color || '#ffffff'}" 
                           onchange="window.LexSlider.updateSlideProperty('background_color', this.value)" 
                           class="input input-xs input-bordered flex-1">
                </div>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Background Image URL</span></label>
                <div class="join w-full">
                    <input type="text" value="${slide.background_image || ''}" 
                           onchange="window.LexSlider.updateSlideProperty('background_image', this.value)" 
                           class="input input-xs input-bordered join-item flex-1" placeholder="https://...">
                    <button class="btn btn-xs btn-square join-item" 
                            onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateSlideProperty('background_image', url))">
                        <span class="material-icons-round text-xs">image</span>
                    </button>
                </div>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label cursor-pointer py-1 justify-start gap-2">
                    <input type="checkbox" ${slide.ken_burns ? 'checked' : ''} 
                           onchange="window.LexSlider.updateSlideProperty('ken_burns', this.checked)" 
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Ken Burns Effect</span>
                </label>
            </div>
        `;
    }

    if (activeTab === 'animation') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Transition</span></label>
                <select onchange="window.LexSlider.updateSlideProperty('transition', this.value)" class="select select-bordered select-xs w-full">
                    <option value="fade" ${!slide.transition || slide.transition === 'fade' ? 'selected' : ''}>Fade</option>
                    <option value="slide-horizontal" ${slide.transition === 'slide-horizontal' ? 'selected' : ''}>Slide Horizontal</option>
                    <option value="slide-vertical" ${slide.transition === 'slide-vertical' ? 'selected' : ''}>Slide Vertical</option>
                    <option value="zoom" ${slide.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
                </select>
            </div>
        `;
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'p-2';
    contentWrapper.innerHTML = html;
    container.appendChild(contentWrapper);
}

// --- Tab Content Generators ---

function renderLayerContentTab(layer) {
    let html = '';

    // Content based on type
    if (['heading', 'text', 'button'].includes(layer.type)) {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Text Content</span></label>
                <textarea id="text-content-editor" rows="3" oninput="window.LexSlider.updateLayerContent('text', this.value)" 
                          class="textarea textarea-bordered textarea-xs w-full">${layer.content.text || ''}</textarea>
            </div>
        `;
    }

    if (layer.type === 'button') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Link URL</span></label>
                <input type="text" value="${layer.content.link || '#'}" 
                       onchange="window.LexSlider.updateLayerContent('link', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        `;
    }

    if (layer.type === 'image') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Image URL</span></label>
                <div class="join w-full">
                    <input type="text" value="${layer.content.src || ''}" 
                           onchange="window.LexSlider.updateLayerContent('src', this.value)" 
                           class="input input-xs input-bordered join-item flex-1">
                    <button class="btn btn-xs btn-square join-item" 
                            onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateLayerContent('src', url))">
                        <span class="material-icons-round text-xs">image</span>
                    </button>
                </div>
            </div>
        `;
    }

    if (layer.type === 'video') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Video URL</span></label>
                <input type="text" value="${layer.content.src || ''}" 
                       onchange="window.LexSlider.updateLayerContent('src', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        `;
    }

    if (layer.type === 'icon') {
        html += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Icon Name</span></label>
                <input type="text" value="${layer.content.icon || 'star'}" 
                       onchange="window.LexSlider.updateLayerContent('icon', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
             <div class="text-[10px] opacity-50 mb-2">
                <a href="https://fonts.google.com/icons" target="_blank" class="link link-hover">Browse Icons</a>
            </div>
        `;
    }

    return renderSection('Content', html);
}

function renderLayerStyleTab(layer) {
    let html = '';

    // Determine effective style based on device mode OR Keyframe
    let effectiveStyle = { ...layer.style };

    if (state.selectedKeyframe) {
        // Overlay keyframe properties
        effectiveStyle = { ...effectiveStyle, ...state.selectedKeyframe.properties };
    } else {
        if (state.device === 'tablet') {
            if (layer.style.tablet) effectiveStyle = { ...effectiveStyle, ...layer.style.tablet };
        }
        if (state.device === 'mobile') {
            if (layer.style.mobile) effectiveStyle = { ...effectiveStyle, ...layer.style.mobile };
        }
    }

    // Typography (Text, Heading, Button)
    if (['heading', 'text', 'button'].includes(layer.type)) {
        const typoHtml = `
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Font Family</span></label>
                    <select onchange="window.LexSlider.updateLayerStyle('fontFamily', this.value)" class="select select-bordered select-xs w-full">
                        <option value="Inter, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Inter') ? 'selected' : ''}>Inter</option>
                        <option value="Roboto, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                        <option value="'Playfair Display', serif" ${(effectiveStyle.fontFamily || '').includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                        <option value="'Montserrat', sans-serif" ${(effectiveStyle.fontFamily || '').includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Size</span></label>
                    <input type="text" value="${effectiveStyle.fontSize || '16px'}" 
                           onchange="window.LexSlider.updateLayerStyle('fontSize', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
                 <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Weight</span></label>
                    <select onchange="window.LexSlider.updateLayerStyle('fontWeight', this.value)" class="select select-bordered select-xs w-full">
                        <option value="300" ${effectiveStyle.fontWeight === '300' ? 'selected' : ''}>Light</option>
                        <option value="400" ${!effectiveStyle.fontWeight || effectiveStyle.fontWeight === '400' ? 'selected' : ''}>Normal</option>
                        <option value="700" ${effectiveStyle.fontWeight === '700' ? 'selected' : ''}>Bold</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Color</span></label>
                    <div class="join w-full">
                        <input type="color" value="${effectiveStyle.color || '#000000'}" 
                               onchange="window.LexSlider.updateLayerStyle('color', this.value)" 
                               class="input input-xs input-bordered join-item w-8 p-0">
                         <input type="text" value="${effectiveStyle.color || '#000000'}" 
                               onchange="window.LexSlider.updateLayerStyle('color', this.value)" 
                               class="input input-xs input-bordered join-item flex-1 font-mono">
                    </div>
                </div>
            </div>
             <div class="flex gap-1 mb-2 justify-center bg-base-100 p-1 rounded">
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.textAlign === 'left' ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.updateLayerStyle('textAlign', 'left')">
                    <span class="material-icons-round text-xs">format_align_left</span>
                </button>
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.textAlign === 'center' ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.updateLayerStyle('textAlign', 'center')">
                    <span class="material-icons-round text-xs">format_align_center</span>
                </button>
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.textAlign === 'right' ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.updateLayerStyle('textAlign', 'right')">
                    <span class="material-icons-round text-xs">format_align_right</span>
                </button>
                <div class="divider divider-horizontal mx-0"></div>
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.fontWeight == '700' ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.toggleTextDecoration('bold')">
                    <span class="material-icons-round text-xs">format_bold</span>
                </button>
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.fontStyle === 'italic' ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.toggleTextDecoration('italic')">
                    <span class="material-icons-round text-xs">format_italic</span>
                </button>
                <button class="btn btn-xs btn-square btn-ghost ${effectiveStyle.textDecoration && effectiveStyle.textDecoration.includes('underline') ? 'btn-active' : ''}" 
                        onclick="window.LexSlider.toggleTextDecoration('underline')">
                    <span class="material-icons-round text-xs">format_underlined</span>
                </button>
            </div>
        `;
        html += renderSection('Typography', typoHtml);
    }

    // Box Model (Background, Padding, Border)
    const boxHtml = `
        <div class="flex gap-2 mb-2">
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Width</span></label>
                <input type="text" value="${effectiveStyle.width || 'auto'}" 
                       onchange="window.LexSlider.updateLayerStyle('width', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Height</span></label>
                <input type="text" value="${effectiveStyle.height || 'auto'}" 
                       onchange="window.LexSlider.updateLayerStyle('height', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Background</span></label>
            <div class="join w-full">
                <input type="color" value="${effectiveStyle.backgroundColor || 'transparent'}" 
                       onchange="window.LexSlider.updateLayerStyle('backgroundColor', this.value)" 
                       class="input input-xs p-0 w-8 h-8 join-item">
                <input type="text" value="${effectiveStyle.backgroundColor || 'transparent'}" 
                       onchange="window.LexSlider.updateLayerStyle('backgroundColor', this.value)" 
                       class="input input-xs input-bordered join-item flex-1">
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Padding</span></label>
                <input type="text" value="${effectiveStyle.padding || '0px'}" 
                       onchange="window.LexSlider.updateLayerStyle('padding', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
             <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Radius</span></label>
                <input type="text" value="${effectiveStyle.borderRadius || '0px'}" 
                       onchange="window.LexSlider.updateLayerStyle('borderRadius', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Border</span></label>
            <input type="text" value="${effectiveStyle.border || 'none'}" 
                   onchange="window.LexSlider.updateLayerStyle('border', this.value)" 
                   class="input input-xs input-bordered w-full" placeholder="1px solid #000">
        </div>
    `;
    html += renderSection('Box Model', boxHtml);

    // Custom CSS
    const cssHtml = `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Custom CSS</span></label>
            <textarea id="custom-css-editor" rows="5" 
                      onchange="window.LexSlider.applyCustomCSS(this.value)" 
                      class="textarea textarea-bordered textarea-xs w-full font-mono text-[10px]"
                      placeholder="box-shadow: ...">${effectiveStyle.customCSS || ''}</textarea>
        </div>
    `;
    html += renderSection('Advanced CSS', cssHtml, false);

    return html;
}



function renderLayerSettingsTab(layer) {
    let html = '';

    let effectiveStyle = { ...layer.style };
    if (state.device === 'tablet') {
        if (layer.style.tablet) effectiveStyle = { ...effectiveStyle, ...layer.style.tablet };
    }
    if (state.device === 'mobile') {
        if (layer.style.mobile) effectiveStyle = { ...effectiveStyle, ...layer.style.mobile };
    }

    const layoutHtml = `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Layer Name</span></label>
            <input type="text" value="${layer.name || ''}" 
                   onchange="window.LexSlider.updateLayerProp('name', this.value)" 
                   placeholder="Layer ${layer.id}" class="input input-xs input-bordered w-full">
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Z-Index</span></label>
                <input type="number" value="${effectiveStyle.zIndex || '1'}" 
                       onchange="window.LexSlider.updateLayerStyle('zIndex', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
             <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs">Opacity</span></label>
                <input type="range" min="0" max="1" step="0.1" value="${effectiveStyle.opacity || '1'}" 
                       oninput="window.LexSlider.updateLayerStyle('opacity', this.value)" 
                       class="range range-xs range-primary">
            </div>
        </div>
    `;
    html += renderSection('General', layoutHtml);

    return html;
}

function renderSection(title, content, isOpen = true) {
    return `
        <div class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mb-2">
            <input type="checkbox" ${isOpen ? 'checked' : ''} /> 
            <div class="collapse-title text-xs font-bold min-h-0 py-2 px-3 bg-base-200">
                ${title}
            </div>
            <div class="collapse-content px-3 py-2 text-xs">
                ${content}
            </div>
        </div>
    `;
}

export function updateLayerStyle(key, value) {
    if (!state.selectedLayer) return;

    if (state.selectedKeyframe) {
        // Update keyframe property
        if (!state.selectedKeyframe.properties) state.selectedKeyframe.properties = {};
        state.selectedKeyframe.properties[key] = value;
    } else {
        // Update layer base style
        if (state.device === 'desktop') {
            state.selectedLayer.style[key] = value;
        } else {
            if (!state.selectedLayer.style[state.device]) {
                state.selectedLayer.style[state.device] = {};
            }
            state.selectedLayer.style[state.device][key] = value;
        }
    }

    // Special handling for z-index to sort layers
    if (key === 'zIndex') {
        // Re-render canvas to sort
    }

    // Trigger updates
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
}

export function updateLayerContent(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer.content[key] = value;
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
}

export function updateLayerProp(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer[key] = value;
    // If name changed, update layer list/timeline tree
    if (key === 'name') {
        if (window.LexSlider && window.LexSlider.renderTimelineTracks) window.LexSlider.renderTimelineTracks();
    }
}

export function updateSlideProperty(key, value) {
    if (!state.currentSlide) return;
    state.currentSlide[key] = value;
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
    renderProperties();
}

export function toggleTextDecoration(decoration) {
    if (!state.selectedLayer) return;

    // Need to handle keyframe vs base style here too
    let styleObj = state.selectedLayer.style;
    if (state.selectedKeyframe) {
        if (!state.selectedKeyframe.properties) state.selectedKeyframe.properties = {};
        styleObj = state.selectedKeyframe.properties;
    } else if (state.device !== 'desktop') {
        if (!state.selectedLayer.style[state.device]) state.selectedLayer.style[state.device] = {};
        styleObj = state.selectedLayer.style[state.device];
    }

    const current = styleObj.textDecoration || '';
    const decorations = current.split(' ').filter(d => d);

    if (decorations.includes(decoration)) {
        const newValue = decorations.filter(d => d !== decoration).join(' ');
        updateLayerStyle('textDecoration', newValue || 'none');
    } else {
        decorations.push(decoration);
        updateLayerStyle('textDecoration', decorations.join(' '));
    }
}

export function applyCustomCSS(cssText) {
    if (!state.selectedLayer) return;

    // Custom CSS usually applies to the layer element, so base style.
    // But maybe we want keyframable CSS? For now, let's keep it base style only.
    state.selectedLayer.style.customCSS = cssText;
    const lines = cssText.split('\n');
    lines.forEach(line => {
        const [property, value] = line.split(':').map(s => s.trim());
        if (property && value) {
            const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            // This updates individual properties which might be keyframed.
            // But custom CSS block is usually static.
            // Let's just update base style directly.
            state.selectedLayer.style[camelCase] = value.replace(';', '');
        }
    });
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
}

export function formatText(format) {
    const textarea = document.getElementById('text-content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    let formattedText = selectedText;
    if (format === 'bold') formattedText = `<b>${selectedText}</b>`;
    if (format === 'italic') formattedText = `<i>${selectedText}</i>`;
    if (format === 'underline') formattedText = `<u>${selectedText}</u>`;

    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newValue;
    updateLayerContent('text', newValue);
}

export function updateKeyframeEasing(value) {
    if (state.selectedKeyframe) {
        state.selectedKeyframe.easing = value;
    }
}

export function deselectKeyframe() {
    state.selectedKeyframe = null;
    renderProperties();
    if (window.LexSlider && window.LexSlider.renderTimelineTracks) window.LexSlider.renderTimelineTracks();
}
