/**
 * Plugin Reconciler (phase 1)
 * Aligns DB state (plugins.status) with runtime workers (stubbed worker).
 */
import { listPlugins, setStatus, updateHealth } from "./pluginRegistry.ts";
import { startWorker, stopWorker, getWorker } from "./pluginWorker.ts";

export async function reconcilePlugins() {
  const plugins = await listPlugins();
  for (const plugin of plugins) {
    if (plugin.status === "active") {
      if (!getWorker(plugin.name)) {
        startWorker(plugin.name);
      }
      await updateHealth(plugin.name, "active");
    } else {
      if (getWorker(plugin.name)) {
        stopWorker(plugin.name);
      }
      await updateHealth(plugin.name, "inactive");
    }
  }
}

export async function activate(name: string) {
  await setStatus(name, "active");
  startWorker(name);
  await updateHealth(name, "active");
  // TODO: apply migrations
}

export async function deactivate(name: string) {
  await setStatus(name, "inactive");
  stopWorker(name);
  await updateHealth(name, "inactive");
  // TODO: optional rollback
}
