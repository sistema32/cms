/**
 * ExportService - Export and Import sliders as JSON
 */

import { NotFoundError } from '../utils/errors.ts';
import { validateSliderId } from '../utils/validation.ts';

export interface ExportData {
    version: string;
    exportedAt: string;
    slider: {
        name: string;
        width: number;
        height: number;
        type: string;
        settings: Record<string, unknown>;
    };
    slides: Array<{
        title?: string;
        background_image?: string;
        transition?: string;
        duration?: number;
        ordering: number;
        ken_burns?: boolean;
        layers: Array<{
            type: string;
            content: Record<string, unknown>;
            style: Record<string, unknown>;
            ordering: number;
        }>;
    }>;
    globalLayers: Array<{
        type: string;
        content: Record<string, unknown>;
        style: Record<string, unknown>;
        ordering: number;
    }>;
}

// deno-lint-ignore no-explicit-any
type DbClient = { query: (opts: any) => Promise<any> };

export class ExportService {
    constructor(private db: DbClient) { }

    /**
     * Export slider as JSON
     */
    async exportSlider(sliderId: number | string): Promise<ExportData> {
        const numId = typeof sliderId === 'string' ? validateSliderId(sliderId) : sliderId;

        // Fetch slider
        const sliderRes = await this.db.query({
            operation: "findOne",
            table: "plugin_lexslider_sliders",
            where: { id: numId }
        });

        const slider = sliderRes?.rows?.[0] || sliderRes;
        if (!slider || !slider.id) {
            throw new NotFoundError('Slider', numId);
        }

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

            const layers = (layersRes.rows || layersRes || []).map((l: any) => ({
                type: l.type,
                content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style,
                ordering: l.ordering || 0
            }));

            return {
                title: slide.title,
                background_image: slide.background_image,
                transition: slide.transition,
                duration: slide.duration,
                ordering: slide.ordering,
                ken_burns: slide.ken_burns,
                layers
            };
        }));

        // Fetch global layers
        const globalLayersRes = await this.db.query({
            operation: "findMany",
            table: "plugin_lexslider_global_layers",
            where: { slider_id: numId },
            orderBy: "ordering ASC"
        });

        const globalLayers = (globalLayersRes.rows || globalLayersRes || []).map((l: any) => ({
            type: l.type,
            content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
            style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style,
            ordering: l.ordering || 0
        }));

        return {
            version: "4.0",
            exportedAt: new Date().toISOString(),
            slider: {
                name: slider.name,
                width: slider.width,
                height: slider.height,
                type: slider.type,
                settings: typeof slider.settings === 'string' ? JSON.parse(slider.settings) : (slider.settings || {})
            },
            slides: slidesWithLayers,
            globalLayers
        };
    }

    /**
     * Import slider from JSON
     */
    async importSlider(data: ExportData, overrideName?: string): Promise<number> {
        // Validate data structure
        if (!data.version || !data.slider) {
            throw new Error("Invalid export data: missing version or slider");
        }

        // Create slider
        const sliderResult = await this.db.query({
            operation: "insert",
            table: "plugin_lexslider_sliders",
            data: {
                name: overrideName || data.slider.name || "Imported Slider",
                width: data.slider.width || 1200,
                height: data.slider.height || 600,
                type: data.slider.type || 'simple',
                settings: JSON.stringify(data.slider.settings || {})
            }
        });

        const newSliderId = sliderResult.rows?.[0]?.id || sliderResult[0]?.id;

        // Create slides
        for (let i = 0; i < (data.slides || []).length; i++) {
            const slide = data.slides[i];

            const slideResult = await this.db.query({
                operation: "insert",
                table: "plugin_lexslider_slides",
                data: {
                    slider_id: newSliderId,
                    title: slide.title || `Slide ${i + 1}`,
                    background_image: slide.background_image || '',
                    transition: slide.transition || 'fade',
                    duration: slide.duration || 5000,
                    ordering: slide.ordering ?? i,
                    ken_burns: slide.ken_burns || false
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
                        content: JSON.stringify(layer.content || {}),
                        style: JSON.stringify(layer.style || {}),
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
                    content: JSON.stringify(layer.content || {}),
                    style: JSON.stringify(layer.style || {}),
                    ordering: layer.ordering || 0
                }
            });
        }

        return newSliderId;
    }

    /**
     * Duplicate an existing slider
     */
    async duplicateSlider(sliderId: number | string, newName?: string): Promise<number> {
        const exportData = await this.exportSlider(sliderId);
        const name = newName || `${exportData.slider.name} (Copy)`;
        return this.importSlider(exportData, name);
    }
}
