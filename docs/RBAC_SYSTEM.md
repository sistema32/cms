# Sistema RBAC (Role-Based Access Control)

## Descripción General

El sistema RBAC ha sido completamente refactorizado para proporcionar un control de acceso robusto, granular y seguro. Este sistema permite gestionar permisos a nivel de módulo y acción (CRUD) para diferentes recursos del CMS.

## Arquitectura del Sistema

### Componentes Principales

1. **Base de Datos**
   - `roles`: Tabla de roles del sistema
   - `permissions`: Tabla de permisos disponibles
   - `role_permissions`: Tabla de relación muchos-a-muchos entre roles y permisos
   - `users.roleId`: Relación del usuario con su rol

2. **Servicios**
   - `authorizationService.ts`: Servicio principal para verificar permisos
   - `permissionService.ts`: CRUD y gestión de permisos
   - `roleService.ts`: CRUD y gestión de roles

3. **Middleware**
   - `authorization.ts`: Middlewares para proteger rutas basándose en permisos

4. **Controladores**
   - `roleController.ts`: API REST para gestión de roles
   - `permissionController.ts`: API REST para gestión de permisos

5. **Seeds**
   - `src/db/seeds/rbac.ts`: Seed para inicializar el sistema con roles y permisos

## Módulos y Permisos

### Módulos del Sistema

El sistema incluye permisos para los siguientes módulos:

- **posts**: Artículos y publicaciones
- **pages**: Páginas estáticas
- **categories**: Categorías de contenido
- **tags**: Etiquetas
- **comments**: Comentarios
- **media**: Biblioteca de medios
- **users**: Gestión de usuarios
- **roles**: Gestión de roles y permisos
- **settings**: Configuración del sistema
- **menus**: Menús de navegación
- **plugins**: Plugins y extensiones
- **backups**: Copias de seguridad
- **audit**: Registros de auditoría
- **webhooks**: Webhooks
- **dashboard**: Panel de administración

### Acciones CRUD

Cada módulo tiene las siguientes acciones básicas:
- `create`: Crear recursos
- `read`: Leer recursos
- `update`: Actualizar recursos
- `delete`: Eliminar recursos

### Permisos Especiales

Además de las acciones CRUD, existen permisos especiales:

- **Media**
  - `media.upload`: Subir archivos
  - `media.delete_others`: Eliminar archivos de otros usuarios

- **Comentarios**
  - `comments.moderate`: Moderar comentarios
  - `comments.approve`: Aprobar comentarios

- **Usuarios**
  - `users.manage_roles`: Asignar roles
  - `users.manage_2fa`: Gestionar 2FA

- **Settings**
  - `settings.manage`: Administrar configuración

- **Plugins**
  - `plugins.install`: Instalar plugins
  - `plugins.activate`: Activar/desactivar plugins
  - `plugins.configure`: Configurar plugins

- **Backups**
  - `backups.create`: Crear backups
  - `backups.restore`: Restaurar backups
  - `backups.download`: Descargar backups

- **Dashboard**
  - `dashboard.access`: Acceder al panel
  - `dashboard.view_stats`: Ver estadísticas

- **Audit**
  - `audit.view`: Ver registros

- **Webhooks**
  - `webhooks.test`: Probar webhooks

## Roles por Defecto

### 1. Superadministrador (superadmin)

- **Características:**
  - Rol del sistema (no se puede eliminar)
  - Tiene TODOS los permisos del sistema
  - El usuario con ID 1 debe tener este rol
  - No se pueden modificar sus permisos

- **Protecciones:**
  - El sistema verifica automáticamente que el usuario ID 1 tenga este rol
  - Las funciones `isSuperAdmin()` retornan `true` para el usuario ID 1

### 2. Usuario Público (public_user)

- **Características:**
  - Rol del sistema (no se puede eliminar)
  - Solo tiene permisos de lectura de contenido público

- **Permisos:**
  - `posts.read`
  - `pages.read`
  - `categories.read`
  - `tags.read`
  - `media.read`
  - `comments.read`
  - `comments.create` (pueden crear comentarios)

