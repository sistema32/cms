import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { pluginManager } from "./lib/plugin-system/index.ts";
import { cacheManager } from "./lib/cache/index.ts";

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
