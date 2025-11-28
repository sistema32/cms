/**
 * Minimal worker stub for DB-first plugins.
 * In this phase, we only track started workers in memory.
 * Later, this will load plugin bundles and execute hooks/routes.
 */

export type WorkerHandle = {
  name: string;
  status: "running" | "stopped" | "error";
  startedAt: number;
};

const workers = new Map<string, WorkerHandle>();

export function startWorker(name: string) {
  const handle: WorkerHandle = {
    name,
    status: "running",
    startedAt: Date.now(),
  };
  workers.set(name, handle);
  return handle;
}

export function stopWorker(name: string) {
  workers.delete(name);
}

export function getWorker(name: string) {
  return workers.get(name);
}

export function listWorkers() {
  return Array.from(workers.values());
}
