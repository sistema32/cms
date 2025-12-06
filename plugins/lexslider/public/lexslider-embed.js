/**
 * LexSlider Embed Script
 * Auto-initializes sliders with data-lexslider attribute
 * 
 * Usage:
 * 1. Add <div data-lexslider="SLIDER_ID"></div> to your page
 * 2. Include this script: <script src="/plugins-runtime/plugins-static/lexslider/lexslider-embed.js"></script>
 */

(function () {
    'use strict';

    const API_BASE = '/plugins-runtime/lexslider/render';

    // Initialize all sliders on page load
    function initAllSliders() {
        const containers = document.querySelectorAll('[data-lexslider]:not([data-initialized])');
        containers.forEach(container => {
            const sliderId = container.getAttribute('data-lexslider');
            if (sliderId) {
                loadSlider(container, sliderId);
            }
        });
    }

    // Load slider content via API
    async function loadSlider(container, sliderId) {
        container.setAttribute('data-initialized', 'loading');
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;background:#f0f0f0;color:#666;">Loading slider...</div>';

        try {
            const res = await fetch(`${API_BASE}/${sliderId}`);
            if (!res.ok) throw new Error('Failed to load slider');

            const data = await res.json();
            if (data.html) {
                container.outerHTML = data.html;
            } else {
                container.innerHTML = '<!-- Slider not found -->';
            }
        } catch (err) {
            console.error('[LexSlider] Error loading slider:', err);
            container.innerHTML = '<div style="padding:20px;background:#fee;color:#c00;text-align:center;">Error loading slider</div>';
            container.setAttribute('data-initialized', 'error');
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllSliders);
    } else {
        initAllSliders();
    }

    // Also observe for dynamically added sliders
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.hasAttribute && node.hasAttribute('data-lexslider') && !node.hasAttribute('data-initialized')) {
                            const sliderId = node.getAttribute('data-lexslider');
                            if (sliderId) loadSlider(node, sliderId);
                        }
                        // Also check children
                        const children = node.querySelectorAll && node.querySelectorAll('[data-lexslider]:not([data-initialized])');
                        if (children) {
                            children.forEach(child => {
                                const sliderId = child.getAttribute('data-lexslider');
                                if (sliderId) loadSlider(child, sliderId);
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Expose API for manual initialization
    window.LexSliderEmbed = {
        init: initAllSliders,
        load: loadSlider
    };
})();
