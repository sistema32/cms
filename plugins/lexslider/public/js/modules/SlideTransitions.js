/**
 * SlideTransitions.js - Advanced slide transition effects
 * 25+ transitions between slides
 */

// All available transitions
export const TRANSITIONS = {
    // Basic
    fade: {
        label: 'Fade',
        css: {
            enter: 'opacity: 0;',
            enterActive: 'opacity: 1; transition: opacity var(--duration) ease;',
            leave: 'opacity: 1;',
            leaveActive: 'opacity: 0; transition: opacity var(--duration) ease;'
        }
    },
    slide: {
        label: 'Slide',
        css: {
            enter: 'transform: translateX(100%);',
            enterActive: 'transform: translateX(0); transition: transform var(--duration) ease;',
            leave: 'transform: translateX(0);',
            leaveActive: 'transform: translateX(-100%); transition: transform var(--duration) ease;'
        }
    },
    slideVertical: {
        label: 'Slide Vertical',
        css: {
            enter: 'transform: translateY(100%);',
            enterActive: 'transform: translateY(0); transition: transform var(--duration) ease;',
            leave: 'transform: translateY(0);',
            leaveActive: 'transform: translateY(-100%); transition: transform var(--duration) ease;'
        }
    },

    // 3D Transforms
    cube: {
        label: 'Cube',
        css: {
            wrapper: 'perspective: 1200px; transform-style: preserve-3d;',
            enter: 'transform: rotateY(90deg); transform-origin: left center;',
            enterActive: 'transform: rotateY(0deg); transition: transform var(--duration) ease;',
            leave: 'transform: rotateY(0deg); transform-origin: right center;',
            leaveActive: 'transform: rotateY(-90deg); transition: transform var(--duration) ease;'
        }
    },
    cubeVertical: {
        label: 'Cube Vertical',
        css: {
            wrapper: 'perspective: 1200px; transform-style: preserve-3d;',
            enter: 'transform: rotateX(-90deg); transform-origin: top center;',
            enterActive: 'transform: rotateX(0deg); transition: transform var(--duration) ease;',
            leave: 'transform: rotateX(0deg); transform-origin: bottom center;',
            leaveActive: 'transform: rotateX(90deg); transition: transform var(--duration) ease;'
        }
    },
    flip: {
        label: 'Flip',
        css: {
            wrapper: 'perspective: 1200px;',
            enter: 'transform: rotateY(180deg); backface-visibility: hidden;',
            enterActive: 'transform: rotateY(0deg); transition: transform var(--duration) ease;',
            leave: 'transform: rotateY(0deg); backface-visibility: hidden;',
            leaveActive: 'transform: rotateY(-180deg); transition: transform var(--duration) ease;'
        }
    },
    flipVertical: {
        label: 'Flip Vertical',
        css: {
            wrapper: 'perspective: 1200px;',
            enter: 'transform: rotateX(-180deg);',
            enterActive: 'transform: rotateX(0deg); transition: transform var(--duration) ease;',
            leave: 'transform: rotateX(0deg);',
            leaveActive: 'transform: rotateX(180deg); transition: transform var(--duration) ease;'
        }
    },

    // Zoom
    zoomIn: {
        label: 'Zoom In',
        css: {
            enter: 'transform: scale(0); opacity: 0;',
            enterActive: 'transform: scale(1); opacity: 1; transition: all var(--duration) ease;',
            leave: 'transform: scale(1); opacity: 1;',
            leaveActive: 'transform: scale(1.5); opacity: 0; transition: all var(--duration) ease;'
        }
    },
    zoomOut: {
        label: 'Zoom Out',
        css: {
            enter: 'transform: scale(1.5); opacity: 0;',
            enterActive: 'transform: scale(1); opacity: 1; transition: all var(--duration) ease;',
            leave: 'transform: scale(1); opacity: 1;',
            leaveActive: 'transform: scale(0); opacity: 0; transition: all var(--duration) ease;'
        }
    },
    zoomRotate: {
        label: 'Zoom Rotate',
        css: {
            enter: 'transform: scale(0) rotate(-180deg); opacity: 0;',
            enterActive: 'transform: scale(1) rotate(0deg); opacity: 1; transition: all var(--duration) ease;',
            leave: 'transform: scale(1) rotate(0deg); opacity: 1;',
            leaveActive: 'transform: scale(0) rotate(180deg); opacity: 0; transition: all var(--duration) ease;'
        }
    },

    // Creative
    blur: {
        label: 'Blur',
        css: {
            enter: 'filter: blur(20px); opacity: 0;',
            enterActive: 'filter: blur(0); opacity: 1; transition: all var(--duration) ease;',
            leave: 'filter: blur(0); opacity: 1;',
            leaveActive: 'filter: blur(20px); opacity: 0; transition: all var(--duration) ease;'
        }
    },
    swing: {
        label: 'Swing',
        css: {
            wrapper: 'perspective: 1200px;',
            enter: 'transform: rotateX(-90deg); transform-origin: top; opacity: 0;',
            enterActive: 'transform: rotateX(0); opacity: 1; transition: all var(--duration) ease;',
            leave: 'transform: rotateX(0); transform-origin: bottom;',
            leaveActive: 'transform: rotateX(90deg); opacity: 0; transition: all var(--duration) ease;'
        }
    },
    door: {
        label: 'Door',
        css: {
            wrapper: 'perspective: 1200px;',
            enter: 'transform: rotateY(-90deg); transform-origin: left;',
            enterActive: 'transform: rotateY(0); transition: transform var(--duration) ease;',
            leave: 'transform: rotateY(0); transform-origin: left;',
            leaveActive: 'transform: rotateY(90deg); transition: transform var(--duration) ease;'
        }
    },
    push: {
        label: 'Push',
        css: {
            enter: 'transform: translateX(100%) scale(0.8);',
            enterActive: 'transform: translateX(0) scale(1); transition: transform var(--duration) ease;',
            leave: 'transform: translateX(0) scale(1);',
            leaveActive: 'transform: translateX(-30%) scale(0.8); transition: transform var(--duration) ease;'
        }
    },
    pull: {
        label: 'Pull',
        css: {
            enter: 'transform: translateX(-30%) scale(0.8); z-index: 0;',
            enterActive: 'transform: translateX(0) scale(1); z-index: 1; transition: transform var(--duration) ease;',
            leave: 'transform: translateX(0) scale(1); z-index: 1;',
            leaveActive: 'transform: translateX(100%); z-index: 0; transition: transform var(--duration) ease;'
        }
    },

    // Wipes
    wipeLeft: {
        label: 'Wipe Left',
        css: {
            enter: 'clip-path: inset(0 100% 0 0);',
            enterActive: 'clip-path: inset(0 0 0 0); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: inset(0 0 0 0);',
            leaveActive: 'clip-path: inset(0 0 0 100%); transition: clip-path var(--duration) ease;'
        }
    },
    wipeRight: {
        label: 'Wipe Right',
        css: {
            enter: 'clip-path: inset(0 0 0 100%);',
            enterActive: 'clip-path: inset(0 0 0 0); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: inset(0 0 0 0);',
            leaveActive: 'clip-path: inset(0 100% 0 0); transition: clip-path var(--duration) ease;'
        }
    },
    wipeUp: {
        label: 'Wipe Up',
        css: {
            enter: 'clip-path: inset(100% 0 0 0);',
            enterActive: 'clip-path: inset(0 0 0 0); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: inset(0 0 0 0);',
            leaveActive: 'clip-path: inset(0 0 100% 0); transition: clip-path var(--duration) ease;'
        }
    },
    wipeDown: {
        label: 'Wipe Down',
        css: {
            enter: 'clip-path: inset(0 0 100% 0);',
            enterActive: 'clip-path: inset(0 0 0 0); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: inset(0 0 0 0);',
            leaveActive: 'clip-path: inset(100% 0 0 0); transition: clip-path var(--duration) ease;'
        }
    },

    // Circle/Shape wipes
    circleIn: {
        label: 'Circle In',
        css: {
            enter: 'clip-path: circle(0% at 50% 50%);',
            enterActive: 'clip-path: circle(100% at 50% 50%); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: circle(100% at 50% 50%);',
            leaveActive: 'clip-path: circle(0% at 50% 50%); transition: clip-path var(--duration) ease;'
        }
    },
    circleOut: {
        label: 'Circle Out',
        css: {
            enter: 'clip-path: circle(100% at 50% 50%); opacity: 0;',
            enterActive: 'clip-path: circle(100% at 50% 50%); opacity: 1; transition: opacity var(--duration) ease;',
            leave: 'clip-path: circle(100% at 50% 50%);',
            leaveActive: 'clip-path: circle(0% at 50% 50%); transition: clip-path var(--duration) ease;'
        }
    },
    diamond: {
        label: 'Diamond',
        css: {
            enter: 'clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);',
            enterActive: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); transition: clip-path var(--duration) ease;',
            leave: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);',
            leaveActive: 'clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); transition: clip-path var(--duration) ease;'
        }
    },

    // Special
    glitch: {
        label: 'Glitch',
        css: {
            enter: 'filter: hue-rotate(90deg); transform: skewX(10deg) translateX(5%);',
            enterActive: 'filter: hue-rotate(0deg); transform: skewX(0) translateX(0); transition: all 0.1s step-end;',
            leave: 'filter: hue-rotate(0deg);',
            leaveActive: 'filter: hue-rotate(-90deg); transform: skewX(-10deg); transition: all 0.1s step-end;'
        }
    },
    pixelate: {
        label: 'Pixelate',
        keyframes: `
            @keyframes pixelate-in {
                0% { filter: blur(10px); opacity: 0; }
                30% { filter: blur(5px); opacity: 0.5; }
                100% { filter: blur(0); opacity: 1; }
            }
        `,
        css: {
            enter: 'opacity: 0;',
            enterActive: 'animation: pixelate-in var(--duration) steps(8) forwards;',
            leave: 'opacity: 1;',
            leaveActive: 'animation: pixelate-in var(--duration) steps(8) reverse forwards;'
        }
    },

    // Random
    random: {
        label: 'Random',
        random: true
    }
};

