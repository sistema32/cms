import type { WorkerPluginAPI } from "../../src/lib/plugin-system/worker/WorkerPluginAPI.ts";
import type { CreateSlideInput, UpdateSlideInput } from "../db/schema.ts";

/**
 * Slide API Endpoints
 */

export async function listSlides(request: any): Promise<Response> {
    try {
        const api = request.api as WorkerPluginAPI;
        const { sliderId } = request.params;

        let slides = await api.query(`
      SELECT * FROM lexslider_slides 
      WHERE slider_id = ? 
      ORDER BY ordering ASC
    `, [sliderId]);

        if (slides && !Array.isArray(slides) && Array.isArray(slides.rows)) {
            slides = slides.rows;
        }

        return new Response(JSON.stringify(slides), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function createSlide(request: any): Promise<Response> {
    try {
        const api = request.api as WorkerPluginAPI;
        const { sliderId } = request.params;
        const data: CreateSlideInput = request.body;

        // Get max ordering
        let maxOrdering = await api.query(`
      SELECT MAX(ordering) as max_order FROM lexslider_slides WHERE slider_id = ?
    `, [sliderId]);

        if (maxOrdering && !Array.isArray(maxOrdering) && Array.isArray(maxOrdering.rows)) {
            maxOrdering = maxOrdering.rows;
        }

        const nextOrdering = (maxOrdering[0]?.max_order || 0) + 1;

        const slide = await api.db.collection('slides').create({
            slider_id: sliderId,
            title: data.title || "Untitled Slide",
            ordering: data.ordering !== undefined ? data.ordering : nextOrdering,
            published: data.published !== undefined ? (data.published ? 1 : 0) : 1,
            background: JSON.stringify(data.background || {}),
            layers: JSON.stringify(data.layers || []),
            settings: JSON.stringify(data.settings || {})
        });

        return new Response(JSON.stringify(slide), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function updateSlide(request: any): Promise<Response> {
    try {
        const api = request.api as WorkerPluginAPI;
        const { id } = request.params;
        const data: UpdateSlideInput = request.body;

        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push("title = ?");
            values.push(data.title);
        }
        if (data.ordering !== undefined) {
            updates.push("ordering = ?");
            values.push(data.ordering);
        }
        if (data.published !== undefined) {
            updates.push("published = ?");
            values.push(data.published ? 1 : 0);
        }
        if (data.background !== undefined) {
            updates.push("background = ?");
            values.push(JSON.stringify(data.background));
        }
        if (data.layers !== undefined) {
            updates.push("layers = ?");
            values.push(JSON.stringify(data.layers));
        }
        if (data.settings !== undefined) {
            updates.push("settings = ?");
            values.push(JSON.stringify(data.settings));
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);

        await api.query(`
      UPDATE lexslider_slides 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

        let slide = await api.query(`
      SELECT * FROM lexslider_slides WHERE id = ?
    `, [id]);

        if (slide && !Array.isArray(slide) && Array.isArray(slide.rows)) {
            slide = slide.rows;
        }

        return new Response(JSON.stringify(slide[0]), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function deleteSlide(request: any): Promise<Response> {
    try {
        const api = request.api as WorkerPluginAPI;
        const { id } = request.params;

        await api.query(`DELETE FROM lexslider_slides WHERE id = ?`, [id]);

        return new Response(JSON.stringify({ message: "Slide deleted successfully" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function reorderSlide(request: any): Promise<Response> {
    try {
        const api = request.api as WorkerPluginAPI;
        const { id } = request.params;
        const { newOrdering } = request.body;

        await api.query(`
      UPDATE lexslider_slides 
      SET ordering = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newOrdering, id]);

        let slide = await api.query(`
      SELECT * FROM lexslider_slides WHERE id = ?
    `, [id]);

        if (slide && !Array.isArray(slide) && Array.isArray(slide.rows)) {
            slide = slide.rows;
        }

        return new Response(JSON.stringify(slide[0]), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}
