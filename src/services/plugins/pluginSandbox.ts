// @ts-nocheck
/**
 * Minimal sandbox helpers for plugin workers.
 * This is a placeholder for DB/FS/HTTP capability checks.
 */

// Capabilities enforced at runtime/sandboxes.
export interface SandboxCapabilities {
  dbRead: boolean;
  dbWrite?: boolean;
  fsRead: boolean;
  fsWrite?: boolean;
  httpAllowlist: string[];
  httpMethods?: string[];
}

export interface SandboxContext {
  plugin: string;
  capabilities: SandboxCapabilities;
}

export function canDb(ctx: SandboxContext) {
  return !!ctx.capabilities.dbRead;
}

export function canDbWrite(ctx: SandboxContext) {
  return !!ctx.capabilities.dbWrite;
}

export function canFs(ctx: SandboxContext) {
  return !!ctx.capabilities.fsRead;
}

export function canFsWrite(ctx: SandboxContext) {
  return !!ctx.capabilities.fsWrite;
}

export function canHttp(ctx: SandboxContext, url: string) {
  const list = ctx.capabilities.httpAllowlist;
  if (!list || list.length === 0) return false;
  try {
    const u = new URL(url);
    return list.some((domain) => u.hostname === domain || u.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
