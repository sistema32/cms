
export const registerSliderRoutes = (ctx: any) => {
    // GET /sliders - List all sliders
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders",
        permission: "route:GET:/sliders",
        handler: async ({ db }: any) => {
            try {
                const result = await db.query({
                    operation: "findMany",
                    table: "plugin_lexslider_sliders",
                    orderBy: "created_at DESC"
                });
                const rows = result.rows || result;
                return rows.map((r: any) => ({ ...r, title: r.name }));
            } catch (e) {
                console.error("[LexSlider] GET /sliders error:", e);
                throw e;
            }
        }
    });

    // POST /sliders - Create new slider
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders",
        permission: "route:POST:/sliders",
        handler: async ({ req, db }: any) => {
            try {
                const body = req.body;
                console.log("[LexSlider] POST /sliders body:", body);

                if (!body.title) throw new Error("Title is required");

                const result = await db.query({
                    operation: "insert",
                    table: "plugin_lexslider_sliders",
                    data: {
                        name: body.title,
                        width: parseInt(body.width) || 1200,
                        height: parseInt(body.height) || 600,
                        type: body.type || 'simple'
                    }
                });

                // Ensure we return the created object. 
                // If insert doesn't return it, we might need to fetch it or construct it.
                // Assuming standard behavior where result contains the new row(s).
                const row = result.rows?.[0] || result[0] || result;

                // Fallback if row is just metadata
                if (!row.id && result.lastInsertId) {
                    return {
                        id: result.lastInsertId,
                        title: body.title,
                        width: parseInt(body.width) || 1200,
                        height: parseInt(body.height) || 600,
                        type: body.type || 'simple'
                    };
                }

                return { ...row, title: row.name };
            } catch (e) {
                console.error("[LexSlider] POST /sliders error:", e);
                throw e;
            }
        }
    });

    // GET /sliders/:id - Get slider details
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id",
        permission: "route:GET:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const sliderRes = await db.query({
                operation: "findOne",
                table: "plugin_lexslider_sliders",
                where: { id }
            });
            const slider = (sliderRes.rows && sliderRes.rows.length > 0) ? sliderRes.rows[0] : sliderRes;

            if (!slider) throw new Error("Slider not found");
            slider.title = slider.name;

            const slides = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            // Fetch layers for each slide
            const slidesWithLayers = await Promise.all((slides.rows || slides).map(async (slide: any) => {
                const layers = await db.query({
                    operation: "findMany",
                    table: "plugin_lexslider_layers",
                    where: { slide_id: slide.id },
                    orderBy: "ordering ASC"
                });

                const parsedLayers = (layers.rows || layers).map((l: any) => ({
                    ...l,
                    content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                    style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
                }));

                return { ...slide, layers: parsedLayers };
            }));

            return { ...slider, slides: slidesWithLayers };
        }
    });

    // PUT /sliders/:id
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/sliders/:id",
        permission: "route:PUT:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            const result = await db.query({
                operation: "update",
                table: "plugin_lexslider_sliders",
                where: { id },
                data: {
                    name: body.title,
                    width: body.width,
                    height: body.height,
                    type: body.type,
                    updated_at: new Date().toISOString()
                }
            });
            return { success: true, result };
        }
    });

    // DELETE /sliders/:id
    ctx.registerRoute(ctx.sandbox, {
        method: "DELETE",
        path: "/sliders/:id",
        permission: "route:DELETE:/sliders/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_lexslider_sliders",
                where: { id }
            });
            return { success: true };
        }
    });
};
