import { WorkerPluginAPI } from '../../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { SliderService } from './SliderService.ts';
import { SlideService } from './SlideService.ts';
import { LayerService } from './LayerService.ts';

export class ExportService {
    private sliderService: SliderService;
    private slideService: SlideService;
    private layerService: LayerService;

    constructor(private api: WorkerPluginAPI) {
        this.sliderService = new SliderService(api);
        this.slideService = new SlideService(api);
        this.layerService = new LayerService(api);
    }

    async exportSlider(sliderId: number) {
        // Get slider (using 'get' method)
        const slider: any = await this.sliderService.get(sliderId.toString());
        if (!slider) throw new Error('Slider not found');

        // Get slides (using 'getBySlider' method)
        const slides = await this.slideService.getBySlider(sliderId.toString());

        // Get layers for each slide
        const slidesWithLayers = await Promise.all(
            slides.map(async (slide: any) => {
                const layers = await this.layerService.listLayers(parseInt(slide.id));
                return {
                    ...slide,
                    layers: layers.map((layer: any) => ({
                        ...layer,
                        settings: JSON.parse(layer.settings || '{}'),
                        position: JSON.parse(layer.position || '{}'),
                        animations: JSON.parse(layer.animations || '{}'),
                        responsive_settings: JSON.parse(layer.responsive_settings || '{}'),
                    })),
                };
            })
        );

        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            slider: {
                ...slider,
                config: slider.config, // Already parsed by service
            },
            slides: slidesWithLayers,
        };
    }

    async importSlider(data: any) {
        // Validate version
        if (!data.version || data.version !== '1.0.0') {
            throw new Error('Unsupported export version');
        }

        // Create slider (using 'create' method)
        const { id: _, createdAt, updatedAt, ...sliderData } = data.slider;
        const newSlider: any = await this.sliderService.create({
            ...sliderData,
            name: `${sliderData.name} (Imported)`,
        });

        // Create slides
        for (const slideData of data.slides) {
            const { id: __, sliderId, layers, ...slideFields } = slideData;

            const newSlide: any = await this.slideService.create({
                ...slideFields,
                sliderId: newSlider.id,
            });

            // Create layers
            if (layers && Array.isArray(layers)) {
                for (const layerData of layers) {
                    const { id: ___, slide_id, created_at, updated_at, ...layerFields } = layerData;
                    await this.layerService.createLayer(parseInt(newSlide.id), layerFields);
                }
            }
        }

        return newSlider;
    }
}
