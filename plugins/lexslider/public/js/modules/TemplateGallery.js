/**
 * TemplateGallery.js - Pre-built slider templates
 * Provides ready-to-use slider configurations
 */

// Template categories
export const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'All Templates', icon: 'apps' },
    { id: 'hero', label: 'Hero Sections', icon: 'web' },
    { id: 'product', label: 'Product Showcase', icon: 'shopping_bag' },
    { id: 'portfolio', label: 'Portfolio', icon: 'photo_library' },
    { id: 'testimonial', label: 'Testimonials', icon: 'format_quote' },
    { id: 'blog', label: 'Blog Posts', icon: 'article' },
    { id: 'minimal', label: 'Minimal', icon: 'crop_square' }
];

// Pre-built templates
export const TEMPLATES = [
    {
        id: 'hero-gradient',
        name: 'Gradient Hero',
        category: 'hero',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/hero-gradient.jpg',
        description: 'Bold gradient background with centered text',
        config: {
            width: 1920,
            height: 800,
            type: 'simple',
            settings: {}
        },
        slides: [{
            title: 'Hero Slide',
            background_color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            layers: [
                {
                    type: 'heading',
                    content: { text: 'Welcome to Your Story' },
                    style: {
                        left: '50%', top: '40%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '64px', fontWeight: '700',
                        color: '#ffffff', textAlign: 'center'
                    }
                },
                {
                    type: 'text',
                    content: { text: 'Create beautiful experiences that inspire and engage' },
                    style: {
                        left: '50%', top: '55%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '20px', color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center', maxWidth: '600px'
                    }
                },
                {
                    type: 'button',
                    content: { text: 'Get Started', link: '#' },
                    style: {
                        left: '50%', top: '70%',
                        transform: 'translateX(-50%)',
                        padding: '15px 40px', fontSize: '16px',
                        backgroundColor: '#ffffff', color: '#667eea',
                        borderRadius: '30px', fontWeight: '600'
                    }
                }
            ]
        }]
    },
    {
        id: 'hero-video',
        name: 'Video Background',
        category: 'hero',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/hero-video.jpg',
        description: 'Full-screen video with overlay text',
        config: {
            width: 1920,
            height: 1080,
            type: 'simple',
            settings: { videoBackground: true }
        },
        slides: [{
            title: 'Video Hero',
            layers: [
                {
                    type: 'video',
                    content: { src: 'https://example.com/video.mp4' },
                    style: {
                        left: '0', top: '0',
                        width: '100%', height: '100%',
                        zIndex: '0'
                    }
                },
                {
                    type: 'heading',
                    content: { text: 'Cinematic Experience' },
                    style: {
                        left: '50%', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '72px', color: '#ffffff',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }
                }
            ]
        }]
    },
    {
        id: 'product-card',
        name: 'Product Cards',
        category: 'product',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/product-card.jpg',
        description: 'Clean product showcase with details',
        config: {
            width: 1200,
            height: 500,
            type: 'carousel',
            settings: { slidesPerView: 3, gap: 30 }
        },
        slides: [
            {
                title: 'Product 1',
                background_color: '#f8f9fa',
                layers: [
                    {
                        type: 'image',
                        content: { src: '/placeholder-product.jpg' },
                        style: {
                            left: '50%', top: '30%',
                            transform: 'translate(-50%, -50%)',
                            width: '200px', height: '200px'
                        }
                    },
                    {
                        type: 'heading',
                        content: { text: 'Product Name' },
                        style: {
                            left: '50%', top: '65%',
                            transform: 'translateX(-50%)',
                            fontSize: '22px', fontWeight: '600'
                        }
                    },
                    {
                        type: 'text',
                        content: { text: '$99.00' },
                        style: {
                            left: '50%', top: '80%',
                            transform: 'translateX(-50%)',
                            fontSize: '18px', color: '#8470ff'
                        }
                    }
                ]
            }
        ]
    },
    {
        id: 'portfolio-grid',
        name: 'Portfolio Grid',
        category: 'portfolio',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/portfolio-grid.jpg',
        description: 'Image gallery with hover effects',
        config: {
            width: 1200,
            height: 600,
            type: 'showcase',
            settings: {}
        },
        slides: [
            {
                title: 'Project 1',
                background_image: '/placeholder-project1.jpg',
                layers: [
                    {
                        type: 'heading',
                        content: { text: 'Project Title' },
                        style: {
                            left: '30px', bottom: '30px',
                            fontSize: '28px', color: '#ffffff'
                        }
                    }
                ]
            }
        ]
    },
    {
        id: 'testimonial-simple',
        name: 'Simple Testimonial',
        category: 'testimonial',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/testimonial-simple.jpg',
        description: 'Clean customer testimonial slider',
        config: {
            width: 800,
            height: 400,
            type: 'simple',
            settings: {}
        },
        slides: [{
            title: 'Testimonial 1',
            background_color: '#f1f5f9',
            layers: [
                {
                    type: 'icon',
                    content: { icon: 'format_quote' },
                    style: {
                        left: '50%', top: '15%',
                        transform: 'translateX(-50%)',
                        fontSize: '48px', color: '#8470ff',
                        opacity: '0.3'
                    }
                },
                {
                    type: 'text',
                    content: { text: '"This product changed my life. Highly recommended!"' },
                    style: {
                        left: '50%', top: '45%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '24px', fontStyle: 'italic',
                        textAlign: 'center', maxWidth: '600px',
                        lineHeight: '1.6'
                    }
                },
                {
                    type: 'text',
                    content: { text: '— Jane Doe, CEO' },
                    style: {
                        left: '50%', top: '75%',
                        transform: 'translateX(-50%)',
                        fontSize: '16px', fontWeight: '600'
                    }
                }
            ]
        }]
    },
    {
        id: 'minimal-text',
        name: 'Minimal Text',
        category: 'minimal',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/minimal-text.jpg',
        description: 'Clean typography-focused slider',
        config: {
            width: 1200,
            height: 600,
            type: 'simple',
            settings: {}
        },
        slides: [{
            title: 'Minimal Slide',
            background_color: '#000000',
            layers: [
                {
                    type: 'heading',
                    content: { text: 'Less is More' },
                    style: {
                        left: '50%', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '80px', fontWeight: '300',
                        color: '#ffffff', letterSpacing: '10px'
                    }
                }
            ]
        }]
    },
    {
        id: 'blog-posts',
        name: 'Blog Post Slider',
        category: 'blog',
        thumbnail: '/plugins-runtime/plugins-static/lexslider/templates/blog-posts.jpg',
        description: 'Featured blog posts carousel',
        config: {
            width: 1200,
            height: 400,
            type: 'carousel',
            settings: { slidesPerView: 3, gap: 20 }
        },
        slides: [{
            title: 'Blog Post',
            background_color: '#ffffff',
            layers: [
                {
                    type: 'image',
                    content: { src: '/placeholder-blog.jpg' },
                    style: {
                        left: '0', top: '0',
                        width: '100%', height: '60%'
                    }
                },
                {
                    type: 'text',
                    content: { text: 'CATEGORY' },
                    style: {
                        left: '15px', top: '65%',
                        fontSize: '11px', color: '#8470ff',
                        letterSpacing: '2px'
                    }
                },
                {
                    type: 'heading',
                    content: { text: 'Blog Post Title Here' },
                    style: {
                        left: '15px', top: '72%',
                        fontSize: '18px', fontWeight: '600',
                        color: '#1a1a1a'
                    }
                }
            ]
        }]
    }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryId) {
    if (categoryId === 'all') return TEMPLATES;
    return TEMPLATES.filter(t => t.category === categoryId);
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId) {
    return TEMPLATES.find(t => t.id === templateId);
}

