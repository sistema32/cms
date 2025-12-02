
import {
  type PluginManifest,
  validateManifestAgainstPermissions,
} from "./pluginManifest.ts";
import { registerRoute, registerHook, clearRuntime } from "./pluginRuntime.ts";
import { MainToWorkerMessage, WorkerToMainMessage } from "./pluginRpc.ts";
import { db } from "../config/db.ts";
import type { SandboxCapabilities } from "./pluginSandbox.ts";

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
  capabilities?: SandboxCapabilities,
) {
  if (manifest) {
    const missing = validateManifestAgainstPermissions(manifest, permissions);
    if (missing.length > 0) {
      throw new Error(
        `Plugin "${name}" is missing required permissions:\n` +
        missing.map(p => `  - ${p}`).join('\n') + '\n\n' +
        `To fix this:\n` +
        `1. Add to ${name}/manifest.json:\n` +
        `   "permissions": [${missing.map(p => `"${p}"`).join(', ')}]\n` +
        `2. Or grant via Admin UI: /admincp/plugins/${name}/permissions`
      );
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
          { plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } },
          {
            method: msg.payload.method,
            path: msg.payload.path,
            permission: msg.payload.permission,
            plugin: name,
            capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] },
            handler: async (reqCtx: any) => {
              const id = generateId();

              // Serialize request with better handling
              const headers: [string, string][] = [];
              reqCtx.req.raw.headers.forEach((value: string, key: string) => {
                headers.push([key, value]);
              });

              // Serialize body based on content-type
              let body = null;
              const contentType = reqCtx.req.header('content-type') || '';

              try {
                if (contentType.includes('application/json')) {
                  body = await reqCtx.req.json().catch(() => null);
                } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
                  const formData = await reqCtx.req.formData().catch(() => null);
                  if (formData) {
                    const formObj: Record<string, any> = {};
                    formData.forEach((value: FormDataEntryValue, key: string) => {
                      formObj[key] = value;
                    });
                    body = formObj;
                  }
                } else if (contentType.includes('text/')) {
                  body = await reqCtx.req.text().catch(() => null);
                } else if (reqCtx.req.body) {
                  // Try JSON as fallback
                  body = await reqCtx.req.json().catch(() => null);
                }
              } catch (err) {
                console.warn(`[worker] Body serialization failed:`, err);
                body = null;
              }

              const reqPayload = {
                method: reqCtx.req.method,
                path: reqCtx.req.path,
                query: reqCtx.req.query(),
                headers,
                body,
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
        registerHook({ plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } }, {
          name: msg.payload.name,
          handler: async (...args: any[]) => {
            const id = crypto.randomUUID();
            worker.postMessage({ type: "invokeHook", id, name: msg.payload.name, args } as MainToWorkerMessage);
            // Wait for result? Hooks might be async.
            // For now fire and forget or implement result waiting if needed.
          },
          permission: msg.payload.permission,
          plugin: name,
          capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] },
        });
        break;
      case "registerCron":
        const { registerCron } = await import("./pluginRuntime.ts");
        registerCron({ plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } }, {
          schedule: msg.payload.schedule,
          permission: msg.payload.permission,
          plugin: name,
          capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] },
        });
        break;
      case "registerUiSlot":
        const { registerUiSlot } = await import("./pluginRuntime.ts");
        registerUiSlot({ plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } }, msg.payload.slot, msg.payload.label, msg.payload.url);
        break;
      case "registerAsset":
        const { registerAsset } = await import("./pluginRuntime.ts");
        registerAsset({ plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } }, msg.payload.type, msg.payload.url);
        break;
      case "registerWidget":
        const { registerWidget } = await import("./pluginRuntime.ts");
        registerWidget({ plugin: name, capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] } }, msg.payload.widget, msg.payload.label, msg.payload.renderUrl);
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
      case "fetch":
        try {
          const { httpFetch } = await import("./pluginHttpSandbox.ts");
          const cap = capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] };
          const response = await httpFetch(msg.url, msg.init || {}, {
            allowlist: cap.httpAllowlist,
            timeoutMs: 10000
          });

          // Serialize response
          const headers: [string, string][] = [];
          response.headers.forEach((value, key) => {
            headers.push([key, value]);
          });

          const body = await response.text();

          worker.postMessage({
            type: "fetchResult",
            id: msg.id,
            response: {
              status: response.status,
              statusText: response.statusText,
              headers,
              body
            }
          } as MainToWorkerMessage);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Fetch Error for ${name}]:`, err);
          worker.postMessage({
            type: "fetchResult",
            id: msg.id,
            error: errorMsg
          } as MainToWorkerMessage);
        }
        break;
      case "fsRead":
        try {
          const { FsSandbox } = await import("./pluginFsSandbox.ts");
          const cap = capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] };

          if (!cap.fsRead) {
            throw new Error("Plugin does not have filesystem read capability");
          }

          const pluginDir = `./plugins/${name}`;
          const sandbox = new FsSandbox(pluginDir);

          let data;
          if (msg.method === "readText") {
            data = await sandbox.readText(msg.path);
          } else {
            const bytes = await sandbox.readFile(msg.path);
            // Convert Uint8Array to base64 for transfer
            data = btoa(String.fromCharCode(...bytes));
          }

          worker.postMessage({
            type: "fsResult",
            id: msg.id,
            data
          } as MainToWorkerMessage);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[FS Error for ${name}]:`, err);
          worker.postMessage({
            type: "fsResult",
            id: msg.id,
            error: errorMsg
          } as MainToWorkerMessage);
        }
        break;
    }
  };

  // Init worker
  worker.postMessage({
    type: "init",
    pluginName: name,
    permissions,
    capabilities: capabilities || { dbRead: false, fsRead: false, httpAllowlist: [] },
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
