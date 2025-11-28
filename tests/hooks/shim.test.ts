import { hookManager } from "../../src/lib/plugin-system/HookManager.ts";
import { resetHooks, applyFilters } from "../../src/lib/hooks/index.ts";

Deno.test("HookManager shim delegates to global hooks (actions)", async () => {
  resetHooks();
  (globalThis as any)._shimTestAction = () => {
    (globalThis as any)._shimCalled = true;
  };
  hookManager.registerAction("test:shimAction", "_shimTestAction", 10, "test-plugin");
  await hookManager.doAction("test:shimAction");
  if (!(globalThis as any)._shimCalled) {
    throw new Error("Shim action did not execute");
  }
  delete (globalThis as any)._shimTestAction;
  delete (globalThis as any)._shimCalled;
});

Deno.test("HookManager shim delegates to global hooks (filters)", async () => {
  resetHooks();
  (globalThis as any)._shimTestFilter = (val: string) => val + "Z";
  hookManager.registerFilter("test:shimFilter", "_shimTestFilter", 10, "test-plugin");
  const result = await applyFilters("test:shimFilter", "A");
  if (result !== "AZ") {
    throw new Error(`Unexpected filter result: ${result}`);
  }
  delete (globalThis as any)._shimTestFilter;
});
