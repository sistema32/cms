import { extractRequestedPermissions, computeMissingPermissions } from "../../src/services/pluginPermissions.ts";

Deno.test("activation guard: missing permissions are detected", () => {
  const requested = extractRequestedPermissions({ required: ["hook:a", "route:GET:/x"] });
  const missing = computeMissingPermissions(requested, [
    { permission: "hook:a", granted: true },
  ]);
  if (missing.length !== 1 || missing[0] !== "route:GET:/x") {
    throw new Error(`Expected missing route:GET:/x, got ${missing}`);
  }
});

Deno.test("activation guard: no missing when all granted", () => {
  const requested = extractRequestedPermissions(["hook:a"]);
  const missing = computeMissingPermissions(requested, [{ permission: "hook:a", granted: true }]);
  if (missing.length !== 0) {
    throw new Error(`Expected no missing permissions, got ${missing}`);
  }
});
