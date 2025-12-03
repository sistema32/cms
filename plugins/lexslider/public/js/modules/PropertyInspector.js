
import { state, elements } from './EditorCore.js?v=3.0.10';
// import { renderCanvas } from './CanvasRenderer.js';

export function renderProperties() {
    const props = elements.editor.propertyInspector;

    if (!state.selectedLayer) {
        if (!state.currentSlide) {
            props.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-base-content/30 p-8 text-center">
                    <span class="material-icons-round text-5xl mb-2">touch_app</span>
                    <p class="text-xs">Select a slide to edit properties</p>
                </div>
            `;
            return;
        }

        renderSlideProperties();
        return;
    }

    renderLayerProperties();
}

function renderSlideProperties() {
    const props = elements.editor.propertyInspector;
    const slide = state.currentSlide;

    let html = '';

    // 1. Background
    const bgHtml = `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Background Image</span></label>
            <div class="join w-full">
                <input type="text" value="${slide.background_image || ''}" 
                       onchange="window.LexSlider.updateSlideProperty('background_image', this.value)" 
                       placeholder="https://..." class="input input-xs input-bordered join-item flex-1">
                <button class="btn btn-xs btn-square join-item" 
                        onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateSlideProperty('background_image', url))">
                    <span class="material-icons-round text-xs">image</span>
                </button>
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Background Color</span></label>
            <div class="join w-full">
                <input type="color" value="${slide.background_color || '#ffffff'}" 
                       onchange="window.LexSlider.updateSlideProperty('background_color', this.value)" 
                       class="input input-xs input-bordered join-item w-8 p-0">
                <input type="text" value="${slide.background_color || '#ffffff'}" 
                       onchange="window.LexSlider.updateSlideProperty('background_color', this.value)" 
                       class="input input-xs input-bordered join-item flex-1 font-mono">
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
    html += renderSection('Background', bgHtml);

    // 2. Animation
    const animHtml = `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Transition</span></label>
            <select onchange="window.LexSlider.updateSlideProperty('transition', this.value)" class="select select-bordered select-xs w-full">
                <option value="fade" ${!slide.transition || slide.transition === 'fade' ? 'selected' : ''}>Fade</option>
                <option value="slide-horizontal" ${slide.transition === 'slide-horizontal' ? 'selected' : ''}>Slide Horizontal</option>
                <option value="slide-vertical" ${slide.transition === 'slide-vertical' ? 'selected' : ''}>Slide Vertical</option>
                <option value="zoom" ${slide.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
            </select>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Duration (ms)</span></label>
            <input type="number" value="${slide.duration || 5000}" 
                   onchange="window.LexSlider.updateSlideProperty('duration', parseInt(this.value))" 
                   class="input input-xs input-bordered w-full">
        </div>
    `;
    html += renderSection('Animation', animHtml);

    props.innerHTML = html;
}

function renderLayerProperties() {
    const props = elements.editor.propertyInspector;
    const layer = state.selectedLayer;

    let effectiveStyle = { ...layer.style };
    if (state.device === 'tablet' || state.device === 'mobile') {
        if (layer.style.tablet) effectiveStyle = { ...effectiveStyle, ...layer.style.tablet };
    }
    if (state.device === 'mobile') {
        if (layer.style.mobile) effectiveStyle = { ...effectiveStyle, ...layer.style.mobile };
    }

    let html = '';

    // 1. General
    html += renderSection('General', `
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Layer Name</span></label>
            <input type="text" value="${layer.name || ''}" 
                   onchange="window.LexSlider.updateLayerProp('name', this.value)" 
                   placeholder="Layer ${layer.id}" class="input input-xs input-bordered w-full">
        </div>
    `);

    // 2. Content
    let contentHtml = '';
    if (['heading', 'text', 'button'].includes(layer.type)) {
        contentHtml += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Text Content</span></label>
                <textarea id="text-content-editor" rows="3" 
                          oninput="window.LexSlider.updateLayerContent('text', this.value)" 
                          class="textarea textarea-bordered textarea-xs w-full">${layer.content.text || ''}</textarea>
            </div>
        `;
    }

    if (layer.type === 'image') {
        contentHtml += `
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

    if (layer.type === 'button') {
        contentHtml += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Link URL</span></label>
                <input type="text" value="${layer.content.link || '#'}" 
                       onchange="window.LexSlider.updateLayerContent('link', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        `;
    }

    if (layer.type === 'video') {
        contentHtml += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Video URL</span></label>
                <input type="text" value="${layer.content.src || ''}" 
                       onchange="window.LexSlider.updateLayerContent('src', this.value)" 
                       placeholder="https://youtube.com/embed/..." class="input input-xs input-bordered w-full">
            </div>
        `;
    }

    if (layer.type === 'icon') {
        contentHtml += `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Icon Name</span></label>
                <input type="text" value="${layer.content.icon || 'star'}" 
                       onchange="window.LexSlider.updateLayerContent('icon', this.value)" 
                       placeholder="star" class="input input-xs input-bordered w-full">
                <label class="label py-0">
                    <a href="https://fonts.google.com/icons" target="_blank" class="label-text-alt link link-primary">Browse Icons</a>
                </label>
            </div>
        `;
    }
    html += renderSection('Content', contentHtml);

    // 3. Typography
    if (['heading', 'text', 'button'].includes(layer.type)) {
        const typoHtml = `
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Font Family</span></label>
                <select onchange="window.LexSlider.updateLayerStyle('fontFamily', this.value)" class="select select-bordered select-xs w-full">
                    <option value="Inter, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="Roboto, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="'Playfair Display', serif" ${(effectiveStyle.fontFamily || '').includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                    <option value="'Montserrat', sans-serif" ${(effectiveStyle.fontFamily || '').includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                </select>
            </div>
            <div class="flex gap-2 mb-2">
                <div class="form-control w-1/2">
                    <label class="label py-1"><span class="label-text text-xs font-bold">Size</span></label>
                    <input type="text" value="${effectiveStyle.fontSize || '16px'}" 
                           onchange="window.LexSlider.updateLayerStyle('fontSize', this.value)" 
                           class="input input-xs input-bordered w-full">
                </div>
                <div class="form-control w-1/2">
                    <label class="label py-1"><span class="label-text text-xs font-bold">Weight</span></label>
                    <select onchange="window.LexSlider.updateLayerStyle('fontWeight', this.value)" class="select select-bordered select-xs w-full">
                        <option value="300" ${effectiveStyle.fontWeight === '300' ? 'selected' : ''}>Light</option>
                        <option value="400" ${!effectiveStyle.fontWeight || effectiveStyle.fontWeight === '400' ? 'selected' : ''}>Normal</option>
                        <option value="700" ${effectiveStyle.fontWeight === '700' ? 'selected' : ''}>Bold</option>
                    </select>
                </div>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Alignment</span></label>
                <div class="btn-group w-full flex">
                    <button class="btn btn-xs flex-1 ${effectiveStyle.textAlign === 'left' ? 'btn-active' : ''}" 
                            onclick="window.LexSlider.updateLayerStyle('textAlign', 'left')">
                        <span class="material-icons-round text-xs">format_align_left</span>
                    </button>
                    <button class="btn btn-xs flex-1 ${effectiveStyle.textAlign === 'center' ? 'btn-active' : ''}" 
                            onclick="window.LexSlider.updateLayerStyle('textAlign', 'center')">
                        <span class="material-icons-round text-xs">format_align_center</span>
                    </button>
                    <button class="btn btn-xs flex-1 ${effectiveStyle.textAlign === 'right' ? 'btn-active' : ''}" 
                            onclick="window.LexSlider.updateLayerStyle('textAlign', 'right')">
                        <span class="material-icons-round text-xs">format_align_right</span>
                    </button>
                </div>
            </div>
            <div class="form-control w-full mb-2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Color</span></label>
                <div class="join w-full">
                    <input type="color" value="${effectiveStyle.color || '#000000'}" 
                           onchange="window.LexSlider.updateLayerStyle('color', this.value)" 
                           class="input input-xs input-bordered join-item w-8 p-0">
                    <input type="text" value="${effectiveStyle.color || '#000000'}" 
                           onchange="window.LexSlider.updateLayerStyle('color', this.value)" 
                           class="input input-xs input-bordered join-item flex-1 font-mono">
                </div>
            </div>
        `;
        html += renderSection('Typography', typoHtml);
    }

    // 4. Style
    const styleHtml = `
        <div class="flex gap-2 mb-2">
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Width</span></label>
                <input type="text" value="${effectiveStyle.width || 'auto'}" 
                       onchange="window.LexSlider.updateLayerStyle('width', this.value)" 
                       placeholder="auto" class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Height</span></label>
                <input type="text" value="${effectiveStyle.height || 'auto'}" 
                       onchange="window.LexSlider.updateLayerStyle('height', this.value)" 
                       placeholder="auto" class="input input-xs input-bordered w-full">
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Background</span></label>
            <div class="join w-full">
                <input type="color" value="${effectiveStyle.background || '#ffffff'}" 
                       onchange="window.LexSlider.updateLayerStyle('background', this.value)" 
                       class="input input-xs input-bordered join-item w-8 p-0">
                <input type="text" value="${effectiveStyle.background || 'transparent'}" 
                       onchange="window.LexSlider.updateLayerStyle('background', this.value)" 
                       class="input input-xs input-bordered join-item flex-1 font-mono">
            </div>
        </div>
        <div class="flex gap-2 mb-2">
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Padding</span></label>
                <input type="text" value="${effectiveStyle.padding || '0px'}" 
                       onchange="window.LexSlider.updateLayerStyle('padding', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Radius</span></label>
                <input type="text" value="${effectiveStyle.borderRadius || '0px'}" 
                       onchange="window.LexSlider.updateLayerStyle('borderRadius', this.value)" 
                       class="input input-xs input-bordered w-full">
            </div>
        </div>
        <div class="flex gap-2 mb-2">
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Border Width</span></label>
                <input type="text" value="${effectiveStyle.borderWidth || '0px'}" 
                       onchange="window.LexSlider.updateLayerStyle('borderWidth', this.value)" 
                       placeholder="0px" class="input input-xs input-bordered w-full">
            </div>
            <div class="form-control w-1/2">
                <label class="label py-1"><span class="label-text text-xs font-bold">Border Color</span></label>
                <div class="join w-full">
                    <input type="color" value="${effectiveStyle.borderColor || '#000000'}" 
                           onchange="window.LexSlider.updateLayerStyle('borderColor', this.value)" 
                           class="input input-xs input-bordered join-item w-8 p-0">
                    <input type="text" value="${effectiveStyle.borderColor || 'transparent'}" 
                           onchange="window.LexSlider.updateLayerStyle('borderColor', this.value)" 
                           class="input input-xs input-bordered join-item flex-1 font-mono">
                </div>
            </div>
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Z-Index</span></label>
            <input type="number" value="${effectiveStyle.zIndex || '1'}" 
                   onchange="window.LexSlider.updateLayerStyle('zIndex', this.value)" 
                   class="input input-xs input-bordered w-full">
        </div>
        <div class="form-control w-full mb-2">
            <label class="label py-1"><span class="label-text text-xs font-bold">Opacity</span></label>
            <input type="range" min="0" max="1" step="0.1" value="${effectiveStyle.opacity || '1'}" 
                   oninput="window.LexSlider.updateLayerStyle('opacity', this.value)" 
                   class="range range-xs range-primary">
        </div>
    `;
    html += renderSection('Style', styleHtml);

    // 5. Custom CSS
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

    props.innerHTML = html;
}

function renderSection(title, content, isOpen = true) {
    return `
        <div class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mb-2">
            <input type="checkbox" ${isOpen ? 'checked' : ''} /> 
            <div class="collapse-title text-xs font-bold min-h-0 py-2 px-4 flex items-center">
                ${title}
            </div>
            <div class="collapse-content px-4 py-2 text-xs"> 
                ${content}
            </div>
        </div>
    `;
}

// ... Exports for update functions remain the same ...
export function updateLayerStyle(key, value) {
    if (!state.selectedLayer) return;

    if (state.device === 'desktop') {
        state.selectedLayer.style[key] = value;
    } else {
        if (!state.selectedLayer.style[state.device]) {
            state.selectedLayer.style[state.device] = {};
        }
        state.selectedLayer.style[state.device][key] = value;
    }
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
    renderProperties();
}

export function updateLayerContent(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer.content[key] = value;
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
}

export function updateLayerProp(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer[key] = value;
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
}

export function updateSlideProperty(key, value) {
    if (!state.currentSlide) return;
    state.currentSlide[key] = value;
    if (window.LexSlider && window.LexSlider.renderCanvas) window.LexSlider.renderCanvas();
    renderProperties();
}

export function toggleTextDecoration(decoration) {
    if (!state.selectedLayer) return;
    const current = state.selectedLayer.style.textDecoration || '';
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
    state.selectedLayer.style.customCSS = cssText;
    const lines = cssText.split('\n');
    lines.forEach(line => {
        const [property, value] = line.split(':').map(s => s.trim());
        if (property && value) {
            const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            updateLayerStyle(camelCase, value.replace(';', ''));
        }
    });
}

export function formatText(format) {
    const textarea = document.getElementById('text-content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    let formattedText = selectedText;
    switch (format) {
        case 'bold':
            formattedText = `<strong>${selectedText}</strong>`;
            break;
        case 'italic':
            formattedText = `<em>${selectedText}</em>`;
            break;
        case 'underline':
            formattedText = `<u>${selectedText}</u>`;
            break;
    }

    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newValue;
    updateLayerContent('text', newValue);
}
