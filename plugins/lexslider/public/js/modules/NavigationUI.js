/**
 * NavigationUI.js - Progress bar, thumbnails, and arrow/bullet customization
 */

// ==================== PROGRESS BAR ====================

export const PROGRESS_POSITIONS = [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' }
];

export const PROGRESS_STYLES = [
    { value: 'bar', label: 'Bar' },
    { value: 'circle', label: 'Circle' },
    { value: 'dots', label: 'Dots' }
];

/**
 * Generate progress bar HTML
 */
export function generateProgressBarHTML(config) {
    const {
        style = 'bar',
        position = 'bottom',
        color = '#8470ff',
        bgColor = 'rgba(255,255,255,0.3)',
        height = 4,
        width = 100
    } = config;

    if (style === 'circle') {
        return `
            <div class="ss3-progress ss3-progress-circle" data-position="${position}">
                <svg viewBox="0 0 36 36">
                    <path class="ss3-progress-bg" stroke="${bgColor}" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="ss3-progress-fill" stroke="${color}"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
            </div>
        `;
    }

    return `
        <div class="ss3-progress ss3-progress-bar ss3-progress-${position}" 
             style="--progress-color: ${color}; --progress-bg: ${bgColor}; --progress-height: ${height}px;">
            <div class="ss3-progress-fill"></div>
        </div>
    `;
}

/**
 * Generate progress bar CSS
 */
export function generateProgressBarCSS() {
    return `
        .ss3-progress-bar {
            position: absolute;
            background: var(--progress-bg);
            z-index: 50;
        }
        
        .ss3-progress-bar.ss3-progress-top,
        .ss3-progress-bar.ss3-progress-bottom {
            left: 0;
            right: 0;
            height: var(--progress-height, 4px);
        }
        
        .ss3-progress-bar.ss3-progress-top { top: 0; }
        .ss3-progress-bar.ss3-progress-bottom { bottom: 0; }
        
        .ss3-progress-bar.ss3-progress-left,
        .ss3-progress-bar.ss3-progress-right {
            top: 0;
            bottom: 0;
            width: var(--progress-height, 4px);
        }
        
        .ss3-progress-bar.ss3-progress-left { left: 0; }
        .ss3-progress-bar.ss3-progress-right { right: 0; }
        
        .ss3-progress-bar .ss3-progress-fill {
            background: var(--progress-color, #8470ff);
            transition: width 0.1s linear, height 0.1s linear;
        }
        
        .ss3-progress-top .ss3-progress-fill,
        .ss3-progress-bottom .ss3-progress-fill {
            height: 100%;
            width: 0%;
        }
        
        .ss3-progress-left .ss3-progress-fill,
        .ss3-progress-right .ss3-progress-fill {
            width: 100%;
            height: 0%;
        }
        
        /* Circle progress */
        .ss3-progress-circle {
            position: absolute;
            width: 40px;
            height: 40px;
        }
        
        .ss3-progress-circle svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
        }
        
        .ss3-progress-circle path {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
        }
        
        .ss3-progress-circle .ss3-progress-fill {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            transition: stroke-dashoffset 0.1s linear;
        }
    `;
}

// ==================== THUMBNAIL NAVIGATION ====================

/**
 * Generate thumbnail navigation HTML
 */
export function generateThumbnailsHTML(slides, config = {}) {
    const {
        position = 'bottom',
        size = 60,
        gap = 8,
        activeColor = '#8470ff'
    } = config;

    const thumbs = slides.map((slide, index) => {
        const bgImage = slide.background_image || '';
        const bgStyle = bgImage
            ? `background-image: url('${bgImage}'); background-size: cover;`
            : `background-color: #333;`;

        return `
            <button class="ss3-thumb" data-index="${index}" 
                    style="width: ${size}px; height: ${size * 0.6}px; ${bgStyle}"
                    aria-label="Go to slide ${index + 1}">
                <span class="ss3-thumb-number">${index + 1}</span>
            </button>
        `;
    }).join('');

    return `
        <div class="ss3-thumbnails ss3-thumbnails-${position}" 
             style="--thumb-gap: ${gap}px; --thumb-active-color: ${activeColor};">
            ${thumbs}
        </div>
    `;
}

/**
 * Generate thumbnail CSS
 */
export function generateThumbnailsCSS() {
    return `
        .ss3-thumbnails {
            display: flex;
            gap: var(--thumb-gap, 8px);
            padding: 10px;
            position: absolute;
            z-index: 40;
        }
        
        .ss3-thumbnails-bottom {
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .ss3-thumbnails-top {
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .ss3-thumbnails-left {
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            flex-direction: column;
        }
        
        .ss3-thumbnails-right {
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            flex-direction: column;
        }
        
        .ss3-thumb {
            border: 2px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        
        .ss3-thumb:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }
        
        .ss3-thumb.active {
            opacity: 1;
            border-color: var(--thumb-active-color, #8470ff);
        }
        
        .ss3-thumb-number {
            position: absolute;
            bottom: 2px;
            right: 4px;
            font-size: 10px;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
    `;
}

// ==================== ARROW/BULLET STYLES ====================

export const ARROW_STYLES = [
    { value: 'default', label: 'Default', icon: 'chevron' },
    { value: 'circle', label: 'Circle', icon: 'chevron' },
    { value: 'square', label: 'Square', icon: 'chevron' },
    { value: 'minimal', label: 'Minimal', icon: 'arrow' },
    { value: 'rounded', label: 'Rounded', icon: 'arrow' },
    { value: 'outline', label: 'Outline', icon: 'chevron' }
];

