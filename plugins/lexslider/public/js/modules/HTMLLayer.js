/**
 * HTMLLayer.js - HTML/Iframe embed layer
 * Embed custom HTML and iframes in slides
 */

// Embed types
export const EMBED_TYPES = {
    html: { label: 'Custom HTML', icon: 'code' },
    iframe: { label: 'Iframe', icon: 'web' },
    youtube: { label: 'YouTube', icon: 'smart_display' },
    vimeo: { label: 'Vimeo', icon: 'play_circle' },
    maps: { label: 'Google Maps', icon: 'map' },
    codepen: { label: 'CodePen', icon: 'terminal' },
    spotify: { label: 'Spotify', icon: 'music_note' }
};

// Default configuration
const DEFAULT_CONFIG = {
    type: 'html',
    content: '',              // For HTML type
    url: '',                  // For iframe/embed types
    width: '100%',
    height: '400px',
    allowFullscreen: true,
    lazy: true,               // Lazy load iframes
    sandbox: true,            // Use sandbox for security
    allowScripts: false,      // Allow scripts in sandbox
    responsive: true,         // Maintain aspect ratio
    aspectRatio: '16:9',
    borderRadius: 0,
    overflow: 'hidden'
};

/**
 * Create HTML layer
 */
export function createHTMLLayer(config = {}) {
    return {
        type: 'html-embed',
        id: `html_${Date.now()}`,
        config: { ...DEFAULT_CONFIG, ...config }
    };
}

/**
 * Parse embed URL to get type and ID
 */
export function parseEmbedUrl(url) {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        return { type: 'youtube', id: ytMatch[1] };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
        return { type: 'vimeo', id: vimeoMatch[1] };
    }

    // Google Maps
    if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
        return { type: 'maps', url };
    }

    // CodePen
    const codepenMatch = url.match(/codepen\.io\/([^\/]+)\/pen\/([a-zA-Z0-9]+)/);
    if (codepenMatch) {
        return { type: 'codepen', user: codepenMatch[1], id: codepenMatch[2] };
    }

    // Spotify
    const spotifyMatch = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
        return { type: 'spotify', kind: spotifyMatch[1], id: spotifyMatch[2] };
    }

    // Generic iframe
    return { type: 'iframe', url };
}

/**
 * Get embed URL for known services
 */
export function getEmbedUrl(parsed) {
    switch (parsed.type) {
        case 'youtube':
            return `https://www.youtube.com/embed/${parsed.id}?autoplay=0&rel=0`;

        case 'vimeo':
            return `https://player.vimeo.com/video/${parsed.id}`;

        case 'codepen':
            return `https://codepen.io/${parsed.user}/embed/${parsed.id}?default-tab=result`;

        case 'spotify':
            return `https://open.spotify.com/embed/${parsed.kind}/${parsed.id}`;

        case 'maps':
        case 'iframe':
        default:
            return parsed.url;
    }
}

/**
 * Generate embed HTML
 */
export function generateHTMLLayerHTML(config = {}) {
    const c = { ...DEFAULT_CONFIG, ...config };

    const style = `
        width: ${c.width};
        height: ${c.height};
        border-radius: ${c.borderRadius}px;
        overflow: ${c.overflow};
    `.trim();

    // Custom HTML content
    if (c.type === 'html') {
        return `
            <div class="ss3-html-layer" style="${style}">
                <div class="html-content">
                    ${c.content}
                </div>
            </div>
        `;
    }

    // Parse URL for known services
    const parsed = c.url ? parseEmbedUrl(c.url) : { type: c.type, url: c.url };
    const embedUrl = getEmbedUrl(parsed);

    // Build sandbox attribute
    let sandboxAttr = '';
    if (c.sandbox) {
        const rules = ['allow-same-origin'];
        if (c.allowScripts) rules.push('allow-scripts');
        if (c.allowFullscreen) rules.push('allow-presentation');
        sandboxAttr = `sandbox="${rules.join(' ')}"`;
    }

    // Responsive wrapper for videos
    const wrapperClass = c.responsive && ['youtube', 'vimeo'].includes(parsed.type)
        ? `ss3-responsive-embed ss3-ratio-${c.aspectRatio.replace(':', '-')}`
        : '';

    return `
        <div class="ss3-html-layer ${wrapperClass}" style="${style}" data-embed-type="${parsed.type}">
            <iframe 
                src="${c.lazy ? '' : embedUrl}"
                data-src="${embedUrl}"
                ${c.allowFullscreen ? 'allowfullscreen' : ''}
                ${sandboxAttr}
                loading="${c.lazy ? 'lazy' : 'eager'}"
                frameborder="0"
                class="embed-iframe">
            </iframe>
        </div>
    `;
}

/**
 * Generate HTML layer CSS
 */
