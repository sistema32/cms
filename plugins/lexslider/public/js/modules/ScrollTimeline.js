/**
 * ScrollTimeline.js - Scroll-based animation timeline
 * Synchronize animations with scroll position
 */

// Scroll direction modes
export const SCROLL_MODES = {
    vertical: { label: 'Vertical Scroll', axis: 'y' },
    horizontal: { label: 'Horizontal Scroll', axis: 'x' },
    both: { label: 'Both Axes', axis: 'both' }
};

// Default configuration
const DEFAULT_CONFIG = {
    mode: 'vertical',
    startOffset: 0,          // Start position (px or %)
    endOffset: 100,          // End position (%)
    scrub: true,             // Smooth scrubbing
    scrubSmoothing: 0.1,     // Smoothing factor (0-1)
    pin: false,              // Pin element during scroll
    pinSpacing: true,        // Add spacing when pinned
    anticipatePin: 0,        // Anticipate pin by N pixels
    markers: false,          // Show debug markers
    trigger: null,           // Trigger element selector
    triggerHook: 0.5         // Trigger position (0 = top, 1 = bottom)
};

/**
 * ScrollTimeline class
 */
export class ScrollTimeline {
    constructor(element, animations, config = {}) {
        this.element = element;
        this.animations = animations; // Array of { target, properties, start, end }
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.progress = 0;
        this.currentProgress = 0;
        this.isPinned = false;
        this.rafId = null;

        this.init();
    }

    init() {
        this.calculateBounds();

        if (this.config.markers) {
            this.createMarkers();
        }

        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        window.addEventListener('resize', this.calculateBounds.bind(this));

        // Initial update
        this.handleScroll();

        // Start animation loop for smooth scrubbing
        if (this.config.scrub) {
            this.startScrubLoop();
        }
    }

    calculateBounds() {
        const rect = this.element.getBoundingClientRect();
        const scrollTop = window.pageYOffset;

        this.elementTop = rect.top + scrollTop;
        this.elementHeight = rect.height;

        // Calculate start and end positions
        const viewportHeight = window.innerHeight;

        if (typeof this.config.startOffset === 'string' && this.config.startOffset.endsWith('%')) {
            this.startY = this.elementTop - viewportHeight * (1 - parseFloat(this.config.startOffset) / 100);
        } else {
            this.startY = this.elementTop - viewportHeight + this.config.startOffset;
        }

        if (typeof this.config.endOffset === 'string' && this.config.endOffset.endsWith('%')) {
            this.endY = this.elementTop + this.elementHeight * (parseFloat(this.config.endOffset) / 100);
        } else {
            this.endY = this.elementTop + this.elementHeight - viewportHeight * (1 - this.config.endOffset / 100);
        }

        this.scrollDistance = this.endY - this.startY;
    }

    handleScroll() {
        const scrollY = window.pageYOffset;

        // Calculate progress
        if (scrollY <= this.startY) {
            this.progress = 0;
        } else if (scrollY >= this.endY) {
            this.progress = 1;
        } else {
            this.progress = (scrollY - this.startY) / this.scrollDistance;
        }

        // Handle pinning
        if (this.config.pin) {
            if (scrollY >= this.startY && scrollY <= this.endY) {
                if (!this.isPinned) {
                    this.pin();
                }
            } else {
                if (this.isPinned) {
                    this.unpin();
                }
            }
        }

        // Apply animations if not scrubbing
        if (!this.config.scrub) {
            this.applyAnimations(this.progress);
        }
    }

