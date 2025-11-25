# Propuesta: API de Base de Datos Segura para Plugins (Secure DB Layer)

## Problema Actual
Actualmente, los plugins utilizan `api.query("SQL RAW")`. Esto presenta varios riesgos y problemas:
1.  **Seguridad**: Riesgo de inyección SQL si el desarrollador no usa `?` correctamente.
2.  **Abstracción**: Diferencias entre drivers (SQLite vs PostgreSQL) causan errores (ej. `RETURNING id` vs `last_insert_rowid`).
3.  **Aislamiento**: Un plugin podría accidentalmente (o maliciosamente) borrar tablas de otro plugin o del sistema core.

## Solución Propuesta: Scoped Data Access Layer (SDAL)

En lugar de ejecutar SQL crudo, los plugins utilizarán una API fluida y tipada, protegida por un sistema de permisos basado en el contexto del plugin.

### 1. Arquitectura

```typescript
// En lugar de:
await api.query("INSERT INTO lexslider_sliders ...");

// Usaremos:
await api.db.collection("sliders").create({
  name: "My Slider",
  width: 1200
});
```

### 2. Características de Seguridad

*   **Scope Automático**: El sistema añade automáticamente el prefijo del plugin (`lexslider_`) a todas las tablas. El plugin `lexslider` *solo* puede acceder a tablas que empiecen por `lexslider_`.
*   **Validación de Schema**: Se puede definir un esquema JSON (o Zod) al activar el plugin. La API validará los datos antes de intentar insertarlos.
*   **Abstracción del Driver**: El Core se encarga de generar el SQL correcto para SQLite, MySQL o Postgres. Esto soluciona definitivamente el problema de los IDs retornados.

### 3. Implementación con Tokens (Opcional / Máxima Seguridad)

Si se requiere "máxima seguridad" (ej. para plugins de terceros no confiables), podemos implementar un sistema de **Capabilities Tokens**:

1.  **Handshake**: Al iniciar, el plugin solicita un token de acceso para una tabla específica.
    ```typescript
    const slidersToken = await api.security.requestToken({
      resource: "database",
      table: "sliders",
      permissions: ["read", "write"]
    });
    ```
2.  **Uso**: Cada operación requiere el token.
    ```typescript
    await api.db.use(slidersToken).create({...});
    ```
3.  **Revocación**: El administrador puede revocar tokens específicos desde el panel de control, bloqueando el acceso a la BD sin detener el plugin.

## Ejemplo de Implementación (Fase 1 - Abstracción)

```typescript
// src/lib/plugin-system/PluginDB.ts

export class PluginDB {
  constructor(private pluginName: string, private db: Database) {}

  private getTableName(collection: string) {
    return `${this.pluginName}_${collection}`;
  }

  async find(collection: string, query: any) {
    // Convierte query object a SQL seguro
    // Retorna array normalizado
  }

  async create(collection: string, data: any) {
    // Maneja INSERT y retorna el objeto creado CON su ID
    // Resuelve automáticamente las diferencias de drivers
  }
}
```

## Beneficios Inmediatos para LexSlider
1.  **Adiós a `last_insert_rowid`**: `api.db.collection('sliders').create(...)` siempre devolverá el objeto creado, independientemente de si usamos SQLite o Postgres.
2.  **Código más limpio**: Se eliminan las cadenas SQL largas y propensas a errores.
