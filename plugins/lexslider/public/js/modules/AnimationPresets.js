
export const animationPresets = [
    { label: 'None', value: 'none' },
    { label: 'Fade In', value: 'fadeIn', css: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }' },
    { label: 'Slide In Left', value: 'slideInLeft', css: '@keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' },
    { label: 'Slide In Right', value: 'slideInRight', css: '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }' },
    { label: 'Slide In Up', value: 'slideInUp', css: '@keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' },
    { label: 'Slide In Down', value: 'slideInDown', css: '@keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' },
    { label: 'Zoom In', value: 'zoomIn', css: '@keyframes zoomIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }' },
    {
        label: 'Bounce In', value: 'bounceIn', css: `
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
    `},
    { label: 'Rotate In', value: 'rotateIn', css: '@keyframes rotateIn { from { transform: rotate(-200deg); opacity: 0; } to { transform: rotate(0); opacity: 1; } }' },
    { label: 'Flip In X', value: 'flipInX', css: '@keyframes flipInX { from { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); opacity: 0; } to { transform: perspective(400px) rotate3d(1, 0, 0, 0deg); opacity: 1; } }' },
    { label: 'Flip In Y', value: 'flipInY', css: '@keyframes flipInY { from { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); opacity: 0; } to { transform: perspective(400px) rotate3d(0, 1, 0, 0deg); opacity: 1; } }' }
];

// Loop Animation Presets
export const loopAnimationCSS = `
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes swing {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(10deg); }
        75% { transform: rotate(-10deg); }
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    @keyframes wobble {
        0%, 100% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(-3deg) scale(1.02); }
        75% { transform: rotate(3deg) scale(0.98); }
    }
    @keyframes wave {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-5px) rotate(2deg); }
        75% { transform: translateY(5px) rotate(-2deg); }
    }
    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        15% { transform: scale(1.15); }
        30% { transform: scale(1); }
        45% { transform: scale(1.10); }
        60% { transform: scale(1); }
    }
    @keyframes breathe {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.03); opacity: 0.9; }
    }
    @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    @keyframes jello {
        0%, 100% { transform: skewX(0deg) skewY(0deg); }
        25% { transform: skewX(-5deg) skewY(-2deg); }
        50% { transform: skewX(4deg) skewY(1deg); }
        75% { transform: skewX(-3deg) skewY(-1deg); }
    }
`;

export function getAnimationCSS() {
    // Include both entrance animations and loop animations
    const entranceCSS = animationPresets.map(p => p.css || '').join('\n');
    return entranceCSS + '\n' + loopAnimationCSS;
}
