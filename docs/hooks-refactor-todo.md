# TODO – Librería global de hooks (reemplazo HookManager de plugins)

## Objetivo
Extraer los hooks del sistema de plugins y centralizar en una librería global (`src/lib/hooks/`) con API estable, segura y con namespacing CMS. Mantener shim temporal para compatibilidad mientras migramos llamadas existentes y retiramos `HookManager` de plugins.

## Tareas
- [ ] Crear módulo `src/lib/hooks/index.ts` con:
  - [ ] `registerAction(hook, handler, opts)` y `doAction(hook, ...args)`.
  - [ ] `registerFilter(hook, handler, opts)` y `applyFilters(hook, value, ...args)`.
  - [ ] Prioridades, namespacing (prefijo `cms_`), límites de listeners y validación de nombres.
  - [ ] Timeouts por handler y conteo de errores (circuit breaker liviano).
  - [ ] Métricas básicas: invocaciones, duración promedio y errores por hook.
- [x] Implementación inicial en `src/lib/hooks/index.ts` (acciones/filtros, timeouts, metrics, breaker, namespacing).
- [x] Bloqueo de nombres sin prefijo y listado de hooks core reservados.
- [ ] Definir hooks reservados/core (p.ej. `cms_title`, `cms_enqueue_scripts`, `cms_render_block`, etc.) y documentarlos.
- [ ] Agregar adaptador/shim de compatibilidad:
  - [x] Shim eliminado (HookManager retirado); usar solo API global.
- [ ] Migrar llamadas existentes:
  - [ ] Frontend (`themes/default/templates/Layout.tsx`) → nueva API.
  - [ ] Admin (`src/lib/admin/hooks.ts` y usos) → nueva API.
  - [ ] Controladores (`auth`, `contentController`, `frontend.ts`) → nueva API.
  - [ ] Utils (`utils/media/imageProcessor.ts`) → nueva API.
- [ ] Testing:
  - [x] Unit tests iniciales para registro, prioridades, filtros encadenados, timeouts y prefix.
  - [x] Test de compatibilidad del shim (HookManager → hooks globales).
- [ ] Limpieza final:
  - [x] Retirar uso de `HookManager` en plugins.
  - [x] Eliminar shim y referencias legacy.

## Notas de seguridad
- Prefijo obligatorio `cms_` para evitar colisiones (no exponer nombres WP).
- Límite de listeners por hook y timeout configurable por entorno (dev vs prod).
- Circuit breaker: si un handler falla repetidas veces, se deshabilita temporalmente y se loguea.
