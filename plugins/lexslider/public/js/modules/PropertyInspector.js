
import { state, elements } from './EditorCore.js';
import { renderCanvas } from './CanvasRenderer.js';

export function renderProperties() {
    const props = elements.editor.propertyInspector;

    if (!state.selectedLayer) {
        if (!state.currentSlide) {
            props.innerHTML = '<p class="empty-text">Select a slide to edit properties</p>';
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

    //1. Background
    const bgHtml = `
        <div class="prop-group">
            <label>Background Image URL</label>
            <div style="display: flex; gap: 8px;">
                <input type="text" value="${slide.background_image || ''}" onchange="window.LexSlider.updateSlideProperty('background_image', this.value)" placeholder="https://example.com/image.jpg">
                <button class="btn-icon" onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateSlideProperty('background_image', url))" title="Select Image">
                    <span class="material-icons-round">image</span>
                </button>
            </div>
        </div>
        <div class="prop-group">
            <label>Background Color</label>
            <div class="color-picker-wrapper">
                <input type="color" value="${slide.background_color || '#ffffff'}" onchange="window.LexSlider.updateSlideProperty('background_color', this.value)">
                <input type="text" value="${slide.background_color || '#ffffff'}" onchange="window.LexSlider.updateSlideProperty('background_color', this.value)" placeholder="#ffffff">
            </div>
        </div>
        <div class="prop-group">
            <label>Ken Burns Effect</label>
            <div class="toggle-wrapper">
                <label class="switch">
                    <input type="checkbox" ${slide.ken_burns ? 'checked' : ''} onchange="window.LexSlider.updateSlideProperty('ken_burns', this.checked)">
                    <span class="slider-toggle round"></span>
                </label>
            </div>
        </div>
    `;
    html += renderSection('Background', bgHtml);

    // 2. Animation
    const animHtml = `
        <div class="prop-group">
            <label>Transition</label>
            <select onchange="window.LexSlider.updateSlideProperty('transition', this.value)">
                <option value="fade" ${!slide.transition || slide.transition === 'fade' ? 'selected' : ''}>Fade</option>
                <option value="slide-horizontal" ${slide.transition === 'slide-horizontal' ? 'selected' : ''}>Slide Horizontal</option>
                <option value="slide-vertical" ${slide.transition === 'slide-vertical' ? 'selected' : ''}>Slide Vertical</option>
                <option value="zoom" ${slide.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
            </select>
        </div>
        <div class="prop-group">
            <label>Duration (ms)</label>
            <input type="number" value="${slide.duration || 500}" onchange="window.LexSlider.updateSlideProperty('duration', parseInt(this.value))">
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
        <div class="prop-group">
            <label>Layer Name</label>
            <input type="text" value="${layer.name || ''}" onchange="window.LexSlider.updateLayerProp('name', this.value)" placeholder="Layer ${layer.id}">
        </div>
    `);

    // 2. Content Section with Rich Text Editor for text layers
    let contentHtml = '';
    if (layer.type === 'heading' || layer.type === 'text' || layer.type === 'button') {
        contentHtml += `
            <div class="prop-group">
                <label>Text</label>
                <textarea id="text-content-editor" rows="3" oninput="window.LexSlider.updateLayerContent('text', this.value)">${layer.content.text || ''}</textarea>
            </div>
        `;
    }

    if (layer.type === 'image') {
        contentHtml += `
            <div class="prop-group">
                <label>Image URL</label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" value="${layer.content.src || ''}" onchange="window.LexSlider.updateLayerContent('src', this.value)">
                    <button class="btn-icon" onclick="window.LexSlider.openAssetManager(url => window.LexSlider.updateLayerContent('src', url))" title="Select Image">
                        <span class="material-icons-round">image</span>
                    </button>
                </div>
            </div>
        `;
    }

    if (layer.type === 'button') {
        contentHtml += `
            <div class="prop-group">
                <label>Link URL</label>
                <input type="text" value="${layer.content.link || '#'}" onchange="window.LexSlider.updateLayerContent('link', this.value)">
            </div>
        `;
    }

    if (layer.type === 'video') {
        contentHtml += `
            <div class="prop-group">
                <label>Video URL</label>
                <input type="text" value="${layer.content.src || ''}" onchange="window.LexSlider.updateLayerContent('src', this.value)" placeholder="https://youtube.com/embed/...">
            </div>
        `;
    }
    if (layer.type === 'icon') {
        contentHtml += `
            <div class="prop-group">
                <label>Icon Name (Material Icons)</label>
                <input type="text" value="${layer.content.icon || 'star'}" onchange="window.LexSlider.updateLayerContent('icon', this.value)" placeholder="star">
                <small style="color: var(--text-muted); font-size: 10px; display: block; margin-top: 4px;">
                    Browse: <a href="https://fonts.google.com/icons" target="_blank" style="color: var(--primary);">Material Icons</a>
                </small>
            </div>
        `;
    }
    html += renderSection('Content', contentHtml);

    // 3. Typography (for text layers)
    if (layer.type === 'heading' || layer.type === 'text' || layer.type === 'button') {
        const typoHtml = `
            <div class="prop-group">
                <label>Font Family</label>
                <select onchange="window.LexSlider.updateLayerStyle('fontFamily', this.value)">
                    <option value="Inter, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="Roboto, sans-serif" ${(effectiveStyle.fontFamily || '').includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="'Playfair Display', serif" ${(effectiveStyle.fontFamily || '').includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                    <option value="'Montserrat', sans-serif" ${(effectiveStyle.fontFamily || '').includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                    <option value="Georgia, serif" ${(effectiveStyle.fontFamily || '').includes('Georgia') ? 'selected' : ''}>Georgia</option>
                </select>
            </div>
            <div class="prop-row">
                <div class="prop-group">
                    <label>Font Size</label>
                    <input type="text" value="${effectiveStyle.fontSize || '16px'}" onchange="window.LexSlider.updateLayerStyle('fontSize', this.value)">
                </div>
                <div class="prop-group">
                    <label>Font Weight</label>
                    <select onchange="window.LexSlider.updateLayerStyle('fontWeight', this.value)">
                        <option value="300" ${effectiveStyle.fontWeight === '300' ? 'selected' : ''}>Light</option>
                        <option value="400" ${!effectiveStyle.fontWeight || effectiveStyle.fontWeight === '400' || effectiveStyle.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="500" ${effectiveStyle.fontWeight === '500' ? 'selected' : ''}>Medium</option>
                        <option value="600" ${effectiveStyle.fontWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
                        <option value="700" ${effectiveStyle.fontWeight === '700' || effectiveStyle.fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
                    </select>
                </div>
            </div>
            <div class="prop-row">
                <div class="prop-group">
                    <label>Text Align</label>
                    <div class="icon-toggles">
                        <button class="icon-toggle ${effectiveStyle.textAlign === 'left' ? 'active' : ''}" onclick="window.LexSlider.updateLayerStyle('textAlign', 'left')">
                            <span class="material-icons-round">format_align_left</span>
                        </button>
                        <button class="icon-toggle ${effectiveStyle.textAlign === 'center' ? 'active' : ''}" onclick="window.LexSlider.updateLayerStyle('textAlign', 'center')">
                            <span class="material-icons-round">format_align_center</span>
                        </button>
                        <button class="icon-toggle ${effectiveStyle.textAlign === 'right' ? 'active' : ''}" onclick="window.LexSlider.updateLayerStyle('textAlign', 'right')">
                            <span class="material-icons-round">format_align_right</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="prop-row">
                <div class="prop-group">
                    <label>Text Color</label>
                    <div class="color-picker-wrapper">
                        <input type="color" value="${effectiveStyle.color || '#000000'}" onchange="window.LexSlider.updateLayerStyle('color', this.value)">
                        <input type="text" value="${effectiveStyle.color || '#000000'}" onchange="window.LexSlider.updateLayerStyle('color', this.value)">
                    </div>
                </div>
            </div>
            <div class="prop-group">
                <label>Text Decoration</label>
                <div class="icon-toggles">
                    <button class="icon-toggle ${(effectiveStyle.textDecoration || '').includes('underline') ? 'active' : ''}" onclick="window.LexSlider.toggleTextDecoration('underline')">
                        <span class="material-icons-round">format_underlined</span>
                    </button>
                    <button class="icon-toggle ${(effectiveStyle.textDecoration || '').includes('line-through') ? 'active' : ''}" onclick="window.LexSlider.toggleTextDecoration('line-through')">
                        <span class="material-icons-round">strikethrough_s</span>
                    </button>
                </div>
            </div>
            <div class="prop-group">
                <label>Font Style</label>
                <div class="icon-toggles">
                    <button class="icon-toggle ${effectiveStyle.fontStyle === 'italic' ? 'active' : ''}" onclick="window.LexSlider.updateLayerStyle('fontStyle', '${effectiveStyle.fontStyle === 'italic' ? 'normal' : 'italic'}')">
                        <span class="material-icons-round">format_italic</span>
                    </button>
                </div>
            </div>
        `;
        html += renderSection('Typography', typoHtml);
    }

    // 4. Style
    const styleHtml = `
        <div class="prop-row">
            <div class="prop-group">
                <label>Width</label>
                <input type="text" value="${effectiveStyle.width || 'auto'}" onchange="window.LexSlider.updateLayerStyle('width', this.value)" placeholder="auto, 100px, 50%">
            </div>
            <div class="prop-group">
                <label>Height</label>
                <input type="text" value="${effectiveStyle.height || 'auto'}" onchange="window.LexSlider.updateLayerStyle('height', this.value)" placeholder="auto, 100px">
            </div>
        </div>
        <div class="prop-group">
            <label>Background</label>
            <div class="color-picker-wrapper">
                <input type="color" value="${effectiveStyle.background || '#ffffff'}" onchange="window.LexSlider.updateLayerStyle('background', this.value)">
                <input type="text" value="${effectiveStyle.background || 'transparent'}" onchange="window.LexSlider.updateLayerStyle('background', this.value)">
            </div>
        </div>
        <div class="prop-row">
            <div class="prop-group">
                <label>Padding</label>
                <input type="text" value="${effectiveStyle.padding || '0px'}" onchange="window.LexSlider.updateLayerStyle('padding', this.value)" placeholder="10px, 10px 20px">
            </div>
            <div class="prop-group">
                <label>Border Radius</label>
                <input type="text" value="${effectiveStyle.borderRadius || '0px'}" onchange="window.LexSlider.updateLayerStyle('borderRadius', this.value)" placeholder="4px">
            </div>
        </div>
        <div class="prop-group">
            <label>Opacity</label>
            <input type="range" min="0" max="1" step="0.1" value="${effectiveStyle.opacity || '1'}" oninput="window.LexSlider.updateLayerStyle('opacity', this.value)">
            <span style="font-size: 11px; color: var(--text-muted);">${Math.round((effectiveStyle.opacity || 1) * 100)}%</span>
        </div>
    `;
    html += renderSection('Style', styleHtml);

    // 5. Custom CSS
    const cssHtml = `
        <div class="prop-group">
            <label>Custom CSS Properties</label>
            <textarea id="custom-css-editor" rows="5" onchange="window.LexSlider.applyCustomCSS(this.value)" placeholder="box-shadow: 0 4px 6px rgba(0,0,0,0.1);
border: 1px solid #ccc;
transform: rotate(5deg);">${effectiveStyle.customCSS || ''}</textarea>
            <small style="color: var(--text-muted); font-size: 10px; display: block; margin-top: 4px;">
                Enter CSS properties one per line without selectors
            </small>
        </div>
    `;
    html += renderSection('Advanced CSS', cssHtml, false);

    props.innerHTML = html;
}



function renderSection(title, content, isOpen = true) {
    return `
        <div class="prop-section ${isOpen ? '' : 'collapsed'}">
            <div class="prop-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <h4>${title}</h4>
                <span class="material-icons-round icon">expand_more</span>
            </div>
            <div class="prop-content">
                ${content}
            </div>
        </div>
    `;
}

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
    renderCanvas();
    renderProperties();
}

export function updateLayerContent(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer.content[key] = value;
    renderCanvas();
}

export function updateLayerProp(key, value) {
    if (!state.selectedLayer) return;
    state.selectedLayer[key] = value;
    renderCanvas();
}

export function updateSlideProperty(key, value) {
    if (!state.currentSlide) return;
    state.currentSlide[key] = value;
    renderCanvas();
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
    // Parse and apply custom CSS
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
