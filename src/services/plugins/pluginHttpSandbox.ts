// @ts-nocheck
export interface HttpSandboxOptions {
  allowlist: string[]; // hostnames
  timeoutMs?: number;
  methods?: string[];
}

export async function httpFetch(url: string, opts: RequestInit = {}, options: HttpSandboxOptions) {
  const u = new URL(url);
  const allowed = options.allowlist.some((host) => u.hostname === host || u.hostname.endsWith(`.${host}`));
  if (!allowed) {
    throw new Error(`HTTP sandbox: host ${u.hostname} is not in allowlist`);
  }
  const method = (opts.method || "GET").toUpperCase();
  const allowedMethods = options.methods && options.methods.length > 0 ? options.methods.map((m) => m.toUpperCase()) : ["GET"];
  if (!allowedMethods.includes(method)) {
    throw new Error(`HTTP sandbox: method ${method} not allowed for ${u.hostname}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
