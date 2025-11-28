/**
 * Global Hooks Library
 * Lightweight action/filter system, independent of PluginManager/worker RPC.
 * Namespaced (default prefix cms_) and with basic limits/metrics.
 */

type HookHandler = (...args: any[]) => Promise<any> | any;

interface HandlerEntry {
  handler: HookHandler;
  priority: number;
  name?: string;
}

interface HookMetrics {
  calls: number;
  errors: number;
  totalTimeMs: number;
}

const DEFAULT_PREFIX = "cms_";
const MAX_LISTENERS_PER_HOOK = 50;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_BREAKER_THRESHOLD = 3;

// Hooks core reservados (documentados)
export const CORE_HOOKS = new Set<string>([
  "cms_system:init",
  "cms_admin:init",
  "cms_admin:head",
  "cms_admin:footer",
  "cms_admin:enqueueScripts",
  "cms_theme:head",
  "cms_theme:footer",
  "cms_theme:bodyClass",
  "cms_theme:template",
  "cms_theme:pageTemplate",
  "cms_content:created",
  "cms_content:beforeDelete",
  "cms_media:afterUpload",
  "cms_media:getUrl",
  "cms_media:beforeDelete",
]);

const actions = new Map<string, HandlerEntry[]>();
const filters = new Map<string, HandlerEntry[]>();
const metrics = new Map<string, HookMetrics>();
const breaker = new Map<string, number>(); // hook -> consecutive errors

function normalizeHookName(name: string): string {
  const normalized = name.startsWith(DEFAULT_PREFIX) ? name : `${DEFAULT_PREFIX}${name}`;
  return normalized.replace(/:+/g, ":"); // evitar separadores repetidos
}

function recordMetric(hook: string, durationMs: number, error?: boolean) {
  const m = metrics.get(hook) || { calls: 0, errors: 0, totalTimeMs: 0 };
  m.calls += 1;
  m.totalTimeMs += durationMs;
  if (error) m.errors += 1;
  metrics.set(hook, m);
}

function isBroken(hook: string): boolean {
  const errors = breaker.get(hook) || 0;
  return errors >= DEFAULT_BREAKER_THRESHOLD;
}

function bumpBreaker(hook: string, reset?: boolean) {
  if (reset) {
    breaker.set(hook, 0);
    return;
  }
  breaker.set(hook, (breaker.get(hook) || 0) + 1);
}

function register(map: Map<string, HandlerEntry[]>, hook: string, handler: HookHandler, priority = 10, name?: string) {
  const key = normalizeHookName(hook);
  if (!key.startsWith(DEFAULT_PREFIX)) {
    throw new Error(`Hook name must start with ${DEFAULT_PREFIX}`);
  }
  const list = map.get(key) || [];
  if (list.length >= MAX_LISTENERS_PER_HOOK) {
    throw new Error(`Too many listeners for hook ${key}`);
  }
  list.push({ handler, priority, name });
  list.sort((a, b) => a.priority - b.priority);
  map.set(key, list);
}

export function registerAction(hook: string, handler: HookHandler, priority = 10, name?: string) {
  register(actions, hook, handler, priority, name);
}

export function registerFilter(hook: string, handler: HookHandler, priority = 10, name?: string) {
  register(filters, hook, handler, priority, name);
}

async function runWithTimeout(fn: () => Promise<any> | any, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Hook handler timed out")), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(fn()), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function doAction(hook: string, ...args: any[]) {
  const key = normalizeHookName(hook);
  if (isBroken(key)) return;
  const list = actions.get(key) || [];
  for (const entry of list) {
    const start = performance.now();
    try {
      await runWithTimeout(() => entry.handler(...args));
      bumpBreaker(key, true);
      recordMetric(key, performance.now() - start);
    } catch (err) {
      bumpBreaker(key);
      recordMetric(key, performance.now() - start, true);
      console.error(`[hooks] action ${key} failed${entry.name ? ` (${entry.name})` : ""}:`, err);
    }
    if (isBroken(key)) {
      console.warn(`[hooks] breaker open for ${key}, stopping remaining handlers`);
      break;
    }
  }
}

export async function applyFilters<T = any>(hook: string, value: T, ...args: any[]): Promise<T> {
  const key = normalizeHookName(hook);
  if (isBroken(key)) return value;
  const list = filters.get(key) || [];
  let result: any = value;
  for (const entry of list) {
    const start = performance.now();
    try {
      const nextVal = await runWithTimeout(() => entry.handler(result, ...args));
      if (nextVal !== undefined) {
        result = nextVal;
      }
      bumpBreaker(key, true);
      recordMetric(key, performance.now() - start);
    } catch (err) {
      bumpBreaker(key);
      recordMetric(key, performance.now() - start, true);
      console.error(`[hooks] filter ${key} failed${entry.name ? ` (${entry.name})` : ""}:`, err);
    }
    if (isBroken(key)) {
      console.warn(`[hooks] breaker open for ${key}, returning current value`);
      break;
    }
  }
  return result;
}

export function getMetrics(hook?: string) {
  if (hook) return metrics.get(normalizeHookName(hook));
  return Object.fromEntries(metrics.entries());
}

export function resetHooks() {
  actions.clear();
  filters.clear();
  metrics.clear();
  breaker.clear();
}

export function removeHook(hook: string) {
  const key = normalizeHookName(hook);
  actions.delete(key);
  filters.delete(key);
  metrics.delete(key);
  breaker.delete(key);
}
