export type ManifestPermission = string;

export interface PluginManifest {
  manifestVersion: "v2";
  id: string;
  name: string;
  version?: string;
  description?: string;
  permissions?: ManifestPermission[] | { required: ManifestPermission[] };
  routes?: Array<
    { method: string; path: string; permission?: ManifestPermission }
  >;
  hooks?: Array<{ name: string; permission?: ManifestPermission }>;
  httpAllowlist?: string[];
  capabilities?: {
    db?: ("read" | "write")[];
    fs?: ("read" | "write")[];
    http?: ("outbound")[];
  };
  checksum?: string; // hex sha256 del manifest JSON
}

function lintHooks(hooks: Array<{ name: string }>) {
  const seen = new Set<string>();
  for (const h of hooks) {
    if (!h.name || typeof h.name !== "string") {
      throw new Error("Manifest.hooks entries must include a name");
    }
    if (!h.name.startsWith("cms_")) {
      throw new Error(`Hook "${h.name}" debe iniciar con prefijo cms_`);
    }
    const key = h.name;
    if (seen.has(key)) {
      throw new Error(`Hook duplicado en manifest: ${key}`);
    }
    seen.add(key);
  }
}

export function parseManifest(raw: unknown): PluginManifest {
  if (!raw || typeof raw !== "object") {
    throw new Error("Manifest must be an object");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.manifestVersion !== "v2") {
    throw new Error("Manifest.manifestVersion must be 'v2'");
  }
  if (typeof obj.id !== "string") {
    throw new Error("Manifest.id is required");
  }
  if (typeof obj.name !== "string") {
    throw new Error("Manifest.name is required");
  }
  if (!obj.capabilities || typeof obj.capabilities !== "object") {
    throw new Error("Manifest.capabilities is required");
  }

  const manifest: PluginManifest = {
    manifestVersion: "v2",
    id: obj.id,
    name: obj.name,
    version: typeof obj.version === "string" ? obj.version : undefined,
    description: typeof obj.description === "string"
      ? obj.description
      : undefined,
    permissions: obj.permissions as any,
    routes: Array.isArray(obj.routes) ? obj.routes as any : [],
    hooks: Array.isArray(obj.hooks) ? obj.hooks as any : [],
    httpAllowlist: Array.isArray(obj.httpAllowlist)
      ? obj.httpAllowlist as string[]
      : [],
    capabilities: obj.capabilities as any,
  };
  lintHooks(manifest.hooks ?? []);
  return manifest;
}

export function requestedPermissionsFromManifest(
  manifest: PluginManifest,
): string[] {
  const base: string[] = [];
  if (manifest.permissions) {
    if (Array.isArray(manifest.permissions)) {
      base.push(...manifest.permissions.map(String));
    }
    if (
      typeof manifest.permissions === "object" &&
      Array.isArray((manifest.permissions as any).required)
    ) {
      base.push(...(manifest.permissions as any).required.map(String));
    }
  }
  const routePerms = (manifest.routes ?? [])
    .map((r) =>
      r.permission ?? `route:${(r.method || "GET").toUpperCase()}:${r.path}`
    )
    .filter(Boolean)
    .map(String);
  const hookPerms = (manifest.hooks ?? [])
    .map((h) => h.permission ?? h.name)
    .filter(Boolean)
    .map(String);
  return Array.from(new Set([...base, ...routePerms, ...hookPerms]));
}

export function validateManifestAgainstPermissions(
  manifest: PluginManifest,
  granted: string[],
): string[] {
  const requested = requestedPermissionsFromManifest(manifest);
  const grantedSet = new Set(granted);
  return requested.filter((p) => !grantedSet.has(p));
}
