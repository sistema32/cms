import { app } from "./app.ts";
import { env, isDevelopment } from "./config/env.ts";
import { pluginManager } from "./lib/plugin-system/index.ts";
import { cacheManager } from "./lib/cache/index.ts";
import { emailManager } from "./lib/email/index.ts";
import { backupManager } from "./lib/backup/index.ts";
import { securityManager } from "./lib/security/index.ts";
import { initializeSearchIndexes } from "./services/searchService.ts";
import { jobQueue } from "./lib/jobs/index.ts";
import { registerBuiltInHandlers } from "./lib/jobs/handlers.ts";
import { HotReloadServer } from "./dev/hotReload.ts";

const port = env.PORT;

// Initialize cache system
try {
  await cacheManager.initialize();
} catch (error) {
  console.error('❌ Failed to initialize cache system:', error);
  // Continue anyway - cache is optional
}

// Initialize plugin system
console.log('\n🔌 Initializing plugin system...');
try {
  await pluginManager.initialize();
} catch (error) {
  console.error('❌ Failed to initialize plugin system:', error);
  // Continue anyway - plugins are optional
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

console.log(`
🚀 Servidor iniciado exitosamente

📍 Entorno: ${env.DENO_ENV}
🌐 URL: http://localhost:${port}
🏥 Health: http://localhost:${port}/health

📚 Endpoints:
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me (protegido)
   GET    /api/users (protegido)
   GET    /api/users/:id (protegido)
   PUT    /api/users/:id (protegido)
   DELETE /api/users/:id (protegido)

🔌 Plugin System:
   GET    /api/plugins (protegido)
   POST   /api/plugins/:name/install (protegido)
   POST   /api/plugins/:name/activate (protegido)
   POST   /api/plugins/:name/deactivate (protegido)
   PATCH  /api/plugins/:name/settings (protegido)
`);

Deno.serve({ port }, app.fetch);
