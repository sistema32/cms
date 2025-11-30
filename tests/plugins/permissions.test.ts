import {
  computeMissingPermissions,
  extractRequestedPermissions,
} from "../../src/services/pluginPermissions.ts";
import { resetHooks } from "../../src/lib/hooks/index.ts";

Deno.test("extractRequestedPermissions handles arrays and required field", () => {
  const arr = extractRequestedPermissions(["hook:a", "route:GET:/x", 123]);
  if (arr.length !== 3 || arr[0] !== "hook:a" || arr[1] !== "route:GET:/x" || arr[2] !== "123") {
    throw new Error("Array form not parsed correctly");
  }

  const obj = extractRequestedPermissions({ required: ["one", "two"] });
  if (obj.length !== 2 || obj[0] !== "one" || obj[1] !== "two") {
    throw new Error("required form not parsed correctly");
  }

  const empty = extractRequestedPermissions(null);
  if (empty.length !== 0) {
    throw new Error("Null should yield empty array");
  }
});

Deno.test("computeMissingPermissions detects gaps against grants", () => {
  resetHooks(); // no-op here, keeps test harness consistent
  const requested = ["a", "b", "c"];
  const grants = [
    { permission: "a", granted: true, grantedAt: new Date() },
    { permission: "c", granted: false, grantedAt: new Date() },
  ];
  const missing = computeMissingPermissions(requested, grants as any);
  if (missing.length !== 2 || !missing.includes("b") || !missing.includes("c")) {
    throw new Error(`Unexpected missing list: ${missing.join(",")}`);
  }
});
