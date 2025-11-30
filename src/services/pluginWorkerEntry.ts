
/// <reference lib="webworker" />
console.log("[worker-entry] Worker script loaded");
import { MainToWorkerMessage, WorkerToMainMessage } from "./pluginRpc.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const handlers = {
    routes: new Map<string, Function>(), // key: METHOD:PATH
    hooks: new Map<string, Function[]>(), // key: hookName
};

const pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

function postMsg(msg: WorkerToMainMessage) {
    self.postMessage(msg);
}

function generateId() {
    return Math.random().toString(36).slice(2);
}

// Sandbox implementation
const createSandbox = (pluginName: string) => ({
    plugin: pluginName,
    capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] }, // TODO: receive from init
});

// Context implementation
const createCtx = (pluginName: string) => ({
    sandbox: createSandbox(pluginName),
    registerRoute: (_sandbox: any, route: any) => {
        const key = `${route.method.toUpperCase()}:${route.path}`;
        handlers.routes.set(key, route.handler);
        postMsg({
            type: "registerRoute",
            payload: {
                method: route.method,
                path: route.path,
                permission: route.permission,
            },
        });
    },
    registerHook: (_sandbox: any, hook: any) => {
        const list = handlers.hooks.get(hook.name) ?? [];
        list.push(hook.handler);
        handlers.hooks.set(hook.name, list);
        postMsg({
            type: "registerHook",
            payload: {
                name: hook.name,
                permission: hook.permission,
            },
        });
    },
    ui: {
        registerSlot: (slot: string, label: string, url: string) => {
            postMsg({
                type: "registerUiSlot",
                payload: { slot, label, url }
            });
        },
        registerAsset: (type: "css" | "js", url: string) => {
            postMsg({
                type: "registerAsset",
                payload: { type, url }
            });
        },
        registerWidget: (widget: string, label: string, renderUrl: string) => {
            postMsg({
                type: "registerWidget",
                payload: { widget, label, renderUrl }
            });
        }
    },
    registerCron: () => {
        // TODO: Implement cron in worker
        console.warn("Cron not yet supported in worker");
    }
});

self.onmessage = async (e: MessageEvent<MainToWorkerMessage>) => {
    const msg = e.data;

    if (msg.type === "init") {
        try {
            const pluginPath = join(Deno.cwd(), "plugins", msg.pluginName, "index.ts");
            const mod = await import(`file://${pluginPath}`);
            const registerFn = mod.default || mod.register;

            if (typeof registerFn !== "function") {
                throw new Error("Plugin does not export register function");
            }

            await registerFn(createCtx(msg.pluginName));
            postMsg({ type: "ready" });
        } catch (err) {
            postMsg({ type: "error", error: err instanceof Error ? err.message : String(err) });
        }
    } else if (msg.type === "invokeRoute") {
        const method = msg.req.method.toUpperCase();
        const path = msg.req.path;

        let handler;
        let params = {};

        // Try exact match first
        const exactKey = `${method}:${path}`;
        if (handlers.routes.has(exactKey)) {
            handler = handlers.routes.get(exactKey);
        } else {
            // Try parameterized match
            for (const [key, h] of handlers.routes.entries()) {
                // Split only on first colon to avoid breaking on :param syntax
                const firstColon = key.indexOf(":");
                const rMethod = key.substring(0, firstColon);
                const rPath = key.substring(firstColon + 1);

                if (rMethod !== method) continue;

                const routeParts = rPath.split('/');
                const reqParts = path.split('/');

                if (routeParts.length !== reqParts.length) continue;

                let match = true;
                const currentParams: any = {};

                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith(':')) {
                        currentParams[routeParts[i].slice(1)] = reqParts[i];
                    } else if (routeParts[i] !== reqParts[i]) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    handler = h;
                    params = currentParams;
                    break;
                }
            }
        }

        if (!handler) {
            postMsg({ type: "routeResult", id: msg.id, response: { status: 404, body: { error: "Route handler not found in worker" } } });
            return;
        }

        try {
            // Mock request object
            const req = {
                ...msg.req,
                json: async () => msg.req.body,
                text: async () => JSON.stringify(msg.req.body),
            };

            // SDK DB client
            const db = {
                query: async (req: any) => {
                    const id = generateId();
                    return new Promise((resolve, reject) => {
                        pendingRequests.set(id, { resolve, reject });
                        postMsg({ type: "dbRequest", id, req });
                    });
                },
                collection: (table: string) => ({
                    findMany: async (where?: any, opts?: any) => {
                        const id = generateId();
                        return new Promise((resolve, reject) => {
                            pendingRequests.set(id, { resolve, reject });
                            postMsg({ type: "dbRequest", id, req: { operation: "findMany", table, where, ...opts } });
                        });
                    },
                    findOne: async (where: any) => {
                        const id = generateId();
                        return new Promise((resolve, reject) => {
                            pendingRequests.set(id, { resolve, reject });
                            postMsg({ type: "dbRequest", id, req: { operation: "findOne", table, where } });
                        });
                    },
                    insert: async (data: any) => {
                        const id = generateId();
                        return new Promise((resolve, reject) => {
                            pendingRequests.set(id, { resolve, reject });
                            postMsg({ type: "dbRequest", id, req: { operation: "insert", table, data } });
                        });
                    }
                })
            };

            // Mock Fetch
            const fetchFn = async (url: string, init?: RequestInit) => {
                const id = generateId();
                return new Promise((resolve, reject) => {
                    pendingRequests.set(id, { resolve, reject });
                    postMsg({ type: "fetch", id, url, init });
                });
            };

            const result = await handler({ req, db, fetch: fetchFn });

            // Normalize result
            let response = { status: 200, body: result, headers: {} };
            if (result instanceof Response) {
                // TODO: Handle Response objects properly (serialize them)
                // For now assume JSON
                response.body = "Response object serialization not implemented";
            }

            postMsg({ type: "routeResult", id: msg.id, response });
        } catch (err) {
            postMsg({ type: "routeResult", id: msg.id, response: { status: 500, body: { error: String(err) } } });
        }
    } else if (msg.type === "dbResponse") {
        const p = pendingRequests.get(msg.id);
        if (p) {
            pendingRequests.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error));
            else p.resolve(msg.data);
        }
    }
    // TODO: Handle fetchResult, fsResult, invokeHook
};
