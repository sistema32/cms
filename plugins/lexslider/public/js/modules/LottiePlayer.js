/**
 * LottiePlayer.js - Lottie animation support
 * Play JSON-based Lottie/Bodymovin animations
 */

// Default configuration
const DEFAULT_CONFIG = {
    src: '',                    // Lottie JSON URL or data
    autoplay: true,
    loop: true,
    speed: 1,
    direction: 1,               // 1 = forward, -1 = reverse
    mode: 'normal',             // 'normal', 'bounce'
    renderer: 'svg',            // 'svg', 'canvas', 'html'
    preserveAspectRatio: 'xMidYMid meet',
    background: 'transparent',
    hover: false,               // Play on hover
    click: false,               // Play on click
    scroll: false,              // Play based on scroll
    intermission: 0             // Pause between loops (ms)
};

/**
 * Create Lottie layer
 */
export function createLottieLayer(config = {}) {
    return {
        type: 'lottie',
        id: `lottie_${Date.now()}`,
        config: { ...DEFAULT_CONFIG, ...config },
        style: {
            width: '300px',
            height: '300px'
        }
    };
}

/**
 * Generate Lottie player HTML
 */
export function generateLottieHTML(config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    return `
        <div class="ss3-lottie" 
             data-src="${settings.src}"
             data-autoplay="${settings.autoplay}"
             data-loop="${settings.loop}"
             data-speed="${settings.speed}"
             data-direction="${settings.direction}"
             data-mode="${settings.mode}"
             data-renderer="${settings.renderer}"
             data-hover="${settings.hover}"
             data-click="${settings.click}"
             data-scroll="${settings.scroll}"
             style="background: ${settings.background};">
            <div class="lottie-container"></div>
        </div>
    `;
}

/**
 * Generate Lottie CSS
 */
export function generateLottieCSS() {
    return `
        .ss3-lottie {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .lottie-container {
            width: 100%;
            height: 100%;
        }
        
        .lottie-container svg {
            width: 100%;
            height: 100%;
        }
    `;
}

/**
 * Generate Lottie loader script
 * Uses lottie-web library
 */
export function generateLottieScript() {
    return `
        (function() {
            // Load lottie-web if not present
            if (typeof lottie === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
                script.onload = initLotties;
                document.head.appendChild(script);
            } else {
                initLotties();
            }
            
            function initLotties() {
                document.querySelectorAll('.ss3-lottie').forEach(function(el) {
                    const container = el.querySelector('.lottie-container');
                    const src = el.dataset.src;
                    if (!src || !container) return;
                    
                    const config = {
                        container: container,
                        renderer: el.dataset.renderer || 'svg',
                        loop: el.dataset.loop === 'true',
                        autoplay: el.dataset.autoplay === 'true',
                        path: src
                    };
                    
                    const anim = lottie.loadAnimation(config);
                    
                    // Speed
                    const speed = parseFloat(el.dataset.speed) || 1;
                    anim.setSpeed(speed);
                    
                    // Direction
                    const direction = parseInt(el.dataset.direction) || 1;
                    anim.setDirection(direction);
                    
                    // Hover control
                    if (el.dataset.hover === 'true') {
                        anim.pause();
                        el.addEventListener('mouseenter', function() { anim.play(); });
                        el.addEventListener('mouseleave', function() { anim.pause(); });
                    }
                    
                    // Click control
                    if (el.dataset.click === 'true') {
                        anim.pause();
                        el.addEventListener('click', function() {
                            if (anim.isPaused) anim.play();
                            else anim.pause();
                        });
                    }
                    
                    // Scroll-based playback
                    if (el.dataset.scroll === 'true') {
                        anim.pause();
                        const observer = new IntersectionObserver(function(entries) {
                            entries.forEach(function(entry) {
                                const progress = Math.min(1, Math.max(0, entry.intersectionRatio));
                                const frame = Math.floor(progress * anim.totalFrames);
                                anim.goToAndStop(frame, true);
                            });
                        }, { threshold: Array.from({length: 100}, (_, i) => i / 100) });
                        observer.observe(el);
                    }
                    
                    // Store reference
                    el._lottie = anim;
                });
            }
        })();
    `;
}

/**
 * Control methods for Lottie animations
 */
export const LottieControls = {
    play(element) {
        if (element._lottie) element._lottie.play();
    },
    pause(element) {
        if (element._lottie) element._lottie.pause();
    },
    stop(element) {
        if (element._lottie) element._lottie.stop();
    },
    setSpeed(element, speed) {
        if (element._lottie) element._lottie.setSpeed(speed);
    },
    setDirection(element, direction) {
        if (element._lottie) element._lottie.setDirection(direction);
    },
    goToFrame(element, frame) {
        if (element._lottie) element._lottie.goToAndStop(frame, true);
    },
    goToPercent(element, percent) {
        if (element._lottie) {
            const frame = Math.floor(percent * element._lottie.totalFrames);
            element._lottie.goToAndStop(frame, true);
        }
    }
};

/**
 * Popular free Lottie animations
 */
export const LOTTIE_PRESETS = [
    { id: 'loading', name: 'Loading Spinner', url: 'https://assets10.lottiefiles.com/packages/lf20_x62chJ.json' },
    { id: 'success', name: 'Success Check', url: 'https://assets4.lottiefiles.com/packages/lf20_ya4ycrti.json' },
    { id: 'error', name: 'Error X', url: 'https://assets10.lottiefiles.com/packages/lf20_s2lryxtd.json' },
    { id: 'scroll', name: 'Scroll Down', url: 'https://assets4.lottiefiles.com/packages/lf20_hbyjwaoo.json' },
    { id: 'arrow', name: 'Arrow Right', url: 'https://assets10.lottiefiles.com/packages/lf20_yxjy8mbb.json' },
    { id: 'heart', name: 'Heart Beat', url: 'https://assets4.lottiefiles.com/packages/lf20_qm8eqzse.json' },
    { id: 'star', name: 'Star Burst', url: 'https://assets10.lottiefiles.com/packages/lf20_GwQyrX.json' },
    { id: 'confetti', name: 'Confetti', url: 'https://assets4.lottiefiles.com/packages/lf20_rovf9gzy.json' }
];

export default {
    createLottieLayer,
    generateLottieHTML,
    generateLottieCSS,
    generateLottieScript,
    LottieControls,
    LOTTIE_PRESETS
};
