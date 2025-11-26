import type { CreateSliderInput, UpdateSliderInput, Slider } from "../db/schema.ts";

/**
 * Slider API Endpoints
 * All functions receive (request) with request.api, request.body, request.params
 */

export async function listSliders(request: any): Promise<Response> {
    try {
        const api = request.api;
        let sliders = await api.query(`
      SELECT * FROM lexslider_sliders 
      ORDER BY created_at DESC
    `);

        // Handle different DB driver result formats
        if (sliders && !Array.isArray(sliders) && Array.isArray(sliders.rows)) {
            sliders = sliders.rows;
        }

        // Ensure it is an array
        if (!Array.isArray(sliders)) {
            sliders = [];
        }

        return new Response(JSON.stringify(sliders), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function createSlider(request: any): Promise<Response> {
    try {
        const api = request.api;
        const data: CreateSliderInput = request.body;

        const slider = await api.db.collection('sliders').create({
            title: data.title,
            alias: data.alias || null,
            type: data.type || 'simple',
            width: data.width || 1200,
            height: data.height || 600,
            responsive: JSON.stringify(data.responsive || {}),
            settings: JSON.stringify(data.settings || {}),
            created_by: 1
        });

        return new Response(JSON.stringify(slider), {
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

export async function getSlider(request: any): Promise<Response> {
    try {
        const api = request.api;
        const id = request.params.id;

        let slider = await api.query(`
      SELECT * FROM lexslider_sliders WHERE id = ?
    `, [id]);

        if (slider && !Array.isArray(slider) && Array.isArray(slider.rows)) {
            slider = slider.rows;
        }

        if (!slider || slider.length === 0) {
            return new Response(JSON.stringify({ error: "Slider not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get slides for this slider
        let slides = await api.query(`
      SELECT * FROM lexslider_slides 
      WHERE slider_id = ? 
      ORDER BY ordering ASC
    `, [id]);

        if (slides && !Array.isArray(slides) && Array.isArray(slides.rows)) {
            slides = slides.rows;
        }

        return new Response(JSON.stringify({
            ...slider[0],
            slides
        }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function updateSlider(request: any): Promise<Response> {
    try {
        const api = request.api;
        const id = request.params.id;
        const data: UpdateSliderInput = request.body;

        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push("title = ?");
            values.push(data.title);
        }
        if (data.alias !== undefined) {
            updates.push("alias = ?");
            values.push(data.alias);
        }
        if (data.type !== undefined) {
            updates.push("type = ?");
            values.push(data.type);
        }
        if (data.width !== undefined) {
            updates.push("width = ?");
            values.push(data.width);
        }
        if (data.height !== undefined) {
            updates.push("height = ?");
            values.push(data.height);
        }
        if (data.responsive !== undefined) {
            updates.push("responsive = ?");
            values.push(JSON.stringify(data.responsive));
        }
        if (data.settings !== undefined) {
            updates.push("settings = ?");
            values.push(JSON.stringify(data.settings));
        }
        // Handle 'config' as alias for 'settings' if needed, or remove if not used
        if ((data as any).config !== undefined) {
            updates.push("settings = ?");
            values.push(JSON.stringify((data as any).config));
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);

        await api.query(`
      UPDATE lexslider_sliders 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

        let slider = await api.query(`
      SELECT * FROM lexslider_sliders WHERE id = ?
    `, [id]);

        if (slider && !Array.isArray(slider) && Array.isArray(slider.rows)) {
            slider = slider.rows;
        }

        return new Response(JSON.stringify(slider[0]), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function deleteSlider(request: any): Promise<Response> {
    try {
        const api = request.api;
        const id = request.params.id;

        await api.query(`DELETE FROM lexslider_sliders WHERE id = ?`, [id]);

        return new Response(JSON.stringify({ message: "Slider deleted successfully" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function duplicateSlider(request: any): Promise<Response> {
    try {
        const api = request.api;
        const id = request.params.id;

        // Get original slider
        let original = await api.query(`
      SELECT * FROM lexslider_sliders WHERE id = ?
    `, [id]);

        if (original && !Array.isArray(original) && Array.isArray(original.rows)) {
            original = original.rows;
        }

        if (!original || original.length === 0) {
            return new Response(JSON.stringify({ error: "Slider not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const slider = original[0];

        // Create duplicate
        const newSlider = await api.db.collection('sliders').create({
            name: slider.name + " (Copy)",
            alias: null,
            type: slider.type,
            width: slider.width,
            height: slider.height,
            responsive: slider.responsive,
            settings: slider.settings,
            created_by: slider.created_by
        });

        const newSliderId = newSlider.id;

        // Duplicate slides
        const slides = await api.db.collection('slides').find({ slider_id: id });

        for (const slide of slides) {
            await api.db.collection('slides').create({
                slider_id: newSliderId,
                title: slide.title,
                ordering: slide.ordering,
                published: slide.published,
                background: slide.background,
                layers: slide.layers,
                settings: slide.settings
            });
        }

        return new Response(JSON.stringify(newSlider), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
