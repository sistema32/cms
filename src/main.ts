import { app } from "./app.ts";
import { env } from "./config/env.ts";

const port = env.PORT;

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
`);

Deno.serve({ port }, app.fetch);
