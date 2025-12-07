/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

export default function (ctx: any) {
    console.log("[lexcommerce] Plugin starting...");

    // Register Sidebar Item
    ctx.registerUiSlot("sidebar", "LexCommerce", "plugin/lexcommerce/index.html", "ui:slot:sidebar");

    // --- API Routes ---

    // GET /products
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/products",
        permission: "route:GET:/products",
        handler: async ({ db }: any) => {
            const result = await db.query({
                operation: "findMany",
                table: "lexcommerce_products",
                orderBy: "created_at DESC"
            });
            return result.rows || result;
        }
    });

    // POST /products
    ctx.registerRoute(ctx.sandbox, {
        method: "POST",
        path: "/products",
        permission: "route:POST:/products",
        handler: async ({ req, db }: any) => {
            const body = req.body;
            if (!body.title) throw new Error("Title is required");

            // Simple slug generation
            let slug = body.slug;
            if (!slug) {
                slug = body.title.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }

            const result = await db.query({
                operation: "insert",
                table: "lexcommerce_products",
                data: {
                    title: body.title,
                    slug: slug,
                    price: body.price || 0,
                    type: body.type || 'simple',
                    status: body.status || 'draft'
                }
            });
            return result.rows?.[0] || result[0];
        }
    });
}
