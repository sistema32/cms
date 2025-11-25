/**
 * Responsive Utilities for LexSlider
 * Handles device-specific settings and breakpoints
 */

// Breakpoints (matching Smart Slider 3)
export const breakpoints = {
    desktop: { min: 1200, max: Infinity, label: 'Desktop' },
    tablet: { min: 768, max: 1199, label: 'Tablet' },
    mobile: { min: 0, max: 767, label: 'Mobile' },
};

// Get current device based on viewport width
export function getCurrentDevice(width = window.innerWidth) {
    if (width >= breakpoints.desktop.min) return 'desktop';
    if (width >= breakpoints.tablet.min) return 'tablet';
    return 'mobile';
}

// Get responsive value for current device
export function getResponsiveValue(responsiveSettings, property, device) {
    if (!responsiveSettings || !device) return null;

    const deviceSettings = responsiveSettings[device];
    if (deviceSettings && deviceSettings[property] !== undefined) {
        return deviceSettings[property];
    }

    // Fallback to desktop if not defined for current device
    if (device !== 'desktop' && responsiveSettings.desktop) {
        return responsiveSettings.desktop[property];
    }

    return null;
}

// Merge responsive settings
export function mergeResponsiveSettings(base, override) {
    return {
        desktop: { ...base?.desktop, ...override?.desktop },
        tablet: { ...base?.tablet, ...override?.tablet },
        mobile: { ...base?.mobile, ...override?.mobile },
    };
}

// Create default responsive settings
export function createDefaultResponsive(baseSettings = {}) {
    return {
        desktop: { visible: true, ...baseSettings },
        tablet: { visible: true, ...baseSettings },
        mobile: { visible: true, ...baseSettings },
    };
}

// Scale value for device
export function scaleForDevice(value, fromDevice, toDevice) {
    const scales = {
        desktop: 1,
        tablet: 0.75,
        mobile: 0.5,
    };

    const fromScale = scales[fromDevice] || 1;
    const toScale = scales[toDevice] || 1;

    return Math.round(value * (toScale / fromScale));
}

// Check if layer is visible on device
export function isVisibleOnDevice(layer, device) {
    const responsive = layer.responsiveSettings || {};
    const deviceSettings = responsive[device];

    if (!deviceSettings) return true; // Visible by default
    return deviceSettings.visible !== false;
}

// Get layer position for device
export function getLayerPosition(layer, device) {
    const basePosition = layer.position || {};
    const responsive = layer.responsiveSettings || {};
    const deviceSettings = responsive[device] || {};

    return {
        x: deviceSettings.x !== undefined ? deviceSettings.x : basePosition.x,
        y: deviceSettings.y !== undefined ? deviceSettings.y : basePosition.y,
        width: deviceSettings.width !== undefined ? deviceSettings.width : basePosition.width,
        height: deviceSettings.height !== undefined ? deviceSettings.height : basePosition.height,
        zIndex: basePosition.zIndex,
    };
}

// Get layer settings for device
export function getLayerSettings(layer, device) {
    const baseSettings = layer.settings || {};
    const responsive = layer.responsiveSettings || {};
    const deviceSettings = responsive[device] || {};

    return {
        ...baseSettings,
        ...deviceSettings,
    };
}

// Responsive preview dimensions
export function getPreviewDimensions(device, containerWidth) {
    const aspectRatio = 16 / 9; // Default aspect ratio

    switch (device) {
        case 'desktop':
            return {
                width: Math.min(containerWidth, 1200),
                height: Math.min(containerWidth, 1200) / aspectRatio,
            };
        case 'tablet':
            return {
                width: Math.min(containerWidth, 768),
                height: Math.min(containerWidth, 768) / aspectRatio,
            };
        case 'mobile':
            return {
                width: Math.min(containerWidth, 375),
                height: Math.min(containerWidth, 375) / aspectRatio,
            };
        default:
            return {
                width: containerWidth,
                height: containerWidth / aspectRatio,
            };
    }
}
