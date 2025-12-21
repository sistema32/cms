import { app } from "./app.ts";
import { env, isDevelopment } from "@/config/env.ts";
import { cacheManager } from "@/lib/cache/index.ts";
import { emailManager } from "@/lib/email/index.ts";
import { backupManager } from "@/lib/backup/index.ts";
import { securityManager } from "@/lib/security/index.ts";
import { initializeSearchIndexes } from "@/services/system/searchService.ts";
import {
  reconcilePlugins,
  startHealthCheckLoop,
  startReconcilerLoop,
} from "@/services/plugins/pluginReconciler.ts";
import { startMetricsReporter } from "@/services/plugins/pluginMetrics.ts";
import { jobQueue } from "@/lib/jobs/index.ts";
import { registerBuiltInHandlers } from "@/lib/jobs/handlers.ts";
import { HotReloadServer } from "./dev/hotReload.ts";
import { createLogger } from "@/platform/logger.ts";

const port = env.PORT;
const log = createLogger("main");

// Function to find an available port
async function findAvailablePort(
  startPort: number,
  maxAttempts = 10,
): Promise<number> {
  const RETRY_DELAY = 200;
  const MAX_PORT_WAIT_ATTEMPTS = 25; // 5 seconds total wait time

  for (let i = 0; i < maxAttempts; i++) {
    const testPort = startPort + i;

    // First, try aggressively to get the PREFERRED port (e.g. 8000)
    // If we are checking the primary port (i=0), we wait longer.
    // If we have moved to fallback ports (i>0), we check quickly.
    const attemptsForThisPort = i === 0 ? MAX_PORT_WAIT_ATTEMPTS : 1;

    for (let attempt = 0; attempt < attemptsForThisPort; attempt++) {
      try {
        const listener = Deno.listen({ port: testPort });
        listener.close();
        return testPort;
      } catch (error) {
        if (
          error instanceof Deno.errors.PermissionDenied ||
          error instanceof Deno.errors.InvalidData
        ) {
          // ... permissions error, just quit
          log.warn("No se pudo abrir sockets (modo sandbox). Se omitirá el servidor HTTP.");
          return -1;
        }

        if (error instanceof Deno.errors.AddrInUse) {
          if (attempt < attemptsForThisPort - 1) {
            // Wait and retry SAME port
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          // If we exhausted retries for this port, move to next port (outer loop)
        } else {
          throw error;
        }
      }
    }
  }
  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1
    }`,
  );
}

// Initialize cache system
try {
  await cacheManager.initialize();
} catch (error) {
  log.error("Failed to initialize cache system", error);
  // Continue anyway - cache is optional
}

// Reconcile plugins (DB-first stub)
try {
  await reconcilePlugins();
  startReconcilerLoop();
  startHealthCheckLoop();
  startMetricsReporter();
} catch (error) {
  log.error("Failed to reconcile plugins", error);
}

// Initialize email system
log.info("Initializing email system...");
try {
  // Email manager initializes automatically on first getInstance()
  // Just verify the connection
  const isConnected = await emailManager.verifyConnection();
  if (isConnected) {
    log.info("Email provider verified");
  } else {
    log.warn("Email provider verification failed - emails may not be sent");
  }
} catch (error) {
  log.error("Failed to initialize email system", error);
  // Continue anyway - email is optional
}

// Initialize backup system
log.info("Initializing backup system...");
try {
  // Ensure all required directories exist
  await backupManager.initializeDirectories();

  // Backup manager initializes automatically on first getInstance()
  const stats = await backupManager.getStats();
  log.info(`Backup system initialized (${stats.totalBackups} backups, ${stats.successfulBackups} successful)`);
} catch (error) {
  log.error("Failed to initialize backup system", error);
  // Continue anyway - backups are optional
}

// Initialize security system
log.info("Initializing security system...");
try {
  // Security manager initializes automatically on first getInstance()
  const stats = await securityManager.getSecurityStats();
  log.info(
    `Security system initialized (${stats.ipRules.total} IP rules, ${stats.events.last24h} events in last 24h)`,
  );
} catch (error) {
  log.error("Failed to initialize security system", error);
  // Continue anyway - security features will still work
}

// Initialize auto-moderation plugin
log.info("Initializing auto-moderation plugin...");
try {
  const mod = await import("../plugins/auto-moderation/init.ts").catch(() =>
    null
  );
  if (mod && typeof (mod as any).setupAutoModeration === "function") {
    const { setupAutoModeration } = mod as any;
    const plugin = setupAutoModeration();
    const config = plugin.getConfig();
    log.info(
      `Auto-moderation initialized (strategy: ${config.strategy}, enabled: ${config.enabled})`,
    );
  } else {
    log.info("Auto-moderation plugin no encontrado; usando reglas básicas.");
  }
} catch (error) {
  log.error("Failed to initialize auto-moderation plugin", error);
  // Continue anyway - comments will use basic moderation rules
}

// Initialize search indexes
try {
  await initializeSearchIndexes();
} catch (error) {
  log.error("Failed to initialize search indexes", error);
  // Continue anyway - search will work but without indexed data
}

// Initialize job queue
log.info("Initializing job queue...");
try {
  registerBuiltInHandlers();
  jobQueue.start();
  const stats = await jobQueue.getStats();
  log.info(`Job queue started (${stats.waiting} waiting, ${stats.active} active)`);
} catch (error) {
  log.error("Failed to initialize job queue", error);
  // Continue anyway - jobs won't be processed
}

// Trigger system:init hook
log.info("Triggering system:init hook...");
try {
  const { doAction } = await import("@/lib/hooks/index.ts");
  await doAction("system:init");
  log.info("System init hooks executed");
} catch (error) {
  log.error("Error executing system:init hooks", error);
}

// Initialize hot reload server in development
if (isDevelopment) {
  log.info("Initializing hot reload server...");
  try {
    const hotReloadServer = new HotReloadServer({
      port: 3001,
      watchPaths: [
        "./src/themes",
        "./src/admin/assets",
      ],
      debounceMs: 100,
    });
    await hotReloadServer.start();
    log.info("Hot reload server started on port 3001");
  } catch (error) {
    log.error("Failed to initialize hot reload server", error);
    // Continue anyway - hot reload is optional
  }
}

// Find available port and start server
try {
  const availablePort = await findAvailablePort(port);

  if (availablePort === -1) {
    log.warn("Sandbox sin red: servidor HTTP deshabilitado.");
    // Mantener el proceso vivo para tareas en background (cron/job queue, watchers)
    await new Promise(() => { });
  }

  if (availablePort !== port) {
    log.warn(
      `Configured port ${port} was in use. Starting server on port ${availablePort} instead.`,
    );
  }

  log.info("Servidor iniciado exitosamente", {
    environment: env.DENO_ENV,
    port: availablePort,
    healthUrl: `http://localhost:${availablePort}/health`,
  });

  const handler = async (req: Request) => {
    const res = await app.fetch(req);
    if (res && res.status === 0) {
      return new Response(await res.text().catch(() => ""), {
        status: 500,
        headers: res.headers,
      });
    }
    return res;
  };
  Deno.serve({ port: availablePort }, handler);
} catch (error) {
  log.error("Failed to start server", error);
  // En sandbox sin red, mantener proceso vivo sin matar
  if (error instanceof Deno.errors.PermissionDenied) {
    log.warn("Continuando sin servidor HTTP por restricciones de red.");
    await new Promise(() => { });
  } else {
    Deno.exit(1);
  }
}
