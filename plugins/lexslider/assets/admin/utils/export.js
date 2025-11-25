/**
 * Export/Import Utilities for LexSlider
 * Handles slider export and import operations
 */

// Export slider to JSON
export async function exportSlider(sliderId) {
    const response = await fetch(`/api/plugins/lexslider/sliders/${sliderId}/export`);

    if (!response.ok) {
        throw new Error('Failed to export slider');
    }

    return await response.json();
}

// Import slider from JSON
export async function importSlider(data) {
    const response = await fetch(`/api/plugins/lexslider/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to import slider');
    }

    return await response.json();
}

// Download slider as JSON file
export function downloadSliderJSON(slider, data) {
    const filename = `lexslider-${slider.alias || slider.id}-${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

// Read JSON file
export function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Validate export data
export function validateExportData(data) {
    const errors = [];

    if (!data.version) {
        errors.push('Missing version field');
    }

    if (!data.slider) {
        errors.push('Missing slider data');
    }

    if (!Array.isArray(data.slides)) {
        errors.push('Missing or invalid slides data');
    }

    // Check slider structure
    if (data.slider) {
        if (!data.slider.name) errors.push('Slider missing name');
        if (!data.slider.alias) errors.push('Slider missing alias');
    }

    // Check slides structure
    if (Array.isArray(data.slides)) {
        data.slides.forEach((slide, index) => {
            if (!slide.order && slide.order !== 0) {
                errors.push(`Slide ${index} missing order`);
            }
            if (!Array.isArray(slide.layers)) {
                errors.push(`Slide ${index} missing layers array`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Export with UI
export async function exportSliderWithUI(sliderId, sliderName) {
    try {
        const data = await exportSlider(sliderId);
        downloadSliderJSON({ id: sliderId, alias: sliderName }, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Import with UI
export async function importSliderWithUI(file) {
    try {
        const data = await readJSONFile(file);

        const validation = validateExportData(data);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Invalid export file: ' + validation.errors.join(', '),
            };
        }

        const imported = await importSlider(data);
        return { success: true, slider: imported };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
