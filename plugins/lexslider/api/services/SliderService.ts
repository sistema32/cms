import { WorkerPluginAPI } from '../../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';

export interface SliderConfig {
    width: number;
    height: number;
    mode: 'boxed' | 'fullwidth' | 'fullscreen';
    autoplay: {
        enabled: boolean;
        duration: number;
        pauseOnHover: boolean;
    };
    arrows: {
        enabled: boolean;
        style: 'simple' | 'circle' | 'minimal';
    };
}

export interface Slider {
    id?: string;
    name: string;
    alias: string;
    config: SliderConfig;
    createdAt?: Date;
    updatedAt?: Date;
}

export class SliderService {
    private api: WorkerPluginAPI;
    private collection = 'sliders';

    constructor(api: WorkerPluginAPI) {
        this.api = api;
    }

    async create(data: Omit<Slider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Slider> {
        return await this.api.db.collection(this.collection).create({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    async update(id: string, data: Partial<Slider>): Promise<Slider> {
        await this.api.db.collection(this.collection).update({ id }, {
            ...data,
            updatedAt: new Date()
        });
        return { id, ...data } as Slider; // Return updated object (mock for now as update returns count)
    }

    async delete(id: string): Promise<void> {
        await this.api.db.collection(this.collection).delete({ id });
        // TODO: Delete associated slides
    }

    async get(id: string): Promise<Slider | null> {
        return await this.api.db.collection(this.collection).findOne({ id });
    }

    async list(): Promise<Slider[]> {
        return await this.api.db.collection(this.collection).find({});
    }
}
