/**
 * SlideService - Business logic for slide and layer operations
 */

import { NotFoundError } from '../utils/errors.ts';
import { validateSliderId, validateSlideId } from '../utils/validation.ts';

export interface Slide {
    id: number;
    slider_id: number;
    title?: string;
    background_image?: string;
    background_color?: string;
    transition?: string;
    duration?: number;
    ordering: number;
    ken_burns?: boolean;
}

export interface Layer {
    id: number;
    slide_id?: number;
    slider_id?: number;
    type: string;
    content: Record<string, unknown>;
    style: Record<string, unknown>;
    animations?: Record<string, unknown>;
    ordering: number;
    is_global?: boolean;
}

export interface CreateSlideInput {
    title?: string;
    background_image?: string;
    ordering?: number;
}

export interface UpdateSlideInput {
    title?: string;
    background_image?: string;
    ordering?: number;
    layers?: Layer[];
}

// deno-lint-ignore no-explicit-any
type DbClient = { query: (opts: any) => Promise<any> };

export class SlideService {
    constructor(private db: DbClient) { }

    /**
     * Get all slides for a slider
     */
    async findBySlider(sliderId: number | string): Promise<Slide[]> {
        const numId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        const result = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_slides",
            where: { slider_id: numId },
            orderBy: "ordering ASC"
        });

        return result.rows || result || [];
    }

    /**
     * Get a single slide with its layers
     */
    async findById(id: number | string): Promise<Slide & { layers: Layer[] }> {
        const numId = typeof id === 'string' ? validateSlideId(id) : id;

        const slideRes = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_slides",
            where: { id: numId }
        });

        const slide = slideRes?.rows?.[0] || slideRes;
        if (!slide || !slide.id) {
            throw new NotFoundError('Slide', numId);
        }

        // Fetch layers
        const layersRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_layers",
            where: { slide_id: numId },
            orderBy: "ordering ASC"
        });

        const layers = (layersRes.rows || layersRes || []).map((l: any) => ({
            ...l,
            content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
            style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
        }));

        return { ...slide, layers };
    }

    /**
     * Create a new slide
     */
    async create(sliderId: number | string, input: CreateSlideInput): Promise<Slide> {
        const numSliderId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        const result = await this.db.query({
            operation: "insert",
            table: "plugin_lexslider_slides",
            data: {
                slider_id: numSliderId,
                title: input.title || "New Slide",
                background_image: input.background_image || "",
                ordering: input.ordering || 0
            }
        });

        return result.rows?.[0] || result[0];
    }

    /**
     * Update a slide and its layers
     */
    async update(id: number | string, input: UpdateSlideInput): Promise<Slide & { layers: Layer[] }> {
        const numId = typeof id === 'string' ? validateSlideId(id) : id;

        // Update slide props
        await this.db.query({
            operation: "update",
            table: "plugin_lexslider_slides",
            where: { id: numId },
            data: {
                title: input.title,
                background_image: input.background_image,
                ordering: input.ordering
            }
        });

        // Update layers if provided (replace all)
        if (input.layers && Array.isArray(input.layers)) {
            await this.db.query({
                operation: "delete",
                table: "plugin_lexslider_layers",
                where: { slide_id: numId }
            });

            for (const layer of input.layers) {
                await this.db.query({
                    operation: "insert",
                    table: "plugin_lexslider_layers",
                    data: {
                        slide_id: numId,
                        type: layer.type,
                        content: JSON.stringify(layer.content),
                        style: JSON.stringify(layer.style),
                        ordering: layer.ordering || 0
                    }
                });
            }
        }

        return this.findById(numId);
    }

    /**
     * Delete a slide and its layers
     */
    async delete(id: number | string): Promise<void> {
        const numId = typeof id === 'string' ? validateSlideId(id) : id;

        // Delete layers first
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_layers",
            where: { slide_id: numId }
        });

        // Delete slide
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_slides",
            where: { id: numId }
        });
    }

    /**
     * Get global layers for a slider
     */
    async getGlobalLayers(sliderId: number | string): Promise<Layer[]> {
        const numId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        const result = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_global_layers",
            where: { slider_id: numId },
            orderBy: "ordering ASC"
        });

        const rows = result.rows || result || [];
        return rows.map((l: any) => ({
            ...l,
            content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
            style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
        }));
    }

    /**
     * Update global layers for a slider (replace all)
     */
    async updateGlobalLayers(sliderId: number | string, layers: Layer[]): Promise<Layer[]> {
        const numId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        // Delete existing
        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_global_layers",
            where: { slider_id: numId }
        });

        // Insert new
        for (const layer of layers) {
            await this.db.query({
                operation: "insert",
                table: "plugin_lexslider_global_layers",
                data: {
                    slider_id: numId,
                    type: layer.type,
                    content: JSON.stringify(layer.content),
                    style: JSON.stringify(layer.style),
                    ordering: layer.ordering || 0
                }
            });
        }

        return this.getGlobalLayers(numId);
    }
}
