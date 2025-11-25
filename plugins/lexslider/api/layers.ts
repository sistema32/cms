import { WorkerPluginAPI } from '../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { LayerService } from './services/LayerService.ts';

export async function listLayers(request: any) {
    const api = request.api as WorkerPluginAPI;
    const slideId = parseInt(request.params.slideId);
    const service = new LayerService(api);
    const layers = await service.listLayers(slideId);

    return {
        status: 200,
        body: layers.map((layer: any) => ({
            ...layer,
            settings: JSON.parse(layer.settings || '{}'),
            position: JSON.parse(layer.position || '{}'),
            animations: JSON.parse(layer.animations || '{}'),
            responsiveSettings: JSON.parse(layer.responsive_settings || '{}'),
        })),
    };
}

export async function createLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const slideId = parseInt(request.params.slideId);
    const service = new LayerService(api);
    const layer = await service.createLayer(slideId, request.body);

    return {
        status: 201,
        body: layer,
    };
}

export async function getLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const service = new LayerService(api);
    const layer: any = await service.getLayer(id);

    if (!layer) {
        return { status: 404, body: { error: 'Layer not found' } };
    }

    return {
        status: 200,
        body: {
            ...layer,
            settings: JSON.parse(layer.settings || '{}'),
            position: JSON.parse(layer.position || '{}'),
            animations: JSON.parse(layer.animations || '{}'),
            responsiveSettings: JSON.parse(layer.responsive_settings || '{}'),
        },
    };
}

export async function updateLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const service = new LayerService(api);
    const layer = await service.updateLayer(id, request.body);

    return {
        status: 200,
        body: layer,
    };
}

export async function deleteLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const service = new LayerService(api);
    await service.deleteLayer(id);

    return {
        status: 204,
        body: null,
    };
}

export async function reorderLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const { order } = request.body;
    const service = new LayerService(api);
    const layer = await service.reorderLayer(id, order);

    return {
        status: 200,
        body: layer,
    };
}

export async function duplicateLayer(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const service = new LayerService(api);
    const layer = await service.duplicateLayer(id);

    return {
        status: 201,
        body: layer,
    };
}
