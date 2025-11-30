
export default function register(ctx: any) {
    ctx.registerRoute(ctx.sandbox, {
        method: "GET",
        path: "/ping",
        handler: async (reqCtx: any) => {
            // Test DB API
            try {
                // This should fail if table doesn't exist, or return empty if it does.
                // But the RPC call should succeed.
                // We query a table that matches the prefix to pass validation.
                await reqCtx.db.collection("plugin_core_system_test").findMany({});
                return { message: "pong from core-system worker (db query success)" };
            } catch (err) {
                return { message: "pong from core-system worker", dbError: String(err) };
            }
        },
        permission: "route:GET:/ping",
        plugin: "core-system",
        capabilities: ctx.sandbox.capabilities,
    });

    // Test UI Slot
    ctx.ui.registerSlot("sidebar", "Core System", "/plugins-static/core-system/index.html");
}
