
import {
  type PluginManifest,
  validateManifestAgainstPermissions,
} from "./pluginManifest.ts";
import { registerRoute, registerHook, clearRuntime } from "./pluginRuntime.ts";
import { MainToWorkerMessage, WorkerToMainMessage } from "./pluginRpc.ts";
import { db } from "../config/db.ts";

export type WorkerHandle = {
  name: string;
  worker: Worker;
  status: "running" | "stopped" | "error";
  startedAt: number;
  permissions: Set<string>;
  pendingInvocations: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>;
};

const workers = new Map<string, WorkerHandle>();

function generateId() {
  return Math.random().toString(36).slice(2);
}

export async function startWorker(
  name: string,
  permissions: string[] = [],
  manifest?: PluginManifest,
) {
  if (manifest) {
    const missing = validateManifestAgainstPermissions(manifest, permissions);
    if (missing.length > 0) {
      throw new Error(`Manifest requests permissions not granted: ${missing.join(", ")}`);
    }
  }

  const workerUrl = new URL("./pluginWorkerEntry.ts", import.meta.url).href;
  const worker = new Worker(workerUrl, { type: "module", name });

  const handle: WorkerHandle = {
    name,
    worker,
    status: "running",
    startedAt: Date.now(),
    permissions: new Set(permissions),
    pendingInvocations: new Map(),
  };

  workers.set(name, handle);

  worker.onmessage = async (e: MessageEvent<WorkerToMainMessage>) => {
    const msg = e.data;
    console.log(`[worker-host] Received message from ${name}:`, msg.type);
    switch (msg.type) {
      case "ready":
        console.log(`[worker] ${name} ready`);
        break;
      case "error":
        console.error(`[worker] ${name} error:`, msg.error);
        handle.status = "error";
        break;
      case "registerRoute":
        registerRoute(
          { plugin: name, capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } }, // TODO: capabilities from manifest
          {
            method: msg.payload.method,
            path: msg.payload.path,
            permission: msg.payload.permission,
            plugin: name,
            capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] },
            handler: async (reqCtx: any) => {
              const id = generateId();
              // Serialize request
              const reqPayload = {
                method: reqCtx.req.method,
                path: reqCtx.req.path, // This might need stripping prefix logic if not done in router
                headers: [], // TODO: serialize headers
                body: await reqCtx.req.json().catch(() => ({})), // TODO: handle body better
              };

              return new Promise((resolve, reject) => {
                handle.pendingInvocations.set(id, { resolve, reject });
                worker.postMessage({ type: "invokeRoute", id, req: reqPayload } as MainToWorkerMessage);
              });
            }
          }
        );
        break;
      case "registerHook":
        const { registerHook } = await import("./pluginRuntime.ts");
        registerHook({ plugin: name, capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } }, {
          name: msg.payload.name,
          handler: async (...args: any[]) => {
            const id = crypto.randomUUID();
            worker.postMessage({ type: "invokeHook", id, name: msg.payload.name, args } as MainToWorkerMessage);
            // Wait for result? Hooks might be async.
            // For now fire and forget or implement result waiting if needed.
          },
          permission: msg.payload.permission,
          plugin: name,
          capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] }, // TODO: Real capabilities
        });
        break;
      case "registerUiSlot":
        const { registerUiSlot } = await import("./pluginRuntime.ts");
        registerUiSlot({ plugin: name, capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } }, msg.payload.slot, msg.payload.label, msg.payload.url);
        break;
      case "registerAsset":
        const { registerAsset } = await import("./pluginRuntime.ts");
        registerAsset({ plugin: name, capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } }, msg.payload.type, msg.payload.url);
        break;
      case "registerWidget":
        const { registerWidget } = await import("./pluginRuntime.ts");
        registerWidget({ plugin: name, capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } }, msg.payload.widget, msg.payload.label, msg.payload.renderUrl);
        break;
      case "routeResult":
        const p = handle.pendingInvocations.get(msg.id);
        if (p) {
          handle.pendingInvocations.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error));
          else p.resolve(msg.response?.body); // Return body directly for now
        }
        break;
      case "dbRequest":
        try {
          const { handleDbRequest } = await import("./pluginDbAdapter.ts");
          const result = await handleDbRequest(name, msg.req);
          worker.postMessage({ type: "dbResponse", id: msg.id, data: result } as MainToWorkerMessage);
        } catch (err) {
          // Sanitize error message to avoid exposing SQL details
          const errorMsg = err instanceof Error
            ? (err.message.includes("Failed query") ? "Database operation failed" : err.message)
            : "Database error occurred";
          console.error(`[DB Error for ${name}]:`, err);
          worker.postMessage({ type: "dbResponse", id: msg.id, error: errorMsg } as MainToWorkerMessage);
        }
        break;
      // TODO: Handle fetch, fsRead
    }
  };

  // Init worker
  worker.postMessage({
    type: "init",
    pluginName: name,
    permissions,
    config: {}
  } as MainToWorkerMessage);

  return handle;
}

export function stopWorker(name: string) {
  const w = workers.get(name);
  if (w) {
    w.worker.terminate();
    workers.delete(name);
    clearRuntime(name);
  }
}

export function getWorker(name: string) {
  return workers.get(name);
}

export function setWorkerError(name: string, error: string) {
  const w = workers.get(name);
  if (!w) return;
  w.status = "error";
  // w.error = error; // WorkerHandle type update needed if I want to store error
}

export function hasPermission(name: string, permission: string): boolean {
  const worker = workers.get(name);
  if (!worker) return false;
  return worker.permissions.has(permission);
}

export function assertPermission(name: string, permission: string) {
  if (!hasPermission(name, permission)) {
    throw new Error(`Worker ${name} missing permission ${permission}`);
  }
}
