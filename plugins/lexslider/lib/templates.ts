/**
 * LexSlider Template Library
 * Pre-made slider templates for quick setup
 */

export interface SliderTemplate {
    id: string;
    name: string;
    description: string;
    category: 'hero' | 'gallery' | 'testimonial' | 'product' | 'portfolio';
    thumbnail: string;
    config: {
        slider: {
            width: number;
            height: number;
            settings: any;
        };
        slides: Array<{
            background: any;
            layers: any[];
        }>;
    };
}

export const templates: SliderTemplate[] = [
    {
        id: 'hero-modern',
        name: 'Modern Hero',
        description: 'Clean hero slider with bold typography and call-to-action',
        category: 'hero',
        thumbnail: '/templates/hero-modern.jpg',
        config: {
            slider: {
                width: 1920,
                height: 600,
                settings: {
                    autoplay: true,
                    autoplayDelay: 5000,
                    loop: true,
                    effect: 'fade',
                    navigation: true,
                    pagination: true
                }
            },
            slides: [
                {
                    background: {
                        type: 'gradient',
                        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    },
                    layers: [
                        {
                            id: 'layer-1',
                            type: 'heading',
                            content: 'Welcome to the Future',
                            position: { x: 100, y: 150, width: 800, height: 120 },
                            style: {
                                color: '#fff',
                                fontSize: '4rem',
                                fontWeight: '800',
                                lineHeight: '1.2'
                            },
                            animation: { type: 'slide-up', duration: 800, delay: 200 }
                        },
                        {
                            id: 'layer-2',
                            type: 'text',
                            content: 'Discover amazing features that will transform your experience',
                            position: { x: 100, y: 290, width: 600, height: 80 },
                            style: {
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '1.5rem',
                                lineHeight: '1.6'
                            },
                            animation: { type: 'slide-up', duration: 800, delay: 400 }
                        },
                        {
                            id: 'layer-3',
                            type: 'button',
                            content: 'Get Started',
                            position: { x: 100, y: 400, width: 200, height: 60 },
                            style: {
                                background: '#fff',
                                color: '#667eea',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                borderRadius: '8px',
                                padding: '16px 40px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            },
                            animation: { type: 'zoom', duration: 600, delay: 600 }
                        }
                    ]
                },
                {
                    background: {
                        type: 'gradient',
                        value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    },
                    layers: [
                        {
                            id: 'layer-4',
                            type: 'heading',
                            content: 'Build Something Amazing',
                            position: { x: 100, y: 150, width: 800, height: 120 },
                            style: {
                                color: '#fff',
                                fontSize: '4rem',
                                fontWeight: '800'
                            },
                            animation: { type: 'fade', duration: 800, delay: 200 }
                        },
                        {
                            id: 'layer-5',
                            type: 'text',
                            content: 'Powerful tools at your fingertips',
                            position: { x: 100, y: 290, width: 600, height: 80 },
                            style: {
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '1.5rem'
                            },
                            animation: { type: 'fade', duration: 800, delay: 400 }
                        }
                    ]
                }
            ]
        }
    },
    {
        id: 'gallery-minimal',
        name: 'Minimal Gallery',
        description: 'Clean image gallery with subtle animations',
        category: 'gallery',
        thumbnail: '/templates/gallery-minimal.jpg',
        config: {
            slider: {
                width: 1200,
                height: 700,
                settings: {
                    autoplay: false,
                    loop: true,
                    effect: 'slide',
                    navigation: true,
                    pagination: true
                }
            },
            slides: [
                {
                    background: {
                        type: 'color',
                        value: '#f5f5f5'
                    },
                    layers: [
                        {
                            id: 'img-1',
                            type: 'image',
                            content: {
                                src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
                                alt: 'Gallery Image 1'
                            },
                            position: { x: 100, y: 50, width: 1000, height: 600 },
                            style: {
                                borderRadius: '12px',
                                objectFit: 'cover'
                            },
                            animation: { type: 'zoom', duration: 1000, delay: 0 }
                        }
                    ]
                },
                {
                    background: {
                        type: 'color',
                        value: '#f5f5f5'
                    },
                    layers: [
                        {
                            id: 'img-2',
                            type: 'image',
                            content: {
                                src: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1200',
                                alt: 'Gallery Image 2'
                            },
                            position: { x: 100, y: 50, width: 1000, height: 600 },
                            style: {
                                borderRadius: '12px',
                                objectFit: 'cover'
                            },
                            animation: { type: 'zoom', duration: 1000, delay: 0 }
                        }
                    ]
                }
            ]
        }
    },
    {
        id: 'testimonial-card',
        name: 'Testimonial Cards',
        description: 'Customer testimonials with profile images',
        category: 'testimonial',
        thumbnail: '/templates/testimonial.jpg',
        config: {
            slider: {
                width: 1000,
                height: 400,
                settings: {
                    autoplay: true,
                    autoplayDelay: 6000,
                    loop: true,
                    effect: 'fade',
                    navigation: false,
                    pagination: true
                }
            },
            slides: [
                {
                    background: {
                        type: 'color',
                        value: '#fff'
                    },
                    layers: [
                        {
                            id: 'quote-1',
                            type: 'text',
                            content: '"This product completely transformed how we work. Highly recommended!"',
                            position: { x: 150, y: 100, width: 700, height: 120 },
                            style: {
                                color: '#1e2328',
                                fontSize: '1.75rem',
                                fontStyle: 'italic',
                                lineHeight: '1.6',
                                textAlign: 'center'
                            },
                            animation: { type: 'fade', duration: 600, delay: 200 }
                        },
                        {
                            id: 'author-1',
                            type: 'text',
                            content: 'Sarah Johnson, CEO at TechCorp',
                            position: { x: 150, y: 250, width: 700, height: 60 },
                            style: {
                                color: '#6b7280',
                                fontSize: '1.125rem',
                                fontWeight: '500',
                                textAlign: 'center'
                            },
                            animation: { type: 'fade', duration: 600, delay: 400 }
                        }
                    ]
                }
            ]
        }
    },
    {
        id: 'product-showcase',
        name: 'Product Showcase',
        description: 'Highlight products with images and descriptions',
        category: 'product',
        thumbnail: '/templates/product.jpg',
        config: {
            slider: {
                width: 1400,
                height: 600,
                settings: {
                    autoplay: true,
                    autoplayDelay: 4000,
                    loop: true,
                    effect: 'slide',
                    navigation: true,
                    pagination: true
                }
            },
            slides: [
                {
                    background: {
                        type: 'color',
                        value: '#f9fafb'
                    },
                    layers: [
                        {
                            id: 'product-img',
                            type: 'image',
                            content: {
                                src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
                                alt: 'Product'
                            },
                            position: { x: 100, y: 100, width: 500, height: 400 },
                            style: {
                                objectFit: 'contain'
                            },
                            animation: { type: 'slide-left', duration: 800, delay: 0 }
                        },
                        {
                            id: 'product-title',
                            type: 'heading',
                            content: 'Premium Headphones',
                            position: { x: 700, y: 150, width: 600, height: 80 },
                            style: {
                                color: '#1e2328',
                                fontSize: '3rem',
                                fontWeight: '700'
                            },
                            animation: { type: 'slide-right', duration: 800, delay: 200 }
                        },
                        {
                            id: 'product-desc',
                            type: 'text',
                            content: 'Experience crystal-clear sound with our latest wireless technology',
                            position: { x: 700, y: 250, width: 600, height: 100 },
                            style: {
                                color: '#6b7280',
                                fontSize: '1.25rem',
                                lineHeight: '1.6'
                            },
                            animation: { type: 'slide-right', duration: 800, delay: 400 }
                        },
                        {
                            id: 'product-cta',
                            type: 'button',
                            content: 'Shop Now',
                            position: { x: 700, y: 380, width: 180, height: 60 },
                            style: {
                                background: '#167bff',
                                color: '#fff',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                borderRadius: '8px',
                                padding: '16px 32px'
                            },
                            animation: { type: 'zoom', duration: 600, delay: 600 }
                        }
                    ]
                }
            ]
        }
    }
];

export function getTemplateById(id: string): SliderTemplate | undefined {
    return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): SliderTemplate[] {
    return templates.filter(t => t.category === category);
}

export function getAllCategories(): string[] {
    return Array.from(new Set(templates.map(t => t.category)));
}
