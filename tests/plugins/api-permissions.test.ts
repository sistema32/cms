import { extractRequestedPermissions } from "../../src/services/pluginPermissions.ts";
import { requestedPermissionsFromManifest, validateManifestAgainstPermissions, parseManifest } from "../../src/services/pluginManifest.ts";

Deno.test("requested permissions from manifest merges base/routes/hooks", () => {
  const manifest = {
    manifestVersion: "v2",
    name: "demo",
    permissions: { required: ["base:a"] },
    routes: [{ method: "GET", path: "/x", permission: "route:x" }],
    hooks: [{ name: "cms_theme:head", permission: "hook:head" }],
    httpAllowlist: [],
  };
  const req = requestedPermissionsFromManifest(manifest as any);
  if (req.length !== 3 || !req.includes("base:a") || !req.includes("route:x") || !req.includes("hook:head")) {
    throw new Error(`Unexpected requested list: ${req.join(",")}`);
  }

  const missing = validateManifestAgainstPermissions(manifest as any, ["base:a", "route:x"]);
  if (missing.length !== 1 || missing[0] !== "hook:head") {
    throw new Error(`Unexpected missing manifest perms: ${missing.join(",")}`);
  }

  if (!Array.isArray(manifest.httpAllowlist)) {
    throw new Error("httpAllowlist should exist when provided");
  }
});

Deno.test("manifest requires capabilities and defaults to deny", () => {
  let threw = false;
  try {
    parseManifest({ name: "no-cap" });
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Manifest without capabilities should throw");

  const m = parseManifest({ manifestVersion: "v2", name: "cap", capabilities: { db: [], fs: [], http: [] } });
  if (m.capabilities?.db?.length !== 0) throw new Error("db capabilities should default empty");
  if (!Array.isArray(m.httpAllowlist) || m.httpAllowlist.length !== 0) {
    throw new Error("httpAllowlist should default to empty array");
  }
});

Deno.test("extractRequestedPermissions works on manifest.permissions shapes", () => {
  const arr = extractRequestedPermissions(["p1", "p2"]);
  if (arr.length !== 2) throw new Error("Array permissions not extracted");
  const obj = extractRequestedPermissions({ required: ["p3"] });
  if (obj.length !== 1 || obj[0] !== "p3") throw new Error("Required permissions not extracted");
});
