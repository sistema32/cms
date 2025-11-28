/**
 * Plugin Reconciler (stub)
 * Aligns DB state (plugins.status) with runtime workers.
 * Currently stubbed: logs intended actions.
 */
import { listPlugins, setStatus, updateHealth } from "./pluginRegistry.ts";

export async function reconcilePlugins() {
  const plugins = await listPlugins();
  for (const plugin of plugins) {
    // In future: start/stop worker; here just ensure status not error/degraded without health
    if (plugin.status === "active") {
      await updateHealth(plugin.name, "active");
    } else {
      await updateHealth(plugin.name, "inactive");
    }
  }
}

export async function activate(name: string) {
  await setStatus(name, "active");
  await updateHealth(name, "active");
  // TODO: start worker, apply migrations
}

export async function deactivate(name: string) {
  await setStatus(name, "inactive");
  await updateHealth(name, "inactive");
  // TODO: stop worker, optional rollback
}
