/**
 * DynamicContent.js - Dynamic content integration
 * Fetch content from CMS posts, products, or custom APIs
 */

// Content source types
export const CONTENT_SOURCES = {
    manual: { label: 'Manual', icon: 'edit' },
    posts: { label: 'CMS Posts', icon: 'article' },
    products: { label: 'Products', icon: 'shopping_bag' },
    custom: { label: 'Custom API', icon: 'api' },
    rss: { label: 'RSS Feed', icon: 'rss_feed' }
};

// Default content mappings
const DEFAULT_MAPPINGS = {
    posts: {
        title: 'title',
        subtitle: 'excerpt',
        image: 'featured_image',
        link: 'url',
        date: 'published_at',
        author: 'author_name',
        category: 'category_name'
    },
    products: {
        title: 'name',
        subtitle: 'description',
        image: 'image_url',
        link: 'url',
        price: 'price',
        salePrice: 'sale_price',
        category: 'category'
    }
};

/**
 * Fetch dynamic content
 */
export async function fetchContent(source, options = {}) {
    switch (source) {
        case 'posts':
            return fetchPosts(options);
        case 'products':
            return fetchProducts(options);
        case 'custom':
            return fetchCustom(options);
        case 'rss':
            return fetchRSS(options);
        default:
            return [];
    }
}

/**
 * Fetch CMS posts
 */
async function fetchPosts(options = {}) {
    const {
        limit = 10,
        category = null,
        orderBy = 'published_at',
        order = 'desc',
        status = 'published'
    } = options;

    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            orderBy,
            order,
            status
        });

        if (category) params.set('category', category);

        const response = await fetch(`/api/posts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        return data.posts || [];
    } catch (err) {
        console.error('[DynamicContent] Fetch posts failed:', err);
        return [];
    }
}

/**
 * Fetch products (if e-commerce available)
 */
async function fetchProducts(options = {}) {
    const {
        limit = 10,
        category = null,
        featured = null,
        orderBy = 'created_at',
        order = 'desc'
    } = options;

    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            orderBy,
            order
        });

        if (category) params.set('category', category);
        if (featured !== null) params.set('featured', featured.toString());

        const response = await fetch(`/api/products?${params}`);
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        return data.products || [];
    } catch (err) {
        console.error('[DynamicContent] Fetch products failed:', err);
        return [];
    }
}

/**
 * Fetch from custom API
 */
async function fetchCustom(options = {}) {
    const { url, method = 'GET', headers = {}, body = null } = options;

    if (!url) return [];

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: body ? JSON.stringify(body) : null
        });

        if (!response.ok) throw new Error('Custom API request failed');

        const data = await response.json();
        return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (err) {
        console.error('[DynamicContent] Custom fetch failed:', err);
        return [];
    }
}

/**
 * Fetch RSS feed (using a proxy)
 */
async function fetchRSS(options = {}) {
    const { feedUrl, limit = 10 } = options;

    if (!feedUrl) return [];

    try {
        // Use a CORS proxy or backend endpoint
        const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}&limit=${limit}`);
        if (!response.ok) throw new Error('RSS fetch failed');

        const data = await response.json();
        return data.items || [];
    } catch (err) {
        console.error('[DynamicContent] RSS fetch failed:', err);
        return [];
    }
}

/**
 * Map content to slide template
 */
export function mapContentToSlide(content, mapping, template) {
    const slide = JSON.parse(JSON.stringify(template)); // Deep clone

    // Replace placeholders in slide
    slide.layers?.forEach(layer => {
        if (layer.content?.text) {
            layer.content.text = replacePlaceholders(layer.content.text, content, mapping);
        }
        if (layer.content?.src) {
            layer.content.src = replacePlaceholders(layer.content.src, content, mapping);
        }
        if (layer.content?.link) {
            layer.content.link = replacePlaceholders(layer.content.link, content, mapping);
        }
    });

    // Replace background image
    if (slide.background_image) {
        slide.background_image = replacePlaceholders(slide.background_image, content, mapping);
    }

    return slide;
}

