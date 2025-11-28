import { app } from "./app.ts";
import { env, isDevelopment } from "./config/env.ts";
import { cacheManager } from "./lib/cache/index.ts";
import { emailManager } from "./lib/email/index.ts";
import { backupManager } from "./lib/backup/index.ts";
import { securityManager } from "./lib/security/index.ts";
import { initializeSearchIndexes } from "./services/searchService.ts";
import { reconcilePlugins } from "./services/pluginReconciler.ts";
import { jobQueue } from "./lib/jobs/index.ts";
import { registerBuiltInHandlers } from "./lib/jobs/handlers.ts";
import { HotReloadServer } from "./dev/hotReload.ts";

const port = env.PORT;

// Function to find an available port
async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const testPort = startPort + i;
    try {
      // Try to create a temporary server to test if port is available
      const listener = Deno.listen({ port: testPort });
      listener.close();
      return testPort;
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        console.warn(`⚠️  Port ${testPort} is already in use, trying next port...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}

// Initialize cache system
try {
  await cacheManager.initialize();
} catch (error) {
  console.error('❌ Failed to initialize cache system:', error);
  // Continue anyway - cache is optional
}

// Reconcile plugins (DB-first stub)
try {
  await reconcilePlugins();
} catch (error) {
  console.error('⚠️ Failed to reconcile plugins:', error);
}

// Initialize email system
console.log('\n📧 Initializing email system...');
try {
  // Email manager initializes automatically on first getInstance()
  // Just verify the connection
  const isConnected = await emailManager.verifyConnection();
  if (isConnected) {
    console.log('✅ Email provider verified');
  } else {
    console.warn('⚠️ Email provider verification failed - emails may not be sent');
  }
} catch (error) {
  console.error('❌ Failed to initialize email system:', error);
  // Continue anyway - email is optional
}

// Initialize backup system
console.log('\n💾 Initializing backup system...');
try {
  // Ensure all required directories exist
  await backupManager.initializeDirectories();

  // Backup manager initializes automatically on first getInstance()
  const stats = await backupManager.getStats();
  console.log(`✅ Backup system initialized (${stats.totalBackups} backups, ${stats.successfulBackups} successful)`);
} catch (error) {
  console.error('❌ Failed to initialize backup system:', error);
  // Continue anyway - backups are optional
}

// Initialize security system
console.log('\n🔒 Initializing security system...');
try {
  // Security manager initializes automatically on first getInstance()
  const stats = await securityManager.getSecurityStats();
  console.log(`✅ Security system initialized (${stats.ipRules.total} IP rules, ${stats.events.last24h} events in last 24h)`);
} catch (error) {
  console.error('❌ Failed to initialize security system:', error);
  // Continue anyway - security features will still work
}

// Initialize auto-moderation plugin
console.log('\n🛡️  Initializing auto-moderation plugin...');
try {
  const { setupAutoModeration } = await import("../plugins/auto-moderation/init.ts");
  const plugin = setupAutoModeration();
  const config = plugin.getConfig();
  console.log(`✅ Auto-moderation initialized (strategy: ${config.strategy}, enabled: ${config.enabled})`);
} catch (error) {
  console.error('❌ Failed to initialize auto-moderation plugin:', error);
  // Continue anyway - comments will use basic moderation rules
}

// Initialize search indexes
try {
  await initializeSearchIndexes();
} catch (error) {
  console.error('❌ Failed to initialize search indexes:', error);
  // Continue anyway - search will work but without indexed data
}

// Initialize job queue
console.log('\n⚙️  Initializing job queue...');
try {
  registerBuiltInHandlers();
  jobQueue.start();
  const stats = await jobQueue.getStats();
  console.log(`✅ Job queue started (${stats.waiting} waiting, ${stats.active} active)`);
} catch (error) {
  console.error('❌ Failed to initialize job queue:', error);
  // Continue anyway - jobs won't be processed
}

// Trigger system:init hook
  console.log('\n🔄 Triggering system:init hook...');
  try {
    const { doAction } = await import("./lib/hooks/index.ts");
    await doAction('system:init');
    console.log('✅ System init hooks executed');
  } catch (error) {
    console.error('❌ Error executing system:init hooks:', error);
  }

// Initialize hot reload server in development
if (isDevelopment) {
  console.log('\n🔥 Initializing hot reload server...');
  try {
    const hotReloadServer = new HotReloadServer({
      port: 3001,
      watchPaths: [
        './src/themes',
        './src/admin/assets',
      ],
      debounceMs: 100,
    });
    await hotReloadServer.start();
    console.log('✅ Hot reload server started on port 3001');
  } catch (error) {
    console.error('❌ Failed to initialize hot reload server:', error);
    // Continue anyway - hot reload is optional
  }
}

// Find available port and start server
try {
  const availablePort = await findAvailablePort(port);

  if (availablePort !== port) {
    console.warn(`⚠️  Configured port ${port} was in use. Starting server on port ${availablePort} instead.`);
  }

  console.log(`
🚀 Servidor iniciado exitosamente

📍 Entorno: ${env.DENO_ENV}
🌐 URL: http://localhost:${availablePort}
🏥 Health: http://localhost:${availablePort}/health

📚 Endpoints:
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me (protegido)
   GET    /api/users (protegido)
   GET    /api/users/:id (protegido)
   PUT    /api/users/:id (protegido)
   DELETE /api/users/:id (protegido)

🔌 Plugin System:
`);

  Deno.serve({ port: availablePort }, app.fetch);
} catch (error) {
  console.error('❌ Failed to start server:', error);
  Deno.exit(1);
}
