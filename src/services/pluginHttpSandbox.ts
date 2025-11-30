export interface HttpSandboxOptions {
  allowlist: string[]; // hostnames
  timeoutMs?: number;
}

export async function httpFetch(url: string, opts: RequestInit = {}, options: HttpSandboxOptions) {
  const u = new URL(url);
  const allowed = options.allowlist.some((host) => u.hostname === host || u.hostname.endsWith(`.${host}`));
  if (!allowed) {
    throw new Error(`HTTP sandbox: host ${u.hostname} is not in allowlist`);
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
