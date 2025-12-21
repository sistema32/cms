/**
 * SliderService - Business logic for slider operations
 * Separates data access from route handlers for better testability
 */

import { NotFoundError, DatabaseError } from '../utils/errors.ts';
import { validateSliderInput, validateSliderId, ValidationError } from '../utils/validation.ts';

export interface Slider {
    id: number;
    name: string;
    title?: string;
    width: number;
    height: number;
    type: string;
    settings?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSliderInput {
    title: string;
    width?: number;
    height?: number;
    type?: string;
    settings?: Record<string, unknown>;
}

export interface UpdateSliderInput {
    title?: string;
    width?: number;
    height?: number;
    type?: string;
    settings?: Record<string, unknown>;
}

// deno-lint-ignore no-explicit-any
type DbClient = { query: (opts: any) => Promise<any> };

export class SliderService {
    constructor(private db: DbClient) { }

    /**
     * Get all sliders
     */
    async findAll(): Promise<Slider[]> {
        try {
            const result = await this.db.query({
                operation: "findMany",
                table: "plugin_lexslider_sliders",
                orderBy: "created_at DESC"
            });
            const rows = result.rows || result;
            return rows.map((r: Slider) => ({ ...r, title: r.name }));
        } catch (error) {
            throw new DatabaseError(`Failed to fetch sliders: ${error}`);
        }
    }

    /**
     * Get slider by ID with slides and layers
     */
    async findById(id: number | string): Promise<Slider & { slides: any[] }> {
        const numId = typeof id === 'string' ? validateSliderId(id) : id;

        const sliderRes = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_sliders",
            where: { id: numId }
        });

        const slider = sliderRes?.rows?.[0] || sliderRes;
        if (!slider || !slider.id) {
            throw new NotFoundError('Slider', numId);
        }

        slider.title = slider.name;

        // Fetch slides
        const slidesRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_slides",
            where: { slider_id: numId },
            orderBy: "ordering ASC"
        });

        const slides = slidesRes.rows || slidesRes || [];

        // Fetch layers for each slide
        const slidesWithLayers = await Promise.all(slides.map(async (slide: any) => {
            const layersRes = await this.db.query({
                operation: "findMany",
                table: "plugin_lexslider_layers",
                where: { slide_id: slide.id },
                orderBy: "ordering ASC"
            });
            const layers = layersRes.rows || layersRes || [];

            return {
                ...slide,
                layers: layers.map((l: any) => ({
                    ...l,
                    content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                    style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
                }))
            };
        }));

        return { ...slider, slides: slidesWithLayers };
    }

    /**
     * Create a new slider
     */
    async create(input: CreateSliderInput): Promise<Slider> {
        const validated = validateSliderInput(input);

        if (!validated.title) {
            throw new ValidationError("Title is required");
        }

        const result = await this.db.query({
            operation: "insert",
            table: "plugin_lexslider_sliders",
            data: {
                name: validated.title,
                width: validated.width || 1200,
                height: validated.height || 600,
                type: input.type || 'simple',
                settings: validated.settings ? JSON.stringify(validated.settings) : '{}'
            }
        });

        const row = result.rows?.[0] || result[0];
        return { ...row, title: row.name };
    }

    /**
     * Update an existing slider
     */
    async update(id: number | string, input: UpdateSliderInput): Promise<Slider> {
        const numId = typeof id === 'string' ? validateSliderId(id) : id;
        const validated = validateSliderInput(input);

        // Check if slider exists
        const existing = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_sliders",
            where: { id: numId }
        });

        if (!existing || (!existing.id && !existing.rows?.length)) {
            throw new NotFoundError('Slider', numId);
        }

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (validated.title) updateData.name = validated.title;
        if (validated.width) updateData.width = validated.width;
        if (validated.height) updateData.height = validated.height;
        if (input.type) updateData.type = input.type;
        if (validated.settings) updateData.settings = JSON.stringify(validated.settings);

        await this.db.query({
            operation: "update",
            table: "plugin_lexslider_sliders",
            where: { id: numId },
            data: updateData
        });

        return this.findById(numId);
    }

    /**
     * Delete a slider and all related data
     */
    async delete(id: number | string): Promise<void> {
        const numId = typeof id === 'string' ? validateSliderId(id) : id;

        // Delete related global layers first
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_global_layers",
            where: { slider_id: numId }
        });

        // Get all slides to delete their layers
        const slidesRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_slides",
            where: { slider_id: numId }
        });
        const slides = slidesRes.rows || slidesRes || [];

        // Delete layers for each slide
        for (const slide of slides) {
            await this.db.query({
                operation: "delete",
                table: "plugin_lexslider_layers",
                where: { slide_id: slide.id }
            });
        }

        // Delete slides
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_slides",
            where: { slider_id: numId }
        });

        // Finally delete the slider
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_sliders",
            where: { id: numId }
        });
    }
}
