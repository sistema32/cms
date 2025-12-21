/**
 * LayerPresets.js - Save and reuse layer styles
 * Manages a library of saved layer configurations
 */

// Default built-in presets
const BUILTIN_PRESETS = [
    {
        id: 'heading-hero',
        name: 'Hero Heading',
        category: 'headings',
        layer: {
            type: 'heading',
            content: { text: 'Hero Title' },
            style: {
                fontSize: '72px',
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                letterSpacing: '2px'
            }
        }
    },
    {
        id: 'heading-elegant',
        name: 'Elegant Heading',
        category: 'headings',
        layer: {
            type: 'heading',
            content: { text: 'Elegant Title' },
            style: {
                fontSize: '48px',
                fontWeight: '300',
                color: '#ffffff',
                textAlign: 'center',
                fontFamily: 'serif',
                letterSpacing: '5px',
                textTransform: 'uppercase'
            }
        }
    },
    {
        id: 'button-primary',
        name: 'Primary Button',
        category: 'buttons',
        layer: {
            type: 'button',
            content: { text: 'Click Here', link: '#' },
            style: {
                padding: '15px 40px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#8470ff',
                color: '#ffffff',
                borderRadius: '30px',
                border: 'none'
            }
        }
    },
    {
        id: 'button-outline',
        name: 'Outline Button',
        category: 'buttons',
        layer: {
            type: 'button',
            content: { text: 'Learn More', link: '#' },
            style: {
                padding: '12px 30px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderRadius: '4px',
                border: '2px solid #ffffff'
            }
        }
    },
    {
        id: 'text-subtitle',
        name: 'Subtitle',
        category: 'text',
        layer: {
            type: 'text',
            content: { text: 'Your subtitle goes here with a brief description.' },
            style: {
                fontSize: '18px',
                fontWeight: '400',
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                lineHeight: '1.6',
                maxWidth: '600px'
            }
        }
    },
    {
        id: 'text-label',
        name: 'Label',
        category: 'text',
        layer: {
            type: 'text',
            content: { text: 'NEW RELEASE' },
            style: {
                fontSize: '12px',
                fontWeight: '600',
                color: '#8470ff',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                padding: '8px 16px',
                backgroundColor: 'rgba(132,112,255,0.15)',
                borderRadius: '20px'
            }
        }
    },
    {
        id: 'image-rounded',
        name: 'Rounded Image',
        category: 'images',
        layer: {
            type: 'image',
            content: { src: '' },
            style: {
                width: '300px',
                height: '300px',
                borderRadius: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }
        }
    },
    {
        id: 'image-circle',
        name: 'Circle Image',
        category: 'images',
        layer: {
            type: 'image',
            content: { src: '' },
            style: {
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '4px solid white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }
        }
    },
    {
        id: 'card-glass',
        name: 'Glass Card',
        category: 'shapes',
        layer: {
            type: 'shape',
            content: {},
            style: {
                width: '400px',
                height: '300px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }
        }
    },
    {
        id: 'divider-line',
        name: 'Divider Line',
        category: 'shapes',
        layer: {
            type: 'shape',
            content: {},
            style: {
                width: '100px',
                height: '3px',
                backgroundColor: '#8470ff',
                borderRadius: '2px'
            }
        }
    }
];

// Preset categories
export const PRESET_CATEGORIES = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'headings', label: 'Headings', icon: 'title' },
    { id: 'text', label: 'Text', icon: 'text_fields' },
    { id: 'buttons', label: 'Buttons', icon: 'smart_button' },
    { id: 'images', label: 'Images', icon: 'image' },
    { id: 'shapes', label: 'Shapes', icon: 'category' },
    { id: 'custom', label: 'My Presets', icon: 'bookmark' }
];

// Storage key
const STORAGE_KEY = 'lexslider_layer_presets';

/**
 * Get all presets (built-in + custom)
 */
export function getAllPresets() {
    const customPresets = getCustomPresets();
    return [...BUILTIN_PRESETS, ...customPresets];
}

/**
 * Get custom presets from storage
 */
