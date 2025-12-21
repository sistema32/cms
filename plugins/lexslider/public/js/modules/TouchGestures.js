/**
 * TouchGestures.js - Touch and swipe support for mobile
 * Handles swipe, pinch-zoom, and touch navigation
 */

// Default configuration
const DEFAULT_CONFIG = {
    threshold: 50,          // Minimum swipe distance in pixels
    restraint: 100,         // Maximum perpendicular distance
    allowedTime: 300,       // Maximum swipe time in ms
    swipeLeft: null,        // Callback for left swipe
    swipeRight: null,       // Callback for right swipe
    swipeUp: null,          // Callback for up swipe
    swipeDown: null,        // Callback for down swipe
    tap: null,              // Callback for tap
    doubleTap: null,        // Callback for double tap
    pinch: null,            // Callback for pinch
    preventScroll: true,    // Prevent page scroll during swipe
    mouseEvents: true       // Also support mouse drag
};

/**
 * TouchGestures class
 */
export class TouchGestures {
    constructor(element, config = {}) {
        this.element = element;
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.lastTap = 0;
        this.initialDistance = 0;

        this.init();
    }

    init() {
        // Touch events
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Mouse events (for desktop testing)
        if (this.config.mouseEvents) {
            this.isDragging = false;
            this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startTime = Date.now();

        // Handle pinch
        if (e.touches.length === 2) {
            this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
        }
    }

    handleTouchMove(e) {
        if (this.config.preventScroll && e.touches.length === 1) {
            const dx = Math.abs(e.touches[0].clientX - this.startX);
            const dy = Math.abs(e.touches[0].clientY - this.startY);

            // Prevent vertical scroll if horizontal swipe detected
            if (dx > dy) {
                e.preventDefault();
            }
        }

        // Handle pinch zoom
        if (e.touches.length === 2 && this.initialDistance > 0) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / this.initialDistance;

            if (this.config.pinch) {
                this.config.pinch(scale);
            }
        }
    }

    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        const distX = touch.clientX - this.startX;
        const distY = touch.clientY - this.startY;
        const elapsedTime = Date.now() - this.startTime;

        // Check for tap
        if (Math.abs(distX) < 10 && Math.abs(distY) < 10) {
            const now = Date.now();

            if (now - this.lastTap < 300 && this.config.doubleTap) {
                this.config.doubleTap(e);
                this.lastTap = 0;
            } else {
                this.lastTap = now;
                if (this.config.tap) {
                    setTimeout(() => {
                        if (this.lastTap !== 0) {
                            this.config.tap(e);
                        }
                    }, 300);
                }
            }
            return;
        }

        // Check for swipe
        if (elapsedTime <= this.config.allowedTime) {
            if (Math.abs(distX) >= this.config.threshold && Math.abs(distY) <= this.config.restraint) {
                // Horizontal swipe
                if (distX > 0 && this.config.swipeRight) {
                    this.config.swipeRight(e);
                } else if (distX < 0 && this.config.swipeLeft) {
                    this.config.swipeLeft(e);
                }
            } else if (Math.abs(distY) >= this.config.threshold && Math.abs(distX) <= this.config.restraint) {
                // Vertical swipe
                if (distY > 0 && this.config.swipeDown) {
                    this.config.swipeDown(e);
                } else if (distY < 0 && this.config.swipeUp) {
                    this.config.swipeUp(e);
                }
            }
        }

        this.initialDistance = 0;
    }

    // Mouse support for desktop
    handleMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startTime = Date.now();
        this.element.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        // Visual feedback
        this.element.style.transform = `translateX(${dx * 0.1}px)`;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.cursor = '';
        this.element.style.transform = '';

        const distX = e.clientX - this.startX;
        const distY = e.clientY - this.startY;
        const elapsedTime = Date.now() - this.startTime;

        if (elapsedTime <= this.config.allowedTime) {
            if (Math.abs(distX) >= this.config.threshold && Math.abs(distY) <= this.config.restraint) {
                if (distX > 0 && this.config.swipeRight) {
                    this.config.swipeRight(e);
                } else if (distX < 0 && this.config.swipeLeft) {
                    this.config.swipeLeft(e);
                }
            }
        }
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);

        if (this.config.mouseEvents) {
            this.element.removeEventListener('mousedown', this.handleMouseDown);
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    }
}

/**
 * Initialize touch gestures for a slider
 */
export function initTouchGestures(container, callbacks) {
    return new TouchGestures(container, {
        swipeLeft: () => callbacks.onNext?.(),
        swipeRight: () => callbacks.onPrev?.(),
        swipeUp: callbacks.onSwipeUp,
        swipeDown: callbacks.onSwipeDown,
        tap: callbacks.onTap,
        doubleTap: callbacks.onDoubleTap,
        pinch: callbacks.onPinch
    });
}

/**
 * Generate touch gestures script for frontend
 */
export function generateTouchScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            let startX = 0, startY = 0, startTime = 0;
            const threshold = 50;
            const restraint = 100;
            const allowedTime = 300;
            
            container.addEventListener('touchstart', function(e) {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startTime = Date.now();
            }, { passive: true });
            
            container.addEventListener('touchend', function(e) {
                const touch = e.changedTouches[0];
                const distX = touch.clientX - startX;
                const distY = touch.clientY - startY;
                const elapsed = Date.now() - startTime;
                
                if (elapsed <= allowedTime) {
                    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                        if (distX > 0) {
                            container.dispatchEvent(new CustomEvent('ss3:prev'));
                        } else {
                            container.dispatchEvent(new CustomEvent('ss3:next'));
                        }
                    }
                }
            }, { passive: true });
            
            // Visual feedback during drag
            let isDragging = false;
            let dragStartX = 0;
            
            container.addEventListener('touchstart', function(e) {
                isDragging = true;
                dragStartX = e.touches[0].clientX;
            }, { passive: true });
            
            container.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                const dx = e.touches[0].clientX - dragStartX;
                const slides = container.querySelector('.ss3-slides');
                if (slides) {
                    slides.style.transition = 'none';
                    slides.style.transform = 'translateX(' + (dx * 0.3) + 'px)';
                }
            }, { passive: true });
            
            container.addEventListener('touchend', function(e) {
                isDragging = false;
                const slides = container.querySelector('.ss3-slides');
                if (slides) {
                    slides.style.transition = '';
                    slides.style.transform = '';
                }
            }, { passive: true });
        })();
    `;
}

/**
 * Generate touch CSS
 */
export function generateTouchCSS() {
    return `
        .lexslider {
            touch-action: pan-y pinch-zoom;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .lexslider.dragging {
            cursor: grabbing;
        }
        
        .lexslider .ss3-slides {
            will-change: transform;
        }
        
        /* Touch indicator (optional) */
        .ss3-touch-indicator {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            background: rgba(0,0,0,0.5);
            border-radius: 20px;
            color: white;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
        
        .lexslider:not(:hover) .ss3-touch-indicator {
            opacity: 0.7;
        }
        
        @media (hover: none) {
            .lexslider {
                touch-action: pan-y;
            }
        }
    `;
}

export default {
    TouchGestures,
    initTouchGestures,
    generateTouchScript,
    generateTouchCSS
};
