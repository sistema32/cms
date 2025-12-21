/**
 * SocialShare.js - Social sharing buttons
 * Share slide content on social networks
 */

// Supported networks
export const SOCIAL_NETWORKS = {
    facebook: {
        label: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        shareUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    twitter: {
        label: 'X (Twitter)',
        icon: 'twitter',
        color: '#000000',
        shareUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    },
    linkedin: {
        label: 'LinkedIn',
        icon: 'linkedin',
        color: '#0A66C2',
        shareUrl: (url, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    whatsapp: {
        label: 'WhatsApp',
        icon: 'whatsapp',
        color: '#25D366',
        shareUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    },
    telegram: {
        label: 'Telegram',
        icon: 'telegram',
        color: '#0088CC',
        shareUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    },
    pinterest: {
        label: 'Pinterest',
        icon: 'pinterest',
        color: '#E60023',
        shareUrl: (url, text, image) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}&media=${encodeURIComponent(image || '')}`
    },
    reddit: {
        label: 'Reddit',
        icon: 'reddit',
        color: '#FF4500',
        shareUrl: (url, text) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
    },
    email: {
        label: 'Email',
        icon: 'email',
        color: '#666666',
        shareUrl: (url, text) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    },
    copy: {
        label: 'Copy Link',
        icon: 'link',
        color: '#333333',
        action: 'copy'
    }
};

// Layout styles
export const SHARE_LAYOUTS = {
    horizontal: { label: 'Horizontal', direction: 'row' },
    vertical: { label: 'Vertical', direction: 'column' },
    grid: { label: 'Grid', direction: 'grid' }
};

// Button styles
export const SHARE_BUTTON_STYLES = {
    filled: { label: 'Filled', variant: 'filled' },
    outline: { label: 'Outline', variant: 'outline' },
    ghost: { label: 'Ghost', variant: 'ghost' },
    iconOnly: { label: 'Icon Only', variant: 'icon' }
};

/**
 * Create share layer
 */
export function createShareLayer(config = {}) {
    return {
        type: 'social-share',
        id: `share_${Date.now()}`,
        config: {
            networks: config.networks || ['facebook', 'twitter', 'whatsapp', 'linkedin'],
            layout: config.layout || 'horizontal',
            buttonStyle: config.buttonStyle || 'filled',
            size: config.size || 'medium',
            showLabels: config.showLabels ?? false,
            shareUrl: config.shareUrl || '',
            shareText: config.shareText || '',
            shareImage: config.shareImage || ''
        }
    };
}

/**
 * Generate share buttons HTML
 */
export function generateShareHTML(config = {}) {
    const {
        networks = ['facebook', 'twitter', 'whatsapp'],
        layout = 'horizontal',
        buttonStyle = 'filled',
        size = 'medium',
        showLabels = false
    } = config;

    const layoutConfig = SHARE_LAYOUTS[layout] || SHARE_LAYOUTS.horizontal;
    const buttonsHTML = networks
        .filter(n => SOCIAL_NETWORKS[n])
        .map(n => {
            const network = SOCIAL_NETWORKS[n];
            return `
                <button class="share-btn share-btn-${n}" 
                        data-network="${n}"
                        style="--share-color: ${network.color};"
                        title="${network.label}">
                    <span class="share-icon">${getSocialIcon(n)}</span>
                    ${showLabels ? `<span class="share-label">${network.label}</span>` : ''}
                </button>
            `;
        }).join('');

    return `
        <div class="ss3-social-share ss3-share-${layout} ss3-share-${buttonStyle} ss3-share-${size}"
             data-share-url=""
             data-share-text="">
            ${buttonsHTML}
        </div>
    `;
}

/**
 * Get SVG icon for social network
 */
function getSocialIcon(network) {
    const icons = {
        facebook: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>',
        twitter: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        pinterest: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 0a12 12 0 0 0-4.373 23.178c-.07-.633-.133-1.604.028-2.295.145-.624.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.683 0 1.012.512 1.012 1.127 0 .687-.437 1.713-.663 2.664-.189.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.612 1.707-3.612 3.471 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A12 12 0 1 0 12 0z"/></svg>',
        reddit: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>',
        email: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        link: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>'
    };
    return icons[network] || icons.link;
}

/**
 * Generate share CSS
 */
export function generateShareCSS() {
    return `
        .ss3-social-share {
            display: flex;
            gap: 8px;
        }
        
        .ss3-share-vertical {
            flex-direction: column;
        }
        
        .ss3-share-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
        }
        
        .share-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        
        /* Sizes */
        .ss3-share-small .share-btn { padding: 8px 12px; font-size: 12px; }
        .ss3-share-medium .share-btn { padding: 10px 16px; font-size: 14px; }
        .ss3-share-large .share-btn { padding: 12px 20px; font-size: 16px; }
        
        /* Filled style */
        .ss3-share-filled .share-btn {
            background: var(--share-color);
            color: white;
            border-radius: 8px;
        }
        
        .ss3-share-filled .share-btn:hover {
            filter: brightness(1.1);
            transform: translateY(-2px);
        }
        
        /* Outline style */
        .ss3-share-outline .share-btn {
            background: transparent;
            border: 2px solid var(--share-color);
            color: var(--share-color);
            border-radius: 8px;
        }
        
        .ss3-share-outline .share-btn:hover {
            background: var(--share-color);
            color: white;
        }
        
        /* Ghost style */
        .ss3-share-ghost .share-btn {
            background: transparent;
            color: var(--share-color);
        }
        
        .ss3-share-ghost .share-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        
        /* Icon only */
        .ss3-share-icon .share-btn {
            width: 44px;
            height: 44px;
            padding: 0;
            border-radius: 50%;
            background: var(--share-color);
            color: white;
        }
        
        .share-icon {
            display: flex;
            align-items: center;
        }
        
        .share-label {
            white-space: nowrap;
        }
    `;
}

/**
 * Generate share script
 */
export function generateShareScript() {
    return `
        (function() {
            document.querySelectorAll('.ss3-social-share').forEach(function(container) {
                container.addEventListener('click', function(e) {
                    const btn = e.target.closest('.share-btn');
                    if (!btn) return;
                    
                    const network = btn.dataset.network;
                    const url = container.dataset.shareUrl || window.location.href;
                    const text = container.dataset.shareText || document.title;
                    
                    if (network === 'copy') {
                        navigator.clipboard.writeText(url).then(function() {
                            btn.classList.add('copied');
                            setTimeout(function() { btn.classList.remove('copied'); }, 2000);
                        });
                        return;
                    }
                    
                    const networks = {
                        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
                        twitter: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text),
                        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
                        whatsapp: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url),
                        telegram: 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text),
                        pinterest: 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(url),
                        reddit: 'https://reddit.com/submit?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(text),
                        email: 'mailto:?subject=' + encodeURIComponent(text) + '&body=' + encodeURIComponent(url)
                    };
                    
                    if (networks[network]) {
                        window.open(networks[network], '_blank', 'width=600,height=400');
                    }
                });
            });
        })();
    `;
}

export default {
    SOCIAL_NETWORKS,
    SHARE_LAYOUTS,
    SHARE_BUTTON_STYLES,
    createShareLayer,
    generateShareHTML,
    generateShareCSS,
    generateShareScript
};
