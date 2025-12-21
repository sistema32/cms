
import { state, elements } from './EditorCore.js?v=3.0.28';
import { animationPresets } from './AnimationPresets.js';
import { easingOptions } from './EasingFunctions.js';
import {
    renderCountdownControls, renderTypingControls, renderSocialShareControls,
    renderLottieControls, renderHTMLEmbedControls, renderHotspotsControls,
    renderLoopAnimationControls, renderParallaxControls, renderKenBurnsControls,
    renderClipMaskControls, renderImageFiltersControls, renderSlideTransitionControls,
    renderBackgroundVideoControls, renderParticlesControls, renderAutoHeightControls,
    renderNavigationControls, renderLayerActionsControls
} from './EditorPanels.js';

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
            <a class="tab tab-xs ${activeTab === 'effects' ? 'tab-active' : ''}" onclick="window.LexSlider.setActiveTab('effects')">Effects</a>
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
    } else if (activeTab === 'effects') {
        html += renderLayerEffectsTab(layer);
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

        // Navigation (only in settings)
        if (activeTab === 'settings' && state.currentSlider) {
            html += renderSection('Navigation', renderNavigationControls(state.currentSlider), false);
            html += renderSection('Auto Height', renderAutoHeightControls(state.currentSlider), false);
        }
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

        // Background Video
        html += renderSection('Background Video', renderBackgroundVideoControls(slide), false);

        // Particles
        html += renderSection('Particles Effect', renderParticlesControls(slide), false);
    }

    if (activeTab === 'effects') {
        // Slide-level effects
        html += renderSection('Background Video', renderBackgroundVideoControls(slide));
        html += renderSection('Particles Effect', renderParticlesControls(slide), false);
    }

    if (activeTab === 'animation') {
        // Use advanced slide transitions
        html += renderSlideTransitionControls(slide);
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'p-2';
    contentWrapper.innerHTML = html;
    container.appendChild(contentWrapper);
}


// --- Tab Content Generators ---

