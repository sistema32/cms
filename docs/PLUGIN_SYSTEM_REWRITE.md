## Plugin System Refactor — DB-First, Secure, Extensible

Objetivo: reescribir el sistema de plugins para que **la base de datos sea la única fuente de verdad**, con un runtime seguro y permisos granulares. Los plugins interactúan mediante una API controlada (no acceso directo a process/Deno), cargan/retiran sus migraciones, registran rutas/hooks declarativamente y se sincronizan siempre con el estado en DB.

### Principios
- DB autoritativa: estado `installed/active/version/settings` solo en DB. El runtime consulta/obedece la DB y corrige cualquier desalineación.
- Seguridad por diseño: sandbox de ejecución (worker restringido), permisos declarativos (fs, red, db ops, hooks) y límites (tiempo, memoria, IO).
- Declaratividad: el plugin declara rutas, hooks, migraciones y permisos requeridos en su manifiesto; el host valida y aplica.
- Observabilidad: auditoría de acciones (activar/desactivar, hooks ejecutados, errores), métricas de uso y health checks de workers.
- Rollback seguro: migraciones por plugin con up/down; desactivar elimina/rollback de migraciones si corresponde (configurable).

### Fases y entregables
1) **Modelado y estado**
   - Esquema DB para plugins (estado, versión, settings, permisos concedidos, hash de manifiesto, migraciones aplicadas, health).
   - API interna `PluginRegistry` que solo lee DB; workers no mantienen estado propio de actividad.
   - Background reconciler: compara DB vs workers y corrige (arranca/para workers según DB).

2) **Manifiesto y permisos**
   - Manifiesto extendido (rutas, hooks, migraciones, permisos requeridos, capacidades FS/HTTP, límites CPU/mem).
   - Validador estricto (zod) + firma opcional (checksum).
   - Grant de permisos por admin: matriz de permisos (read/write config, db migrations, http outbound, fs scoped, hooks allowed).

3) **API de runtime (host ↔ plugin)**
   - RPC limitado: operaciones de DB a través de un `PluginDB` con métodos parametrizados (sin SQL arbitrario) y quotas.
   - FS virtualizado: acceso solo a carpeta del plugin (lectura opcional, escritura opcional si se concede).
   - HTTP sandbox: allowlist/denylist de dominios; límites de frecuencia.
   - Hooks: registro declarativo; ejecución aislada con timeouts y captura de errores; permitir que plugins definan nuevos hook types solo si se aprueba.
   - Rutas: registro declarativo; handlers corren en worker sandbox; solo retornan JSON/text y usan la API limitada.

4) **Migraciones por plugin**
   - Carpeta `plugins/<name>/migrations`; registro en DB por plugin.
   - Comandos host: `plugin:migrate <name> up|down|status`.
   - Activar plugin: aplica migraciones pendientes (con rollback en fallo).
   - Desactivar plugin (configurable): opción de rollback o mantener datos; siempre marca en DB qué migraciones quedaron aplicadas.

5) **Ciclo de vida**
   - Install: validar manifiesto, registrar en DB, sin arrancar worker hasta activar.
   - Activate: DB -> set active, reconciler arranca worker, aplica migraciones, registra rutas/hooks declaradas.
   - Deactivate: DB -> set inactive, reconciler detiene worker, desregistra rutas/hooks, opcional rollback de migraciones.
   - Uninstall: requiere inactivo; limpia rutas/hooks, opcional rollback total, borra registro en DB.
   - Reload: inactivo → activo con rebootstrap del worker, releyendo manifiesto.

6) **Admin UI/UX**
   - Estado siempre desde `/api/plugins/:name` (DB); botones muestran spinner/errores; sync tras cada acción.
   - Vista de permisos concedidos/solicitados; flujo de aprobación.
   - Logs de activación/desactivación y de migraciones por plugin.

7) **Seguridad y límites**
   - Timeouts por hook/route, memoria máxima por worker, rate limit de RPC (DB/FS/HTTP).
   - Serialización segura (sin funciones) en mensajes worker.
   - Auditoría: bitácora de acciones y fallos con trazas mínimas.

8) **Rollout**
   - Fase 1: introducir reconciler y DB-authoritative status sin romper API actual.
   - Fase 2: manifest v2 con permisos y rutas declarativas; migraciones por plugin.
   - Fase 3: sandbox reforzado y UI de permisos/observabilidad.
   - Fase 4: limpiar APIs legacy (acceso directo a db/fs) y migrar plugins internos (lexslider, hello-world).

### TODO (ejecutable)
- [ ] Esquema DB: tabla `plugins` extendida, tabla `plugin_migrations`, tabla `plugin_permissions_grants`.
- [ ] Reconciler: job periódico que alinea workers con DB (start/stop) y repara drift.
- [ ] Manifest v2 + validador + checksum.
- [ ] API limitada de DB/FS/HTTP en el worker (capabilities + quotas).
- [ ] Registro declarativo de rutas y hooks desde el manifest; host monta/desmonta dinámicamente.
- [ ] Pipeline de migraciones por plugin (CLI + on-activate).
- [ ] UI admin: estado en vivo desde DB, feedback de acciones, vista de permisos y logs.
- [ ] Auditoría y métricas (activaciones, fallos, tiempo de hooks/rutas).
- [ ] Plan de migración para plugins existentes y fallback de compatibilidad temporal.
- [ ] Health checks + circuit breaker por plugin: ping periódico al worker; si falla N veces, marcar degradado, pausar hooks/rutas y notificar en admin con botón de reintento.
- [ ] Snapshots de configuración por plugin: guardar settings/estado antes de activar o migrar; rollback rápido desde el admin.
- [ ] Escáner de seguridad para plugins instalados: análisis de manifiesto y código (firma/checksum, dependencias, rutas expuestas, permisos solicitados) con reporte y scoring; ejecución programada y bajo demanda.
- [ ] Perfilado y límites por hook/ruta: medir duración y recursos; cortar handlers que excedan umbrales configurables por plugin.
- [ ] Modo “dry-run” de activación: simular validaciones/migraciones y mostrar reporte de cambios antes de aplicar.
- [ ] Modo desarrollo con controles de seguridad desactivables (opt-in): permitir reducir restricciones de sandbox para plugins en entorno dev, nunca en prod.
- [ ] Compat de hooks estilo WordPress con namespace CMS: exponer equivalentes (`cms_title`, `cms_enqueue_scripts`, etc.) sin colisionar con nombres WP.
- [ ] Bibliotecar hooks globales (fuera del sistema de plugins): crear `src/lib/hooks` con registro/ejecución independiente del PluginManager; migrar llamadas existentes a usar la nueva librería; los plugins futuros solo se conectan a esta API pública.
- [ ] Plan de retirada del sistema de plugins actual: aislar llamadas legacy, desregistrar HookManager de plugins y preparar migración hacia el nuevo runtime DB-first; documentar fases de eliminación y compatibilidad temporal.
