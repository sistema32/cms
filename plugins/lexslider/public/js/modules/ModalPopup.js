/**
 * ModalPopup.js - Slider as modal popup
 * Display sliders in overlay modal triggered by buttons, links, or timers
 */

// Trigger types
export const MODAL_TRIGGERS = {
    click: { label: 'On Click', icon: 'touch_app' },
    timer: { label: 'After Delay', icon: 'timer' },
    scroll: { label: 'On Scroll', icon: 'swap_vert' },
    exit: { label: 'Exit Intent', icon: 'exit_to_app' },
    pageLoad: { label: 'Page Load', icon: 'refresh' }
};

// Default configuration
const DEFAULT_CONFIG = {
    trigger: 'click',
    triggerSelector: null,      // CSS selector for click trigger
    delay: 3000,                // Delay for timer trigger (ms)
    scrollPosition: 50,         // Scroll percentage for scroll trigger
    closeOnBackdrop: true,      // Close when clicking backdrop
    closeOnEscape: true,        // Close on ESC key
    showCloseButton: true,      // Show X button
    animation: 'fadeScale',     // Opening animation
    animationDuration: 400,     // Animation duration
    backdropColor: 'rgba(0,0,0,0.85)',
    maxWidth: '900px',
    maxHeight: '80vh',
    preventScroll: true,        // Prevent body scroll when open
    oncePerSession: false,      // Show only once per session
    cookieDays: 7               // Days to remember closed state
};

// Animation presets
const MODAL_ANIMATIONS = {
    fade: {
        initial: 'opacity: 0;',
        final: 'opacity: 1;'
    },
    fadeScale: {
        initial: 'opacity: 0; transform: scale(0.8);',
        final: 'opacity: 1; transform: scale(1);'
    },
    slideUp: {
        initial: 'opacity: 0; transform: translateY(50px);',
        final: 'opacity: 1; transform: translateY(0);'
    },
    slideDown: {
        initial: 'opacity: 0; transform: translateY(-50px);',
        final: 'opacity: 1; transform: translateY(0);'
    },
    zoomIn: {
        initial: 'opacity: 0; transform: scale(0);',
        final: 'opacity: 1; transform: scale(1);'
    },
    flip: {
        initial: 'opacity: 0; transform: perspective(1000px) rotateX(90deg);',
        final: 'opacity: 1; transform: perspective(1000px) rotateX(0);'
    }
};

/**
 * ModalPopup class
 */
export class ModalPopup {
    constructor(sliderId, config = {}) {
        this.sliderId = sliderId;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isOpen = false;
        this.modal = null;
        this.slider = null;

        this.init();
    }

    init() {
        this.createModal();
        this.setupTrigger();
        this.setupCloseHandlers();
    }

    createModal() {
        const animation = MODAL_ANIMATIONS[this.config.animation] || MODAL_ANIMATIONS.fadeScale;

        this.modal = document.createElement('div');
        this.modal.className = 'ss3-modal-popup';
        this.modal.innerHTML = `
            <div class="ss3-modal-backdrop" style="background: ${this.config.backdropColor};"></div>
            <div class="ss3-modal-container" style="max-width: ${this.config.maxWidth}; max-height: ${this.config.maxHeight}; ${animation.initial}">
                ${this.config.showCloseButton ? `
                    <button class="ss3-modal-close" aria-label="Close">
                        <span class="material-icons-round">close</span>
                    </button>
                ` : ''}
                <div class="ss3-modal-content" data-slider-id="${this.sliderId}"></div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    setupTrigger() {
        switch (this.config.trigger) {
            case 'click':
                if (this.config.triggerSelector) {
                    document.querySelectorAll(this.config.triggerSelector).forEach(el => {
                        el.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.open();
                        });
                    });
                }
                break;

            case 'timer':
                if (!this.shouldShowOnce()) {
                    setTimeout(() => this.open(), this.config.delay);
                }
                break;

            case 'scroll':
                if (!this.shouldShowOnce()) {
                    const handler = () => {
                        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                        if (scrollPercent >= this.config.scrollPosition) {
                            this.open();
                            window.removeEventListener('scroll', handler);
                        }
                    };
                    window.addEventListener('scroll', handler);
                }
                break;

            case 'exit':
                if (!this.shouldShowOnce()) {
                    document.addEventListener('mouseout', (e) => {
                        if (e.clientY < 10 && !this.isOpen) {
                            this.open();
                        }
                    });
                }
                break;

            case 'pageLoad':
                if (!this.shouldShowOnce()) {
                    this.open();
                }
                break;
        }
    }

    setupCloseHandlers() {
        // Backdrop click
        if (this.config.closeOnBackdrop) {
            this.modal.querySelector('.ss3-modal-backdrop').addEventListener('click', () => this.close());
        }

        // Close button
        const closeBtn = this.modal.querySelector('.ss3-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Escape key
        if (this.config.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
    }

    shouldShowOnce() {
        if (!this.config.oncePerSession) return false;

        const key = `ss3_modal_${this.sliderId}`;
        return localStorage.getItem(key) === 'closed';
    }

    markAsClosed() {
        if (this.config.oncePerSession) {
            const key = `ss3_modal_${this.sliderId}`;
            localStorage.setItem(key, 'closed');
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        const animation = MODAL_ANIMATIONS[this.config.animation] || MODAL_ANIMATIONS.fadeScale;
        const container = this.modal.querySelector('.ss3-modal-container');

        this.modal.classList.add('active');

        if (this.config.preventScroll) {
            document.body.style.overflow = 'hidden';
        }

        // Animate in
        requestAnimationFrame(() => {
            container.style.cssText = `max-width: ${this.config.maxWidth}; max-height: ${this.config.maxHeight}; ${animation.final} transition: all ${this.config.animationDuration}ms ease;`;
        });

        // Initialize slider in modal
        this.modal.dispatchEvent(new CustomEvent('ss3:modalOpen', { detail: { sliderId: this.sliderId } }));
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        const animation = MODAL_ANIMATIONS[this.config.animation] || MODAL_ANIMATIONS.fadeScale;
        const container = this.modal.querySelector('.ss3-modal-container');

        container.style.cssText = `max-width: ${this.config.maxWidth}; max-height: ${this.config.maxHeight}; ${animation.initial} transition: all ${this.config.animationDuration}ms ease;`;

        setTimeout(() => {
            this.modal.classList.remove('active');

            if (this.config.preventScroll) {
                document.body.style.overflow = '';
            }
        }, this.config.animationDuration);

        this.markAsClosed();
        this.modal.dispatchEvent(new CustomEvent('ss3:modalClose', { detail: { sliderId: this.sliderId } }));
    }

    destroy() {
        this.modal.remove();
    }
}

/**
 * Generate modal popup CSS
 */
export function generateModalCSS() {
    return `
        .ss3-modal-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .ss3-modal-popup.active {
            display: flex;
        }
        
        .ss3-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .ss3-modal-container {
            position: relative;
            width: 90%;
            background: #000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0,0,0,0.5);
        }
        
        .ss3-modal-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            background: rgba(0,0,0,0.5);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.2s;
        }
        