export function getCustomPresets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save custom preset
 */
export function saveCustomPreset(name, layer) {
    const presets = getCustomPresets();
    const newPreset = {
        id: `custom_${Date.now()}`,
        name,
        category: 'custom',
        layer: { ...layer },
        createdAt: new Date().toISOString()
    };

    presets.push(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

    return newPreset;
}

/**
 * Delete custom preset
 */
export function deleteCustomPreset(presetId) {
    const presets = getCustomPresets().filter(p => p.id !== presetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(categoryId) {
    const all = getAllPresets();
    if (categoryId === 'all') return all;
    return all.filter(p => p.category === categoryId);
}

/**
 * Get preset by ID
 */
export function getPresetById(presetId) {
    return getAllPresets().find(p => p.id === presetId);
}

/**
 * Apply preset to create a new layer
 */
export function applyPreset(presetId, overrides = {}) {
    const preset = getPresetById(presetId);
    if (!preset) return null;

    return {
        ...preset.layer,
        ...overrides,
        style: {
            ...preset.layer.style,
            ...(overrides.style || {})
        },
        content: {
            ...preset.layer.content,
            ...(overrides.content || {})
        }
    };
}

/**
 * Generate preset gallery HTML
 */
export function generatePresetGalleryHTML() {
    const categories = PRESET_CATEGORIES.map(cat => `
        <button class="preset-category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
            <span class="material-icons-round">${cat.icon}</span>
            ${cat.label}
        </button>
    `).join('');

    const presets = getAllPresets().map(preset => `
        <div class="preset-card" data-preset-id="${preset.id}" data-category="${preset.category}">
            <div class="preset-preview">
                <span class="material-icons-round">${getPresetIcon(preset.layer.type)}</span>
            </div>
            <div class="preset-name">${preset.name}</div>
            ${preset.category === 'custom' ? '<button class="preset-delete" data-id="' + preset.id + '"><span class="material-icons-round">close</span></button>' : ''}
        </div>
    `).join('');

    return `
        <div class="preset-gallery">
            <div class="preset-categories">${categories}</div>
            <div class="preset-grid">${presets}</div>
        </div>
    `;
}

function getPresetIcon(type) {
    const icons = {
        heading: 'title',
        text: 'text_fields',
        button: 'smart_button',
        image: 'image',
        video: 'videocam',
        icon: 'emoji_emotions',
        shape: 'category'
    };
    return icons[type] || 'layers';
}

/**
 * Generate preset gallery CSS
 */
export function generatePresetGalleryCSS() {
    return `
        .preset-gallery {
            padding: 15px;
        }
        
        .preset-categories {
            display: flex;
            gap: 6px;
            margin-bottom: 15px;
            overflow-x: auto;
            padding-bottom: 5px;
        }
        
        .preset-category-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: 1px solid #333;
            border-radius: 15px;
            background: transparent;
            color: #888;
            font-size: 12px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        
        .preset-category-btn .material-icons-round {
            font-size: 14px;
        }
        
        .preset-category-btn:hover,
        .preset-category-btn.active {
            background: #8470ff;
            border-color: #8470ff;
            color: white;
        }
        
        .preset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
        }
        
        .preset-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }
        
        .preset-card:hover {
            border-color: #8470ff;
            transform: translateY(-2px);
        }
        
        .preset-preview {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .preset-preview .material-icons-round {
            font-size: 28px;
            color: #666;
        }
        
        .preset-name {
            font-size: 11px;
            text-align: center;
            color: #aaa;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .preset-delete {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 18px;
            height: 18px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: rgba(255,50,50,0.8);
            color: white;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .preset-delete .material-icons-round {
            font-size: 12px;
        }
        
        .preset-card:hover .preset-delete {
            display: flex;
        }
    `;
}

export default {
    PRESET_CATEGORIES,
    getAllPresets,
    getCustomPresets,
    saveCustomPreset,
    deleteCustomPreset,
    getPresetsByCategory,
    getPresetById,
    applyPreset,
    generatePresetGalleryHTML,
    generatePresetGalleryCSS
};