/**
 * Generate template gallery HTML
 */
export function generateGalleryHTML(templates = TEMPLATES) {
    const categoriesHTML = TEMPLATE_CATEGORIES.map(cat => `
        <button class="template-category-btn ${cat.id === 'all' ? 'active' : ''}" 
                data-category="${cat.id}">
            <span class="material-icons-round">${cat.icon}</span>
            ${cat.label}
        </button>
    `).join('');

    const templatesHTML = templates.map(template => `
        <div class="template-card" data-template-id="${template.id}" data-category="${template.category}">
            <div class="template-thumb" style="background-image: url('${template.thumbnail}');">
                <div class="template-overlay">
                    <button class="btn btn-sm btn-primary">Use Template</button>
                    <button class="btn btn-sm btn-ghost">Preview</button>
                </div>
            </div>
            <div class="template-info">
                <h4>${template.name}</h4>
                <p>${template.description}</p>
            </div>
        </div>
    `).join('');

    return `
        <div class="template-gallery">
            <div class="template-categories">
                ${categoriesHTML}
            </div>
            <div class="template-grid">
                ${templatesHTML}
            </div>
        </div>
    `;
}

/**
 * Generate template gallery CSS
 */
export function generateGalleryCSS() {
    return `
        .template-gallery {
            padding: 20px;
        }
        
        .template-categories {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding-bottom: 10px;
        }
        
        .template-category-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border: 1px solid #333;
            border-radius: 20px;
            background: transparent;
            color: #888;
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        
        .template-category-btn:hover,
        .template-category-btn.active {
            background: #8470ff;
            border-color: #8470ff;
            color: white;
        }
        
        .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .template-card {
            background: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .template-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        
        .template-thumb {
            height: 180px;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        
        .template-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .template-card:hover .template-overlay {
            opacity: 1;
        }
        
        .template-info {
            padding: 15px;
        }
        
        .template-info h4 {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .template-info p {
            font-size: 12px;
            color: #888;
            margin: 0;
        }
    `;
}

export default {
    TEMPLATE_CATEGORIES,
    TEMPLATES,
    getTemplatesByCategory,
    getTemplateById,
    generateGalleryHTML,
    generateGalleryCSS
};
