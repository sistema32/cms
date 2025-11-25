# Arquitectura del Sistema de Plugins de LexCMS

LexCMS implementa un sistema de plugins avanzado basado en **Web Workers** para garantizar la seguridad, estabilidad y rendimiento del núcleo del CMS. Este documento detalla las características técnicas y la arquitectura del sistema.

## 1. Arquitectura General

El sistema utiliza un modelo de **aislamiento por Worker**, donde cada plugin se ejecuta en su propio hilo (Thread) separado del hilo principal de la aplicación.

### Componentes Principales

1.  **Main Thread (Núcleo)**:
    *   **PluginManager**: Orquesta el ciclo de vida de los plugins.
    *   **PluginLoader**: Carga, valida e instancia los plugins.
    *   **PluginWorker**: Gestiona la comunicación con el worker del plugin.
    *   **RPCServer**: Servidor RPC que recibe peticiones del plugin.

2.  **Worker Thread (Plugin)**:
    *   **worker-entry.ts**: Punto de entrada del worker. Inicializa el entorno.
    *   **WorkerPluginAPI**: API disponible para el plugin dentro del worker.
    *   **RPCClient**: Cliente RPC que envía peticiones al núcleo.
    *   **Plugin Instance**: La instancia de la clase del plugin.

## 2. Aislamiento y Seguridad (Sandboxing)

Cada plugin corre en un entorno aislado con permisos estrictamente controlados mediante las políticas de seguridad de Deno.

*   **Sin acceso directo al sistema de archivos**: Los plugins no pueden leer ni escribir archivos arbitrarios. Solo tienen acceso a su propio directorio.
*   **Sin acceso directo a la red**: Las peticiones de red son interceptadas y gestionadas por el núcleo, permitiendo listas blancas de dominios.
*   **Sin acceso a variables de entorno**: Los plugins no pueden leer las variables de entorno del servidor (como claves API secretas).
*   **Límites de Recursos**: Se monitorea el uso de CPU y memoria de cada worker.

## 3. Sistema de Comunicación RPC

La comunicación entre el núcleo y los plugins es asíncrona y se realiza mediante un protocolo **RPC (Remote Procedure Call)** sobre `postMessage`.

### Flujo de una llamada (Ejemplo: Consulta a Base de Datos)

1.  **Plugin**: Llama a `api.db.collection('users').find()`.
2.  **WorkerPluginAPI**: Convierte la llamada en un mensaje RPC `api:database:query`.
3.  **RPCClient**: Envía el mensaje al hilo principal.
4.  **RPCServer (Main)**: Recibe el mensaje y ejecuta la consulta real en la base de datos.
5.  **RPCServer**: Envía el resultado de vuelta al worker.
6.  **RPCClient (Worker)**: Recibe el resultado y resuelve la promesa original.

### Timeouts y Protección

Todas las operaciones RPC tienen un tiempo máximo de ejecución (por defecto 30s). Si una operación tarda más, se lanza un error de Timeout para evitar que un plugin bloquee el sistema.

## 4. API del Plugin

Los plugins interactúan con el sistema a través de la clase `PluginAPI` (expuesta como `api` en el constructor o `globalThis.pluginAPI`).

### Capacidades Principales

*   **Base de Datos (`api.db`)**: Acceso seguro y "scoped" a tablas propias del plugin.
    *   `api.db.collection('items').create(...)`
    *   `api.db.collection('items').find(...)`
*   **Hooks y Filtros**:
    *   `api.addAction('hook_name', callback)`: Ejecutar código en puntos específicos.
    *   `api.addFilter('filter_name', callback)`: Modificar datos.
*   **Rutas API**:
    *   `api.registerRoute('GET', '/my-route', handler)`: Registrar endpoints REST.
*   **Panel de Administración**:
    *   `api.registerAdminPanel({...})`: Registrar interfaz de usuario en el admin.
*   **Settings**:
    *   `api.getSetting('key')` / `api.setSetting('key', value)`: Gestión de configuración.

## 5. Ciclo de Vida

1.  **Load**: Se carga el código del plugin en el worker. Se ejecuta el constructor.
2.  **Init (`onInit`)**: Inicialización asíncrona. Ideal para cargar dependencias pesadas.
3.  **Activate (`onActivate`)**: Se llama cuando el usuario activa el plugin. Registro de hooks iniciales.
4.  **Deactivate (`onDeactivate`)**: Limpieza de recursos y hooks.

## 6. Frontend y Assets

Los plugins pueden servir assets estáticos (JS, CSS, imágenes) que son accesibles públicamente bajo `/api/plugins/:pluginName/assets/*`.

*   **Admin UI**: Se recomienda usar Preact/HTM cargado desde `esm.sh` para interfaces ligeras y rápidas sin paso de compilación (No-Build).

## 7. Diagnóstico de Problemas Comunes

*   **Timeout en Load**: Puede ocurrir si el plugin intenta importar módulos externos pesados en el nivel superior (top-level await) o si hay problemas de red al descargar dependencias.
*   **Error de RPC**: Ocurre si se intentan pasar objetos no serializables (como funciones o referencias circulares) entre el worker y el núcleo.
