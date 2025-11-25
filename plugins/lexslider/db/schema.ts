/**
 * LexSlider Type Definitions
 */

export interface Slider {
    id: number;
    name: string;
    alias?: string;
    type: 'simple' | 'carousel' | 'showcase';
    width: number;
    height: number;
    responsive: ResponsiveSettings;
    settings: SliderSettings;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: number;
}

export interface ResponsiveSettings {
    tablet?: {
        width?: number;
        height?: number;
    };
    mobile?: {
        width?: number;
        height?: number;
    };
}

export interface SliderSettings {
    autoplay?: boolean;
    autoplayDelay?: number;
    loop?: boolean;
    navigation?: boolean;
    pagination?: boolean;
    effect?: 'slide' | 'fade' | 'cube' | 'flip';
    speed?: number;
}

export interface Slide {
    id: number;
    sliderId: number;
    title?: string;
    ordering: number;
    published: boolean;
    background: SlideBackground;
    layers: Layer[];
    settings: SlideSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface SlideBackground {
    type: 'color' | 'image' | 'gradient' | 'video';
    value: string; // color code, image URL, gradient CSS, or video URL
    overlay?: {
        color: string;
        opacity: number;
    };
}

export interface SlideSettings {
    duration?: number;
    transition?: string;
}

export interface Layer {
    id: string;
    type: 'image' | 'heading' | 'text' | 'button' | 'video';
    content: string | ImageContent | VideoContent;
    position: LayerPosition;
    style: Record<string, string>;
    animation?: LayerAnimation;
    responsive?: {
        tablet?: Partial<LayerPosition>;
        mobile?: Partial<LayerPosition>;
    };
}

export interface ImageContent {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export interface VideoContent {
    src: string;
    poster?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
}

export interface LayerPosition {
    x: number; // pixels or percentage
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}

export interface LayerAnimation {
    type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'none';
    duration: number; // milliseconds
    delay: number; // milliseconds
    easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface CreateSliderInput {
    name: string;
    alias?: string;
    type?: Slider['type'];
    width?: number;
    height?: number;
    responsive?: ResponsiveSettings;
    settings?: SliderSettings;
}

export interface UpdateSliderInput extends Partial<CreateSliderInput> {
    id: number;
}

export interface CreateSlideInput {
    sliderId: number;
    title?: string;
    ordering?: number;
    published?: boolean;
    background?: SlideBackground;
    layers?: Layer[];
    settings?: SlideSettings;
}

export interface UpdateSlideInput extends Partial<CreateSlideInput> {
    id: number;
}
