
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

export function getAnimationCSS() {
    return animationPresets.map(p => p.css || '').join('\n');
}
