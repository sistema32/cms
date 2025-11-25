/**
 * LexSlider Animation Library
 * Enhanced animations with easing functions
 */

export interface AnimationConfig {
    type: string;
    duration: number;
    delay: number;
    easing?: string;
}

export const easingFunctions = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
    easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
    easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
    easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
    easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
    easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
    easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

export const animationPresets = {
    fadeIn: {
        type: 'fade',
        duration: 600,
        delay: 0,
        easing: 'easeOut'
    },
    slideInLeft: {
        type: 'slide-left',
        duration: 800,
        delay: 0,
        easing: 'easeOutCubic'
    },
    slideInRight: {
        type: 'slide-right',
        duration: 800,
        delay: 0,
        easing: 'easeOutCubic'
    },
    slideInUp: {
        type: 'slide-up',
        duration: 800,
        delay: 0,
        easing: 'easeOutCubic'
    },
    slideInDown: {
        type: 'slide-down',
        duration: 800,
        delay: 0,
        easing: 'easeOutCubic'
    },
    zoomIn: {
        type: 'zoom',
        duration: 600,
        delay: 0,
        easing: 'easeOutBack'
    },
    bounceIn: {
        type: 'zoom',
        duration: 1000,
        delay: 0,
        easing: 'easeOutBack'
    }
};

export function getAnimationCSS(animation: AnimationConfig): string {
    const easing = animation.easing ? easingFunctions[animation.easing] || animation.easing : 'ease';

    return `
    animation: lexslider-${animation.type} ${animation.duration}ms ${easing} ${animation.delay}ms forwards;
  `;
}

export function generateAnimationKeyframes(): string {
    return `
    @keyframes lexslider-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes lexslider-slide-left {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes lexslider-slide-right {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes lexslider-slide-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes lexslider-slide-down {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes lexslider-zoom {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes lexslider-rotate {
      from { transform: rotate(-180deg) scale(0.5); opacity: 0; }
      to { transform: rotate(0) scale(1); opacity: 1; }
    }

    @keyframes lexslider-flip {
      from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
      to { transform: perspective(400px) rotateY(0); opacity: 1; }
    }
  `;
}
