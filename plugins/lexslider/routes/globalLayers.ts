
export const registerGlobalLayerRoutes = (ctx: any) => {
    // GET /sliders/:id/global-layers
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/sliders/:id/global-layers",
        permission: "route:GET:/sliders/:id/global-layers",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];

            const result = await db.query({
                operation: "findMany",
                table: "plugin_lexslider_global_layers",
                where: { slider_id: id },
                orderBy: "ordering ASC"
            });

            const rows = result.rows || result;
            return rows.map((l: any) => ({
                ...l,
                content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content,
                style: typeof l.style === 'string' ? JSON.parse(l.style) : l.style
            }));
        }
    });

    // PUT /sliders/:id/global-layers
    ctx.registerRoute(ctx.sandbox, {
        method: "PUT",
        path: "/sliders/:id/global-layers",
        permission: "route:PUT:/sliders/:id/global-layers",
        handler: async ({ req, db }: any) => {
            const parts = req.path.split("/");
            const id = parts[parts.length - 2];
            const body = req.body;

            if (body.layers && Array.isArray(body.layers)) {
                await db.query({
                    operation: "delete",
                    table: "plugin_lexslider_global_layers",
                    where: { slider_id: id }
                });

                for (const layer of body.layers) {
                    await db.query({
                        operation: "insert",
                        table: "plugin_lexslider_global_layers",
                        data: {
                            slider_id: id,
                            type: layer.type,
                            content: JSON.stringify(layer.content),
                            style: JSON.stringify(layer.style),
                            ordering: layer.ordering || 0
                        }
                    });
                }
            }
            return { success: true };
        }
    });
};
