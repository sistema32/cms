import { assertPermission } from "./pluginWorker.ts";
import { SandboxContext } from "./pluginSandbox.ts";

export type RegisteredRoute = {
  method: string;
  path: string;
  handler: (...args: any[]) => Promise<any> | any;
  permission: string;
  plugin: string;
  httpAllowlist?: string[];
  capabilities: import("./pluginSandbox.ts").SandboxCapabilities;
};

export type RegisteredHook = {
  name: string;
  handler: (...args: any[]) => Promise<any> | any;
  permission: string;
  plugin: string;
  capabilities: import("./pluginSandbox.ts").SandboxCapabilities;
};

export const hookTimeoutMs = 3000;
export const hookMaxErrors = 3;
export const HOOK_BREAKER_THRESHOLD = 3;
const hookErrorCounts = new Map<string, number>();
const breakerState = new Map<string, { openedAt: number; reason?: string }>();

export function isBreakerOpen(plugin: string) {
  return breakerState.has(plugin);
}

export async function openBreaker(plugin: string, reason = "breaker_open") {
  breakerState.set(plugin, { openedAt: Date.now(), reason });
  try {
    const { updateHealth } = await import("./pluginRegistry.ts");
    await updateHealth(plugin, "degraded", reason, undefined, true);
  } catch (err) {
    console.error("[plugin breaker] failed to persist health", err);
  }
}

export function seedBreaker(plugin: string, reason = "breaker_open") {
  breakerState.set(plugin, { openedAt: Date.now(), reason });
}

export function resetBreaker(plugin: string) {
  breakerState.delete(plugin);
}

export async function runHookSafely(hookName: string, ...args: any[]) {
  const handlers = runtimeHooks.get(hookName) ?? [];
  for (const h of handlers) {
    if (isBreakerOpen(h.plugin)) {
      continue;
    }
    if (
      hookErrorCounts.get(h.plugin) &&
      (hookErrorCounts.get(h.plugin) ?? 0) >= hookMaxErrors
    ) {
      continue;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), hookTimeoutMs);
    const start = performance.now();
    try {
      await Promise.race([
        Promise.resolve(h.handler(...args)),
        new Promise((_, reject) => {
          controller.signal.addEventListener(
            "abort",
            () => reject(new Error("Hook timeout")),
          );
        }),
      ]);
      hookErrorCounts.set(h.plugin, 0);
      try {
        const { updateHealth } = await import("./pluginRegistry.ts");
        await updateHealth(h.plugin, "active", null, performance.now() - start);
      } catch (_e) {
        // ignore health update errors in hook execution
      }
      try {
        const { recordHookMetric } = await import("./pluginMetrics.ts");
        recordHookMetric(h.plugin, performance.now() - start, true);
      } catch (_e) {
        // ignore metrics
      }
    } catch (err) {
      hookErrorCounts.set(h.plugin, (hookErrorCounts.get(h.plugin) ?? 0) + 1);
      console.error(`[plugin hook error] ${hookName} (${h.plugin}):`, err);
      const errors = hookErrorCounts.get(h.plugin) ?? 0;
      if (errors >= HOOK_BREAKER_THRESHOLD) {
        await openBreaker(h.plugin, "hook_breaker");
      }
      try {
        const { updateHealth } = await import("./pluginRegistry.ts");
        await updateHealth(
          h.plugin,
          "error",
          err instanceof Error ? err.message : String(err),
        );
      } catch (_e) {
        // ignore health update errors in hook execution
      }
      try {
        const { recordHookMetric } = await import("./pluginMetrics.ts");
        recordHookMetric(h.plugin, performance.now() - start, false);
      } catch (_e) {
        // ignore metrics
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

export const runtimeRoutes = new Map<string, RegisteredRoute>(); // key: method:path
export const runtimeHooks = new Map<string, RegisteredHook[]>(); // key: hook name
export const registeredSlots: { plugin: string; slot: string; label: string; url: string }[] = [];

export function registerRoute(ctx: SandboxContext, route: RegisteredRoute) {
  assertPermission(ctx.plugin, route.permission);
  const key = `${route.method.toUpperCase()}:${ctx.plugin}:${route.path}`;
  route.plugin = ctx.plugin;
  runtimeRoutes.set(key, route);
}

export function registerHook(ctx: SandboxContext, hook: RegisteredHook) {
  assertPermission(ctx.plugin, hook.permission);
  if (!hook.name.startsWith("cms_")) {
    throw new Error(`Hook "${hook.name}" debe iniciar con prefijo cms_`);
  }
  const list = runtimeHooks.get(hook.name) ?? [];
  list.push({ ...hook, plugin: ctx.plugin });
  runtimeHooks.set(hook.name, list);
}

export const registeredAssets: { plugin: string; type: "css" | "js"; url: string }[] = [];
export const registeredWidgets: { plugin: string; widget: string; label: string; renderUrl: string }[] = [];

export function registerUiSlot(ctx: SandboxContext, slot: string, label: string, url: string) {
  // TODO: Check permissions
  registeredSlots.push({
    plugin: ctx.plugin,
    slot,
    label,
    url
  });
}

export function registerAsset(ctx: SandboxContext, type: "css" | "js", url: string) {
  registeredAssets.push({
    plugin: ctx.plugin,
    type,
    url
  });
}

export function registerWidget(ctx: SandboxContext, widget: string, label: string, renderUrl: string) {
  registeredWidgets.push({
    plugin: ctx.plugin,
    widget,
    label,
    renderUrl
  });
}

export function clearRuntime(plugin: string) {
  for (const [key, route] of runtimeRoutes.entries()) {
    if (route.plugin === plugin) {
      runtimeRoutes.delete(key);
    }
  }
  for (const [hook, list] of runtimeHooks.entries()) {
    runtimeHooks.set(hook, list.filter((h) => h.plugin !== plugin));
  }
}

// Helper to emit hooks declared by plugins with sandbox protections (timeout/breaker)
export async function emitHook(name: string, ...args: any[]) {
  await runHookSafely(name, ...args);
}
