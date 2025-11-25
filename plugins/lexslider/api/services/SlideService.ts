import { WorkerPluginAPI } from '../../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';

export interface Layer {
    id: string;
    type: 'heading' | 'text' | 'image' | 'button' | 'video';
    content: string;
    style: Record<string, any>;
    animation?: {
        in?: string;
        out?: string;
        delay?: number;
        duration?: number;
    };
}

export interface Slide {
    id?: string;
    sliderId: string;
    order: number;
    background: {
        type: 'image' | 'video' | 'color';
        url?: string;
        color?: string;
        position?: string;
    };
    layers: Layer[];
    settings: {
        duration: number;
    };
}

export class SlideService {
    private api: WorkerPluginAPI;
    private collection = 'slides';

    constructor(api: WorkerPluginAPI) {
        this.api = api;
    }

    async create(data: Omit<Slide, 'id'>): Promise<Slide> {
        return await this.api.db.collection(this.collection).create(data);
    }

    async update(id: string, data: Partial<Slide>): Promise<Slide> {
        await this.api.db.collection(this.collection).update({ id }, data);
        return { id, ...data } as Slide;
    }

    async delete(id: string): Promise<void> {
        await this.api.db.collection(this.collection).delete({ id });
    }

    async getBySlider(sliderId: string): Promise<Slide[]> {
        const slides = await this.api.db.collection(this.collection).find({ sliderId });
        // Sort manually since API doesn't support sort option
        return (slides as Slide[]).sort((a, b) => a.order - b.order);
    }

    async reorder(ids: string[]): Promise<void> {
        // This would ideally be a transaction or batch update
        for (let i = 0; i < ids.length; i++) {
            await this.update(ids[i], { order: i });
        }
    }
}