export function generateHTMLLayerCSS() {
    return `
        .ss3-html-layer {
            position: relative;
        }
        
        .html-content {
            width: 100%;
            height: 100%;
        }
        
        .embed-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        /* Responsive embed */
        .ss3-responsive-embed {
            position: relative;
            width: 100%;
            height: 0;
        }
        
        .ss3-responsive-embed iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .ss3-ratio-16-9 { padding-bottom: 56.25%; }
        .ss3-ratio-4-3 { padding-bottom: 75%; }
        .ss3-ratio-21-9 { padding-bottom: 42.86%; }
        .ss3-ratio-1-1 { padding-bottom: 100%; }
        
        /* Loading placeholder */
        .ss3-html-layer[data-loading="true"]::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ss3-html-layer[data-loading="true"]::after {
            content: '';
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top-color: #8470ff;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            margin: -20px 0 0 -20px;
            animation: embedLoader 1s linear infinite;
        }
        
        @keyframes embedLoader {
            to { transform: rotate(360deg); }
        }
    `;
}

/**
 * Generate HTML layer script
 */
export function generateHTMLLayerScript() {
    return `
        (function() {
            // Lazy load iframes
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const iframe = entry.target;
                        if (iframe.dataset.src && !iframe.src) {
                            iframe.parentElement.dataset.loading = 'true';
                            iframe.src = iframe.dataset.src;
                            iframe.onload = function() {
                                delete iframe.parentElement.dataset.loading;
                            };
                        }
                        observer.unobserve(iframe);
                    }
                });
            }, { rootMargin: '100px' });
            
            document.querySelectorAll('.ss3-html-layer iframe[data-src]').forEach(function(iframe) {
                observer.observe(iframe);
            });
        })();
    `;
}

/**
 * Generate HTML layer editor HTML
 */
export function generateHTMLLayerEditorHTML(config = {}) {
    const c = { ...DEFAULT_CONFIG, ...config };

    return `
        <div class="html-layer-editor">
            <div class="tabs">
                <button class="tab active" data-tab="html">HTML</button>
                <button class="tab" data-tab="embed">Embed URL</button>
            </div>
            
            <div class="tab-content active" data-content="html">
                <div class="form-group">
                    <label>Custom HTML</label>
                    <textarea class="html-input" rows="10" placeholder="<div>Your HTML here</div>">${c.content}</textarea>
                </div>
            </div>
            
            <div class="tab-content" data-content="embed">
                <div class="form-group">
                    <label>Embed URL</label>
                    <input type="url" class="embed-url-input" 
                           placeholder="YouTube, Vimeo, Google Maps, CodePen..." 
                           value="${c.url}">
                </div>
                <div class="embed-preview"></div>
            </div>
            
            <div class="form-group">
                <label>Dimensions</label>
                <div class="form-row">
                    <input type="text" class="width-input" value="${c.width}" placeholder="Width">
                    <input type="text" class="height-input" value="${c.height}" placeholder="Height">
                </div>
            </div>
            
            <div class="form-group">
                <label>Options</label>
                <label class="checkbox">
                    <input type="checkbox" class="lazy-checkbox" ${c.lazy ? 'checked' : ''}>
                    Lazy load
                </label>
                <label class="checkbox">
                    <input type="checkbox" class="sandbox-checkbox" ${c.sandbox ? 'checked' : ''}>
                    Use sandbox (security)
                </label>
                <label class="checkbox">
                    <input type="checkbox" class="responsive-checkbox" ${c.responsive ? 'checked' : ''}>
                    Responsive
                </label>
            </div>
        </div>
    `;
}

/**
 * Quick embed helpers
 */
export const EmbedHelpers = {
    youtubeEmbed(videoId, options = {}) {
        const params = new URLSearchParams({
            autoplay: options.autoplay ? '1' : '0',
            mute: options.mute ? '1' : '0',
            loop: options.loop ? '1' : '0',
            controls: options.controls !== false ? '1' : '0',
            rel: '0',
            modestbranding: '1'
        });
        return `https://www.youtube.com/embed/${videoId}?${params}`;
    },

    vimeoEmbed(videoId, options = {}) {
        const params = new URLSearchParams({
            autoplay: options.autoplay ? '1' : '0',
            muted: options.mute ? '1' : '0',
            loop: options.loop ? '1' : '0',
            title: '0',
            byline: '0',
            portrait: '0'
        });
        return `https://player.vimeo.com/video/${videoId}?${params}`;
    },

    googleMapsEmbed(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            zoom: options.zoom || 14
        });
        return `https://maps.google.com/maps?${params}&output=embed`;
    },

    spotifyEmbed(type, id) {
        return `https://open.spotify.com/embed/${type}/${id}`;
    }
};

export default {
    EMBED_TYPES,
    createHTMLLayer,
    parseEmbedUrl,
    getEmbedUrl,
    generateHTMLLayerHTML,
    generateHTMLLayerCSS,
    generateHTMLLayerScript,
    generateHTMLLayerEditorHTML,
    EmbedHelpers
};
