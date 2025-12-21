/**
 * MousewheelNav.js - Mousewheel/scroll navigation
 * Navigate slides using mouse scroll wheel
 */

// Configuration defaults
const DEFAULT_CONFIG = {
    sensitivity: 1,         // Scroll sensitivity multiplier
    threshold: 50,          // Minimum scroll delta to trigger
    cooldown: 1000,         // Cooldown between slide changes (ms)
    invert: false,          // Invert scroll direction
    horizontal: false,      // Use horizontal scroll
    smooth: true,           // Smooth transition
    stopPropagation: true   // Prevent page scroll while over slider
};

/**
 * MousewheelNav class
 */
export class MousewheelNav {
    constructor(element, config = {}) {
        this.element = element;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.lastScrollTime = 0;
        this.accumulatedDelta = 0;
        this.isScrolling = false;

        this.onNext = config.onNext || (() => { });
        this.onPrev = config.onPrev || (() => { });

        this.init();
    }

    init() {
        this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Reset accumulated delta on mouse leave
        this.element.addEventListener('mouseleave', () => {
            this.accumulatedDelta = 0;
        });
    }

    handleWheel(e) {
        const now = Date.now();

        // Get delta based on config
        let delta = this.config.horizontal ? e.deltaX : e.deltaY;

        // Apply sensitivity and invert
        delta *= this.config.sensitivity;
        if (this.config.invert) delta *= -1;

        // Accumulate delta for smooth behavior
        this.accumulatedDelta += delta;

        // Check if we've passed the threshold
        if (Math.abs(this.accumulatedDelta) >= this.config.threshold) {
            // Check cooldown
            if (now - this.lastScrollTime >= this.config.cooldown) {
                if (this.accumulatedDelta > 0) {
                    this.onNext();
                } else {
                    this.onPrev();
                }

                this.lastScrollTime = now;
            }

            this.accumulatedDelta = 0;
        }

        // Prevent page scroll while over slider
        if (this.config.stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    destroy() {
        this.element.removeEventListener('wheel', this.handleWheel);
    }
}

/**
 * Initialize mousewheel navigation
 */
export function initMousewheelNav(container, callbacks = {}) {
    return new MousewheelNav(container, {
        ...callbacks,
        onNext: callbacks.onNext,
        onPrev: callbacks.onPrev
    });
}

/**
 * Generate mousewheel navigation script
 */
export function generateMousewheelScript(sliderId, config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const config = ${JSON.stringify(settings)};
            let lastScrollTime = 0;
            let accumulatedDelta = 0;
            
            container.addEventListener('wheel', function(e) {
                const now = Date.now();
                
                let delta = config.horizontal ? e.deltaX : e.deltaY;
                delta *= config.sensitivity;
                if (config.invert) delta *= -1;
                
                accumulatedDelta += delta;
                
                if (Math.abs(accumulatedDelta) >= config.threshold) {
                    if (now - lastScrollTime >= config.cooldown) {
                        if (accumulatedDelta > 0) {
                            container.dispatchEvent(new CustomEvent('ss3:next'));
                        } else {
                            container.dispatchEvent(new CustomEvent('ss3:prev'));
                        }
                        lastScrollTime = now;
                    }
                    accumulatedDelta = 0;
                }
                
                if (config.stopPropagation) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
            
            container.addEventListener('mouseleave', function() {
                accumulatedDelta = 0;
            });
        })();
    `;
}

/**
 * Generate mousewheel indicator
 */
export function generateMousewheelIndicator() {
    return `
        <div class="ss3-mousewheel-indicator">
            <svg viewBox="0 0 24 40" width="24" height="40">
                <rect x="4" y="1" width="16" height="28" rx="8" 
                      fill="none" stroke="currentColor" stroke-width="2"/>
                <circle class="ss3-mousewheel-dot" cx="12" cy="10" r="3" fill="currentColor"/>
            </svg>
            <span>Scroll</span>
        </div>
    `;
}

/**
 * Generate mousewheel CSS
 */
export function generateMousewheelCSS() {
    return `
        .ss3-mousewheel-indicator {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            color: rgba(255,255,255,0.6);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            pointer-events: none;
            z-index: 20;
        }
        
        .ss3-mousewheel-dot {
            animation: mousewheelScroll 2s ease-in-out infinite;
        }
        
        @keyframes mousewheelScroll {
            0%, 100% { cy: 10; opacity: 1; }
            50% { cy: 18; opacity: 0.3; }
        }
        
        /* Hide indicator on touch devices */
        @media (hover: none) {
            .ss3-mousewheel-indicator {
                display: none;
            }
        }
    `;
}

export default {
    MousewheelNav,
    initMousewheelNav,
    generateMousewheelScript,
    generateMousewheelIndicator,
    generateMousewheelCSS
};
