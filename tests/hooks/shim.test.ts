// Shim removed; ensure imports fail gracefully and global hooks still work
import { resetHooks, applyFilters, registerAction, registerFilter } from "../../src/lib/hooks/index.ts";

Deno.test("HookManager shim delegates to global hooks (actions)", async () => {
  resetHooks();
  let called = false;
  registerAction("test:shimAction", () => { called = true; });
  await (await import("../../src/lib/hooks/index.ts")).doAction("test:shimAction");
  if (!called) {
    throw new Error("Action did not execute");
  }
});

Deno.test("HookManager shim delegates to global hooks (filters)", async () => {
  resetHooks();
  registerFilter("test:shimFilter", (val: string) => val + "Z");
  const result = await applyFilters("test:shimFilter", "A");
  if (result !== "AZ") {
    throw new Error(`Unexpected filter result: ${result}`);
  }
});