    startScrubLoop() {
        const loop = () => {
            const diff = this.progress - this.currentProgress;

            if (Math.abs(diff) > 0.001) {
                this.currentProgress += diff * this.config.scrubSmoothing;
                this.applyAnimations(this.currentProgress);
            }

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    applyAnimations(progress) {
        this.animations.forEach(anim => {
            const { target, properties, start = 0, end = 1 } = anim;

            // Calculate local progress for this animation
            let localProgress;
            if (progress <= start) {
                localProgress = 0;
            } else if (progress >= end) {
                localProgress = 1;
            } else {
                localProgress = (progress - start) / (end - start);
            }

            // Apply easing if specified
            if (anim.ease) {
                localProgress = this.applyEasing(localProgress, anim.ease);
            }

            // Apply properties
            const element = typeof target === 'string'
                ? this.element.querySelector(target)
                : target;

            if (!element) return;

            Object.entries(properties).forEach(([prop, values]) => {
                const fromValue = values.from ?? values[0];
                const toValue = values.to ?? values[1];

                const currentValue = this.interpolate(fromValue, toValue, localProgress);

                if (prop === 'opacity' || prop === 'scale') {
                    element.style[prop === 'scale' ? 'transform' : prop] =
                        prop === 'scale' ? `scale(${currentValue})` : currentValue;
                } else if (['x', 'y', 'rotate', 'rotateX', 'rotateY'].includes(prop)) {
                    this.applyTransform(element, prop, currentValue);
                } else {
                    element.style[prop] = typeof currentValue === 'number'
                        ? `${currentValue}px`
                        : currentValue;
                }
            });
        });

        // Dispatch progress event
        this.element.dispatchEvent(new CustomEvent('ss3:scrollProgress', {
            detail: { progress }
        }));
    }

    interpolate(from, to, progress) {
        if (typeof from === 'number' && typeof to === 'number') {
            return from + (to - from) * progress;
        }

        // Parse values with units
        const fromMatch = String(from).match(/([-\d.]+)(\D*)/);
        const toMatch = String(to).match(/([-\d.]+)(\D*)/);

        if (fromMatch && toMatch) {
            const fromNum = parseFloat(fromMatch[1]);
            const toNum = parseFloat(toMatch[1]);
            const unit = fromMatch[2] || toMatch[2] || '';

            return `${fromNum + (toNum - fromNum) * progress}${unit}`;
        }

        return progress >= 0.5 ? to : from;
    }

    applyTransform(element, prop, value) {
        const current = element.style.transform || '';
        const regex = new RegExp(`${prop}\\([^)]+\\)`, 'g');

        let newTransform;
        if (['x', 'y'].includes(prop)) {
            newTransform = `translate${prop.toUpperCase()}(${value}px)`;
        } else if (prop === 'rotate') {
            newTransform = `rotate(${value}deg)`;
        } else if (['rotateX', 'rotateY'].includes(prop)) {
            newTransform = `${prop}(${value}deg)`;
        }

        if (current.match(regex)) {
            element.style.transform = current.replace(regex, newTransform);
        } else {
            element.style.transform = `${current} ${newTransform}`.trim();
        }
    }

    applyEasing(t, ease) {
        const easings = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1
        };

        return (easings[ease] || easings.easeInOut)(t);
    }

    pin() {
        this.isPinned = true;
        const rect = this.element.getBoundingClientRect();

        this.element.style.position = 'fixed';
        this.element.style.top = `${rect.top}px`;
        this.element.style.left = `${rect.left}px`;
        this.element.style.width = `${rect.width}px`;
        this.element.style.zIndex = '1000';

        if (this.config.pinSpacing) {
            this.spacer = document.createElement('div');
            this.spacer.style.height = `${this.scrollDistance}px`;
            this.element.parentNode.insertBefore(this.spacer, this.element.nextSibling);
        }
    }

    unpin() {
        this.isPinned = false;

        this.element.style.position = '';
        this.element.style.top = '';
        this.element.style.left = '';
        this.element.style.width = '';
        this.element.style.zIndex = '';

        if (this.spacer) {
            this.spacer.remove();
            this.spacer = null;
        }
    }

    createMarkers() {
        const startMarker = document.createElement('div');
        startMarker.style.cssText = `position: absolute; left: 0; top: ${this.startY}px; width: 100%; height: 2px; background: green; z-index: 9999; pointer-events: none;`;
        startMarker.innerHTML = '<span style="background: green; color: white; padding: 2px 5px; font-size: 10px;">START</span>';

        const endMarker = document.createElement('div');
        endMarker.style.cssText = `position: absolute; left: 0; top: ${this.endY}px; width: 100%; height: 2px; background: red; z-index: 9999; pointer-events: none;`;
        endMarker.innerHTML = '<span style="background: red; color: white; padding: 2px 5px; font-size: 10px;">END</span>';

        document.body.appendChild(startMarker);
        document.body.appendChild(endMarker);
    }

    destroy() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.calculateBounds);

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        this.unpin();
    }
}

