/**
 * Render API - Public slider rendering endpoint
 */

import { WorkerPluginAPI } from '../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { SliderService } from './services/SliderService.ts';
import { SlideService } from './services/SlideService.ts';
import { LayerService } from './services/LayerService.ts';

export async function renderSlider(request: any) {
  const api = request.api as WorkerPluginAPI;
  const idOrAlias = request.params.sliderIdOrAlias;

  try {
    const sliderService = new SliderService(api);
    const slideService = new SlideService(api);
    const layerService = new LayerService(api);

    // Find slider by ID or alias
    let slider;
    if (idOrAlias.match(/^\d+$/)) {
      slider = await sliderService.get(idOrAlias);
    } else {
      const sliders = await sliderService.list();
      slider = sliders.find((s: any) => s.alias === idOrAlias);
    }

    if (!slider) {
      return {
        status: 404,
        body: { error: 'Slider not found' }
      };
    }

    // Get slides
    const slides = await slideService.getBySlider(slider.id!);

    // Get layers for each slide
    const slidesWithLayers = await Promise.all(
      slides.map(async (slide: any) => {
        const slideId = slide.id ? parseInt(slide.id) : 0;
        const layers = slideId ? await layerService.listLayers(slideId) : [];

        return {
          ...slide,
          background: typeof slide.background === 'string'
            ? JSON.parse(slide.background)
            : slide.background,
          settings: typeof slide.settings === 'string'
            ? JSON.parse(slide.settings)
            : slide.settings,
          layers: layers.map((layer: any) => ({
            ...layer,
            settings: typeof layer.settings === 'string'
              ? JSON.parse(layer.settings)
              : layer.settings,
            position: typeof layer.position === 'string'
              ? JSON.parse(layer.position)
              : layer.position,
            animations: typeof layer.animations === 'string'
              ? JSON.parse(layer.animations)
              : layer.animations,
            responsiveSettings: typeof layer.responsive_settings === 'string'
              ? JSON.parse(layer.responsive_settings)
              : layer.responsive_settings,
          }))
        };
      })
    );

    return {
      status: 200,
      body: {
        id: slider.id,
        name: slider.name,
        alias: slider.alias,
        config: typeof slider.config === 'string'
          ? JSON.parse(slider.config)
          : slider.config,
        slides: slidesWithLayers
      }
    };
  } catch (error: any) {
    api.logger.error(`Failed to render slider: ${error.message}`);
    return {
      status: 500,
      body: { error: 'Failed to render slider' }
    };
  }
}
