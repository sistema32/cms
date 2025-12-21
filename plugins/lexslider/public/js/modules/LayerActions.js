/**
 * LayerActions.js - Interactive layer actions (onClick events)
 * Handles: links, scroll-to, popup, next/prev slide, custom JS
 */

// Action types
export const ACTION_TYPES = {
    none: { label: 'None', icon: 'block' },
    link: { label: 'Open Link', icon: 'link' },
    scrollTo: { label: 'Scroll To', icon: 'arrow_downward' },
    nextSlide: { label: 'Next Slide', icon: 'arrow_forward' },
    prevSlide: { label: 'Previous Slide', icon: 'arrow_back' },
    goToSlide: { label: 'Go To Slide', icon: 'skip_next' },
    openPopup: { label: 'Open Popup', icon: 'open_in_new' },
    closePopup: { label: 'Close Popup', icon: 'close' },
    playVideo: { label: 'Play Video', icon: 'play_arrow' },
    pauseSlider: { label: 'Pause Slider', icon: 'pause' },
    customJS: { label: 'Custom JavaScript', icon: 'code' }
};

/**
 * Get action options for UI dropdown
 */
export function getActionOptions() {
    return Object.entries(ACTION_TYPES).map(([value, config]) => ({
        value,
        label: config.label,
        icon: config.icon
    }));
}

/**
 * Validate action configuration
 */
export function validateAction(action) {
    if (!action || action.type === 'none') return true;

    switch (action.type) {
        case 'link':
            return !!action.url;
        case 'scrollTo':
            return !!action.target; // CSS selector or ID
        case 'goToSlide':
            return typeof action.slideIndex === 'number';
        case 'customJS':
            return !!action.code;
        default:
            return true;
    }
}

/**
 * Generate HTML attributes for action
 */
export function getActionAttributes(layer) {
    const action = layer.action;
    if (!action || action.type === 'none') {
        return { style: 'cursor: default;', attrs: '' };
    }

    const attrs = [];
    attrs.push('data-action-type="' + action.type + '"');
    attrs.push('style="cursor: pointer;"');
    attrs.push('role="button"');
    attrs.push('tabindex="0"');

    if (action.type === 'link') {
        attrs.push('data-href="' + (action.url || '#') + '"');
        if (action.newTab) attrs.push('data-target="_blank"');
    } else if (action.type === 'scrollTo') {
        attrs.push('data-scroll-target="' + (action.target || '') + '"');
        attrs.push('data-scroll-offset="' + (action.offset || 0) + '"');
    } else if (action.type === 'goToSlide') {
        attrs.push('data-slide-index="' + (action.slideIndex || 0) + '"');
    }

    return {
        style: 'cursor: pointer;',
        attrs: attrs.join(' ')
    };
}

/**
 * Generate frontend action handler script
 */
export function generateActionScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            container.addEventListener('click', function(e) {
                const layer = e.target.closest('[data-action-type]');
                if (!layer) return;
                
                const actionType = layer.dataset.actionType;
                if (!actionType || actionType === 'none') return;
                
                e.preventDefault();
                
                switch(actionType) {
                    case 'link':
                        const href = layer.dataset.href;
                        const target = layer.dataset.target;
                        if (href) {
                            if (target === '_blank') {
                                window.open(href, '_blank');
                            } else {
                                window.location.href = href;
                            }
                        }
                        break;
                        
                    case 'scrollTo':
                        const scrollTarget = layer.dataset.scrollTarget;
                        const offset = parseInt(layer.dataset.scrollOffset) || 0;
                        const targetEl = document.querySelector(scrollTarget);
                        if (targetEl) {
                            const y = targetEl.getBoundingClientRect().top + window.pageYOffset + offset;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                        break;
                        
                    case 'nextSlide':
                        container.dispatchEvent(new CustomEvent('ss3:next'));
                        break;
                        
                    case 'prevSlide':
                        container.dispatchEvent(new CustomEvent('ss3:prev'));
                        break;
                        
                    case 'goToSlide':
                        const slideIndex = parseInt(layer.dataset.slideIndex) || 0;
                        container.dispatchEvent(new CustomEvent('ss3:goto', { detail: { index: slideIndex } }));
                        break;
                        
                    case 'pauseSlider':
                        container.dispatchEvent(new CustomEvent('ss3:pause'));
                        break;
                        
                    case 'playVideo':
                        const video = container.querySelector('video, iframe');
                        if (video && video.play) video.play();
                        break;
                }
            });
            
            // Keyboard accessibility
            container.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    const layer = e.target.closest('[data-action-type]');
                    if (layer && layer.dataset.actionType !== 'none') {
                        e.preventDefault();
                        layer.click();
                    }
                }
            });
        })();
    `;
}

/**
 * Default action object
 */
export function createDefaultAction() {
    return {
        type: 'none',
        url: '',
        newTab: false,
        target: '',
        offset: 0,
        slideIndex: 0,
        code: ''
    };
}

export default {
    ACTION_TYPES,
    getActionOptions,
    validateAction,
    getActionAttributes,
    generateActionScript,
    createDefaultAction
};