/**
 * Create scroll timeline for slider
 */
export function createScrollTimeline(sliderId, animations, config = {}) {
    const container = document.querySelector(`[data-lexslider="${sliderId}"]`);
    if (!container) return null;

    return new ScrollTimeline(container, animations, config);
}

/**
 * Generate scroll timeline script
 */
export function generateScrollTimelineScript(sliderId, animations, config = {}) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const config = ${JSON.stringify({ ...DEFAULT_CONFIG, ...config })};
            const animations = ${JSON.stringify(animations)};
            
            let progress = 0;
            let currentProgress = 0;
            let startY, endY, scrollDistance;
            
            function calculateBounds() {
                const rect = container.getBoundingClientRect();
                const scrollTop = window.pageYOffset;
                const vh = window.innerHeight;
                
                startY = rect.top + scrollTop - vh;
                endY = rect.top + scrollTop + rect.height;
                scrollDistance = endY - startY;
            }
            
            function handleScroll() {
                const scrollY = window.pageYOffset;
                
                if (scrollY <= startY) progress = 0;
                else if (scrollY >= endY) progress = 1;
                else progress = (scrollY - startY) / scrollDistance;
            }
            
            function interpolate(from, to, p) {
                if (typeof from === 'number') return from + (to - from) * p;
                const fm = String(from).match(/([\\d.-]+)(.*)/);
                const tm = String(to).match(/([\\d.-]+)(.*)/);
                if (fm && tm) return (parseFloat(fm[1]) + (parseFloat(tm[1]) - parseFloat(fm[1])) * p) + (fm[2] || tm[2] || '');
                return p >= 0.5 ? to : from;
            }
            
            function applyAnimations(p) {
                animations.forEach(function(anim) {
                    const start = anim.start || 0;
                    const end = anim.end || 1;
                    let lp = p <= start ? 0 : (p >= end ? 1 : (p - start) / (end - start));
                    
                    const el = typeof anim.target === 'string' ? container.querySelector(anim.target) : container;
                    if (!el) return;
                    
                    Object.keys(anim.properties).forEach(function(prop) {
                        const vals = anim.properties[prop];
                        const from = vals.from !== undefined ? vals.from : vals[0];
                        const to = vals.to !== undefined ? vals.to : vals[1];
                        const val = interpolate(from, to, lp);
                        
                        if (prop === 'opacity') el.style.opacity = val;
                        else if (prop === 'y') el.style.transform = 'translateY(' + val + 'px)';
                        else if (prop === 'x') el.style.transform = 'translateX(' + val + 'px)';
                        else if (prop === 'scale') el.style.transform = 'scale(' + val + ')';
                        else if (prop === 'rotate') el.style.transform = 'rotate(' + val + 'deg)';
                    });
                });
            }
            
            function loop() {
                if (config.scrub) {
                    const diff = progress - currentProgress;
                    if (Math.abs(diff) > 0.001) {
                        currentProgress += diff * config.scrubSmoothing;
                        applyAnimations(currentProgress);
                    }
                }
                requestAnimationFrame(loop);
            }
            
            calculateBounds();
            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', calculateBounds);
            requestAnimationFrame(loop);
        })();
    `;
}

export default {
    SCROLL_MODES,
    ScrollTimeline,
    createScrollTimeline,
    generateScrollTimelineScript
};
