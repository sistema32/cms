// @ts-nocheck
export interface PermissionGrantLite {
  permission: string;
  granted: boolean;
}

export function extractRequestedPermissions(permissions: unknown): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions.map((p) => String(p)).filter(Boolean);
  if (typeof permissions === "object" && permissions !== null) {
    const permObj = permissions as Record<string, unknown>;
    if (Array.isArray(permObj.required)) {
      return permObj.required.map((p) => String(p)).filter(Boolean);
    }
  }
  return [];
}

export function computeMissingPermissions(
  requested: string[],
  grants: PermissionGrantLite[] | undefined,
): string[] {
  if (requested.length === 0) return [];
  const grantedSet = new Set((grants ?? []).filter((g) => g.granted).map((g) => g.permission));
  return requested.filter((perm) => !grantedSet.has(perm));
}
