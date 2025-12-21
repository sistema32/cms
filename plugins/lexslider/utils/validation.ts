/**
 * Input Validation Utilities
 * Validates and sanitizes user input for LexSlider
 */

export interface ValidatedSlider {
    title: string;
    width: number;
    height: number;
    settings: Record<string, unknown>;
}

export interface ValidatedSlide {
    sliderId: number;
    backgroundImage?: string;
    backgroundColor?: string;
    transition?: string;
    duration?: number;
    sortOrder: number;
    kenBurns?: boolean;
}

export interface ValidatedLayer {
    slideId?: number;
    sliderId?: number;
    type: 'text' | 'heading' | 'button' | 'image' | 'video' | 'icon';
    content: Record<string, unknown>;
    style: Record<string, unknown>;
    animations?: Record<string, unknown>;
    sortOrder: number;
    isGlobal?: boolean;
}

/**
 * Validate and parse slider ID from string
 */
export function validateSliderId(id: string | undefined): number {
    if (!id) {
        throw new ValidationError('Slider ID is required');
    }
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
        throw new ValidationError('Invalid slider ID');
    }
    return numId;
}

/**
 * Validate and parse slide ID from string
 */
export function validateSlideId(id: string | undefined): number {
    if (!id) {
        throw new ValidationError('Slide ID is required');
    }
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
        throw new ValidationError('Invalid slide ID');
    }
    return numId;
}

/**
 * Validate slider input for create/update
 */
export function validateSliderInput(body: unknown): Partial<ValidatedSlider> {
    if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body is required');
    }

    const input = body as Record<string, unknown>;
    const result: Partial<ValidatedSlider> = {};

    if ('title' in input) {
        if (typeof input.title !== 'string' || input.title.trim().length === 0) {
            throw new ValidationError('Title must be a non-empty string');
        }
        result.title = input.title.trim().substring(0, 200); // Max 200 chars
    }

    if ('width' in input) {
        const width = Number(input.width);
        if (isNaN(width) || width < 100 || width > 10000) {
            throw new ValidationError('Width must be between 100 and 10000');
        }
        result.width = width;
    }

    if ('height' in input) {
        const height = Number(input.height);
        if (isNaN(height) || height < 50 || height > 5000) {
            throw new ValidationError('Height must be between 50 and 5000');
        }
        result.height = height;
    }

    if ('settings' in input) {
        if (typeof input.settings === 'object' && input.settings !== null) {
            result.settings = input.settings as Record<string, unknown>;
        }
    }

    return result;
}

/**
 * Validate slide input for create/update
 */
export function validateSlideInput(body: unknown): Partial<ValidatedSlide> {
    if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body is required');
    }

    const input = body as Record<string, unknown>;
    const result: Partial<ValidatedSlide> = {};

    if ('background_image' in input || 'backgroundImage' in input) {
        const bg = (input.background_image || input.backgroundImage) as string;
        if (typeof bg === 'string') {
            result.backgroundImage = bg.substring(0, 1000);
        }
    }

    if ('transition' in input) {
        const transitions = ['fade', 'slide', 'zoom', 'flip', 'cube'];
        if (typeof input.transition === 'string' && transitions.includes(input.transition)) {
            result.transition = input.transition;
        }
    }

    if ('duration' in input) {
        const duration = Number(input.duration);
        if (!isNaN(duration) && duration >= 100 && duration <= 30000) {
            result.duration = duration;
        }
    }

    if ('sort_order' in input || 'sortOrder' in input) {
        const order = Number(input.sort_order || input.sortOrder);
        if (!isNaN(order)) {
            result.sortOrder = order;
        }
    }

    if ('ken_burns' in input || 'kenBurns' in input) {
        result.kenBurns = Boolean(input.ken_burns || input.kenBurns);
    }

    return result;
}

/**
 * Validate layer input for create/update
 */
export function validateLayerInput(body: unknown): Partial<ValidatedLayer> {
    if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body is required');
    }

    const input = body as Record<string, unknown>;
    const result: Partial<ValidatedLayer> = {};

    const validTypes = ['text', 'heading', 'button', 'image', 'video', 'icon'];
    if ('type' in input && typeof input.type === 'string') {
        if (!validTypes.includes(input.type)) {
            throw new ValidationError(`Layer type must be one of: ${validTypes.join(', ')}`);
        }
        result.type = input.type as ValidatedLayer['type'];
    }

    if ('content' in input && typeof input.content === 'object') {
        result.content = input.content as Record<string, unknown>;
    }

    if ('style' in input && typeof input.style === 'object') {
        result.style = input.style as Record<string, unknown>;
    }

    if ('animations' in input && typeof input.animations === 'object') {
        result.animations = input.animations as Record<string, unknown>;
    }

    return result;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
    public readonly status = 400;

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
