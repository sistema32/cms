// @ts-nocheck
type CronHandler = () => Promise<void> | void;

interface CronTask {
  plugin: string;
  name: string;
  intervalMs: number;
  lastRun?: number;
  maxRuns?: number;
  runs: number;
  handler: CronHandler;
  timer?: number;
}

const tasks = new Map<string, CronTask>(); // key plugin:name
const MAX_TASKS_PER_PLUGIN = 3;
const MIN_INTERVAL_MS = 60_000; // 1 min

export function registerCronTask(
  plugin: string,
  name: string,
  intervalMs: number,
  handler: CronHandler,
  opts?: { maxRuns?: number },
) {
  if (intervalMs < MIN_INTERVAL_MS) {
    throw new Error("Intervalo de cron demasiado bajo (mínimo 1 minuto)");
  }
  const key = `${plugin}:${name}`;
  const existing = Array.from(tasks.values()).filter((t) => t.plugin === plugin);
  if (!tasks.has(key) && existing.length >= MAX_TASKS_PER_PLUGIN) {
    throw new Error(`Máximo de tareas cron alcanzado para ${plugin}`);
  }
  tasks.set(key, {
    plugin,
    name,
    intervalMs,
    handler,
    runs: 0,
    maxRuns: opts?.maxRuns,
  });
}

export function startCronScheduler() {
  for (const [key, task] of tasks.entries()) {
    if (task.timer) continue;
    const timer = setInterval(async () => {
      if (task.maxRuns && task.runs >= task.maxRuns) {
        clearInterval(timer);
        tasks.delete(key);
        return;
      }
      const start = performance.now();
      try {
        const race = Promise.race([
          Promise.resolve(task.handler()),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Cron timeout")), Math.min(task.intervalMs - 100, 10_000))),
        ]);
        await race;
      } catch (err) {
        console.error(`[cron] tarea ${key} falló:`, err);
      } finally {
        task.runs += 1;
        task.lastRun = Date.now();
        task.timer = timer as unknown as number;
      }
    }, task.intervalMs);
    task.timer = timer as unknown as number;
  }
}

export function stopCronScheduler() {
  for (const task of tasks.values()) {
    if (task.timer) clearInterval(task.timer);
    task.timer = undefined;
  }
}

export async function runCronNow(plugin: string, name: string) {
  const key = `${plugin}:${name}`;
  const task = tasks.get(key);
  if (!task) throw new Error(`Cron task no encontrada: ${key}`);
  await Promise.resolve(task.handler());
  task.runs += 1;
  task.lastRun = Date.now();
}

export function clearCronForPlugin(plugin: string) {
  for (const [key, task] of tasks.entries()) {
    if (task.plugin === plugin) {
      if (task.timer) clearInterval(task.timer);
      tasks.delete(key);
    }
  }
}