## Uso del Sistema

### 1. Inicialización (Seed)

Para inicializar el sistema con roles y permisos por defecto:

```bash
deno run --allow-all src/db/seeds/rbac.ts
```

Esto creará:
- Todos los permisos necesarios para los módulos del sistema
- Rol de superadministrador con todos los permisos
- Rol de usuario público con permisos limitados
- Asignará el rol de superadmin al usuario ID 1

### 2. Verificar Permisos en el Código

#### Servicio de Autorización

```typescript
import { hasPermission, isSuperAdmin } from "../services/authorizationService.ts";

// Verificar un permiso específico
const canCreatePosts = await hasPermission(userId, "posts", "create");

// Verificar si es superadmin
const isAdmin = await isSuperAdmin(userId);

// Verificar múltiples permisos (cualquiera)
const hasAny = await hasAnyPermission(userId, [
  { module: "posts", action: "create" },
  { module: "pages", action: "create" }
]);

// Verificar múltiples permisos (todos)
const hasAll = await hasAllPermissions(userId, [
  { module: "posts", action: "create" },
  { module: "posts", action: "update" }
]);
```

#### Middleware en Rutas

```typescript
import { requirePermission, requireSuperAdmin } from "../middleware/authorization.ts";

// Proteger una ruta con un permiso específico
app.post("/api/posts",
  authMiddleware,
  requirePermission("posts", "create"),
  createPost
);

// Requerir ser superadmin
app.delete("/api/users/:id",
  authMiddleware,
  requireSuperAdmin(),
  deleteUser
);

// Requerir cualquiera de varios permisos
app.get("/api/content",
  authMiddleware,
  requireAnyPermission([
    { module: "posts", action: "read" },
    { module: "pages", action: "read" }
  ]),
  getContent
);
```

### 3. Gestión de Roles (API)

#### Crear un Rol

```http
POST /api/roles
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "editor",
  "description": "Editor de contenido"
}
```

#### Asignar Permisos a un Rol

```http
POST /api/roles/{roleId}/permissions
Content-Type: application/json
Authorization: Bearer {token}

{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

#### Agregar un Permiso

```http
POST /api/roles/{roleId}/permissions/add
Content-Type: application/json
Authorization: Bearer {token}

{
  "permissionId": 10
}
```

#### Remover un Permiso

```http
POST /api/roles/{roleId}/permissions/remove
Content-Type: application/json
Authorization: Bearer {token}

{
  "permissionId": 10
}
```

#### Clonar un Rol

```http
POST /api/roles/{roleId}/clone
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "editor_senior",
  "description": "Editor senior con más permisos"
}
```

### 4. Gestión de Permisos (API)

#### Listar Todos los Permisos

```http
GET /api/permissions
Authorization: Bearer {token}
```

#### Permisos Agrupados por Módulo

```http
GET /api/permissions/grouped
Authorization: Bearer {token}
```

#### Buscar Permisos

```http
GET /api/permissions/search?q=posts
Authorization: Bearer {token}
```

#### Crear un Permiso

```http
POST /api/permissions
Content-Type: application/json
Authorization: Bearer {token}

