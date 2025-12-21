/**
 * TemplateService - Manage slider templates for reuse
 */

import { NotFoundError } from '../utils/errors.ts';
import { validateSliderId } from '../utils/validation.ts';

export interface Template {
    id: number;
    name: string;
    description?: string;
    thumbnail_url?: string;
    slider_data: string; // JSON stringified slider config
    created_at?: string;
}

export interface CreateTemplateInput {
    name: string;
    description?: string;
    thumbnail_url?: string;
}

// deno-lint-ignore no-explicit-any
type DbClient = { query: (opts: any) => Promise<any> };

export class TemplateService {
    constructor(private db: DbClient) { }

    /**
     * Get all templates
     */
    async findAll(): Promise<Template[]> {
        const result = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_templates",
            orderBy: "created_at DESC"
        });
        return result.rows || result || [];
    }

    /**
     * Get template by ID
     */
    async findById(id: number | string): Promise<Template> {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;

        const result = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_templates",
            where: { id: numId }
        });

        const template = result?.rows?.[0] || result;
        if (!template || !template.id) {
            throw new NotFoundError('Template', numId);
        }

        return template;
    }

    /**
     * Create template from existing slider
     */
    async createFromSlider(sliderId: number | string, input: CreateTemplateInput): Promise<Template> {
        const numSliderId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        // Fetch slider data
        const slider = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_sliders",
            where: { id: numSliderId }
        });

        if (!slider || !slider.id) {
            throw new NotFoundError('Slider', numSliderId);
        }

        // Fetch slides
        const slidesRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_slides",
            where: { slider_id: numSliderId },
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
            const layers = (layersRes.rows || layersRes || []).map((l: any) => ({
                ...l,
                id: undefined, // Remove IDs for template
                slide_id: undefined,
                content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
            }));
            return { ...slide, id: undefined, slider_id: undefined, layers };
        }));

        // Fetch global layers
        const globalLayersRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_global_layers",
            where: { slider_id: numSliderId },
            orderBy: "ordering ASC"
        });
        const globalLayers = (globalLayersRes.rows || globalLayersRes || []).map((l: any) => ({
            ...l,
            id: undefined,
            slider_id: undefined,
            content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
            style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
        }));

        // Create template data
        const templateData = {
            version: "4.0",
            slider: {
                width: slider.width,
                height: slider.height,
                type: slider.type,
                settings: typeof slider.settings === 'string' ? JSON.parse(slider.settings) : slider.settings
            },
            slides: slidesWithLayers,
            globalLayers
        };

        // Save template
        const result = await this.db.query({
            operation: "insert",
            table: "plugin_lexslider_templates",
            data: {
                name: input.name,
                description: input.description || '',
                thumbnail_url: input.thumbnail_url || '',
                slider_data: JSON.stringify(templateData)
            }
        });

        return result.rows?.[0] || result[0];
    }

    /**
     * Create slider from template
     */
    async createSliderFromTemplate(templateId: number | string, title: string): Promise<number> {
        const template = await this.findById(templateId);
        const data = JSON.parse(template.slider_data);

        // Create slider
        const sliderResult = await this.db.query({
            operation: "insert",
            table: "plugin_lexslider_sliders",
            data: {
                name: title,
                width: data.slider.width || 1200,
                height: data.slider.height || 600,
                type: data.slider.type || 'simple',
                settings: JSON.stringify(data.slider.settings || {})
            }
        });

        const newSliderId = sliderResult.rows?.[0]?.id || sliderResult[0]?.id;

        // Create slides and layers
        for (let i = 0; i < (data.slides || []).length; i++) {
            const slide = data.slides[i];

            const slideResult = await this.db.query({
                operation: "insert",
                table: "plugin_lexslider_slides",
                data: {
                    slider_id: newSliderId,
                    title: slide.title || `Slide ${i + 1}`,
                    background_image: slide.background_image || '',
                    ordering: i
                }
            });

            const newSlideId = slideResult.rows?.[0]?.id || slideResult[0]?.id;

            // Create layers
            for (const layer of (slide.layers || [])) {
                await this.db.query({
                    operation: "insert",
                    table: "plugin_lexslider_layers",
                    data: {
                        slide_id: newSlideId,
                        type: layer.type,
                        content: JSON.stringify(layer.content),
                        style: JSON.stringify(layer.style),
                        ordering: layer.ordering || 0
                    }
                });
            }
        }

        // Create global layers
        for (const layer of (data.globalLayers || [])) {
            await this.db.query({
                operation: "insert",
                table: "plugin_lexslider_global_layers",
                data: {
                    slider_id: newSliderId,
                    type: layer.type,
                    content: JSON.stringify(layer.content),
                    style: JSON.stringify(layer.style),
                    ordering: layer.ordering || 0
                }
            });
        }

        return newSliderId;
    }

    /**
     * Delete a template
     */
    async delete(id: number | string): Promise<void> {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;

        await this.db.query({
            operation: "delete",
            table: "plugin_lexslider_templates",
            where: { id: numId }
        });
    }
}
