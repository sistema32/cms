/**
 * DeepLinking.js - URL-based slide navigation
 * Direct links to specific slides via URL hash
 */

// Configuration
const DEFAULT_CONFIG = {
    hashPrefix: 'slide-',      // URL hash prefix (e.g., #slide-2)
    useSlideId: false,         // Use slide ID instead of index
    updateOnChange: true,      // Update URL when slide changes
    scrollToSlider: true,      // Scroll to slider on hash navigation
    scrollOffset: 0            // Offset for scroll position
};

/**
 * Parse hash from URL
 */
export function parseHash(hashPrefix = 'slide-', useSlideId = false) {
    const hash = window.location.hash.slice(1); // Remove #

    if (!hash.startsWith(hashPrefix)) {
        return null;
    }

    const value = hash.slice(hashPrefix.length);

    if (useSlideId) {
        return { type: 'id', value };
    }

    const index = parseInt(value, 10);
    if (isNaN(index)) {
        return { type: 'id', value };
    }

    return { type: 'index', value: index - 1 }; // Convert to 0-based
}

/**
 * Set hash in URL
 */
export function setHash(slideIndex, config = {}) {
    const { hashPrefix = 'slide-' } = config;
    const newHash = `${hashPrefix}${slideIndex + 1}`; // Convert to 1-based

    // Use replaceState to avoid adding to history
    if (config.replaceState) {
        window.history.replaceState(null, '', `#${newHash}`);
    } else {
        window.location.hash = newHash;
    }
}

/**
 * Clear hash from URL
 */
export function clearHash() {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/**
 * DeepLinking class
 */
export class DeepLinking {
    constructor(element, config = {}) {
        this.element = element;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.currentSlide = 0;

        this.onGoTo = config.onGoTo || (() => { });

        this.init();
    }

    init() {
        // Check initial hash
        this.checkHash();

        // Listen for hash changes
        window.addEventListener('hashchange', this.handleHashChange.bind(this));

        // Listen for slide changes
        if (this.config.updateOnChange) {
            this.element.addEventListener('ss3:slideChange', this.handleSlideChange.bind(this));
        }
    }

    checkHash() {
        const parsed = parseHash(this.config.hashPrefix, this.config.useSlideId);

        if (!parsed) return;

        if (parsed.type === 'index') {
            this.goToSlide(parsed.value);
        } else if (parsed.type === 'id') {
            this.goToSlideById(parsed.value);
        }
    }

    handleHashChange() {
        this.checkHash();
    }

    handleSlideChange(e) {
        const index = e.detail.index;
        if (index !== this.currentSlide) {
            this.currentSlide = index;
            setHash(index, { ...this.config, replaceState: true });
        }
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.onGoTo(index);

        if (this.config.scrollToSlider) {
            this.scrollToSlider();
        }
    }

    goToSlideById(slideId) {
        const slides = this.element.querySelectorAll('.ss3-slide');
        const index = Array.from(slides).findIndex(s =>
            s.dataset.slideId === slideId || s.id === slideId
        );

        if (index >= 0) {
            this.goToSlide(index);
        }
    }

    scrollToSlider() {
        const rect = this.element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - this.config.scrollOffset;

        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    destroy() {
        window.removeEventListener('hashchange', this.handleHashChange);
    }
}

/**
 * Initialize deep linking
 */
export function initDeepLinking(container, callbacks = {}) {
    return new DeepLinking(container, {
        ...callbacks,
        onGoTo: callbacks.onGoTo
    });
}

/**
 * Generate deep linking script
 */
export function generateDeepLinkingScript(sliderId, config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const config = ${JSON.stringify(settings)};
            let currentSlide = 0;
            
            function parseHash() {
                const hash = window.location.hash.slice(1);
                if (!hash.startsWith(config.hashPrefix)) return null;
                
                const value = hash.slice(config.hashPrefix.length);
                const index = parseInt(value, 10);
                
                if (isNaN(index)) {
                    return { type: 'id', value: value };
                }
                return { type: 'index', value: index - 1 };
            }
            
            function setHash(index) {
                const newHash = config.hashPrefix + (index + 1);
                window.history.replaceState(null, '', '#' + newHash);
            }
            
            function goToSlide(index) {
                currentSlide = index;
                container.dispatchEvent(new CustomEvent('ss3:goto', { detail: { index: index } }));
                
                if (config.scrollToSlider) {
                    const rect = container.getBoundingClientRect();
                    const scrollTop = window.pageYOffset + rect.top - config.scrollOffset;
                    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
            }
            
            function checkHash() {
                const parsed = parseHash();
                if (!parsed) return;
                
                if (parsed.type === 'index') {
                    goToSlide(parsed.value);
                } else {
                    const slides = container.querySelectorAll('.ss3-slide');
                    const index = Array.from(slides).findIndex(function(s) {
                        return s.dataset.slideId === parsed.value || s.id === parsed.value;
                    });
                    if (index >= 0) goToSlide(index);
                }
            }
            
            // Initial check
            checkHash();
            
            // Hash change listener
            window.addEventListener('hashchange', checkHash);
            
            // Update hash on slide change
            if (config.updateOnChange) {
                container.addEventListener('ss3:slideChange', function(e) {
                    if (e.detail.index !== currentSlide) {
                        currentSlide = e.detail.index;
                        setHash(e.detail.index);
                    }
                });
            }
        })();
    `;
}

/**
 * Generate share links for slides
 */
export function generateShareLinks(sliderId, slideCount, config = {}) {
    const { hashPrefix = 'slide-' } = config;
    const baseUrl = window.location.href.split('#')[0];

    const links = [];
    for (let i = 0; i < slideCount; i++) {
        links.push({
            index: i,
            url: `${baseUrl}#${hashPrefix}${i + 1}`,
            label: `Slide ${i + 1}`
        });
    }

    return links;
}

/**
 * Copy slide link to clipboard
 */
export async function copySlideLink(slideIndex, config = {}) {
    const { hashPrefix = 'slide-' } = config;
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#${hashPrefix}${slideIndex + 1}`;

    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch {
        // Fallback
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        return true;
    }
}

export default {
    parseHash,
    setHash,
    clearHash,
    DeepLinking,
    initDeepLinking,
    generateDeepLinkingScript,
    generateShareLinks,
    copySlideLink
};
