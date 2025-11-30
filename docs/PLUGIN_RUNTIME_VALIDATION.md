# Plugin Runtime Validation (Phase 2)

Objetivo: validar manifiestos y permisos antes de arrancar workers, y abortar si hay inconsistencias. Integrar en reconciler/worker startup.

## Reglas
- Cada plugin declara `permissions.required` (hooks, rutas, tareas).
- El host calcula `requested = extractRequestedPermissions(manifest.permissions)` y `missing = computeMissingPermissions(requested, grants)`.
- Si `missing.length > 0`: no iniciar worker, marcar health error y responder 400 en activación.
- Worker debe exponer assertPermission para operaciones internas (registrar ruta/hook/tarea).

## Flujo de startup
1. Reconciler lee plugin (DB).
2. Calcula `missing`.
3. Si `missing.length > 0` -> `plugin_health.status=error`, no inicia worker.
4. Si ok, `startWorker(name, requestedPermissions)`.
5. Worker (cuando se implemente real) valida manifiesto: rutas/hook names deben estar en `requested`.
6. Si falla, health=error y status=error.

## TODO inmediato
- [ ] Implementar validación de manifiesto en `startWorker` (cuando cargue bundle real).
- [ ] Añadir `requestedPermissions` al state/health de worker (ya pasamos lista, falta persistir en health logs).
- [ ] Responder en `/api/plugins/:name` la lista `missingPermissions` (ya) y `requestedPermissions` (pendiente).
- [ ] Tests e2e de activación y reconciler con worker simulado.
