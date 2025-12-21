// @ts-nocheck
export type DbFilter = Record<string, any>; // Simple key-value for now, e.g. { id: 1, "age >": 18 }

import type { SandboxCapabilities } from "./pluginSandbox.ts";

export type DbRequest =
    | { operation: "findMany"; table: string; where?: DbFilter; limit?: number; offset?: number; orderBy?: string }
    | { operation: "findOne"; table: string; where: DbFilter; orderBy?: string }
    | { operation: "insert"; table: string; data: Record<string, any> }
    | { operation: "update"; table: string; where: DbFilter; data: Record<string, any> }
    | { operation: "delete"; table: string; where: DbFilter };

export type WorkerToMainMessage =
    | { type: "registerRoute"; payload: { method: string; path: string; permission: string } }
    | { type: "registerHook"; payload: { name: string; permission: string } }
    | { type: "registerCron"; payload: { schedule: string; permission: string } }
    | { type: "registerUiSlot"; payload: { slot: string; label: string; url: string; permission?: string } }
    | { type: "registerAsset"; payload: { type: "css" | "js"; url: string } }
    | { type: "registerWidget"; payload: { widget: string; label: string; renderUrl: string } }
    | { type: "dbRequest"; id: string; req: DbRequest }
    | { type: "fetch"; id: string; url: string; init?: RequestInit }
    | { type: "fsRead"; id: string; path: string; method: "readFile" | "readText" }
    | { type: "log"; level: "info" | "warn" | "error"; args: unknown[] }
    | { type: "ready" }
    | { type: "error"; error: string }
    | { type: "routeResult"; id: string; response: { status: number; body?: any; headers?: Record<string, string> }; error?: string }
    | { type: "hookResult"; id: string; result?: any; error?: string };

export type MainToWorkerMessage =
    | { type: "init"; pluginName: string; config: any; permissions: string[]; capabilities: SandboxCapabilities }
    | { type: "dbResponse"; id: string; data?: any; error?: string }
    | { type: "fetchResult"; id: string; response?: { status: number; statusText: string; headers: [string, string][]; body: string | null }; error?: string }
    | { type: "fsResult"; id: string; data?: any; error?: string }
    | { type: "invokeHook"; id: string; name: string; args: any[] }
    | { type: "invokeRoute"; id: string; req: { method: string; path: string; query?: Record<string, string>; headers: [string, string][]; body?: any } }
    | { type: "lifecycle"; phase: "deactivate" | "activate" };
