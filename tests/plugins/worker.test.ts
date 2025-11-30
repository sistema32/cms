import { startWorker, stopWorker, hasPermission, assertPermission, getWorker } from "../../src/services/pluginWorker.ts";

Deno.test("worker stores permissions and can validate them", () => {
  startWorker("demo", ["hook:a", "route:GET:/x"]);
  if (!hasPermission("demo", "hook:a")) {
    throw new Error("Permission hook:a not found");
  }
  let threw = false;
  try {
    assertPermission("demo", "hook:missing");
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error("Expected missing permission to throw");
  }
  const w = getWorker("demo");
  if (!w || !w.permissions.has("route:GET:/x")) {
    throw new Error("Worker permissions not persisted");
  }
  stopWorker("demo");
});

Deno.test("startWorker throws if manifest requests missing permissions", async () => {
  let threw = false;
  try {
    await startWorker("demo2", ["hook:a"], { manifestVersion: "v2", name: "demo2", permissions: ["hook:a", "route:b"], capabilities: { db: [], fs: [], http: [] } } as any);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error("Expected startWorker to throw for missing manifest perms");
  }
});
