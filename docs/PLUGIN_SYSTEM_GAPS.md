# Análisis de Gaps del Sistema de Plugins de LexCMS

## Resumen Ejecutivo

El sistema de plugins de LexCMS tiene una base sólida con aislamiento via Workers, RPC, y una API limpia. Sin embargo, hay **gaps críticos** que limitan su funcionalidad, seguridad y usabilidad en producción.

---

## 1. Base de Datos y Migraciones

### ❌ Faltante Crítico

#### 1.1 Implementación Incompleta de Queries
**Estado Actual:**
```typescript
// HostServices.ts - línea 18
this.bridge.registerHandler('db:find', async (collection: string, query: any) => {
    const tableName = this.getTableName(collection);
    // TODO: Implement proper query builder. For now, simple SELECT *
    return await executeQuery(`SELECT * FROM ${tableName}`);
});
```

**Problema:** 
- No se está usando el parámetro `query`
- Solo hace `SELECT *` sin filtros
- No hay soporte para WHERE, ORDER BY, LIMIT, etc.

**Impacto:** Los plugins NO pueden filtrar datos, haciendo la API de DB casi inútil.

#### 1.2 Falta `db:update` y `db:delete`
**Estado Actual:** Solo está implementado `db:find` y `db:create` en `HostServices.ts`.

**Faltante:**
- Handler para `db:update`
- Handler para `db:findOne`
- Handler para `db:delete`

#### 1.3 Sistema de Migraciones No Integrado
**Estado Actual:** 
- Creamos `MigrationRunner.ts` y `AgnosticMigrationRunner.ts`
- Pero NO están integrados en el ciclo de vida del plugin
- No hay llamada a `runMigrations()` en `PluginSandbox` o `PluginManager`

**Faltante:**
- Exponer `api.db.runMigrations(migrations)` en `HostAPI`
- Ejecutar migraciones automáticamente en `onActivate`
- CLI para gestionar migraciones manualmente

---

## 2. Rutas y Admin Panel

### ❌ Faltante Crítico

#### 2.1 Registro de Rutas No Implementado
**Estado Actual:**
```typescript
// WorkerHostAPI.ts - línea 67
register: (method: string, path: string, handler: (request: any) => Promise<any>) => {
    const handlerId = `route:${method}:${path}:${crypto.randomUUID()}`;
    this.bridge.registerHandler(handlerId, handler);
    this.bridge.call('routes:register', method, path, handlerId);
}
```

**Problema:** 
- Se llama a `routes:register` via RPC
- Pero NO hay handler en `HostServices.ts` que reciba esto
- Las rutas nunca se registran en el router de Express/Oak

**Impacto:** Los plugins NO pueden exponer endpoints HTTP.

#### 2.2 Admin Panel No Implementado
**Estado Actual:** Similar al problema de rutas, se llama a `admin:registerPanel` pero no hay handler.

**Faltante:**
- Handler RPC `admin:registerPanel` en `HostServices.ts`
- Integración con el sistema de rutas del admin (`/admincp/plugins/:name/*`)
- Registro en el menú lateral del admin

---

## 3. Seguridad y Permisos

### ⚠️ Gaps de Seguridad

#### 3.1 Validación de Permisos No Implementada
**Estado Actual:** 
- El `plugin.json` declara permisos (`permissions: ['database:write', 'network:external']`)
- Pero NO se validan en runtime

**Faltante:**
- Middleware en `HostServices` que verifique permisos antes de ejecutar operaciones
- Ejemplo: Si un plugin NO tiene `network:external`, bloquear `http:fetch`

#### 3.2 Rate Limiting Ausente
**Problema:** Un plugin malicioso o con bugs puede:
- Hacer miles de queries a la DB
- Saturar la red con requests HTTP
- Consumir toda la CPU/memoria

**Faltante:**
- Rate limiter por plugin (ej. 100 queries/segundo)
- Timeout global para operaciones RPC
- Circuit breaker para plugins que fallan repetidamente

#### 3.3 Sanitización de SQL Incompleta
**Estado Actual:**
```typescript
// HostServices.ts - línea 90
private getTableName(collection: string): string {
    const sanitized = collection.replace(/[^a-zA-Z0-9_]/g, '');
    return `${this.pluginName}_${sanitized}`;
}
```

**Problema:** Solo sanitiza el nombre de tabla, pero:
- No sanitiza los valores en `INSERT`
- No usa prepared statements correctamente
- Vulnerable a SQL injection en queries complejos

---

## 4. Developer Experience (DX)

### 📝 Faltante para Productividad

#### 4.1 No Hay TypeScript Types Exportados
**Problema:** Los plugins no tienen autocompletado ni type safety.

**Faltante:**
- Exportar tipos de `HostAPI` en un paquete npm
- Generar `.d.ts` para que los plugins puedan importar:
  ```typescript
  import type { HostAPI, PluginManifest } from '@lexcms/plugin-types';
  ```

