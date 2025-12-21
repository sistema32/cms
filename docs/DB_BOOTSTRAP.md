## Base de datos y bootstrap rápido

Cuando `DATABASE_URL` apunta a SQLite/Turso y el cliente nativo no está disponible, LexCMS cae a `@libsql/client-wasm` y usa una base en memoria (`:memory:`). Durante ese modo se crea automáticamente un esquema mínimo para los tests/integración:

- Roles, usuarios y permisos (incluye semilla de `superadmin` con `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`; valores por defecto `admin@example.com` / `password123`).
- Contenidos, taxonomías, SEO, media, notificaciones, seguridad (IP rules, security events, rate limits), plugins, webhooks y ajustes (`settings` con `blog_base` y `active_theme`).

### Producción / persistencia

- Para SQLite local usa una ruta de archivo en `DATABASE_URL` (ej. `file:cms.db`) y el cliente nativo; habilita WAL automáticamente.
- Para Turso, define `DATABASE_AUTH_TOKEN` y una URL remota.
- Para Postgres o MySQL, elige el tipo en config y ejecuta tus migraciones habituales (ej. `deno run -A run_slider_migrations.ts` o tu pipeline de Drizzle).

### Tests y CI

- `deno test -A` inicializa la DB en memoria y aplica el bootstrap anterior; no requiere servicios externos.

