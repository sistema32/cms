# Sistema de Migraciones y Base de Datos para Plugins

## Resumen

LexCMS utiliza un sistema de migraciones versionadas para gestionar el esquema de base de datos de los plugins. Cada plugin tiene sus propias tablas con prefijo automático para evitar conflictos.

## Arquitectura

### 1. Flujo de Peticiones a la Base de Datos

```
┌─────────────┐         ┌──────────┐         ┌──────────────┐         ┌──────────┐
│   Plugin    │  RPC    │  Host    │  Query  │   Drizzle    │  SQL    │  SQLite  │
│  (Worker)   │────────▶│ Services │────────▶│     ORM      │────────▶│    DB    │
└─────────────┘         └──────────┘         └──────────────┘         └──────────┘
```

**Ejemplo:**
```typescript
// En el plugin (worker)
const sliders = await api.db.collection('sliders').find({ name: 'Hero' });

// Se convierte automáticamente a:
// SELECT * FROM lexslider_sliders WHERE name = 'Hero'
```

### 2. Prefijos Automáticos

Todas las tablas de un plugin se crean con el prefijo `{pluginName}_`:

- Plugin `lexslider` → Tablas: `lexslider_sliders`, `lexslider_slides`
- Plugin `analytics` → Tablas: `analytics_events`, `analytics_sessions`

Esto se maneja automáticamente en `HostServices.ts`:

```typescript
const tableName = `${pluginName}_${collectionName}`;
```

## Sistema de Migraciones

### 1. Definir Migraciones

Crea un archivo `migrations.ts` en la raíz de tu plugin:

```typescript
export const migrations = [
    {
        version: 1,
        name: 'initial_schema',
        up: async (db) => {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS myplugin_items (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                )
            `);
        },
        down: async (db) => {
            await db.execute('DROP TABLE IF EXISTS myplugin_items');
        }
    },
    {
        version: 2,
        name: 'add_description_field',
        up: async (db) => {
            await db.execute(`
                ALTER TABLE myplugin_items 
                ADD COLUMN description TEXT
            `);
        },
        down: async (db) => {
            // SQLite no soporta DROP COLUMN directamente
            // Necesitarías recrear la tabla
        }
    }
];
```

### 2. Ejecutar Migraciones

Las migraciones se ejecutan automáticamente cuando:
1. El plugin se activa por primera vez
2. Se detecta una nueva versión del plugin con migraciones pendientes

El sistema mantiene un registro en la tabla `plugin_migrations`:

```sql
CREATE TABLE plugin_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plugin_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL,
    UNIQUE(plugin_name, version)
)
```

### 3. Rollback

Para revertir la última migración:

```typescript
import { MigrationRunner } from './MigrationRunner.ts';
import { migrations } from './migrations.ts';

const runner = new MigrationRunner(db, 'myplugin');
await runner.rollback(migrations);
```

## API de Base de Datos

### Métodos Disponibles

```typescript
// Buscar registros
await api.db.collection('items').find({ status: 'active' });

// Buscar uno
await api.db.collection('items').findOne({ id: '123' });

// Crear
await api.db.collection('items').create({
    id: crypto.randomUUID(),
    name: 'New Item',
    created_at: Date.now()
});

// Actualizar
await api.db.collection('items').update(
    { id: '123' },  // Query
    { name: 'Updated Name' }  // Data
);

// Eliminar
await api.db.collection('items').delete({ id: '123' });
```

### Tipos de Datos Recomendados

Para SQLite, usa estos tipos:

- **TEXT**: Strings, JSON (serializado)
- **INTEGER**: Números enteros, timestamps (Unix epoch)
- **REAL**: Números decimales
- **BLOB**: Datos binarios

**Ejemplo de esquema completo:**

```sql
CREATE TABLE lexslider_sliders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT UNIQUE NOT NULL,
    config TEXT NOT NULL,  -- JSON serializado
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
)
```

## Mejores Prácticas

### 1. Usa UUIDs para IDs

```typescript
import { crypto } from 'node:crypto';

const id = crypto.randomUUID();
```

### 2. Serializa Objetos Complejos como JSON

```typescript
const slider = {
    id: crypto.randomUUID(),
    name: 'Hero Slider',
    config: JSON.stringify({
        width: 1200,
        height: 600,
        autoplay: true
    })
};
```

### 3. Usa Timestamps Unix

```typescript
const now = Date.now(); // Milisegundos desde epoch
```

### 4. Índices para Consultas Frecuentes

```sql
CREATE INDEX idx_slides_slider_id 
ON lexslider_slides(slider_id);
```

### 5. Foreign Keys para Integridad

```sql
FOREIGN KEY (slider_id) 
REFERENCES lexslider_sliders(id) 
ON DELETE CASCADE
```

## Limitaciones Actuales

1. **No hay transacciones explícitas**: Cada operación es atómica pero no puedes agrupar múltiples operaciones.
2. **No hay joins nativos**: Debes hacer consultas separadas y combinar en el código.
3. **SQLite solo**: El sistema está optimizado para SQLite (aunque Drizzle soporta otros).

## Próximos Pasos

- [ ] Exponer `api.db.runMigrations()` en `HostAPI`
- [ ] Implementar sistema de transacciones
- [ ] Soporte para consultas JOIN
- [ ] CLI para gestionar migraciones (`deno task plugin:migrate`)
