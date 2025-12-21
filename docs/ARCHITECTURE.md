# Arquitectura y bounded contexts (draft)

## Contextos principales

- **Core CMS**: contenido, taxonomía, media, SEO, menús. Capas: dominio (servicios), infraestructura (DB/Drizzle), delivery (API Hono).
- **Seguridad**: auth, permisos/RBAC, rate limiting, IP rules, inspección, auditoría. Contrato: middlewares + servicios dedicados.
- **Plugins**: registro, reconciliación, migraciones, worker sandbox, capacidades y permisos. Contrato: manifest/capabilities/hooks.
- **Temas/Admin UI**: render de temas (público) y panel admin (React/Hono SSR). Build y assets separados.
- **Plataforma**: config/env, logging, errores, límites y utilidades compartidas (en `src/platform`).

## Convenciones de imports

- Preferir alias `@/` para código de `src/`.
- Evitar rutas relativas profundas (`../../`); mover utilidades comunes a `platform/` o módulos dedicados.

## Contratos de errores y respuestas

- Exponer errores de dominio como `AppError` (`code`, `message`, `status`, `details`). El middleware `errorHandler` traduce a JSON consistente.
- Zod: validar inputs en controladores y encapsular errores como `validation_error` con detalles.
- Respuestas de controllers: `{ data | resource, ... }` o `{ error, message }` manteniendo `status` adecuado.

## Errores y logging

- Errores de aplicación: `AppError` con `code` y `status`. Middlewares devuelven JSON estándar.
- Logger: usar `createLogger(scope)` para agregar contexto (scope + metadatos) en lugar de `console.*`.

## Próximos pasos (base)

- Alinear controladores/servicios a `AppError` y respuestas homogéneas.
- Definir DTOs y contratos zod compartidos para API pública y admin.
- Separar adaptadores de infraestructura (DB/cache/email/webhooks) de la lógica de dominio para facilitar pruebas y swap de proveedores.
