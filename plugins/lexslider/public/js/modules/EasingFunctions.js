
export const easingFunctions = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
    easeInOutQuint: (t) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeOutBounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

export const easingOptions = Object.keys(easingFunctions).map(key => ({
    value: key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}));