{
  "module": "custom_module",
  "action": "special_action",
  "description": "Acción especial para módulo personalizado"
}
```

## Cache de Permisos

El sistema incluye un cache de permisos de usuario para mejorar el rendimiento:

- **TTL**: 5 minutos
- **Limpieza automática**: Se limpia cuando se modifican roles o permisos
- **Funciones**:
  - `clearUserPermissionsCache(userId)`: Limpia cache de un usuario
  - `clearAllPermissionsCache()`: Limpia todo el cache

## Protecciones de Seguridad

### Usuario ID 1
- Siempre es considerado superadministrador
- No se puede cambiar su rol
- No se puede eliminar
- No se puede cambiar su estado

### Rol Superadmin
- No se pueden modificar sus permisos
- No se puede eliminar
- No se puede cambiar su nombre

### Roles del Sistema
- Los roles marcados como `isSystem=true` no se pueden eliminar
- Solo se puede editar la descripción, no el nombre

### Validaciones
- No se puede eliminar un rol que tenga usuarios asignados
- No se puede eliminar un permiso que esté asignado a roles
- Los permisos module+action son únicos

## API Endpoints

### Roles

- `GET /api/roles` - Listar todos los roles
- `GET /api/roles/:id` - Obtener un rol por ID
- `GET /api/roles/:id/with-stats` - Obtener rol con estadísticas
- `GET /api/roles/all-with-stats` - Listar roles con estadísticas
- `GET /api/roles/stats` - Obtener estadísticas generales
- `POST /api/roles` - Crear un rol
- `PUT /api/roles/:id` - Actualizar un rol
- `DELETE /api/roles/:id` - Eliminar un rol
- `GET /api/roles/:id/permissions` - Obtener permisos de un rol
- `POST /api/roles/:id/permissions` - Asignar permisos a un rol
- `POST /api/roles/:id/permissions/add` - Agregar un permiso
- `POST /api/roles/:id/permissions/remove` - Remover un permiso
- `POST /api/roles/:id/clone` - Clonar un rol

### Permisos

- `GET /api/permissions` - Listar todos los permisos
- `GET /api/permissions/:id` - Obtener un permiso
- `GET /api/permissions/grouped` - Permisos agrupados por módulo
- `GET /api/permissions/modules` - Listar módulos únicos
- `GET /api/permissions/stats` - Estadísticas de permisos
- `GET /api/permissions/search?q=query` - Buscar permisos
- `GET /api/permissions/module/:module` - Permisos de un módulo
- `POST /api/permissions` - Crear un permiso
- `PUT /api/permissions/:id` - Actualizar un permiso
- `DELETE /api/permissions/:id` - Eliminar un permiso
- `GET /api/users/:userId/permissions` - Permisos de un usuario

## Mejores Prácticas

### 1. Principio de Menor Privilegio
Asigna solo los permisos necesarios para cada rol. No des permisos excesivos.

### 2. Separación de Responsabilidades
Crea roles específicos para diferentes funciones:
- `content_creator`: Solo crear y editar contenido propio
- `content_moderator`: Moderar y aprobar contenido
- `user_manager`: Gestionar usuarios

### 3. Auditoría
El sistema registra intentos de acceso denegado en la tabla `audit_logs`.

### 4. Testing
Siempre verifica los permisos en:
- Controladores (doble verificación)
- Rutas (middleware)
- Capa de servicio (cuando sea crítico)

### 5. Cache
El cache de permisos mejora el rendimiento, pero ten en cuenta:
- Se limpia automáticamente al modificar roles/permisos
- Puede haber un delay de hasta 5 minutos en reflejar cambios
- Usa `clearUserPermissionsCache()` si necesitas actualización inmediata

## Migración de Sistemas Antiguos

Si tienes un sistema antiguo de roles/permisos:

1. Ejecuta el seed de RBAC: `deno run --allow-all src/db/seeds/rbac.ts`
2. Mapea tus roles antiguos a los nuevos permisos
3. Asigna los permisos correspondientes a cada rol
4. Actualiza los usuarios con sus nuevos roles
5. Verifica que el usuario ID 1 tenga el rol superadmin

## Troubleshooting

### El usuario no puede acceder a un recurso

1. Verificar que el usuario tenga un rol asignado: `SELECT * FROM users WHERE id = ?`
2. Verificar los permisos del rol: `GET /api/roles/:roleId/permissions`
3. Revisar logs de auditoría: `SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC`
4. Limpiar cache de permisos: `clearUserPermissionsCache(userId)`

### Cambios en permisos no se reflejan

1. Esperar 5 minutos (TTL del cache)
2. O limpiar cache manualmente: `clearUserPermissionsCache(userId)`

### No se puede modificar el superadmin

Esto es intencional por seguridad. El superadmin está protegido y siempre debe tener todos los permisos.

## Soporte

Para preguntas o problemas, revisa:
- Esta documentación
- Código fuente en `src/services/authorizationService.ts`
- Tests en `tests/rbac/`
