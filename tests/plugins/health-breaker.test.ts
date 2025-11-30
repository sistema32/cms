import { startWorker, stopWorker } from "../../src/services/pluginWorker.ts";
import {
  registerHook,
  emitHook,
  clearRuntime,
  isBreakerOpen,
  resetBreaker,
  HOOK_BREAKER_THRESHOLD,
} from "../../src/services/pluginRuntime.ts";

Deno.test("hook breaker opens after consecutive errors", async () => {
  startWorker("demo-health", ["hook:test"]);
  const ctx = {
    plugin: "demo-health",
    capabilities: { dbRead: false, fsRead: false, httpAllow: false, httpAllowlist: [] },
  } as any;
  registerHook(ctx, {
    name: "hook:test",
    handler: async () => {
      throw new Error("boom");
    },
    permission: "hook:test",
    plugin: "demo-health",
    capabilities: ctx.capabilities,
  });

  for (let i = 0; i < HOOK_BREAKER_THRESHOLD; i += 1) {
    await emitHook("hook:test");
  }

  if (!isBreakerOpen("demo-health")) {
    throw new Error("Breaker was not opened after repeated hook errors");
  }

  resetBreaker("demo-health");
  clearRuntime("demo-health");
  stopWorker("demo-health");
});
