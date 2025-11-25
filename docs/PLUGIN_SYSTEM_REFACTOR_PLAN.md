# Plan de Refactorización del Sistema de Plugins

Este documento describe el plan para reconstruir el sistema de plugins de LexCMS desde cero, priorizando la limpieza, seguridad y robustez.

## Objetivos
1.  **Eliminar la complejidad innecesaria**: Simplificar la capa RPC y la inicialización de workers.
2.  **Robustez**: Eliminar los timeouts aleatorios y mejorar el manejo de errores.
3.  **Seguridad**: Mantener el aislamiento estricto (Sandboxing) pero con una API más clara.
4.  **Sin Hardcoding**: Configuración dinámica y flexible.

## Nueva Arquitectura

### 1. Núcleo (`src/lib/plugins/core`)

*   **`PluginManager`**: Singleton que orquesta todo.
*   **`PluginRegistry`**: Base de datos en memoria de plugins cargados y su estado.
*   **`PluginSandBox`**: Clase que encapsula la lógica del Worker (reemplaza a `PluginWorker`).

### 2. Comunicación (`src/lib/plugins/rpc`)

*   **`RPCBridge`**: Una clase simplificada para mensajería bidireccional.
    *   Uso de `Transferable` objects para mejor rendimiento.
    *   Manejo de Promesas con IDs únicos (Request/Response pattern).
    *   Tipado estricto de mensajes.

### 3. API del Plugin (`src/lib/plugins/api`)

*   **`IPlugin`**: Interfaz que todo plugin debe implementar.
*   **`HostAPI`**: La API que se expone al plugin (DB, Hooks, Logger).
    *   `db`: Acceso a base de datos scoped.
    *   `hooks`: Registro de acciones y filtros.
    *   `http`: Peticiones de red controladas.

### 4. Ciclo de Vida Simplificado

1.  **Discovery**: Escaneo de carpetas `plugins/*/manifest.json`.
2.  **Sandboxing**: Creación del Worker solo cuando se necesita (Lazy Loading).
3.  **Handshake**: El Worker y el Host intercambian capacidades.
4.  **Activation**: Ejecución de `onActivate`.

## Pasos de Implementación

### Fase 1: Infraestructura Base
1.  Crear estructura de directorios `src/lib/plugins/`.
2.  Implementar `RPCBridge` (la base de la comunicación).
3.  Implementar `PluginSandbox` (el contenedor del worker).

### Fase 2: API y Host
1.  Implementar `HostAPI` (la cara visible para el plugin).
2.  Implementar `PluginDB` (versión limpia y optimizada).
3.  Conectar `HookManager` existente al nuevo sistema.

### Fase 3: Loader y Manager
1.  Implementar `PluginLoader` (lectura de manifiestos).
2.  Implementar `PluginManager` (orquestación).

### Fase 4: Migración
1.  Adaptar el plugin `lexslider` a la nueva arquitectura.
2.  Verificar que no haya timeouts ni errores de "undefined".

## Mejoras Específicas sobre el Sistema Anterior

*   **Worker Entry**: Será un archivo estático y simple que importa dinámicamente el plugin. Sin lógica compleja de "warmup" bloqueante.
*   **Timeouts**: Configurable por plugin, pero con defaults sensatos. El handshake inicial no tendrá timeout estricto para permitir compilación JIT si es necesaria.
*   **Dependencias**: Los plugins declararán sus dependencias externas en `manifest.json` y el Host se encargará de proveerlas o permitirlas (ej: `preact`, `htm`), evitando `import` duros a URLs externas dentro del código del plugin.

## Estructura de Archivos Propuesta

```
src/lib/plugins/
├── core/
│   ├── PluginManager.ts
│   ├── PluginSandbox.ts
│   └── PluginLoader.ts
├── rpc/
│   ├── RPCBridge.ts
│   └── messages.ts
├── api/
│   ├── HostAPI.ts
│   └── IPlugin.ts
└── worker/
    └── bootstrapper.ts  <-- Nuevo entry point genérico
```