export const BULLET_STYLES = [
    { value: 'dots', label: 'Dots' },
    { value: 'lines', label: 'Lines' },
    { value: 'numbers', label: 'Numbers' },
    { value: 'fraction', label: 'Fraction' },
    { value: 'progressDots', label: 'Progress Dots' }
];

/**
 * Generate arrows HTML
 */
export function generateArrowsHTML(config = {}) {
    const {
        style = 'default',
        size = 40,
        color = '#ffffff',
        bgColor = 'rgba(0,0,0,0.5)',
        position = 'sides' // sides, bottom, outside
    } = config;

    const iconPrev = style === 'minimal' ? 'arrow_back' : 'chevron_left';
    const iconNext = style === 'minimal' ? 'arrow_forward' : 'chevron_right';

    return `
        <button class="ss3-arrow ss3-arrow-prev ss3-arrow-${style}" 
                style="--arrow-size: ${size}px; --arrow-color: ${color}; --arrow-bg: ${bgColor};"
                aria-label="Previous slide">
            <span class="material-icons-round">${iconPrev}</span>
        </button>
        <button class="ss3-arrow ss3-arrow-next ss3-arrow-${style}"
                style="--arrow-size: ${size}px; --arrow-color: ${color}; --arrow-bg: ${bgColor};"
                aria-label="Next slide">
            <span class="material-icons-round">${iconNext}</span>
        </button>
    `;
}

/**
 * Generate bullets HTML
 */
export function generateBulletsHTML(slideCount, config = {}) {
    const {
        style = 'dots',
        color = '#ffffff',
        activeColor = '#8470ff',
        size = 10
    } = config;

    if (style === 'fraction') {
        return `
            <div class="ss3-bullets ss3-bullets-fraction"
                 style="--bullet-color: ${color};">
                <span class="ss3-current">1</span>
                <span class="ss3-separator">/</span>
                <span class="ss3-total">${slideCount}</span>
            </div>
        `;
    }

    if (style === 'numbers') {
        const bullets = Array.from({ length: slideCount }, (_, i) =>
            `<button class="ss3-bullet" data-index="${i}">${i + 1}</button>`
        ).join('');

        return `
            <div class="ss3-bullets ss3-bullets-numbers"
                 style="--bullet-color: ${color}; --bullet-active: ${activeColor};">
                ${bullets}
            </div>
        `;
    }

    const bullets = Array.from({ length: slideCount }, (_, i) =>
        `<button class="ss3-bullet" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
    ).join('');

    return `
        <div class="ss3-bullets ss3-bullets-${style}"
             style="--bullet-color: ${color}; --bullet-active: ${activeColor}; --bullet-size: ${size}px;">
            ${bullets}
        </div>
    `;
}

/**
 * Generate navigation CSS
 */
export function generateNavigationCSS() {
    return `
        /* Arrows */
        .ss3-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: var(--arrow-size, 40px);
            height: var(--arrow-size, 40px);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--arrow-bg, rgba(0,0,0,0.5));
            color: var(--arrow-color, white);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 30;
        }
        
        .ss3-arrow-prev { left: 10px; }
        .ss3-arrow-next { right: 10px; }
        
        .ss3-arrow:hover {
            background: var(--arrow-bg);
            filter: brightness(1.2);
            transform: translateY(-50%) scale(1.1);
        }
        
        .ss3-arrow-circle { border-radius: 50%; }
        .ss3-arrow-square { border-radius: 4px; }
        .ss3-arrow-rounded { border-radius: 12px; }
        .ss3-arrow-minimal { background: transparent; }
        .ss3-arrow-outline { 
            background: transparent; 
            border: 2px solid var(--arrow-color);
            border-radius: 50%;
        }
        
        /* Bullets */
        .ss3-bullets {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 30;
        }
        
        .ss3-bullet {
            width: var(--bullet-size, 10px);
            height: var(--bullet-size, 10px);
            border-radius: 50%;
            background: var(--bullet-color, rgba(255,255,255,0.5));
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .ss3-bullet:hover,
        .ss3-bullet.active {
            background: var(--bullet-active, #8470ff);
            transform: scale(1.2);
        }
        
        .ss3-bullets-lines .ss3-bullet {
            width: 30px;
            height: 4px;
            border-radius: 2px;
        }
        
        .ss3-bullets-numbers .ss3-bullet {
            width: 24px;
            height: 24px;
            font-size: 12px;
            color: var(--bullet-color);
            background: transparent;
        }
        
        .ss3-bullets-numbers .ss3-bullet.active {
            background: var(--bullet-active);
            color: white;
        }
        
        .ss3-bullets-fraction {
            font-size: 14px;
            color: var(--bullet-color);
        }
        
        .ss3-bullets-progressDots .ss3-bullet {
            position: relative;
            overflow: hidden;
        }
        
        .ss3-bullets-progressDots .ss3-bullet.active::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%;
            background: var(--bullet-active);
            border-radius: inherit;
            animation: bulletProgress 5s linear forwards;
        }
        
        @keyframes bulletProgress {
            to { width: 100%; }
        }
    `;
}

export default {
    PROGRESS_POSITIONS,
    PROGRESS_STYLES,
    generateProgressBarHTML,
    generateProgressBarCSS,
    generateThumbnailsHTML,
    generateThumbnailsCSS,
    ARROW_STYLES,
    BULLET_STYLES,
    generateArrowsHTML,
    generateBulletsHTML,
    generateNavigationCSS
};
