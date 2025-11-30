import { computeMissingPermissions } from "../../src/services/pluginPermissions.ts";
import { startWorker, stopWorker, getWorker, hasPermission } from "../../src/services/pluginWorker.ts";
import { registerRoute, clearRuntime, runtimeRoutes } from "../../src/services/pluginRuntime.ts";
import { SandboxContext } from "../../src/services/pluginSandbox.ts";

Deno.test("simulated activation flow with reconciler logic", () => {
  const requested = ["hook:a", "route:GET:/x"];
  const grants = [{ permission: "hook:a", granted: true }, { permission: "route:GET:/x", granted: true }];
  const missing = computeMissingPermissions(requested, grants as any);
  if (missing.length !== 0) {
    throw new Error("Expected no missing permissions");
  }

  startWorker("sim-plugin", requested, {
    manifestVersion: "v2",
    name: "sim-plugin",
    permissions: requested,
    routes: [{ method: "GET", path: "/x", permission: "route:GET:/x" }],
    hooks: [{ name: "cms_theme:head", permission: "hook:a" }],
    capabilities: { db: ["read"], fs: ["read"], http: [] },
  } as any);
  const ctx: SandboxContext = { plugin: "sim-plugin", capabilities: { dbRead: true, fsRead: true, httpAllowlist: [] } };
  registerRoute(ctx, {
    method: "GET",
    path: "/x",
    handler: () => "ok",
    permission: "route:GET:/x",
    plugin: "sim-plugin",
    httpAllowlist: [],
    capabilities: ctx.capabilities,
  });
  if (!runtimeRoutes.has("GET:/x")) {
    throw new Error("Route not registered");
  }

  const w = getWorker("sim-plugin");
  if (!w || w.status !== "running" || !hasPermission("sim-plugin", "route:GET:/x")) {
    throw new Error("Worker did not start with permissions");
  }
  stopWorker("sim-plugin");
  clearRuntime("sim-plugin");
});
