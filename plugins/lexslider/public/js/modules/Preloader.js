/**
 * Preloader.js - Smart loading indicator for sliders
 * Shows loading progress until all assets are ready
 */

// Preloader styles
export const PRELOADER_STYLES = [
    { value: 'spinner', label: 'Spinner', icon: 'autorenew' },
    { value: 'bar', label: 'Progress Bar', icon: 'linear_scale' },
    { value: 'dots', label: 'Dots', icon: 'more_horiz' },
    { value: 'pulse', label: 'Pulse', icon: 'radio_button_checked' },
    { value: 'skeleton', label: 'Skeleton', icon: 'dashboard' },
    { value: 'blur', label: 'Blur Reveal', icon: 'blur_on' },
    { value: 'curtain', label: 'Curtain', icon: 'vertical_split' },
    { value: 'custom', label: 'Custom', icon: 'code' }
];

/**
 * Default preloader configuration
 */
export const DEFAULT_CONFIG = {
    style: 'spinner',
    color: '#8470ff',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    size: 40,
    minDisplayTime: 500,     // Minimum time to show loader
    hideDelay: 300,          // Delay before hiding
    showProgress: true,
    customHTML: ''
};

/**
 * Generate preloader HTML
 */
export function generatePreloaderHTML(config = {}) {
    const settings = { ...DEFAULT_CONFIG, ...config };

    let content = '';

    switch (settings.style) {
        case 'spinner':
            content = `
                <div class="ss3-preloader-spinner" style="--size: ${settings.size}px; --color: ${settings.color};">
                    <svg viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                    </svg>
                </div>
            `;
            break;

        case 'bar':
            content = `
                <div class="ss3-preloader-bar" style="--color: ${settings.color};">
                    <div class="ss3-preloader-bar-fill"></div>
                    ${settings.showProgress ? '<span class="ss3-preloader-percent">0%</span>' : ''}
                </div>
            `;
            break;

        case 'dots':
            content = `
                <div class="ss3-preloader-dots" style="--color: ${settings.color};">
                    <span></span><span></span><span></span>
                </div>
            `;
            break;

        case 'pulse':
            content = `
                <div class="ss3-preloader-pulse" style="--size: ${settings.size}px; --color: ${settings.color};">
                    <span></span><span></span>
                </div>
            `;
            break;

        case 'skeleton':
            content = `
                <div class="ss3-preloader-skeleton">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>
            `;
            break;

        case 'blur':
            content = `<div class="ss3-preloader-blur"></div>`;
            break;

        case 'curtain':
            content = `
                <div class="ss3-preloader-curtain">
                    <div class="curtain-left" style="background: ${settings.bgColor};"></div>
                    <div class="curtain-right" style="background: ${settings.bgColor};"></div>
                </div>
            `;
            break;

        case 'custom':
            content = settings.customHTML;
            break;
    }

    return `
        <div class="ss3-preloader" style="background: ${settings.bgColor};" data-style="${settings.style}">
            ${content}
        </div>
    `;
}

/**
 * Generate preloader CSS
 */
