import { WorkerPluginAPI } from '../../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';

export class LayerService {
    constructor(private api: WorkerPluginAPI) { }

    async listLayers(slideId: number) {
        const layers = await this.api.db.collection('layers').find({ slide_id: slideId });
        // Sort manually since API doesn't support sort option
        return (layers as any[]).sort((a, b) => a.order - b.order);
    }

    async getLayer(id: number) {
        return await this.api.db.collection('layers').findOne({ id });
    }

    async createLayer(slideId: number, data: any) {
        // Get max order for this slide
        const layers = await this.listLayers(slideId);
        const maxOrder = layers.length > 0 ? Math.max(...layers.map((l: any) => l.order)) : -1;

        return await this.api.db.collection('layers').create({
            slide_id: slideId,
            type: data.type || 'text',
            content: data.content || '',
            settings: JSON.stringify(data.settings || {}),
            position: JSON.stringify(data.position || { x: 0, y: 0, width: 200, height: 100, zIndex: 1 }),
            animations: JSON.stringify(data.animations || { in: null, out: null, loop: null }),
            responsive_settings: JSON.stringify(data.responsiveSettings || {}),
            order: maxOrder + 1,
        });
    }

    async updateLayer(id: number, data: any) {
        const updateData: any = {};

        if (data.type !== undefined) updateData.type = data.type;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
        if (data.position !== undefined) updateData.position = JSON.stringify(data.position);
        if (data.animations !== undefined) updateData.animations = JSON.stringify(data.animations);
        if (data.responsiveSettings !== undefined) updateData.responsive_settings = JSON.stringify(data.responsiveSettings);
        if (data.order !== undefined) updateData.order = data.order;

        updateData.updated_at = new Date().toISOString();

        await this.api.db.collection('layers').update({ id }, updateData);
        return await this.getLayer(id);
    }

    async deleteLayer(id: number) {
        return await this.api.db.collection('layers').delete({ id });
    }

    async reorderLayer(id: number, newOrder: number) {
        const layer: any = await this.getLayer(id);
        if (!layer) throw new Error('Layer not found');

        const layers = await this.listLayers(layer.slide_id);
        const oldOrder = layer.order;

        // Reorder other layers
        for (const l of layers) {
            if (l.id === id) continue;

            if (newOrder > oldOrder) {
                // Moving down: shift layers up
                if (l.order > oldOrder && l.order <= newOrder) {
                    await this.api.db.collection('layers').update(
                        { id: l.id },
                        { order: l.order - 1 }
                    );
                }
            } else {
                // Moving up: shift layers down
                if (l.order >= newOrder && l.order < oldOrder) {
                    await this.api.db.collection('layers').update(
                        { id: l.id },
                        { order: l.order + 1 }
                    );
                }
            }
        }

        // Update target layer
        return await this.updateLayer(id, { order: newOrder });
    }

    async duplicateLayer(id: number) {
        const layer: any = await this.getLayer(id);
        if (!layer) throw new Error('Layer not found');

        const { id: _, created_at, updated_at, ...layerData } = layer;

        return await this.createLayer(layer.slide_id, {
            ...layerData,
            settings: JSON.parse(layer.settings || '{}'),
            position: JSON.parse(layer.position || '{}'),
            animations: JSON.parse(layer.animations || '{}'),
            responsiveSettings: JSON.parse(layer.responsive_settings || '{}'),
        });
    }
}
