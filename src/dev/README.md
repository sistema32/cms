# LexCMS DevBar

Una barra de desarrollo similar a Laravel Debugbar que muestra información detallada sobre cada request en modo desarrollo.

## Características

- 📊 **Overview**: Información general del request/response
- 🗃️ **Queries**: Todas las queries SQL ejecutadas con tiempo y parámetros
- 📝 **Logs**: Captura automática de console.log, console.warn, console.error
- 🔐 **Request**: Headers y query parameters del request
- 🚀 **Response**: Headers y status de la respuesta
- 👤 **Session**: Información del usuario autenticado

## Uso

El DevBar se activa automáticamente en modo desarrollo (`NODE_ENV !== "production"`).

### Capturar Queries Manualmente

Si quieres registrar queries de base de datos manualmente:

```typescript
import { devBarAddQuery } from "../dev/DevBarMiddleware.ts";

// Ejemplo con Drizzle ORM
const start = performance.now();
const users = await db.select().from(usersTable).execute();
const duration = performance.now() - start;

devBarAddQuery({
  sql: 'SELECT * FROM users',
  params: [],
  duration: duration,
});
```

### Interceptar Queries de Drizzle Automáticamente

Para interceptar automáticamente todas las queries de Drizzle ORM:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import { devBarAddQuery } from "../dev/DevBarMiddleware.ts";

// Wrapper para capturar queries
const createQueryLogger = (originalMethod: any) => {
  return async function(this: any, ...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const duration = performance.now() - start;

    // Capturar query
    devBarAddQuery({
      sql: args[0] || 'Unknown query',
      params: args.slice(1),
      duration: duration,
    });

    return result;
  };
};

// Aplicar wrapper al cliente de Drizzle
// (Esto es un ejemplo conceptual, la implementación real puede variar)
```

## Desactivar en Producción

El DevBar **solo se activa en desarrollo**. En producción (cuando `NODE_ENV=production`), el middleware no hace nada y no afecta el rendimiento.

## Configuración

El DevBar está configurado para:
- Capturar hasta 1000 queries por request
- Capturar hasta 1000 logs por request
- Interceptar todos los métodos de console

## Atajos de Teclado

- Haz clic en el header del DevBar para expandir/contraer
- Usa las tabs para navegar entre secciones

## Estilo

El DevBar usa:
- Colores inspirados en VS Code Dark Theme
- Tipografía monoespaciada para mejor legibilidad de código
- Diseño no intrusivo que no interfiere con el contenido

## Performance

El DevBar añade un overhead mínimo:
- ~1-2ms por request en desarrollo
- 0ms en producción (middleware desactivado)
- La captura de logs es asíncrona y no bloquea