export function generatePreloaderCSS() {
    return `
        .ss3-preloader {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .ss3-preloader.hidden {
            opacity: 0;
            visibility: hidden;
        }
        
        /* Spinner */
        .ss3-preloader-spinner {
            width: var(--size, 40px);
            height: var(--size, 40px);
            color: var(--color, #8470ff);
        }
        
        .ss3-preloader-spinner svg {
            width: 100%;
            height: 100%;
            animation: spinnerRotate 1s linear infinite;
        }
        
        .ss3-preloader-spinner circle {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: 0;
            animation: spinnerDash 1.5s ease-in-out infinite;
        }
        
        @keyframes spinnerRotate {
            100% { transform: rotate(360deg); }
        }
        
        @keyframes spinnerDash {
            0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124; }
        }
        
        /* Progress Bar */
        .ss3-preloader-bar {
            width: 200px;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        
        .ss3-preloader-bar-fill {
            height: 100%;
            background: var(--color, #8470ff);
            width: 0%;
            transition: width 0.1s linear;
        }
        
        .ss3-preloader-percent {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            color: rgba(255,255,255,0.7);
        }
        
        /* Dots */
        .ss3-preloader-dots {
            display: flex;
            gap: 8px;
        }
        
        .ss3-preloader-dots span {
            width: 12px;
            height: 12px;
            background: var(--color, #8470ff);
            border-radius: 50%;
            animation: dotsBounce 1.4s ease-in-out infinite both;
        }
        
        .ss3-preloader-dots span:nth-child(1) { animation-delay: -0.32s; }
        .ss3-preloader-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes dotsBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        /* Pulse */
        .ss3-preloader-pulse {
            width: var(--size, 40px);
            height: var(--size, 40px);
            position: relative;
        }
        
        .ss3-preloader-pulse span {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--color, #8470ff);
            border-radius: 50%;
            animation: pulseFade 2s ease-out infinite;
        }
        
        .ss3-preloader-pulse span:nth-child(2) {
            animation-delay: 1s;
        }
        
        @keyframes pulseFade {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        
        /* Skeleton */
        .ss3-preloader-skeleton {
            width: 80%;
            max-width: 400px;
        }
        
        .skeleton-header,
        .skeleton-text {
            background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
            background-size: 200% 100%;
            animation: skeletonShimmer 1.5s infinite;
            border-radius: 4px;
        }
        
        .skeleton-header {
            height: 40px;
            margin-bottom: 20px;
        }
        
        .skeleton-text {
            height: 16px;
            margin-bottom: 10px;
        }
        
        .skeleton-text.short {
            width: 60%;
        }
        
        @keyframes skeletonShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        /* Blur Reveal */
        .ss3-preloader[data-style="blur"] {
            background: transparent;
            backdrop-filter: blur(20px);
        }
        
        .ss3-preloader[data-style="blur"].hidden {
            backdrop-filter: blur(0);
        }
        
        /* Curtain */
        .ss3-preloader-curtain {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
        }
        
        .curtain-left,
        .curtain-right {
            width: 50%;
            height: 100%;
            transition: transform 0.6s ease-in-out;
        }
        
        .ss3-preloader.hidden .curtain-left {
            transform: translateX(-100%);
        }
        
        .ss3-preloader.hidden .curtain-right {
            transform: translateX(100%);
        }
    `;
}

/**
 * Preloader controller class
 */
export class Preloader {
    constructor(container, config = {}) {
        this.container = container;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.element = null;
        this.progress = 0;
        this.assetsToLoad = [];
        this.assetsLoaded = 0;
        this.startTime = 0;

        this.init();
    }

    init() {
        // Insert preloader HTML
        this.container.insertAdjacentHTML('afterbegin', generatePreloaderHTML(this.config));
        this.element = this.container.querySelector('.ss3-preloader');
        this.startTime = Date.now();
    }

