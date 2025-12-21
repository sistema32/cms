/**
 * CopyPaste.js - Copy and paste layers between sliders
 * Uses clipboard and localStorage for cross-slider operations
 */

// Clipboard storage key
const CLIPBOARD_KEY = 'lexslider_clipboard';

/**
 * Copy layer to clipboard
 */
export function copyLayer(layer) {
    if (!layer) return false;

    const clipboardData = {
        type: 'layer',
        data: JSON.parse(JSON.stringify(layer)), // Deep clone
        timestamp: Date.now(),
        source: window.location.href
    };

    // Remove unique identifiers
    delete clipboardData.data.id;

    try {
        localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(clipboardData));

        // Also try system clipboard
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(JSON.stringify(clipboardData)).catch(() => { });
        }

        return true;
    } catch (err) {
        console.error('[CopyPaste] Copy failed:', err);
        return false;
    }
}

/**
 * Copy multiple layers
 */
export function copyLayers(layers) {
    if (!layers || layers.length === 0) return false;

    const clipboardData = {
        type: 'layers',
        data: JSON.parse(JSON.stringify(layers)).map(layer => {
            delete layer.id;
            return layer;
        }),
        timestamp: Date.now(),
        source: window.location.href
    };

    try {
        localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(clipboardData));
        return true;
    } catch (err) {
        console.error('[CopyPaste] Copy failed:', err);
        return false;
    }
}

/**
 * Copy slide to clipboard
 */
export function copySlide(slide) {
    if (!slide) return false;

    const clipboardData = {
        type: 'slide',
        data: JSON.parse(JSON.stringify(slide)),
        timestamp: Date.now(),
        source: window.location.href
    };

    // Remove unique identifiers
    delete clipboardData.data.id;
    delete clipboardData.data.slider_id;
    clipboardData.data.layers?.forEach(layer => delete layer.id);

    try {
        localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(clipboardData));
        return true;
    } catch (err) {
        console.error('[CopyPaste] Copy failed:', err);
        return false;
    }
}

/**
 * Paste from clipboard
 */
export function paste() {
    try {
        const stored = localStorage.getItem(CLIPBOARD_KEY);
        if (!stored) return null;

        const clipboardData = JSON.parse(stored);

        // Validate timestamp (expire after 24 hours)
        if (Date.now() - clipboardData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(CLIPBOARD_KEY);
            return null;
        }

        return clipboardData;
    } catch (err) {
        console.error('[CopyPaste] Paste failed:', err);
        return null;
    }
}

/**
 * Check if clipboard has content
 */
export function hasClipboard() {
    try {
        const stored = localStorage.getItem(CLIPBOARD_KEY);
        if (!stored) return false;

        const clipboardData = JSON.parse(stored);
        return Date.now() - clipboardData.timestamp < 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

/**
 * Get clipboard content type
 */
export function getClipboardType() {
    try {
        const stored = localStorage.getItem(CLIPBOARD_KEY);
        if (!stored) return null;

        const clipboardData = JSON.parse(stored);
        return clipboardData.type;
    } catch {
        return null;
    }
}

/**
 * Clear clipboard
 */
export function clearClipboard() {
    localStorage.removeItem(CLIPBOARD_KEY);
}

/**
 * Duplicate layer with offset
 */
export function duplicateLayer(layer, offsetX = 20, offsetY = 20) {
    const newLayer = JSON.parse(JSON.stringify(layer));

    delete newLayer.id;

    // Offset position
    if (newLayer.style) {
        if (newLayer.style.left) {
            const left = parseFloat(newLayer.style.left);
            newLayer.style.left = `${left + offsetX}${newLayer.style.left.replace(/[\d.]+/, '')}`;
        }
        if (newLayer.style.top) {
            const top = parseFloat(newLayer.style.top);
            newLayer.style.top = `${top + offsetY}${newLayer.style.top.replace(/[\d.]+/, '')}`;
        }
    }

    return newLayer;
}

/**
 * Export layer as JSON file
 */
export function exportLayer(layer, filename = 'layer') {
    const data = JSON.stringify(layer, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

/**
 * Import layer from JSON file
 */
export function importLayer() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            try {
                const text = await file.text();
                const layer = JSON.parse(text);

                // Validate basic structure
                if (!layer.type || !layer.style) {
                    reject(new Error('Invalid layer format'));
                    return;
                }

                delete layer.id;
                resolve(layer);
            } catch (err) {
                reject(err);
            }
        };

        input.click();
    });
}

/**
 * Generate copy/paste keyboard handler
 */
export function initCopyPasteKeyboard(container, callbacks) {
    const { onCopy, onPaste, onCut, onDuplicate } = callbacks;

    container.addEventListener('keydown', (e) => {
        // Check for input elements
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const isMod = e.ctrlKey || e.metaKey;

        if (isMod && e.key === 'c') {
            e.preventDefault();
            onCopy?.();
        } else if (isMod && e.key === 'v') {
            e.preventDefault();
            onPaste?.();
        } else if (isMod && e.key === 'x') {
            e.preventDefault();
            onCut?.();
        } else if (isMod && e.key === 'd') {
            e.preventDefault();
            onDuplicate?.();
        }
    });
}

/**
 * Copy/Paste script for frontend
 */
export function generateCopyPasteScript() {
    return `
        (function() {
            // This is a simplified version for frontend
            // Full copy/paste is handled in the editor
            console.log('[LexSlider] Copy/Paste module loaded');
        })();
    `;
}

export default {
    copyLayer,
    copyLayers,
    copySlide,
    paste,
    hasClipboard,
    getClipboardType,
    clearClipboard,
    duplicateLayer,
    exportLayer,
    importLayer,
    initCopyPasteKeyboard
};