        .ss3-modal-close:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.1);
        }
        
        .ss3-modal-content {
            width: 100%;
            height: 100%;
        }
        
        .ss3-modal-content .lexslider {
            width: 100% !important;
            height: 100% !important;
        }
    `;
}

/**
 * Generate modal popup script
 */
export function generateModalScript(sliderId, config = {}) {
    return `
        (function() {
            const config = ${JSON.stringify({ ...DEFAULT_CONFIG, ...config })};
            const animations = ${JSON.stringify(MODAL_ANIMATIONS)};
            let isOpen = false;
            let modal = null;
            
            function createModal() {
                const anim = animations[config.animation] || animations.fadeScale;
                
                modal = document.createElement('div');
                modal.className = 'ss3-modal-popup';
                modal.innerHTML = \`
                    <div class="ss3-modal-backdrop" style="background: \${config.backdropColor};"></div>
                    <div class="ss3-modal-container" style="max-width: \${config.maxWidth}; max-height: \${config.maxHeight}; \${anim.initial}">
                        \${config.showCloseButton ? '<button class="ss3-modal-close"><span class="material-icons-round">close</span></button>' : ''}
                        <div class="ss3-modal-content" data-lexslider="${sliderId}"></div>
                    </div>
                \`;
                document.body.appendChild(modal);
                
                if (config.closeOnBackdrop) {
                    modal.querySelector('.ss3-modal-backdrop').onclick = close;
                }
                
                const closeBtn = modal.querySelector('.ss3-modal-close');
                if (closeBtn) closeBtn.onclick = close;
            }
            
            function open() {
                if (isOpen) return;
                isOpen = true;
                
                const anim = animations[config.animation] || animations.fadeScale;
                const container = modal.querySelector('.ss3-modal-container');
                
                modal.classList.add('active');
                if (config.preventScroll) document.body.style.overflow = 'hidden';
                
                requestAnimationFrame(function() {
                    container.style.cssText = 'max-width: ' + config.maxWidth + '; max-height: ' + config.maxHeight + '; ' + anim.final + ' transition: all ' + config.animationDuration + 'ms ease;';
                });
            }
            
            function close() {
                if (!isOpen) return;
                isOpen = false;
                
                const anim = animations[config.animation] || animations.fadeScale;
                const container = modal.querySelector('.ss3-modal-container');
                
                container.style.cssText = 'max-width: ' + config.maxWidth + '; max-height: ' + config.maxHeight + '; ' + anim.initial + ' transition: all ' + config.animationDuration + 'ms ease;';
                
                setTimeout(function() {
                    modal.classList.remove('active');
                    if (config.preventScroll) document.body.style.overflow = '';
                }, config.animationDuration);
            }
            
            createModal();
            
            if (config.closeOnEscape) {
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && isOpen) close();
                });
            }
            
            // Trigger
            if (config.trigger === 'click' && config.triggerSelector) {
                document.querySelectorAll(config.triggerSelector).forEach(function(el) {
                    el.addEventListener('click', function(e) { e.preventDefault(); open(); });
                });
            } else if (config.trigger === 'timer') {
                setTimeout(open, config.delay);
            } else if (config.trigger === 'pageLoad') {
                open();
            }
        })();
    `;
}

export default {
    MODAL_TRIGGERS,
    MODAL_ANIMATIONS,
    ModalPopup,
    generateModalCSS,
    generateModalScript
};
