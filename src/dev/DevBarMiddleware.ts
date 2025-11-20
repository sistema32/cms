import { Context, Next } from "hono";
import type { DevBarData, LogEntry, QueryInfo } from "./types.ts";
import { DevBar } from "./DevBar.tsx";

/**
 * DevBar Middleware
 * Captures request/response data and injects DevBar into HTML responses
 */

// Global storage for current request data
const devBarStorage = new Map<string, DevBarData>();

// Intercept console methods to capture logs
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

let logsEnabled = false;

function enableLogCapture() {
  if (logsEnabled) return;
  logsEnabled = true;

  const createLogInterceptor = (
    level: LogEntry["level"],
    original: typeof console.log,
  ) => {
    return (...args: any[]) => {
      // Call original
      original.apply(console, args);

      // Capture for DevBar
      const currentRequestId = getCurrentRequestId();
      if (currentRequestId) {
        const data = devBarStorage.get(currentRequestId);
        if (data) {
          data.logs.push({
            level,
            message: args.map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            ).join(" "),
            timestamp: Date.now(),
            args,
          });
        }
      }
    };
  };

  console.log = createLogInterceptor("log", originalConsole.log);
  console.info = createLogInterceptor("info", originalConsole.info);
  console.warn = createLogInterceptor("warn", originalConsole.warn);
  console.error = createLogInterceptor("error", originalConsole.error);
  console.debug = createLogInterceptor("debug", originalConsole.debug);
}

// Simple request ID tracking
let currentRequestId: string | null = null;

function getCurrentRequestId(): string | null {
  return currentRequestId;
}

function setCurrentRequestId(id: string) {
  currentRequestId = id;
}

function clearCurrentRequestId() {
  currentRequestId = null;
}

/**
 * Main DevBar middleware
 */
export const devBarMiddleware = () => {
  enableLogCapture();

  return async (c: Context, next: Next) => {
    const isDevelopment = Deno.env.get("NODE_ENV") !== "production";

    if (!isDevelopment) {
      await next();
      return;
    }

    // Generate request ID
    const requestId = crypto.randomUUID();
    setCurrentRequestId(requestId);

    // Start timing
    const startTime = performance.now();

    // Get memory info
    const memoryUsage = Deno.memoryUsage();

    // Parse URL
    const url = new URL(c.req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Capture request headers
    const requestHeaders: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    // Initialize DevBar data
    const devBarData: DevBarData = {
      request: {
        method: c.req.method,
        url: c.req.url,
        path: url.pathname,
        query: queryParams,
        headers: requestHeaders,
        startTime,
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
      },
      queries: [],
      logs: [],
      performance: {
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        denoVersion: Deno.version.deno,
      },
    };

    // Try to get user session info
    try {
      const session = c.get("session");
      const user = c.get("user");

      if (user || session) {
        devBarData.session = {
          userId: user?.id,
          userName: user?.name,
          email: user?.email,
          role: user?.role,
          sessionId: session?.id,
        };
      }
    } catch (e) {
      // Session not available, ignore
    }

    // Store in global map
    devBarStorage.set(requestId, devBarData);

    // Execute request
    await next();

    // Capture response info
    const endTime = performance.now();
    devBarData.request.endTime = endTime;
    devBarData.request.duration = endTime - startTime;
    devBarData.response.status = c.res.status;
    devBarData.response.statusText = c.res.statusText || "OK";

    // Capture response headers
    c.res.headers.forEach((value, key) => {
      devBarData.response.headers[key] = value;
    });

    // Only inject DevBar into HTML responses (skip redirects and errors)
    const contentType = c.res.headers.get("content-type");
    const status = c.res.status;

    // Skip redirects (3xx), client errors (4xx), and server errors (5xx)
    if (
      contentType && contentType.includes("text/html") && status >= 200 &&
      status < 300
    ) {
      try {
        // Get the original HTML
        const originalBody = await c.res.text();

        // Only inject if there's a closing body tag
        if (originalBody.includes("</body>")) {
          // Inject DevBar before closing body tag
          const devBarHtml = DevBar(devBarData).toString();
          const modifiedBody = originalBody.replace(
            "</body>",
            `${devBarHtml}</body>`,
          );

          // Create new response with modified body
          const newResponse = new Response(modifiedBody, {
            status: c.res.status,
            statusText: c.res.statusText,
            headers: c.res.headers,
          });

          // Replace response
          c.res = newResponse;
        }
      } catch (e) {
        console.error("DevBar injection failed:", e);
      }
    }

    // Cleanup
    clearCurrentRequestId();
    devBarStorage.delete(requestId);
  };
};

/**
 * Helper to manually add a query to DevBar
 * Usage: devBarAddQuery({ sql: 'SELECT ...', duration: 10 })
 */
export function devBarAddQuery(query: Omit<QueryInfo, "timestamp">) {
  const requestId = getCurrentRequestId();
  if (requestId) {
    const data = devBarStorage.get(requestId);
    if (data) {
      data.queries.push({
        ...query,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Helper to get current DevBar data
 */
export function getDevBarData(): DevBarData | null {
  const requestId = getCurrentRequestId();
  if (requestId) {
    return devBarStorage.get(requestId) || null;
  }
  return null;
}
