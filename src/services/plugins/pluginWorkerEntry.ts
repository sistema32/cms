// @ts-nocheck
/// <reference lib="webworker" />
console.log("[worker-entry] Worker script loaded");
import { MainToWorkerMessage, WorkerToMainMessage } from "./pluginRpc.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
// Cron import will be dynamic in registerCron

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

function isBundleMissing(err: unknown) {
    if (err instanceof Deno.errors.NotFound) return true;
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    return msg.includes("not found") || msg.includes("cannot resolve") || msg.includes("no such file");
}

// Sandbox implementation
const createSandbox = (pluginName: string, capabilities: any) => ({
    plugin: pluginName,
    capabilities: capabilities || { dbRead: false, dbWrite: false, fsRead: false, fsWrite: false, httpAllowlist: [] },
});

// Context implementation
const createCtx = (pluginName: string, capabilities: any) => ({
    sandbox: createSandbox(pluginName, capabilities),
    sdk: {
        db: createDbClient(),
        fs: createFsClient(),
        fetch: createFetchClient(),
    },
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
    registerUiSlot: (slot: string, label: string, url: string) => {
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
    },
    registerCron: async (schedule: string, handler: Function, permission?: string) => {
        // Use croner library for full cron support
        const { createCronJob } = await import("./pluginCronParser.ts");

        if (permission) {
            // Permission check will be done by main thread when registering
            postMsg({
                type: "registerCron",
                payload: { schedule, permission }
            });
        }

        // Set up cron job with full cron syntax support
        const stopCron = createCronJob(schedule, async () => {
            try {
                await handler();
            } catch (err) {
                console.error(`[cron error] ${schedule}:`, err);
            }
        });

        // Store stop function for cleanup if needed
        // TODO: Add cleanup mechanism when plugin is deactivated
    }
});

function createDbClient() {
    const rpc = (req: any) => {
        const id = generateId();
        return new Promise((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
            postMsg({ type: "dbRequest", id, req });
        });
    };
    return {
        query: (table: string, where?: any) => rpc({ operation: "findMany", table, where }),
        findOne: (table: string, where: any) => rpc({ operation: "findOne", table, where }),
        insert: (table: string, data: any) => rpc({ operation: "insert", table, data }),
        update: (table: string, where: any, data: any) => rpc({ operation: "update", table, where, data }),
        delete: (table: string, where: any) => rpc({ operation: "delete", table, where }),
        collection: (table: string) => ({
            findMany: (where?: any, opts?: any) => rpc({ operation: "findMany", table, where, ...opts }),
            findOne: (where: any) => rpc({ operation: "findOne", table, where }),
            insert: (data: any) => rpc({ operation: "insert", table, data }),
            update: (where: any, data: any) => rpc({ operation: "update", table, where, data }),
            delete: (where: any) => rpc({ operation: "delete", table, where }),
        }),
    };
}

function createFsClient() {
    return {
        readText: (path: string) => {
            const id = generateId();
            return new Promise((resolve, reject) => {
                pendingRequests.set(id, { resolve, reject });
                postMsg({ type: "fsRead", id, path, method: "readText" });
            });
        },
        readFile: (path: string) => {
            const id = generateId();
            return new Promise((resolve, reject) => {
                pendingRequests.set(id, { resolve, reject });
                postMsg({ type: "fsRead", id, path, method: "readFile" });
            });
        },
    };
}

function createFetchClient() {
    return async (url: string, init?: RequestInit) => {
        const id = generateId();
        return new Promise((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
            postMsg({ type: "fetch", id, url, init });
        });
    };
}

self.onmessage = async (e: MessageEvent<MainToWorkerMessage>) => {
    const msg = e.data;

    if (msg.type === "init") {
        try {
            (self as any).__pluginName = msg.pluginName;
            (self as any).__pluginCaps = msg.capabilities;

            const pluginPath = join(Deno.cwd(), "plugins", msg.pluginName, "index.ts");
            const mod = await import(`file://${pluginPath}`);
            const registerFn = mod.default || mod.register;
            const onActivate = (mod as any).onActivate;

            if (typeof registerFn !== "function") {
                throw new Error("Plugin does not export register function");
            }

            await registerFn(createCtx(msg.pluginName, msg.capabilities));
            if (typeof onActivate === "function") {
                await onActivate(createCtx(msg.pluginName, msg.capabilities));
            }
            postMsg({ type: "ready" });
        } catch (err) {
            if (isBundleMissing(err)) {
                console.warn(`[worker-entry] ${msg.pluginName}: bundle not found, continuing without executing plugin code`);
                postMsg({ type: "ready" });
                return;
            }
            postMsg({ type: "error", error: err instanceof Error ? err.message : String(err) });
        }
    } else if (msg.type === "lifecycle" && msg.phase === "deactivate") {
        try {
            const pluginPath = join(Deno.cwd(), "plugins", (self as any).__pluginName ?? "unknown", "index.ts");
            const mod = await import(`file://${pluginPath}`);
            const onDeactivate = (mod as any).onDeactivate;
            if (typeof onDeactivate === "function") {
                await onDeactivate(createCtx((self as any).__pluginName ?? "unknown", (self as any).__pluginCaps ?? {}));
            }
        } catch (err) {
            console.warn("[worker-entry] onDeactivate failed:", err);
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
                    // The following block is from the user's instruction, but it seems to be a
                    // misplaced `case` statement from a `switch` block.
                    // I will integrate the type annotation for `req` into the existing `if/else if` structure.
                    // The original logic for finding handler and params will be preserved.
                    // The user's instruction seems to imply a full replacement of the invokeRoute block,
                    // but the provided snippet is incomplete for that.
                    // I will apply the type annotation for `req` as requested,
                    // and keep the existing route matching logic.
                }
            }
        }

        if (!handler) {
            postMsg({ type: "routeResult", id: msg.id, response: { status: 404, body: { error: "Route handler not found in worker" } } });
            return;
        }

        try {
            // Mock request object
            const headersObj: Record<string, string> = {};
            for (const [key, value] of msg.req.headers || []) {
                headersObj[key] = value;
            }

            const req: {
                method: string;
                path: string;
                headers: Record<string, string>;
                query: Record<string, string>;
                params: Record<string, string>;
                json: () => Promise<any>;
                text: () => Promise<string>;
                body?: any;
            } = {
                ...msg.req,
                headers: headersObj,
                query: msg.req.query || {},
                params,
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
    } else if (msg.type === "fetchResult") {
        const p = pendingRequests.get(msg.id);
        if (p) {
            pendingRequests.delete(msg.id);
            if (msg.error) {
                p.reject(new Error(msg.error));
            } else if (msg.response) {
                // Reconstruct Response object
                const headers = new Headers(msg.response.headers);
                const response = new Response(msg.response.body, {
                    status: msg.response.status,
                    statusText: msg.response.statusText,
                    headers
                });
                p.resolve(response);
            }
        }
    } else if (msg.type === "fsResult") {
        const p = pendingRequests.get(msg.id);
        if (p) {
            pendingRequests.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error));
            else p.resolve(msg.data);
        }
    } else if (msg.type === "invokeHook") {
        const hookHandlers = handlers.hooks.get(msg.name) ?? [];
        for (const h of hookHandlers) {
            try {
                await h(...msg.args);
            } catch (err) {
                console.error(`[hook error] ${msg.name}:`, err);
            }
        }
    }
};
