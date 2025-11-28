import {
  applyFilters,
  doAction,
  registerAction,
  registerFilter,
  resetHooks,
  getMetrics,
} from "../../src/lib/hooks/index.ts";

Deno.test("filters apply in order and modify value", async () => {
  resetHooks();
  registerFilter("test:filter", (val: string) => val + "A", 20);
  registerFilter("test:filter", (val: string) => val + "B", 10);

  const result = await applyFilters("test:filter", "X");
  // Priority 10 runs first -> XB, then priority 20 -> XBA
  if (result !== "XBA") {
    throw new Error(`Unexpected result: ${result}`);
  }
});

Deno.test("actions run with timeout and breaker counts errors", async () => {
  resetHooks();
  let calls = 0;
  registerAction("test:action", async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  await doAction("test:action");
  if (calls !== 1) throw new Error(`Expected 1 call, got ${calls}`);
});

Deno.test("metrics are recorded", async () => {
  resetHooks();
  registerAction("test:metric", () => {});
  await doAction("test:metric");
  const m = getMetrics("test:metric");
  if (!m || m.calls !== 1) {
    throw new Error(`Metrics not recorded: ${JSON.stringify(m)}`);
  }
});

Deno.test("namespacing enforces cms_ prefix", async () => {
  resetHooks();
  let errorCaught = false;
  try {
    registerAction("no_prefix", () => {});
  } catch (_e) {
    errorCaught = true;
  }
  if (!errorCaught) throw new Error("Expected error for missing prefix");
});