#### 4.2 Sin Hot Reload para Desarrollo
**Problema:** Cada cambio en un plugin requiere:
1. Detener el servidor
2. Reiniciar
3. Reactivar el plugin

**Faltante:**
- File watcher que detecte cambios en `plugins/*/`
- Recargar el worker sin reiniciar el servidor
- Preservar estado de desarrollo

#### 4.3 Sin Debugging Tools
**Faltante:**
- Logs estructurados con niveles (debug, info, warn, error)
- Inspector de RPC messages (ver qué se envía entre worker y host)
- Profiler de performance (tiempo de queries, RPC latency)

#### 4.4 Sin CLI para Scaffolding
**Faltante:**
```bash
deno task plugin:create my-plugin
deno task plugin:migrate my-plugin up
deno task plugin:test my-plugin
```

---

## 5. Gestión de Assets

### 📦 Faltante

#### 5.1 Servir Assets Estáticos No Implementado
**Estado Actual:** El `loader.ts` de LexSlider intenta cargar:
```typescript
import { Dashboard } from "/api/plugins/lexslider/assets/admin/components/Dashboard.js";
```

**Problema:** 
- No hay ruta `/api/plugins/:name/assets/*` configurada
- Los assets no se sirven

**Faltante:**
- Middleware en `pluginController.ts` para servir archivos estáticos
- Soporte para MIME types (`.js`, `.css`, `.png`, etc.)
- Cache headers para assets

#### 5.2 Sin Build Pipeline
**Problema:** Para plugins complejos, necesitas:
- Compilar TypeScript a JavaScript
- Minificar CSS
- Optimizar imágenes

**Faltante:**
- Integración con esbuild/vite
- Hot module replacement (HMR) para desarrollo

---

## 6. Testing y Calidad

### 🧪 Faltante

#### 6.1 Sin Framework de Testing
**Faltante:**
- Helpers para testing de plugins:
  ```typescript
  import { createTestPlugin } from '@lexcms/plugin-test-utils';
  
  const plugin = await createTestPlugin('my-plugin');
  await plugin.activate();
  const result = await plugin.api.db.collection('items').find({});
  ```

#### 6.2 Sin Validación de Manifests
**Problema:** Un `plugin.json` malformado puede romper el sistema.

**Faltante:**
- Schema validation con Zod o similar
- Validar que los permisos solicitados existen
- Validar que la versión es semver válida

---

## 7. Monitoreo y Observabilidad

### 📊 Faltante

#### 7.1 Sin Métricas
**Faltante:**
- Contador de queries por plugin
- Latencia promedio de RPC calls
- Uso de memoria/CPU por worker
- Tasa de errores

#### 7.2 Sin Health Checks
**Faltante:**
- Endpoint `/api/plugins/:name/health`
- Auto-restart de workers que crashean
- Alertas cuando un plugin falla repetidamente

---

## 8. Documentación

### 📚 Faltante

#### 8.1 Sin Guía de Desarrollo
**Faltante:**
- Tutorial paso a paso para crear un plugin
- Ejemplos de plugins comunes (analytics, SEO, cache)
- Best practices

#### 8.2 Sin API Reference
**Faltante:**
- Documentación generada automáticamente de `HostAPI`
- Ejemplos de cada método
- Casos de uso comunes

---

## Priorización de Implementación

### 🔴 Crítico (Bloqueante para Producción)
1. **Implementar handlers DB completos** (`update`, `delete`, `findOne` con queries)
2. **Implementar registro de rutas** (handler RPC + integración con router)
3. **Implementar admin panel registration**
4. **Validación de permisos en runtime**
5. **Servir assets estáticos**

### 🟡 Alta Prioridad (Necesario para UX)
6. **Integrar sistema de migraciones**
7. **Rate limiting y circuit breakers**
8. **Hot reload para desarrollo**
9. **TypeScript types exportados**

### 🟢 Media Prioridad (Mejora DX)
10. **CLI para scaffolding**
11. **Framework de testing**
12. **Debugging tools**
13. **Métricas y observabilidad**

### 🔵 Baja Prioridad (Nice to Have)
14. **Build pipeline**
15. **Health checks automáticos**
16. **Documentación generada**

---

## Conclusión

El sistema de plugins tiene una **arquitectura sólida** pero está **incompleto en implementación**. Los gaps más críticos son:

1. **Base de datos**: Queries no funcionan, falta update/delete
2. **Rutas**: No se registran, los plugins no pueden exponer APIs
3. **Seguridad**: Sin validación de permisos ni rate limiting
4. **Assets**: No se sirven, el admin UI no carga

**Recomendación:** Priorizar los 5 ítems críticos antes de considerar el sistema "production-ready".
