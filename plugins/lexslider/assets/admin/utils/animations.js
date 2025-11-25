/**
 * Animation Presets for LexSlider
 * Based on Smart Slider 3 animation library
 */

export const animationPresets = {
    // IN ANIMATIONS
    in: {
        // Fade
        fadeIn: {
            name: 'Fade In',
            keyframes: [
                { opacity: 0 },
                { opacity: 1 }
            ],
            duration: 1000,
            easing: 'ease-out',
        },
        fadeInUp: {
            name: 'Fade In Up',
            keyframes: [
                { opacity: 0, transform: 'translateY(50px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            duration: 1000,
            easing: 'ease-out',
        },
        fadeInDown: {
            name: 'Fade In Down',
            keyframes: [
                { opacity: 0, transform: 'translateY(-50px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            duration: 1000,
            easing: 'ease-out',
        },
        fadeInLeft: {
            name: 'Fade In Left',
            keyframes: [
                { opacity: 0, transform: 'translateX(-50px)' },
                { opacity: 1, transform: 'translateX(0)' }
            ],
            duration: 1000,
            easing: 'ease-out',
        },
        fadeInRight: {
            name: 'Fade In Right',
            keyframes: [
                { opacity: 0, transform: 'translateX(50px)' },
                { opacity: 1, transform: 'translateX(0)' }
            ],
            duration: 1000,
            easing: 'ease-out',
        },

        // Slide
        slideInUp: {
            name: 'Slide In Up',
            keyframes: [
                { transform: 'translateY(100%)' },
                { transform: 'translateY(0)' }
            ],
            duration: 800,
            easing: 'ease-out',
        },
        slideInDown: {
            name: 'Slide In Down',
            keyframes: [
                { transform: 'translateY(-100%)' },
                { transform: 'translateY(0)' }
            ],
            duration: 800,
            easing: 'ease-out',
        },
        slideInLeft: {
            name: 'Slide In Left',
            keyframes: [
                { transform: 'translateX(-100%)' },
                { transform: 'translateX(0)' }
            ],
            duration: 800,
            easing: 'ease-out',
        },
        slideInRight: {
            name: 'Slide In Right',
            keyframes: [
                { transform: 'translateX(100%)' },
                { transform: 'translateX(0)' }
            ],
            duration: 800,
            easing: 'ease-out',
        },

        // Zoom
        zoomIn: {
            name: 'Zoom In',
            keyframes: [
                { opacity: 0, transform: 'scale(0.5)' },
                { opacity: 1, transform: 'scale(1)' }
            ],
            duration: 800,
            easing: 'ease-out',
        },

        // Bounce
        bounceIn: {
            name: 'Bounce In',
            keyframes: [
                { opacity: 0, transform: 'scale(0.3)' },
                { opacity: 1, transform: 'scale(1.05)' },
                { transform: 'scale(0.9)' },
                { transform: 'scale(1)' }
            ],
            duration: 1000,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },

        // Rotate
        rotateIn: {
            name: 'Rotate In',
            keyframes: [
                { opacity: 0, transform: 'rotate(-200deg)' },
                { opacity: 1, transform: 'rotate(0deg)' }
            ],
            duration: 1000,
            easing: 'ease-out',
        },
    },

    // OUT ANIMATIONS
    out: {
        fadeOut: {
            name: 'Fade Out',
            keyframes: [
                { opacity: 1 },
                { opacity: 0 }
            ],
            duration: 800,
            easing: 'ease-in',
        },
        fadeOutUp: {
            name: 'Fade Out Up',
            keyframes: [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-50px)' }
            ],
            duration: 800,
            easing: 'ease-in',
        },
        fadeOutDown: {
            name: 'Fade Out Down',
            keyframes: [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(50px)' }
            ],
            duration: 800,
            easing: 'ease-in',
        },
        slideOutUp: {
            name: 'Slide Out Up',
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-100%)' }
            ],
            duration: 600,
            easing: 'ease-in',
        },
        slideOutDown: {
            name: 'Slide Out Down',
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(100%)' }
            ],
            duration: 600,
            easing: 'ease-in',
        },
        zoomOut: {
            name: 'Zoom Out',
            keyframes: [
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.5)' }
            ],
            duration: 600,
            easing: 'ease-in',
        },
    },

    // LOOP ANIMATIONS
    loop: {
        pulse: {
            name: 'Pulse',
            keyframes: [
                { transform: 'scale(1)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
            ],
            duration: 2000,
            easing: 'ease-in-out',
            iterationCount: 'infinite',
        },
        bounce: {
            name: 'Bounce',
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ],
            duration: 1500,
            easing: 'ease-in-out',
            iterationCount: 'infinite',
        },
        shake: {
            name: 'Shake',
            keyframes: [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(0)' }
            ],
            duration: 800,
            easing: 'ease-in-out',
            iterationCount: 'infinite',
        },
        swing: {
            name: 'Swing',
            keyframes: [
                { transform: 'rotate(0deg)' },
                { transform: 'rotate(15deg)' },
                { transform: 'rotate(-10deg)' },
                { transform: 'rotate(5deg)' },
                { transform: 'rotate(0deg)' }
            ],
            duration: 2000,
            easing: 'ease-in-out',
            iterationCount: 'infinite',
        },
    },
};

// Easing functions
export const easingFunctions = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'ease-in-quad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    'ease-out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'ease-in-cubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    'ease-out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    'ease-in-quart': 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    'ease-out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    'ease-in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Helper to apply animation to element
export function applyAnimation(element, animationType, animationKey, options = {}) {
    const preset = animationPresets[animationType]?.[animationKey];
    if (!preset) return;

    const animation = element.animate(preset.keyframes, {
        duration: options.duration || preset.duration,
        easing: options.easing || preset.easing,
        delay: options.delay || 0,
        iterations: options.iterations || preset.iterationCount || 1,
        fill: 'both',
    });

    return animation;
}
