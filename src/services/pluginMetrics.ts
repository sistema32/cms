type PluginMetric = {
  routeCalls: number;
  routeErrors: number;
  totalLatencyMs: number;
  lastLatencyMs?: number;
  lastError?: string | null;
  breakerOpen?: boolean;
  hookCalls?: number;
  hookErrors?: number;
  hookTotalLatencyMs?: number;
  lastHookLatencyMs?: number;
};

const metrics = new Map<string, PluginMetric>();
let reporterHandle: ReturnType<typeof setInterval> | null = null;

export function recordRouteMetric(plugin: string, durationMs: number, ok: boolean) {
  const m = metrics.get(plugin) ?? { routeCalls: 0, routeErrors: 0, totalLatencyMs: 0 };
  m.routeCalls += 1;
  if (!ok) m.routeErrors += 1;
  m.totalLatencyMs += durationMs;
  m.lastLatencyMs = durationMs;
  metrics.set(plugin, m);
}

export function recordHookMetric(plugin: string, durationMs: number, ok: boolean) {
  const m = metrics.get(plugin) ?? { routeCalls: 0, routeErrors: 0, totalLatencyMs: 0 };
  m.hookCalls = (m.hookCalls ?? 0) + 1;
  if (!ok) m.hookErrors = (m.hookErrors ?? 0) + 1;
  m.hookTotalLatencyMs = (m.hookTotalLatencyMs ?? 0) + durationMs;
  m.lastHookLatencyMs = durationMs;
  metrics.set(plugin, m);
}

export function getMetrics() {
  const out: Record<string, PluginMetric & { avgLatencyMs: number; hookAvgLatencyMs: number }> = {};
  for (const [plugin, m] of metrics.entries()) {
    const avg = m.routeCalls ? m.totalLatencyMs / m.routeCalls : 0;
    const hookAvg = m.hookCalls ? (m.hookTotalLatencyMs ?? 0) / m.hookCalls : 0;
    out[plugin] = { ...m, avgLatencyMs: avg, hookAvgLatencyMs: hookAvg };
  }
  return out;
}

export function startMetricsReporter(intervalMs = 60_000) {
  if (reporterHandle) return;
  reporterHandle = setInterval(() => {
    const snapshot = getMetrics();
    console.log("[plugin metrics]", JSON.stringify(snapshot));
  }, intervalMs);
}

export function stopMetricsReporter() {
  if (reporterHandle) {
    clearInterval(reporterHandle);
    reporterHandle = null;
  }
}
