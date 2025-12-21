/**
 * Accessibility.js - ARIA labels, keyboard navigation, RTL support
 * Ensures sliders are accessible to all users
 */

// ==================== ARIA LABELS ====================

/**
 * Generate ARIA attributes for slider container
 */
export function getSliderAriaAttrs(slider, currentSlide, totalSlides) {
    return {
        role: 'region',
        'aria-roledescription': 'carousel',
        'aria-label': slider.title || 'Slider',
        'aria-live': slider.autoplay ? 'off' : 'polite'
    };
}

/**
 * Generate ARIA attributes for slide
 */
export function getSlideAriaAttrs(slideIndex, totalSlides, isActive) {
    return {
        role: 'group',
        'aria-roledescription': 'slide',
        'aria-label': `Slide ${slideIndex + 1} of ${totalSlides}`,
        'aria-hidden': !isActive ? 'true' : 'false'
    };
}

/**
 * Generate ARIA attributes for navigation
 */
export function getNavAriaAttrs(type) {
    const labels = {
        prev: { 'aria-label': 'Previous slide', 'aria-controls': 'slider-slides' },
        next: { 'aria-label': 'Next slide', 'aria-controls': 'slider-slides' },
        play: { 'aria-label': 'Play slideshow' },
        pause: { 'aria-label': 'Pause slideshow' },
        bullet: (i) => ({
            role: 'tab',
            'aria-label': `Go to slide ${i + 1}`,
            'aria-selected': 'false'
        })
    };
    return labels[type] || {};
}

/**
 * Apply ARIA attributes to element
 */
export function applyAriaAttrs(element, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
        if (key.startsWith('aria-') || key === 'role' || key === 'tabindex') {
            element.setAttribute(key, value);
        }
    });
}

// ==================== KEYBOARD NAVIGATION ====================

/**
 * Initialize keyboard navigation for slider
 */
export function initKeyboardNav(container, callbacks) {
    const { onNext, onPrev, onPause, onPlay, onGoTo } = callbacks;

    container.setAttribute('tabindex', '0');

    container.addEventListener('keydown', (e) => {
        // Don't interfere with inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                onNext?.();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                onPrev?.();
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                container.dataset.paused === 'true' ? onPlay?.() : onPause?.();
                break;
            case 'Home':
                e.preventDefault();
                onGoTo?.(0);
                break;
            case 'End':
                e.preventDefault();
                onGoTo?.(-1); // Last slide
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                onGoTo?.(parseInt(e.key) - 1);
                break;
        }
    });

    // Tab trap for bullets
    const bullets = container.querySelectorAll('.ss3-bullet, .ss3-thumb');
    bullets.forEach((bullet, index) => {
        bullet.setAttribute('tabindex', index === 0 ? '0' : '-1');

        bullet.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = bullets[index + 1] || bullets[0];
                next.focus();
                next.click();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = bullets[index - 1] || bullets[bullets.length - 1];
                prev.focus();
                prev.click();
            }
        });
    });
}

/**
 * Generate keyboard navigation script
 */
export function generateKeyboardNavScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            container.setAttribute('tabindex', '0');
            
            container.addEventListener('keydown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        container.dispatchEvent(new CustomEvent('ss3:next'));
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        container.dispatchEvent(new CustomEvent('ss3:prev'));
                        break;
                    case ' ':
                        e.preventDefault();
                        container.dispatchEvent(new CustomEvent('ss3:toggle'));
                        break;
                    case 'Home':
                        e.preventDefault();
                        container.dispatchEvent(new CustomEvent('ss3:goto', { detail: { index: 0 } }));
                        break;
                    case 'End':
                        e.preventDefault();
                        container.dispatchEvent(new CustomEvent('ss3:goto', { detail: { index: -1 } }));
                        break;
                }
            });
            
            // Focus indicator
            container.addEventListener('focus', function() {
                container.style.outline = '2px solid #8470ff';
                container.style.outlineOffset = '2px';
            });
            
            container.addEventListener('blur', function() {
                container.style.outline = '';
            });
        })();
    `;
}

// ==================== RTL SUPPORT ====================

/**
 * Check if RTL is enabled
 */
export function isRTL() {
    return document.documentElement.dir === 'rtl' ||
        document.body.dir === 'rtl' ||
        getComputedStyle(document.body).direction === 'rtl';
}

/**
 * Generate RTL-aware styles
 */
export function generateRTLCSS() {
    return `
        [dir="rtl"] .lexslider,
        .lexslider[dir="rtl"] {
            direction: rtl;
        }
        
        [dir="rtl"] .ss3-arrow-prev {
            right: 10px;
            left: auto;
        }
        
        [dir="rtl"] .ss3-arrow-next {
            left: 10px;
            right: auto;
        }
        
        [dir="rtl"] .ss3-arrow-prev .material-icons-round {
            transform: rotate(180deg);
        }
        
        [dir="rtl"] .ss3-arrow-next .material-icons-round {
            transform: rotate(180deg);
        }
        
        [dir="rtl"] .ss3-slides {
            flex-direction: row-reverse;
        }
        
        [dir="rtl"] .ss3-thumbnails {
            flex-direction: row-reverse;
        }
        
        [dir="rtl"] .ss3-bullets {
            flex-direction: row-reverse;
        }
        
        [dir="rtl"] .ss3-progress-bar.ss3-progress-left {
            right: 0;
            left: auto;
        }
        
        [dir="rtl"] .ss3-progress-bar.ss3-progress-right {
            left: 0;
            right: auto;
        }
    `;
}

/**
 * Apply RTL transform to movement
 */
export function rtlTransform(value) {
    return isRTL() ? -value : value;
}

// ==================== SCREEN READER ANNOUNCEMENTS ====================

let announcer = null;

/**
 * Initialize screen reader announcer
 */
export function initAnnouncer() {
    if (announcer) return;

    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `;
    document.body.appendChild(announcer);
}

/**
 * Announce message to screen readers
 */
export function announce(message) {
    if (!announcer) initAnnouncer();
    announcer.textContent = '';

    // Use timeout to ensure change is detected
    setTimeout(() => {
        announcer.textContent = message;
    }, 50);
}

/**
 * Generate screen reader only CSS
 */
export function generateSROnlyCSS() {
    return `
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        .sr-only-focusable:focus,
        .sr-only-focusable:active {
            position: static;
            width: auto;
            height: auto;
            overflow: visible;
            clip: auto;
            white-space: normal;
        }
    `;
}

// ==================== REDUCED MOTION ====================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generate reduced motion CSS
 */
export function generateReducedMotionCSS() {
    return `
        @media (prefers-reduced-motion: reduce) {
            .lexslider *,
            .lexslider *::before,
            .lexslider *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            
            .ss3-slide {
                transition: none !important;
            }
        }
    `;
}

export default {
    getSliderAriaAttrs,
    getSlideAriaAttrs,
    getNavAriaAttrs,
    applyAriaAttrs,
    initKeyboardNav,
    generateKeyboardNavScript,
    isRTL,
    generateRTLCSS,
    rtlTransform,
    initAnnouncer,
    announce,
    generateSROnlyCSS,
    prefersReducedMotion,
    generateReducedMotionCSS
};