    /**
     * Collect all assets to preload
     */
    collectAssets() {
        const images = this.container.querySelectorAll('img');
        const backgrounds = this.container.querySelectorAll('[style*="background-image"]');
        const videos = this.container.querySelectorAll('video source');

        images.forEach(img => {
            if (img.src && !img.complete) {
                this.assetsToLoad.push({ type: 'image', src: img.src, element: img });
            }
        });

        backgrounds.forEach(el => {
            const match = el.style.backgroundImage.match(/url\(['"]?(.+?)['"]?\)/);
            if (match) {
                this.assetsToLoad.push({ type: 'image', src: match[1] });
            }
        });

        videos.forEach(source => {
            if (source.src) {
                this.assetsToLoad.push({ type: 'video', src: source.src });
            }
        });

        return this.assetsToLoad;
    }

    /**
     * Load all assets
     */
    async loadAssets() {
        if (this.assetsToLoad.length === 0) {
            this.collectAssets();
        }

        if (this.assetsToLoad.length === 0) {
            this.hide();
            return;
        }

        const promises = this.assetsToLoad.map(asset => this.loadAsset(asset));

        await Promise.all(promises);
        this.hide();
    }

    /**
     * Load single asset
     */
    loadAsset(asset) {
        return new Promise((resolve) => {
            if (asset.type === 'image') {
                const img = new Image();
                img.onload = img.onerror = () => {
                    this.onAssetLoaded();
                    resolve();
                };
                img.src = asset.src;
            } else if (asset.type === 'video') {
                const video = document.createElement('video');
                video.oncanplaythrough = video.onerror = () => {
                    this.onAssetLoaded();
                    resolve();
                };
                video.src = asset.src;
            } else {
                this.onAssetLoaded();
                resolve();
            }
        });
    }

    /**
     * Handle asset loaded
     */
    onAssetLoaded() {
        this.assetsLoaded++;
        this.progress = (this.assetsLoaded / this.assetsToLoad.length) * 100;
        this.updateProgress(this.progress);
    }

    /**
     * Update progress display
     */
    updateProgress(percent) {
        const bar = this.element?.querySelector('.ss3-preloader-bar-fill');
        const percentText = this.element?.querySelector('.ss3-preloader-percent');

        if (bar) {
            bar.style.width = `${percent}%`;
        }
        if (percentText) {
            percentText.textContent = `${Math.round(percent)}%`;
        }
    }

    /**
     * Hide preloader
     */
    hide() {
        const elapsed = Date.now() - this.startTime;
        const delay = Math.max(0, this.config.minDisplayTime - elapsed);

        setTimeout(() => {
            this.element?.classList.add('hidden');

            setTimeout(() => {
                this.element?.remove();
            }, this.config.hideDelay);
        }, delay);
    }

    /**
     * Show preloader (if needed again)
     */
    show() {
        if (!this.element) {
            this.init();
        } else {
            this.element.classList.remove('hidden');
        }
        this.startTime = Date.now();
    }
}

/**
 * Initialize preloader for slider
 */
export function initPreloader(container, config = {}) {
    const preloader = new Preloader(container, config);
    preloader.loadAssets();
    return preloader;
}

/**
 * Generate preloader script for frontend
 */
export function generatePreloaderScript(sliderId, config = {}) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const config = ${JSON.stringify({ ...DEFAULT_CONFIG, ...config })};
            const startTime = Date.now();
            
            // Create preloader
            const preloaderHTML = \`${generatePreloaderHTML(config)}\`;
            container.insertAdjacentHTML('afterbegin', preloaderHTML);
            const preloader = container.querySelector('.ss3-preloader');
            
            // Collect assets
            const images = Array.from(container.querySelectorAll('img')).filter(img => !img.complete);
            let loaded = 0;
            
            function updateProgress() {
                loaded++;
                const percent = images.length > 0 ? (loaded / images.length) * 100 : 100;
                
                const bar = preloader.querySelector('.ss3-preloader-bar-fill');
                const percentText = preloader.querySelector('.ss3-preloader-percent');
                
                if (bar) bar.style.width = percent + '%';
                if (percentText) percentText.textContent = Math.round(percent) + '%';
                
                if (loaded >= images.length) {
                    hidePreloader();
                }
            }
            
            function hidePreloader() {
                const elapsed = Date.now() - startTime;
                const delay = Math.max(0, config.minDisplayTime - elapsed);
                
                setTimeout(function() {
                    preloader.classList.add('hidden');
                    setTimeout(function() {
                        preloader.remove();
                    }, config.hideDelay);
                }, delay);
            }
            
            if (images.length === 0) {
                hidePreloader();
            } else {
                images.forEach(function(img) {
                    if (img.complete) {
                        updateProgress();
                    } else {
                        img.addEventListener('load', updateProgress);
                        img.addEventListener('error', updateProgress);
                    }
                });
            }
        })();
    `;
}

export default {
    PRELOADER_STYLES,
    DEFAULT_CONFIG,
    generatePreloaderHTML,
    generatePreloaderCSS,
    Preloader,
    initPreloader,
    generatePreloaderScript
};
