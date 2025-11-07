# Configuración del Sistema RBAC

## Instrucciones de Instalación

### 1. Ejecutar el Seed de RBAC

Para inicializar el sistema de roles y permisos, ejecuta el siguiente comando:

```bash
deno run --allow-all src/db/seeds/rbac.ts
```

Este comando:
- Creará todos los permisos necesarios para los módulos del sistema
- Creará el rol de **superadmin** con todos los permisos
- Creará el rol de **public_user** con permisos de lectura básicos
- Asignará automáticamente el rol de superadmin al usuario con ID 1

### 2. Verificar la Instalación

Después de ejecutar el seed, verifica que todo esté correcto:

1. El usuario ID 1 debe tener el rol de superadmin
2. Deben existir dos roles en el sistema
3. Deben existir permisos para todos los módulos

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
