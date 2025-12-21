// @ts-nocheck
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { SandboxContext } from "./pluginSandbox.ts";
import { registerRoute, registerHook } from "./pluginRuntime.ts";
import { registerCronTask } from "./pluginCronSandbox.ts";

export interface PluginBundleContext {
  sandbox: SandboxContext;
  registerRoute: typeof registerRoute;
  registerHook: typeof registerHook;
  registerCron: typeof registerCronTask;
}

/**
 * Loads a plugin bundle file (if present) and lets it register routes/hooks declaratively.
 * Expected interface: export default function register(ctx: PluginBundleContext) or named export register.
 */
export async function loadPluginBundle(pluginName: string, sandbox: SandboxContext) {
  const bundlePath = join(Deno.cwd(), "plugins", pluginName, "index.ts");
  try {
    const stat = await Deno.stat(bundlePath);
    if (!stat.isFile) return false;
  } catch (_e) {
    return false;
  }

  const moduleUrl = `file://${bundlePath}`;
  const mod = await import(moduleUrl);
  const registerFn = mod.default || mod.register;
  if (typeof registerFn !== "function") {
    console.warn(`[plugin bundle] ${pluginName} index.ts does not export a register function`);
    return false;
  }

  const ctx: PluginBundleContext = {
    sandbox,
    registerRoute,
    registerHook,
    registerCron: (name: string, intervalMs: number, handler: () => Promise<void> | void, opts?: any) =>
      registerCronTask(sandbox.plugin, name, intervalMs, handler, opts),
  };
  await registerFn(ctx);
  return true;
}
