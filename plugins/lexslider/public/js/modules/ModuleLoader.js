/**
 * ModuleLoader - Lazy loading utilities for LexSlider
 * Implements code splitting for better initial load performance
 */

// Cache for loaded modules
const moduleCache = new Map();

// Module paths for lazy loading
const MODULE_PATHS = {
    timeline: './modules/TimelineManager.js?v=3.0.28',
    properties: './modules/PropertyInspector.js?v=3.0.28',
    history: './modules/HistoryManager.js?v=3.0.28',
    animations: './modules/AnimationPresets.js?v=3.0.28',
    easing: './modules/EasingFunctions.js'
};

/**
 * Lazy load a module
 * @param {string} name - Module name
 * @returns {Promise<any>} - Loaded module
 */
export async function loadModule(name) {
    if (moduleCache.has(name)) {
        return moduleCache.get(name);
    }

    const path = MODULE_PATHS[name];
    if (!path) {
        throw new Error(`Unknown module: ${name}`);
    }

    try {
        const module = await import(path);
        moduleCache.set(name, module);
        return module;
    } catch (error) {
        console.error(`[ModuleLoader] Failed to load ${name}:`, error);
        throw error;
    }
}

/**
 * Preload modules (non-blocking)
 * @param {string[]} names - Module names to preload
 */
export function preloadModules(names) {
    names.forEach(name => {
        loadModule(name).catch(() => { }); // Silent fail for preload
    });
}

/**
 * Check if module is loaded
 * @param {string} name - Module name
 * @returns {boolean}
 */
export function isModuleLoaded(name) {
    return moduleCache.has(name);
}

/**
 * Clear module cache (for testing/reloading)
 */
export function clearModuleCache() {
    moduleCache.clear();
}

/**
 * Defer heavy initialization until idle
 * Uses requestIdleCallback if available
 * @param {Function} fn - Function to run when idle
 * @param {number} timeout - Max timeout in ms
 */
export function runWhenIdle(fn, timeout = 2000) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(fn, { timeout });
    } else {
        setTimeout(fn, 100);
    }
}

/**
 * Intersection Observer factory for lazy loading components
 * @param {Function} callback - Called when element enters viewport
 * @returns {IntersectionObserver}
 */
export function createLazyObserver(callback) {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
            }
        });
    }, {
        rootMargin: '100px', // Start loading before fully visible
        threshold: 0.1
    });
}

// Performance monitoring utilities
let perfMarks = {};

export function perfStart(name) {
    perfMarks[name] = performance.now();
}

export function perfEnd(name) {
    if (perfMarks[name]) {
        const duration = performance.now() - perfMarks[name];
        console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
        delete perfMarks[name];
        return duration;
    }
    return 0;
}

// Export default preloader for critical modules
export function preloadCriticalModules() {
    runWhenIdle(() => {
        preloadModules(['timeline', 'properties']);
    });
}
