/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

export default function (ctx: any) {
    console.log("[hello-world] Plugin starting...");

    ctx.registerRoute(null, {
        method: "GET",
        path: "/hello",
        permission: "route:GET:/hello",
        handler: async () => {
            return { message: "Hello from Hello World Plugin! 🌍" };
        }
    });

    // Register a link in the sidebar
    ctx.ui.registerSlot("sidebar", "Hello World", "/plugins-runtime/plugins-static/hello-world/index.html");
}