/**
 * Replace placeholders in string
 */
function replacePlaceholders(str, content, mapping) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const mappedKey = mapping[key] || key;
        return content[mappedKey] ?? match;
    });
}

/**
 * Generate slides from dynamic content
 */
export async function generateDynamicSlides(source, options, template, mapping) {
    const content = await fetchContent(source, options);
    const effectiveMapping = { ...DEFAULT_MAPPINGS[source], ...mapping };

    return content.map(item => mapContentToSlide(item, effectiveMapping, template));
}

/**
 * Create dynamic content configuration
 */
export function createDynamicConfig(source, options = {}) {
    return {
        source,
        options,
        mapping: DEFAULT_MAPPINGS[source] || {},
        refreshInterval: options.refreshInterval || 0, // 0 = no auto-refresh
        lastFetched: null
    };
}

/**
 * Generate dynamic content picker HTML
 */
export function generateContentPickerHTML() {
    const sourcesHTML = Object.entries(CONTENT_SOURCES).map(([key, source]) => `
        <button class="content-source-btn" data-source="${key}">
            <span class="material-icons-round">${source.icon}</span>
            ${source.label}
        </button>
    `).join('');

    return `
        <div class="dynamic-content-picker">
            <h4>Content Source</h4>
            <div class="content-sources">${sourcesHTML}</div>
            
            <div class="content-options" style="display:none;">
                <div class="form-group">
                    <label>Limit</label>
                    <input type="number" class="dc-limit" value="10" min="1" max="50">
                </div>
                <div class="form-group">
                    <label>Category (optional)</label>
                    <input type="text" class="dc-category" placeholder="Enter category">
                </div>
                <div class="form-group">
                    <label>Order By</label>
                    <select class="dc-orderby">
                        <option value="published_at">Date</option>
                        <option value="title">Title</option>
                        <option value="views">Views</option>
                    </select>
                </div>
            </div>
            
            <div class="content-custom-options" style="display:none;">
                <div class="form-group">
                    <label>API URL</label>
                    <input type="url" class="dc-api-url" placeholder="https://api.example.com/data">
                </div>
            </div>
            
            <div class="content-mapping" style="display:none;">
                <h5>Field Mapping</h5>
                <div class="mapping-fields"></div>
            </div>
            
            <button class="btn btn-primary dc-fetch-btn">
                <span class="material-icons-round">sync</span>
                Fetch Content
            </button>
        </div>
    `;
}

/**
 * Generate content picker CSS
 */
export function generateContentPickerCSS() {
    return `
        .dynamic-content-picker {
            padding: 15px;
        }
        
        .dynamic-content-picker h4 {
            margin-bottom: 10px;
            font-size: 14px;
            color: #aaa;
        }
        
        .content-sources {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .content-source-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            padding: 12px;
            border: 1px solid #333;
            border-radius: 8px;
            background: #1a1a1a;
            color: #888;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .content-source-btn .material-icons-round {
            font-size: 24px;
        }
        
        .content-source-btn:hover,
        .content-source-btn.active {
            border-color: #8470ff;
            color: #8470ff;
            background: rgba(132, 112, 255, 0.1);
        }
        
        .content-options .form-group,
        .content-custom-options .form-group {
            margin-bottom: 12px;
        }
        
        .content-options label,
        .content-custom-options label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #888;
        }
        
        .content-options input,
        .content-options select,
        .content-custom-options input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #333;
            border-radius: 6px;
            background: #111;
            color: #fff;
            font-size: 13px;
        }
        
        .dc-fetch-btn {
            width: 100%;
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
    `;
}

export default {
    CONTENT_SOURCES,
    fetchContent,
    mapContentToSlide,
    generateDynamicSlides,
    createDynamicConfig,
    generateContentPickerHTML,
    generateContentPickerCSS
};
