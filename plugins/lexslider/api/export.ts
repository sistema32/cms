import { WorkerPluginAPI } from '../../../src/lib/plugin-system/worker/WorkerPluginAPI.ts';
import { ExportService } from './services/ExportService.ts';

export async function exportSlider(request: any) {
    const api = request.api as WorkerPluginAPI;
    const id = parseInt(request.params.id);
    const service = new ExportService(api);

    try {
        const data = await service.exportSlider(id);

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="lexslider-${id}-export.json"`,
            },
            body: data,
        };
    } catch (error: any) {
        return {
            status: 404,
            body: { error: error.message },
        };
    }
}

export async function importSlider(request: any) {
    const api = request.api as WorkerPluginAPI;
    const service = new ExportService(api);

    try {
        const data = request.body;
        const slider = await service.importSlider(data);

        return {
            status: 201,
            body: slider,
        };
    } catch (error: any) {
        return {
            status: 400,
            body: { error: error.message },
        };
    }
}