/**
 * Get transition options for UI
 */
export function getTransitionOptions() {
    return Object.entries(TRANSITIONS).map(([key, transition]) => ({
        value: key,
        label: transition.label
    }));
}

/**
 * Get random transition
 */
export function getRandomTransition() {
    const keys = Object.keys(TRANSITIONS).filter(k => k !== 'random');
    return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Generate transition CSS
 */
export function generateTransitionCSS(duration = 600) {
    let css = `
        .ss3-slides {
            --duration: ${duration}ms;
        }
        
        .ss3-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    `;

    // Add keyframes for special transitions
    Object.values(TRANSITIONS).forEach(t => {
        if (t.keyframes) {
            css += t.keyframes;
        }
    });

    return css;
}

/**
 * Apply transition to slides
 */
export function applyTransition(enterSlide, leaveSlide, transitionName, duration = 600) {
    let transition = TRANSITIONS[transitionName];

    if (transitionName === 'random') {
        transition = TRANSITIONS[getRandomTransition()];
    }

    if (!transition || !transition.css) {
        transition = TRANSITIONS.fade;
    }

    const { css } = transition;

    // Apply wrapper styles if needed
    const wrapper = enterSlide.parentElement;
    if (css.wrapper && wrapper) {
        wrapper.style.cssText += css.wrapper;
    }

    // Setup enter
    enterSlide.style.cssText += css.enter;
    enterSlide.classList.add('active');

    // Setup leave
    if (leaveSlide) {
        leaveSlide.style.cssText += css.leave;
    }

    // Trigger transitions
    requestAnimationFrame(() => {
        enterSlide.style.cssText = css.enterActive.replace('var(--duration)', `${duration}ms`);

        if (leaveSlide) {
            leaveSlide.style.cssText = css.leaveActive.replace('var(--duration)', `${duration}ms`);
        }
    });

    // Cleanup after transition
    setTimeout(() => {
        enterSlide.style.cssText = '';
        if (leaveSlide) {
            leaveSlide.style.cssText = '';
            leaveSlide.classList.remove('active');
        }
        if (wrapper) {
            wrapper.style.perspective = '';
            wrapper.style.transformStyle = '';
        }
    }, duration + 50);
}

/**
 * Generate transition script for frontend
 */
export function generateTransitionScript(sliderId, transitionName = 'fade', duration = 600) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const transitions = ${JSON.stringify(TRANSITIONS)};
            const defaultTransition = '${transitionName}';
            const defaultDuration = ${duration};
            
            container.addEventListener('ss3:beforeChange', function(e) {
                const { fromIndex, toIndex } = e.detail;
                const slides = container.querySelectorAll('.ss3-slide');
                const enterSlide = slides[toIndex];
                const leaveSlide = slides[fromIndex];
                
                if (!enterSlide) return;
                
                let transitionName = container.dataset.transition || defaultTransition;
                if (transitionName === 'random') {
                    const keys = Object.keys(transitions).filter(k => k !== 'random');
                    transitionName = keys[Math.floor(Math.random() * keys.length)];
                }
                
                const transition = transitions[transitionName] || transitions.fade;
                const duration = parseInt(container.dataset.transitionDuration) || defaultDuration;
                const css = transition.css;
                
                // Apply wrapper
                const wrapper = enterSlide.parentElement;
                if (css.wrapper && wrapper) {
                    wrapper.style.cssText += css.wrapper;
                }
                
                // Enter
                enterSlide.style.cssText = css.enter;
                enterSlide.classList.add('active');
                
                // Leave
                if (leaveSlide && leaveSlide !== enterSlide) {
                    leaveSlide.style.cssText = css.leave;
                }
                
                requestAnimationFrame(function() {
                    enterSlide.style.cssText = css.enterActive.replace(/var\\(--duration\\)/g, duration + 'ms');
                    if (leaveSlide && leaveSlide !== enterSlide) {
                        leaveSlide.style.cssText = css.leaveActive.replace(/var\\(--duration\\)/g, duration + 'ms');
                    }
                });
                
                setTimeout(function() {
                    enterSlide.style.cssText = '';
                    if (leaveSlide && leaveSlide !== enterSlide) {
                        leaveSlide.style.cssText = '';
                        leaveSlide.classList.remove('active');
                    }
                }, duration + 50);
            });
        })();
    `;
}

export default {
    TRANSITIONS,
    getTransitionOptions,
    getRandomTransition,
    generateTransitionCSS,
    applyTransition,
    generateTransitionScript
};
