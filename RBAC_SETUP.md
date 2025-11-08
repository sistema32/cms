# Configuración del Sistema RBAC

## Instrucciones de Instalación

### 1. Configurar Variables de Entorno

Asegúrate de tener un archivo `.env` en la raíz del proyecto con la configuración de la base de datos:

```bash
DATABASE_URL=./lexcms.db
```

Puedes copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

### 2. Ejecutar Setup de Base de Datos

Para crear la base de datos y ejecutar las migraciones:

```bash
python3 scripts/setup_db.py
```

Este script:
- Lee la ubicación de la base de datos desde `.env`
- Crea la base de datos SQLite
- Ejecuta todas las migraciones SQL

### 3. Ejecutar Seed de RBAC

Para inicializar el sistema de roles y permisos:

```bash
python3 scripts/run_seed.py
```

Este comando:
- Lee la ubicación de la base de datos desde `.env`
- Crea el usuario administrador (admin@example.com / password123)
- Crea todos los permisos necesarios (77 permisos)
- Crea el rol de **superadmin** con todos los permisos
- Crea el rol de **public_user** con permisos de lectura básicos
- Asigna automáticamente el rol de superadmin al usuario con ID 1

### 4. Verificar la Instalación

Para verificar que todo está correcto:

```bash
python3 scripts/verify_rbac.py
```

Este script mostrará:
- Todos los roles creados
- Permisos asignados a cada rol
- Usuario administrador
- Estadísticas del sistema

Deberías ver:
1. 2 roles (superadmin y public_user)
2. 77 permisos creados
3. Usuario ID 1 con rol superadmin
4. 15 módulos del sistema

### 3. Estructura del Sistema

El sistema RBAC completo incluye:

#### Archivos Nuevos Creados:

- `src/db/seeds/rbac.ts` - Seed para inicializar roles y permisos
- `src/services/authorizationService.ts` - Servicio principal de autorización
- `src/middleware/authorization.ts` - Middleware de autorización para rutas
- `docs/RBAC_SYSTEM.md` - Documentación completa del sistema

#### Archivos Actualizados:

- `src/services/permissionService.ts` - Mejorado con nuevas funcionalidades
- `src/services/roleService.ts` - Mejorado con cache y validaciones
- `src/controllers/roleController.ts` - Nuevos endpoints agregados
- `src/controllers/permissionController.ts` - Nuevos endpoints agregados

## Características Principales

### ✅ Sistema RBAC Completo
- Roles y permisos granulares por módulo y acción (CRUD)
- Superadministrador con acceso total
- Usuario público con acceso limitado

### ✅ Módulos Soportados
- Posts, Pages, Categories, Tags
- Comments, Media, Users, Roles
- Settings, Menus, Plugins, Backups
- Audit, Webhooks, Dashboard

### ✅ Seguridad
- Usuario ID 1 protegido como superadmin
- Roles del sistema no eliminables
- Validaciones exhaustivas
- Logs de auditoría para accesos denegados

### ✅ Performance
- Cache de permisos (TTL: 5 minutos)
- Limpieza automática del cache
- Optimización de queries

### ✅ API REST Completa
- Endpoints para gestión de roles
- Endpoints para gestión de permisos
- Estadísticas y búsqueda

## Próximos Pasos

1. **Ejecutar el seed**: `deno run --allow-all src/db/seeds/rbac.ts`
2. **Leer la documentación**: Revisar `docs/RBAC_SYSTEM.md`
3. **Probar el sistema**: Verificar que los permisos funcionen correctamente
4. **Crear roles personalizados**: Usar la API para crear roles según tus necesidades

## Uso Rápido

### Proteger una Ruta

```typescript
import { requirePermission } from "../middleware/authorization.ts";

app.post("/api/posts",
  authMiddleware,
  requirePermission("posts", "create"),
  createPost
);
```

### Verificar Permisos en el Código

```typescript
import { hasPermission } from "../services/authorizationService.ts";

const canEdit = await hasPermission(userId, "posts", "update");
```

## Soporte

Para más información, consulta la documentación completa en `docs/RBAC_SYSTEM.md`.
