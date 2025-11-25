# Documentación del Núcleo de LexCMS

Este documento detalla la arquitectura, APIs, hooks y funcionalidades del núcleo de LexCMS.

## 1. Servicios del Núcleo (`src/services`)

Los servicios encapsulan la lógica de negocio y son reutilizables por controladores y plugins.

*   **UserService**: Gestión de usuarios, roles y permisos.
*   **ContentService**: CRUD de contenidos (páginas, posts), versionado y taxonomías.
*   **MediaService**: Gestión de archivos multimedia, procesamiento de imágenes y almacenamiento.
*   **CommentService**: Gestión de comentarios y moderación.
*   **PluginService**: Gestión del ciclo de vida de los plugins (instalación, activación).
*   **AuthService**: Autenticación, JWT y 2FA.

## 2. Sistema de Hooks (Acciones y Filtros)

LexCMS utiliza un sistema de eventos para permitir la extensión de funcionalidades.

### Acciones (`doAction`)
Se ejecutan en puntos específicos del flujo de ejecución.

| Hook Name | Argumentos | Descripción | Ubicación |
|-----------|------------|-------------|-----------|
| `system:init` | - | Inicio del sistema | `src/main.ts` |
| `admin:init` | `user` | Inicialización del panel admin | `src/routes/admin.ts` |
| `user:register` | `user` | Nuevo usuario registrado | `authController.ts` |
| `user:login` | `user` | Usuario inicia sesión | `authController.ts` |
| `content:created` | `content` | Contenido creado | `contentController.ts` |
| `content:updated` | `content` | Contenido actualizado | `contentController.ts` |
| `content:deleted` | `contentId` | Contenido eliminado | `contentController.ts` |
| `media:afterUpload` | `media` | Archivo subido | `mediaService.ts` |
| `media:beforeDelete` | `media` | Archivo a eliminar | `mediaService.ts` |

### Filtros (`applyFilters`)
Permiten modificar datos antes de ser utilizados o mostrados.

| Hook Name | Valor (Input) | Argumentos Adicionales | Descripción | Ubicación |
|-----------|---------------|------------------------|-------------|-----------|
| `theme:template` | `path` | `templateName`, `theme` | Ruta de la plantilla principal | `frontend.ts` |
| `theme:pageTemplate` | `path` | `templateName`, `theme` | Ruta de plantilla de página | `frontend.ts` |
| `content:render` | `html` | - | Renderizado del contenido | `frontend.ts` |
| `media:imageSizes` | `sizes` | - | Tamaños de imagen a generar | `imageProcessor.ts` |
| `media:getUrl` | `url` | `mediaData` | URL pública del archivo | `mediaService.ts` |

## 3. Webhooks (`webhookManager`)

Eventos asíncronos para integraciones externas.

*   `user.created`, `user.updated`, `user.deleted`, `user.login`
*   `content.created`, `content.updated`, `content.deleted`
*   `media.uploaded`
*   `comment.created`, `comment.approved`
*   `system.test`

## 4. Estructura de APIs (`src/routes`)

*   `/api/auth`: Autenticación y perfil.
*   `/api/content`: Gestión de contenidos.
*   `/api/media`: Subida y gestión de archivos.
*   `/api/users`: Gestión de usuarios (admin).
*   `/api/plugins`: Gestión de plugins.
*   `/api/settings`: Configuración del sistema.
*   `/admincp/*`: Rutas del panel de administración (renderizado SSR/SPA).

## 5. Middleware

*   `authMiddleware`: Verifica tokens JWT.
*   `permissionMiddleware`: Verifica permisos RBAC.
*   `securityMiddleware`: Rate limiting, CSP, headers de seguridad.
