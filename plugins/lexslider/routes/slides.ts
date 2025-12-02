
export const registerSlideRoutes = (ctx: any) => {
    // GET /sliders/:id/slides
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id/slides",
        permission: "route:GET:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];

            return await db.query({
                operation: "findMany",
                table: "plugin_lexslider_slides",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });
        }
    });

    // POST /sliders/:id/slides
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/sliders/:id/slides",
        permission: "route:POST:/sliders/:id/slides",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const sliderId = parts[parts.length - 2];
            const body = req.body;

            const result = await db.query({
                operation: "insert",
                table: "plugin_lexslider_slides",
                data: {
                    slider_id: sliderId,
                    title: body.title || "New Slide",
                    background_image: body.background_image || "",
                    ordering: body.ordering || 0
                }
            });
            return result.rows?.[0] || result[0] || result;
        }
    });

    // PUT /slides/:id
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/slides/:id",
        permission: "route:PUT:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            const body = req.body;

            // 1. Update Slide Props
            await db.query({
                operation: "update",
                table: "plugin_lexslider_slides",
                where: { id },
                data: {
                    title: body.title,
                    background_image: body.background_image,
                    ordering: body.ordering,
                    ken_burns: body.ken_burns ? 1 : 0,
                    transition: body.transition || 'fade',
                    duration: body.duration || 500
                }
            });

            // 2. Update Layers
            if (body.layers && Array.isArray(body.layers)) {
                await db.query({
                    operation: "delete",
                    table: "plugin_lexslider_layers",
                    where: { slide_id: id }
                });

                for (const layer of body.layers) {
                    await db.query({
                        operation: "insert",
                        table: "plugin_lexslider_layers",
                        data: {
                            slide_id: id,
                            type: layer.type,
                            content: JSON.stringify(layer.content),
                            style: JSON.stringify(layer.style),
                            ordering: layer.ordering || 0,
                            locked: layer.locked ? 1 : 0,
                            hidden: layer.hidden ? 1 : 0,
                            start_time: layer.startTime || 0,
                            duration: layer.duration || 5000
                        }
                    });
                }
            }

            return { success: true };
        }
    });

    // DELETE /slides/:id
    ctx.registerRoute(ctx.sandbox, {
        method: "DELETE",
        path: "/slides/:id",
        permission: "route:DELETE:/slides/:id",
        handler: async ({ req, db }: any) => {
            const id = req.path.split("/").pop();
            await db.query({
                operation: "delete",
                table: "plugin_lexslider_slides",
                where: { id }
            });
            return { success: true };
        }
    });
};
