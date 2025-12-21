/**
 * Lightbox.js - Lightbox/Modal gallery for images
 * Opens images in fullscreen overlay with navigation
 */

/**
 * Generate lightbox HTML structure
 */
export function generateLightboxHTML() {
    return `
        <div class="ss3-lightbox" id="ss3-lightbox">
            <div class="ss3-lightbox-backdrop"></div>
            <div class="ss3-lightbox-container">
                <button class="ss3-lightbox-close" aria-label="Close">
                    <span class="material-icons-round">close</span>
                </button>
                <button class="ss3-lightbox-prev" aria-label="Previous">
                    <span class="material-icons-round">chevron_left</span>
                </button>
                <div class="ss3-lightbox-content">
                    <img class="ss3-lightbox-image" src="" alt="">
                    <div class="ss3-lightbox-caption"></div>
                </div>
                <button class="ss3-lightbox-next" aria-label="Next">
                    <span class="material-icons-round">chevron_right</span>
                </button>
                <div class="ss3-lightbox-counter">
                    <span class="ss3-lightbox-current">1</span> / <span class="ss3-lightbox-total">1</span>
                </div>
                <div class="ss3-lightbox-thumbnails"></div>
            </div>
        </div>
    `;
}

/**
 * Generate lightbox CSS
 */
export function generateLightboxCSS() {
    return `
        .ss3-lightbox {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .ss3-lightbox.active {
            display: flex;
            opacity: 1;
        }
        
        .ss3-lightbox-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
        }
        
        .ss3-lightbox-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ss3-lightbox-content {
            max-width: 90%;
            max-height: 85%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .ss3-lightbox-image {
            max-width: 100%;
            max-height: calc(100vh - 150px);
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        }
        
        .ss3-lightbox-caption {
            margin-top: 15px;
            color: white;
            font-size: 14px;
            text-align: center;
            max-width: 600px;
        }
        
        .ss3-lightbox-close,
        .ss3-lightbox-prev,
        .ss3-lightbox-next {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10;
        }
        
        .ss3-lightbox-close:hover,
        .ss3-lightbox-prev:hover,
        .ss3-lightbox-next:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }
        
        .ss3-lightbox-close {
            top: 20px;
            right: 20px;
        }
        
        .ss3-lightbox-prev {
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .ss3-lightbox-prev:hover {
            transform: translateY(-50%) scale(1.1);
        }
        
        .ss3-lightbox-next {
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .ss3-lightbox-next:hover {
            transform: translateY(-50%) scale(1.1);
        }
        
        .ss3-lightbox-counter {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
        }
        
        .ss3-lightbox-thumbnails {
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            max-width: 80%;
            overflow-x: auto;
            padding: 10px;
        }
        
        .ss3-lightbox-thumb {
            width: 60px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0.5;
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        
        .ss3-lightbox-thumb:hover,
        .ss3-lightbox-thumb.active {
            opacity: 1;
            border-color: white;
        }
        
        /* Lightbox trigger */
        [data-lightbox] {
            cursor: zoom-in;
        }
    `;
}

/**
 * Generate lightbox interaction script
 */
export function generateLightboxScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            // Create lightbox if not exists
            let lightbox = document.getElementById('ss3-lightbox');
            if (!lightbox) {
                document.body.insertAdjacentHTML('beforeend', \`${generateLightboxHTML()}\`);
                lightbox = document.getElementById('ss3-lightbox');
            }
            
            const image = lightbox.querySelector('.ss3-lightbox-image');
            const caption = lightbox.querySelector('.ss3-lightbox-caption');
            const currentSpan = lightbox.querySelector('.ss3-lightbox-current');
            const totalSpan = lightbox.querySelector('.ss3-lightbox-total');
            const thumbsContainer = lightbox.querySelector('.ss3-lightbox-thumbnails');
            
            let images = [];
            let currentIndex = 0;
            
            // Collect all lightbox images
            function collectImages() {
                images = Array.from(container.querySelectorAll('[data-lightbox]')).map(el => ({
                    src: el.dataset.lightbox || el.src || el.querySelector('img')?.src,
                    caption: el.dataset.caption || el.alt || ''
                }));
                
                // Generate thumbnails
                thumbsContainer.innerHTML = images.map((img, i) => 
                    '<img class="ss3-lightbox-thumb' + (i === 0 ? ' active' : '') + '" src="' + img.src + '" data-index="' + i + '">'
                ).join('');
                
                totalSpan.textContent = images.length;
            }
            
            function showImage(index) {
                if (index < 0) index = images.length - 1;
                if (index >= images.length) index = 0;
                currentIndex = index;
                
                image.src = images[index].src;
                caption.textContent = images[index].caption;
                currentSpan.textContent = index + 1;
                
                // Update thumbnail active state
                thumbsContainer.querySelectorAll('.ss3-lightbox-thumb').forEach((thumb, i) => {
                    thumb.classList.toggle('active', i === index);
                });
            }
            
            function open(index = 0) {
                collectImages();
                showImage(index);
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            function close() {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Event: Click on lightbox trigger
            container.addEventListener('click', e => {
                const trigger = e.target.closest('[data-lightbox]');
                if (!trigger) return;
                
                e.preventDefault();
                collectImages();
                const index = images.findIndex(img => img.src === (trigger.dataset.lightbox || trigger.src));
                open(Math.max(0, index));
            });
            
            // Event: Close
            lightbox.querySelector('.ss3-lightbox-close').addEventListener('click', close);
            lightbox.querySelector('.ss3-lightbox-backdrop').addEventListener('click', close);
            
            // Event: Navigation
            lightbox.querySelector('.ss3-lightbox-prev').addEventListener('click', () => showImage(currentIndex - 1));
            lightbox.querySelector('.ss3-lightbox-next').addEventListener('click', () => showImage(currentIndex + 1));
            
            // Event: Thumbnails
            thumbsContainer.addEventListener('click', e => {
                const thumb = e.target.closest('.ss3-lightbox-thumb');
                if (thumb) showImage(parseInt(thumb.dataset.index));
            });
            
            // Event: Keyboard
            document.addEventListener('keydown', e => {
                if (!lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') close();
                if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
                if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            });
        })();
    `;
}

/**
 * Create lightbox-enabled layer
 */
export function createLightboxLayer(src, caption = '') {
    return {
        type: 'image',
        content: { src },
        attributes: {
            'data-lightbox': src,
            'data-caption': caption
        }
    };
}

export default {
    generateLightboxHTML,
    generateLightboxCSS,
    generateLightboxScript,
    createLightboxLayer
};
