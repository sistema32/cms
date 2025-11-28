import {
  applyWpFilters,
  registerWpFilter,
} from "../../src/lib/hooks/filters.ts";
import {
  doWpAction,
  registerWpAction,
} from "../../src/lib/hooks/actions.ts";
import { resetHooks } from "../../src/lib/hooks/index.ts";

Deno.test("WP filter helpers map to cms_ names", async () => {
  resetHooks();
  registerWpFilter("the_title", (val: string) => `**${val}**`);
  const result = await applyWpFilters("the_title", "Hello");
  if (result !== "**Hello**") {
    throw new Error(`Unexpected result: ${result}`);
  }
});

Deno.test("WP action helpers map to cms_ names", async () => {
  resetHooks();
  let called = false;
  registerWpAction("the_content", () => {
    called = true;
  });
  await doWpAction("the_content");
  if (!called) {
    throw new Error("WP action did not run");
  }
});
