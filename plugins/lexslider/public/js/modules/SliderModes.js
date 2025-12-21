/**
 * SliderModes.js - Carousel and Showcase slider modes
 * Extends basic slider with multi-slide display options
 */

// Slider mode configurations
export const SLIDER_MODES = {
    simple: {
        label: 'Simple',
        description: 'One slide at a time',
        config: {
            slidesPerView: 1,
            gap: 0,
            centeredSlides: false,
            loop: true
        }
    },
    carousel: {
        label: 'Carousel',
        description: 'Multiple slides visible',
        config: {
            slidesPerView: 3,
            gap: 20,
            centeredSlides: false,
            loop: true,
            responsive: {
                768: { slidesPerView: 2, gap: 15 },
                480: { slidesPerView: 1, gap: 10 }
            }
        }
    },
    showcase: {
        label: 'Showcase',
        description: 'Center slide highlighted',
        config: {
            slidesPerView: 3,
            gap: 30,
            centeredSlides: true,
            loop: true,
            centerScale: 1.2,       // Scale of center slide
            sideScale: 0.8,         // Scale of side slides
            sideOpacity: 0.6,       // Opacity of side slides
            perspective: 1000       // 3D perspective
        }
    },
    coverflow: {
        label: 'Coverflow',
        description: '3D coverflow effect',
        config: {
            slidesPerView: 3,
            gap: -50,
            centeredSlides: true,
            loop: true,
            rotate: 30,             // Rotation angle
            depth: 100,             // Z-depth
            stretch: 0
        }
    },
    stack: {
        label: 'Stack',
        description: 'Stacked cards effect',
        config: {
            slidesPerView: 1,
            gap: 0,
            centeredSlides: true,
            loop: false,
            stackScale: 0.94,
            stackOffset: 10
        }
    }
};

/**
 * Get mode options for UI
 */
export function getModeOptions() {
    return Object.entries(SLIDER_MODES).map(([key, mode]) => ({
        value: key,
        label: mode.label,
        description: mode.description
    }));
}

/**
 * Get default config for a mode
 */
export function getModeConfig(modeName) {
    return SLIDER_MODES[modeName]?.config || SLIDER_MODES.simple.config;
}

/**
 * Generate CSS for carousel mode
 */
export function generateCarouselCSS(config) {
    const { slidesPerView, gap } = config;

    return `
        .lexslider-carousel {
            display: flex;
            overflow: hidden;
        }
        
        .lexslider-carousel .ss3-slide {
            flex: 0 0 calc(${100 / slidesPerView}% - ${gap * (slidesPerView - 1) / slidesPerView}px);
            margin-right: ${gap}px;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .lexslider-carousel .ss3-slide:last-child {
            margin-right: 0;
        }
    `;
}

/**
 * Generate CSS for showcase mode
 */
export function generateShowcaseCSS(config) {
    const { centerScale, sideScale, sideOpacity, perspective, gap } = config;

    return `
        .lexslider-showcase {
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: ${perspective}px;
            overflow: visible;
        }
        
        .lexslider-showcase .ss3-slide {
            flex: 0 0 40%;
            transition: transform 0.5s ease, opacity 0.5s ease;
            margin: 0 ${gap / 2}px;
        }
        
        .lexslider-showcase .ss3-slide.active {
            transform: scale(${centerScale});
            z-index: 10;
            opacity: 1;
        }
        
        .lexslider-showcase .ss3-slide:not(.active) {
            transform: scale(${sideScale});
            opacity: ${sideOpacity};
            z-index: 1;
        }
        
        .lexslider-showcase .ss3-slide.prev {
            transform: scale(${sideScale}) translateX(20%) rotateY(5deg);
        }
        
        .lexslider-showcase .ss3-slide.next {
            transform: scale(${sideScale}) translateX(-20%) rotateY(-5deg);
        }
    `;
}

/**
 * Generate CSS for coverflow mode
 */
export function generateCoverflowCSS(config) {
    const { rotate, depth, perspective } = config;

    return `
        .lexslider-coverflow {
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: ${perspective || 1000}px;
            overflow: visible;
        }
        
        .lexslider-coverflow .ss3-slide {
            transition: transform 0.5s ease, opacity 0.5s ease;
            transform-style: preserve-3d;
        }
        
        .lexslider-coverflow .ss3-slide.active {
            transform: translateZ(${depth}px) rotateY(0deg);
            z-index: 10;
            opacity: 1;
        }
        
        .lexslider-coverflow .ss3-slide.prev {
            transform: translateX(-50%) translateZ(-${depth}px) rotateY(${rotate}deg);
            opacity: 0.7;
        }
        
        .lexslider-coverflow .ss3-slide.next {
            transform: translateX(50%) translateZ(-${depth}px) rotateY(-${rotate}deg);
            opacity: 0.7;
        }
    `;
}

/**
 * Generate mode-specific CSS
 */
export function generateModeCSS(mode, config) {
    switch (mode) {
        case 'carousel':
            return generateCarouselCSS(config);
        case 'showcase':
            return generateShowcaseCSS(config);
        case 'coverflow':
            return generateCoverflowCSS(config);
        default:
            return '';
    }
}

/**
 * Generate frontend JavaScript for carousel navigation
 */
export function generateModeScript(sliderId, mode, config) {
    if (mode === 'simple') return '';

    const { slidesPerView, loop } = config;

    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const mode = '${mode}';
            const slidesPerView = ${slidesPerView};
            const track = container.querySelector('.ss3-slides');
            const slides = Array.from(container.querySelectorAll('.ss3-slide'));
            let currentIndex = 0;
            
            container.classList.add('lexslider-' + mode);
            
            function updateSlideClasses() {
                slides.forEach((slide, index) => {
                    slide.classList.remove('active', 'prev', 'next');
                    
                    if (index === currentIndex) {
                        slide.classList.add('active');
                    } else if (index === currentIndex - 1 || (currentIndex === 0 && index === slides.length - 1)) {
                        slide.classList.add('prev');
                    } else if (index === currentIndex + 1 || (currentIndex === slides.length - 1 && index === 0)) {
                        slide.classList.add('next');
                    }
                });
            }
            
            function goToSlide(index) {
                if (${loop}) {
                    currentIndex = (index + slides.length) % slides.length;
                } else {
                    currentIndex = Math.max(0, Math.min(index, slides.length - 1));
                }
                
                if (mode === 'carousel') {
                    const slideWidth = slides[0].offsetWidth + ${config.gap || 0};
                    track.style.transform = 'translateX(' + (-currentIndex * slideWidth) + 'px)';
                }
                
                updateSlideClasses();
            }
            
            container.addEventListener('ss3:next', function() {
                goToSlide(currentIndex + 1);
            });
            
            container.addEventListener('ss3:prev', function() {
                goToSlide(currentIndex - 1);
            });
            
            container.addEventListener('ss3:goto', function(e) {
                goToSlide(e.detail.index);
            });
            
            // Initial state
            updateSlideClasses();
        })();
    `;
}

export default {
    SLIDER_MODES,
    getModeOptions,
    getModeConfig,
    generateModeCSS,
    generateModeScript
};