function renderLayerContentTab(layer) {
    let html = '';

    // ===== TEXT CONTENT (heading, text, button) =====
    if (['heading', 'text', 'button'].includes(layer.type)) {
        const isHeading = layer.type === 'heading';
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1">
                    <span class="label-text text-xs font-bold">${isHeading ? 'Heading Text' : 'Text Content'}</span>
                </label>
                <textarea id="text-content-editor" rows="${isHeading ? 2 : 3}" 
                          oninput="window.LexSlider.updateLayerContent('text', this.value)" 
                          class="textarea textarea-bordered textarea-sm w-full font-medium"
                          placeholder="Enter your text here...">${layer.content.text || ''}</textarea>
            </div>
        `;
    }

    // ===== BUTTON SPECIFIC =====
    if (layer.type === 'button') {
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Link URL</span></label>
                <div class="join w-full">
                    <input type="text" value="${layer.content.link || '#'}" 
                           onchange="window.LexSlider.updateLayerContent('link', this.value)" 
                           class="input input-sm input-bordered join-item flex-1"
                           placeholder="https://example.com">
                    <select class="select select-sm select-bordered join-item" 
                            onchange="window.LexSlider.updateLayerContent('target', this.value)">
                        <option value="_self" ${(layer.content.target || '_self') === '_self' ? 'selected' : ''}>Same Tab</option>
                        <option value="_blank" ${layer.content.target === '_blank' ? 'selected' : ''}>New Tab</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Border Radius</span></label>
                    <input type="text" value="${layer.content.borderRadius || '4px'}" 
                           onchange="window.LexSlider.updateLayerContent('borderRadius', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Padding</span></label>
                    <input type="text" value="${layer.content.padding || '10px 20px'}" 
                           onchange="window.LexSlider.updateLayerContent('padding', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
            </div>
        `;
    }

    // ===== IMAGE =====
    if (layer.type === 'image') {
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Image Source</span></label>
                <div class="join w-full">
                    <input type="text" value="${layer.content.src || ''}" 
                           onchange="window.LexSlider.updateLayerContent('src', this.value)" 
                           class="input input-sm input-bordered join-item flex-1"
                           placeholder="https://example.com/image.jpg">
                    <button class="btn btn-sm btn-primary join-item" 
                            onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateLayerContent('src', url))">
                        <span class="material-icons-round text-sm">folder</span>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Object Fit</span></label>
                    <select onchange="window.LexSlider.updateLayerContent('objectFit', this.value)" 
                            class="select select-xs select-bordered w-full">
                        <option value="cover" ${(layer.content.objectFit || 'cover') === 'cover' ? 'selected' : ''}>Cover</option>
                        <option value="contain" ${layer.content.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
                        <option value="fill" ${layer.content.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
                        <option value="none" ${layer.content.objectFit === 'none' ? 'selected' : ''}>None</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Alt Text</span></label>
                    <input type="text" value="${layer.content.alt || ''}" 
                           onchange="window.LexSlider.updateLayerContent('alt', this.value)" 
                           class="input input-xs input-bordered w-full"
                           placeholder="Image description">
                </div>
            </div>
        `;
    }

    // ===== VIDEO (YouTube, Vimeo, Direct) =====
    if (layer.type === 'video') {
        const videoUrl = layer.content.src || '';
        let detectedService = 'direct';
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) detectedService = 'youtube';
        else if (videoUrl.includes('vimeo.com')) detectedService = 'vimeo';

        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1">
                    <span class="label-text text-xs font-bold">Video URL</span>
                    <span class="badge badge-xs ${detectedService === 'youtube' ? 'badge-error' : detectedService === 'vimeo' ? 'badge-info' : 'badge-ghost'}">
                        ${detectedService === 'youtube' ? 'YouTube' : detectedService === 'vimeo' ? 'Vimeo' : 'Direct'}
                    </span>
                </label>
                <input type="text" value="${videoUrl}" 
                       onchange="window.LexSlider.updateVideoUrl(this.value)" 
                       class="input input-sm input-bordered w-full"
                       placeholder="https://youtube.com/watch?v=... or https://vimeo.com/...">
                <label class="label py-0.5">
                    <span class="label-text-alt text-[10px] opacity-50">Paste YouTube, Vimeo, or direct video URL</span>
                </label>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.autoplay ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('autoplay', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Autoplay</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.muted ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('muted', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Muted</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.loop ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('loop', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Loop</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.controls !== false ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('controls', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Controls</span>
                </label>
            </div>
        `;
    }

    // ===== AUDIO =====
    if (layer.type === 'audio') {
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Audio Source</span></label>
                <div class="join w-full">
                    <input type="text" value="${layer.content.src || ''}" 
                           onchange="window.LexSlider.updateLayerContent('src', this.value)" 
                           class="input input-sm input-bordered join-item flex-1"
                           placeholder="https://example.com/audio.mp3">
                    <button class="btn btn-sm join-item" onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateLayerContent('src', url))">
                        <span class="material-icons-round text-sm">folder</span>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-3">
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.autoplay ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('autoplay', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Autoplay</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.loop ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('loop', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Loop</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" ${layer.content.controls !== false ? 'checked' : ''} 
                           onchange="window.LexSlider.updateLayerContent('controls', this.checked)"
                           class="toggle toggle-xs toggle-primary">
                    <span class="label-text text-xs">Controls</span>
                </label>
            </div>
        `;
    }

    // ===== ICON =====
    if (layer.type === 'icon') {
        const commonIcons = ['star', 'favorite', 'search', 'home', 'settings', 'check_circle', 'arrow_forward', 'play_arrow', 'shopping_cart', 'person', 'email', 'phone'];
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Icon Name</span></label>
                <input type="text" value="${layer.content.icon || 'star'}" 
                       onchange="window.LexSlider.updateLayerContent('icon', this.value)" 
                       class="input input-sm input-bordered w-full"
                       placeholder="star">
            </div>
            <div class="mb-3">
                <div class="text-[10px] opacity-50 mb-2">Quick Pick:</div>
                <div class="flex flex-wrap gap-1">
                    ${commonIcons.map(icon => `
                        <button class="btn btn-xs btn-square btn-ghost ${layer.content.icon === icon ? 'btn-active' : ''}"
                                onclick="window.LexSlider.updateLayerContent('icon', '${icon}')"
                                title="${icon}">
                            <span class="material-icons-round text-sm">${icon}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <a href="https://fonts.google.com/icons" target="_blank" class="link link-primary text-xs">
                <span class="material-icons-round text-xs align-middle">open_in_new</span> Browse All Icons
            </a>
        `;
    }

    // ===== SHAPE =====
    if (layer.type === 'shape') {
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Shape Type</span></label>
                <select onchange="window.LexSlider.updateLayerContent('shapeType', this.value)" 
                        class="select select-sm select-bordered w-full">
                    <option value="rectangle" ${(layer.content.shapeType || 'rectangle') === 'rectangle' ? 'selected' : ''}>Rectangle</option>
                    <option value="circle" ${layer.content.shapeType === 'circle' ? 'selected' : ''}>Circle</option>
                    <option value="triangle" ${layer.content.shapeType === 'triangle' ? 'selected' : ''}>Triangle</option>
                    <option value="line" ${layer.content.shapeType === 'line' ? 'selected' : ''}>Line</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Fill Color</span></label>
                    <div class="join w-full">
                        <input type="color" value="${layer.content.fill || '#666666'}" 
                               onchange="window.LexSlider.updateLayerContent('fill', this.value)" 
                               class="input input-xs join-item w-10 p-0.5">
                        <input type="text" value="${layer.content.fill || '#666666'}" 
                               onchange="window.LexSlider.updateLayerContent('fill', this.value)" 
                               class="input input-xs input-bordered join-item flex-1 font-mono">
                    </div>
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Border Radius</span></label>
                    <input type="text" value="${layer.content.borderRadius || '0'}" 
                           onchange="window.LexSlider.updateLayerContent('borderRadius', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Border Width</span></label>
                    <input type="text" value="${layer.content.borderWidth || '0'}" 
                           onchange="window.LexSlider.updateLayerContent('borderWidth', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Border Color</span></label>
                    <input type="color" value="${layer.content.borderColor || '#000000'}" 
                           onchange="window.LexSlider.updateLayerContent('borderColor', this.value)" 
                           class="input input-xs w-full p-0.5">
                </div>
            </div>
        `;
    }

    // ===== DIVIDER =====
    if (layer.type === 'divider') {
        html += `
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs font-bold">Style</span></label>
                    <select onchange="window.LexSlider.updateLayerContent('style', this.value)" 
                            class="select select-sm select-bordered w-full">
                        <option value="solid" ${(layer.content.style || 'solid') === 'solid' ? 'selected' : ''}>Solid</option>
                        <option value="dashed" ${layer.content.style === 'dashed' ? 'selected' : ''}>Dashed</option>
                        <option value="dotted" ${layer.content.style === 'dotted' ? 'selected' : ''}>Dotted</option>
                        <option value="gradient" ${layer.content.style === 'gradient' ? 'selected' : ''}>Gradient</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs font-bold">Thickness</span></label>
                    <input type="text" value="${layer.content.thickness || '2px'}" 
                           onchange="window.LexSlider.updateLayerContent('thickness', this.value)" 
                           class="input input-sm input-bordered w-full">
                </div>
            </div>
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs">Color</span></label>
                <div class="join w-full">
                    <input type="color" value="${layer.content.color || '#333333'}" 
                           onchange="window.LexSlider.updateLayerContent('color', this.value)" 
                           class="input input-sm join-item w-12 p-0.5">
                    <input type="text" value="${layer.content.color || '#333333'}" 
                           onchange="window.LexSlider.updateLayerContent('color', this.value)" 
                           class="input input-sm input-bordered join-item flex-1 font-mono">
                </div>
            </div>
        `;
    }

    // ===== ROW (Grid Layout) =====
    if (layer.type === 'row') {
        html += `
            <div class="form-control w-full mb-3">
                <label class="label py-1"><span class="label-text text-xs font-bold">Columns</span></label>
                <select onchange="window.LexSlider.updateLayerContent('columns', parseInt(this.value))" 
                        class="select select-sm select-bordered w-full">
                    <option value="2" ${(layer.content.columns || 2) === 2 ? 'selected' : ''}>2 Columns</option>
                    <option value="3" ${layer.content.columns === 3 ? 'selected' : ''}>3 Columns</option>
                    <option value="4" ${layer.content.columns === 4 ? 'selected' : ''}>4 Columns</option>
                    <option value="6" ${layer.content.columns === 6 ? 'selected' : ''}>6 Columns</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Gap</span></label>
                    <input type="text" value="${layer.content.gap || '20px'}" 
                           onchange="window.LexSlider.updateLayerContent('gap', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs">Align</span></label>
                    <select onchange="window.LexSlider.updateLayerContent('align', this.value)" 
                            class="select select-xs select-bordered w-full">
                        <option value="start" ${(layer.content.align || 'start') === 'start' ? 'selected' : ''}>Start</option>
                        <option value="center" ${layer.content.align === 'center' ? 'selected' : ''}>Center</option>
                        <option value="end" ${layer.content.align === 'end' ? 'selected' : ''}>End</option>
                        <option value="stretch" ${layer.content.align === 'stretch' ? 'selected' : ''}>Stretch</option>
                    </select>
                </div>
            </div>
        `;
    }

    // ===== EXISTING SPECIAL TYPES =====
    if (layer.type === 'countdown') {
        html += renderCountdownControls(layer);
    }

    if (layer.type === 'typing') {
        html += renderTypingControls(layer);
    }

    if (layer.type === 'lottie') {
        html += renderLottieControls(layer);
    }

    if (layer.type === 'social') {
        html += renderSocialShareControls(layer);
    }

    if (layer.type === 'html' || layer.type === 'iframe') {
        html += renderHTMLEmbedControls(layer);
    }

    // Hotspots for images
    if (layer.type === 'image') {
        html += renderSection('Hotspots', renderHotspotsControls(layer), false);
    }

    return renderSection('Content', html);
}

// New Effects Tab
function renderLayerEffectsTab(layer) {
    let html = '';

    // Loop Animations
    html += renderSection('Loop Animation', renderLoopAnimationControls(layer));

    // Parallax
    html += renderSection('Parallax', renderParallaxControls(layer), false);

    // Ken Burns (for images)
    if (layer.type === 'image') {
        html += renderSection('Ken Burns', renderKenBurnsControls(layer), false);
    }

    // Clip Masks
    html += renderSection('Clip Mask', renderClipMaskControls(layer), false);

    // Image Filters (for images)
    if (layer.type === 'image') {
        html += renderSection('Image Filters', renderImageFiltersControls(layer), false);
    }

    // Layer Actions
    html += renderSection('Click Action', renderLayerActionsControls(layer), false);

    return html;
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
