/**
 * VideoBackground.js - Video background support for slides
 * Handles autoplay, mute, loop, and fallback
 */

/**
 * Video source types
 */
export const VIDEO_SOURCES = {
    file: { label: 'Video File', icon: 'video_file' },
    youtube: { label: 'YouTube', icon: 'smart_display' },
    vimeo: { label: 'Vimeo', icon: 'play_circle' },
    selfHosted: { label: 'Self-Hosted', icon: 'cloud_upload' }
};

/**
 * Default video settings
 */
export const DEFAULT_VIDEO_SETTINGS = {
    autoplay: true,
    muted: true,
    loop: true,
    controls: false,
    playsinline: true,
    poster: '',
    startTime: 0,
    endTime: null,
    playbackRate: 1.0,
    overlay: 'none', // none, dark, light, gradient
    overlayOpacity: 0.5
};

/**
 * Parse video URL to determine source type
 */
export function parseVideoUrl(url) {
    if (!url) return { type: 'file', id: null };

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
        return { type: 'youtube', id: ytMatch[1] };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
        return { type: 'vimeo', id: vimeoMatch[1] };
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
        return { type: 'file', id: url };
    }

    return { type: 'file', id: url };
}

/**
 * Generate video background HTML
 */
export function generateVideoBackgroundHTML(videoUrl, settings = {}) {
    const config = { ...DEFAULT_VIDEO_SETTINGS, ...settings };
    const parsed = parseVideoUrl(videoUrl);

    let videoHTML = '';
    let overlayHTML = '';

    // Overlay
    if (config.overlay !== 'none') {
        let overlayStyle = '';
        switch (config.overlay) {
            case 'dark':
                overlayStyle = `background: rgba(0,0,0,${config.overlayOpacity});`;
                break;
            case 'light':
                overlayStyle = `background: rgba(255,255,255,${config.overlayOpacity});`;
                break;
            case 'gradient':
                overlayStyle = `background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${config.overlayOpacity}) 100%);`;
                break;
        }
        overlayHTML = `<div class="ss3-video-overlay" style="${overlayStyle}"></div>`;
    }

    switch (parsed.type) {
        case 'youtube':
            const ytParams = [
                'autoplay=1',
                'mute=1',
                'loop=1',
                `playlist=${parsed.id}`,
                'controls=0',
                'showinfo=0',
                'rel=0',
                'enablejsapi=1',
                config.startTime ? `start=${config.startTime}` : ''
            ].filter(Boolean).join('&');

            videoHTML = `
                <iframe class="ss3-video-bg ss3-video-youtube"
                    src="https://www.youtube.com/embed/${parsed.id}?${ytParams}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            `;
            break;

        case 'vimeo':
            const vimeoParams = [
                'autoplay=1',
                'muted=1',
                'loop=1',
                'background=1',
                'controls=0'
            ].join('&');

            videoHTML = `
                <iframe class="ss3-video-bg ss3-video-vimeo"
                    src="https://player.vimeo.com/video/${parsed.id}?${vimeoParams}"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen>
                </iframe>
            `;
            break;

        default:
            const attrs = [
                config.autoplay ? 'autoplay' : '',
                config.muted ? 'muted' : '',
                config.loop ? 'loop' : '',
                config.playsinline ? 'playsinline' : '',
                config.controls ? 'controls' : '',
                config.poster ? `poster="${config.poster}"` : ''
            ].filter(Boolean).join(' ');

            videoHTML = `
                <video class="ss3-video-bg ss3-video-native" ${attrs}>
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support video.
                </video>
            `;
            break;
    }

    return `
        <div class="ss3-video-container">
            ${videoHTML}
            ${overlayHTML}
        </div>
    `;
}

/**
 * Generate video background CSS
 */
export function generateVideoBackgroundCSS() {
    return `
        .ss3-video-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }
        
        .ss3-video-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
            transform: translate(-50%, -50%);
            object-fit: cover;
        }
        
        .ss3-video-youtube,
        .ss3-video-vimeo {
            width: 100vw;
            height: 56.25vw; /* 16:9 aspect ratio */
            min-height: 100vh;
            min-width: 177.78vh; /* 16:9 aspect ratio */
            pointer-events: none;
        }
        
        .ss3-video-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        }
        
        /* Responsive adjustments */
        @media (max-aspect-ratio: 16/9) {
            .ss3-video-youtube,
            .ss3-video-vimeo {
                height: 100%;
                width: auto;
            }
        }
    `;
}

/**
 * Initialize video controls
 */
export function initVideoControls(container) {
    const video = container.querySelector('video.ss3-video-native');
    if (!video) return null;

    return {
        play: () => video.play(),
        pause: () => video.pause(),
        mute: () => video.muted = true,
        unmute: () => video.muted = false,
        setVolume: (vol) => video.volume = Math.max(0, Math.min(1, vol)),
        setTime: (time) => video.currentTime = time,
        setPlaybackRate: (rate) => video.playbackRate = rate,
        getState: () => ({
            playing: !video.paused,
            muted: video.muted,
            currentTime: video.currentTime,
            duration: video.duration,
            volume: video.volume
        })
    };
}

/**
 * Generate video background script
 */
export function generateVideoBackgroundScript(sliderId) {
    return `
        (function() {
            const container = document.querySelector('[data-lexslider="${sliderId}"]');
            if (!container) return;
            
            const video = container.querySelector('video.ss3-video-native');
            if (!video) return;
            
            // Ensure autoplay works
            video.play().catch(function() {
                // Autoplay failed, add click to play
                container.addEventListener('click', function() {
                    video.play();
                }, { once: true });
            });
            
            // Pause when not visible
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        video.play().catch(function() {});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.25 });
            
            observer.observe(container);
            
            // Handle slide change
            container.addEventListener('ss3:slideChange', function(e) {
                const activeSlide = container.querySelector('.ss3-slide.active');
                const slideVideos = container.querySelectorAll('.ss3-video-native');
                
                slideVideos.forEach(function(v) {
                    const isInActive = activeSlide && activeSlide.contains(v);
                    if (isInActive) {
                        v.currentTime = 0;
                        v.play().catch(function() {});
                    } else {
                        v.pause();
                    }
                });
            });
        })();
    `;
}

export default {
    VIDEO_SOURCES,
    DEFAULT_VIDEO_SETTINGS,
    parseVideoUrl,
    generateVideoBackgroundHTML,
    generateVideoBackgroundCSS,
    initVideoControls,
    generateVideoBackgroundScript
};
