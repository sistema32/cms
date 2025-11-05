# Mejoras al Sistema de Creación de Entradas

Este documento describe las mejoras implementadas al sistema de gestión de contenido (CMS).

## Resumen de Cambios

Se han implementado las siguientes mejoras al sistema:

1. ✅ **Sistema de Categorías y Tags para Posts** (ya existía y se mantiene funcional)
2. ✅ **Páginas Hijas (Child Pages)**
3. ✅ **Sistema de Historial de Versiones**
4. ✅ **Mejoras al Sistema de Edición**

---

## 1. Categorías y Tags para Posts

### Estado Actual

El sistema **ya contaba con** un robusto sistema de categorías y tags completamente funcional:

#### Categorías
- **Jerárquicas**: Soporte para categorías padres e hijas ilimitados
- **Por tipo de contenido**: Cada tipo de contenido puede tener su propio conjunto de categorías
- **Metadatos SEO**: Cada categoría puede tener metadatos completos de SEO
- **Soft delete**: Las categorías eliminadas pueden ser restauradas
- **Personalización**: Color, iconos y orden personalizable

#### Tags
- **Flat structure**: Sistema de etiquetas plano (sin jerarquía)
- **Global**: Compartidos entre todos los tipos de contenido
- **Personalización**: Color personalizable para cada tag

### Uso en la Creación/Edición

```typescript
// Al crear o editar contenido
POST/PATCH /api/content
{
  "title": "Mi post",
  "slug": "mi-post",
  "body": "Contenido...",
  "categoryIds": [1, 2, 3],  // IDs de categorías
  "tagIds": [4, 5, 6]         // IDs de tags
}
```

---

## 2. Páginas Hijas (Child Pages)

### Cambios Implementados

Se agregó el campo `parentId` a la tabla `content` para permitir relaciones jerárquicas entre páginas.

#### Modelo de Datos

```typescript
// Nuevo campo en la tabla content
content.parentId: integer  // ID de la página padre (opcional)
```

#### Características

- ✅ Validación para evitar que una página sea su propia hija
- ✅ Validación de existencia del padre
- ✅ Relaciones bidireccionales (parent/children)
- ✅ Consulta de páginas hijas

### API Endpoints

#### Crear página con padre
```typescript
POST /api/content
{
  "contentTypeId": 2,  // ID del tipo "Page"
  "parentId": 10,       // ID de la página padre
  "title": "Subpágina",
  "slug": "pagina-padre/subpagina",
  // ... otros campos
}
```

#### Actualizar página padre
```typescript
PATCH /api/content/:id
{
  "parentId": 15  // Cambiar o establecer página padre
}
```

#### Obtener páginas hijas
```typescript
GET /api/content/:id/children

Respuesta:
{
  "children": [
    {
      "id": 20,
      "title": "Subpágina 1",
      "slug": "pagina/subpagina-1",
      "parentId": 10
    },
    // ...
  ]
}
```

---

## 3. Sistema de Historial de Versiones

### Implementación

Se creó un sistema completo de versionado automático de contenido.

#### Modelo de Datos

Nueva tabla `content_revisions`:
```typescript
{
  id: integer
  contentId: integer           // Referencia al contenido
  title: string
  slug: string
  excerpt: string
  body: string
  status: string
  visibility: string
  password: string
  featuredImageId: integer
  publishedAt: timestamp
  scheduledAt: timestamp
  revisionNumber: integer      // Número secuencial de versión
  authorId: integer            // Autor de esta versión
  changesSummary: string       // Resumen opcional de cambios
  createdAt: timestamp
}
```

### Características

#### Guardado Automático
- ✅ Se crea automáticamente una revisión al actualizar contenido
- ✅ Solo se guarda si hay cambios importantes (título, body, excerpt, status)
- ✅ Numeración secuencial automática
- ✅ Registro del autor de cada versión

#### Control Manual
```typescript
PATCH /api/content/:id
{
  "title": "Título actualizado",
  "saveRevision": false,  // Opcional: evitar guardar revisión
  "changesSummary": "Corregido error ortográfico"  // Opcional
}
```

### API Endpoints

#### Obtener historial de versiones
```typescript
GET /api/content/:id/revisions

Respuesta:
{
  "revisions": [
    {
      "id": 5,
      "revisionNumber": 3,
      "title": "Versión 3 del artículo",
      "changesSummary": "Actualización de contenido",
      "author": { /* datos del autor */ },
      "createdAt": "2025-11-05T10:00:00Z"
    },
    // ...
  ]
}
```

#### Obtener una revisión específica
```typescript
GET /api/content/:id/revisions/:revisionId

Respuesta:
{
  "revision": {
    "id": 5,
    "contentId": 10,
    "title": "...",
    "body": "...",
    "revisionNumber": 3,
    // ... todos los campos
  }
}
```

#### Restaurar una revisión
```typescript
POST /api/content/:id/revisions/:revisionId/restore

Acción:
1. Guarda el estado actual como una nueva revisión
2. Restaura los datos de la revisión seleccionada
3. Actualiza el contenido actual

Respuesta:
{
  "content": { /* contenido restaurado */ },
  "message": "Revisión restaurada exitosamente"
}
```

#### Comparar dos revisiones
```typescript
GET /api/content/revisions/compare?revision1=5&revision2=7

Respuesta:
{
  "comparison": {
    "revision1": { /* datos completos */ },
    "revision2": { /* datos completos */ },
    "differences": {
      "title": true,        // true = diferente
      "slug": false,        // false = igual
      "excerpt": true,
      "body": true,
      "status": false,
      "visibility": false
    }
  }
}
```

#### Eliminar una revisión
```typescript
DELETE /api/content/revisions/:revisionId

Nota: Solo elimina la revisión, no afecta el contenido actual
```

---

## 4. Mejoras al Sistema de Edición

### Cambios Implementados

- ✅ **Validación mejorada**: Validaciones más robustas para parentId
- ✅ **Sanitización XSS**: Protección contra ataques XSS mantenida
- ✅ **Transaccionalidad**: Operaciones de categorías/tags optimizadas
- ✅ **Versionado automático**: Historial completo sin intervención manual

---

## Migración de Base de Datos

### Archivo de Migración

**Ubicación**: `/src/db/migrations/0011_add_revisions_and_parent_id.sql`

### Cambios en el Schema

1. **Tabla `content`**:
   - Nuevo campo: `parent_id` (integer, nullable)

2. **Nueva tabla `content_revisions`**:
   - Sistema completo de versionado
   - Relaciones con `content` y `users`

### Ejecución

La migración se aplica automáticamente al iniciar el proyecto:

```bash
deno task db:migrate
```

O manualmente con:
```bash
deno run --allow-all src/db/migrate.ts
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear un Post con Categorías y Tags

```typescript
POST /api/content
{
  "contentTypeId": 1,  // Post
  "title": "Mi primer artículo",
  "slug": "mi-primer-articulo",
  "body": "Contenido del artículo...",
  "excerpt": "Breve descripción",
  "status": "published",
  "categoryIds": [1, 3],  // Asignar a categorías
  "tagIds": [5, 7, 9],    // Asignar tags
  "featuredImageId": 20,
  "seo": {
    "metaTitle": "Mi Artículo",
    "metaDescription": "Descripción SEO"
  }
}
```

### Ejemplo 2: Crear una Página Hija

```typescript
// 1. Crear página padre
POST /api/content
{
  "contentTypeId": 2,  // Page
  "title": "Servicios",
  "slug": "servicios",
  "body": "Página principal de servicios"
}
// Respuesta: { content: { id: 100, ... } }

// 2. Crear página hija
POST /api/content
{
  "contentTypeId": 2,
  "parentId": 100,  // ID de la página padre
  "title": "Desarrollo Web",
  "slug": "servicios/desarrollo-web",
  "body": "Servicios de desarrollo web"
}

// 3. Consultar páginas hijas
GET /api/content/100/children
```

### Ejemplo 3: Editar con Versionado

```typescript
// Actualizar contenido (se guarda versión automáticamente)
PATCH /api/content/50
{
  "title": "Título actualizado",
  "body": "Contenido mejorado...",
  "changesSummary": "Actualización de contenido y corrección de errores"
}

// Ver historial de versiones
GET /api/content/50/revisions

// Restaurar versión anterior
POST /api/content/50/revisions/8/restore
```

### Ejemplo 4: Comparar Versiones

```typescript
// Comparar dos versiones para ver qué cambió
GET /api/content/revisions/compare?revision1=8&revision2=10

// Respuesta muestra qué campos son diferentes
```

---

## Permisos Requeridos

### Operaciones de Contenido
- `content.create` - Crear contenido
- `content.read` - Leer contenido
- `content.update` - Actualizar contenido
- `content.delete` - Eliminar contenido

### Operaciones de Revisiones
- `content.read` - Ver historial y revisiones
- `content.update` - Restaurar revisiones
- `content.delete` - Eliminar revisiones

---

## Notas Técnicas

### Rendimiento
- Las consultas de páginas hijas están indexadas por `parent_id`
- Las revisiones se ordenan por `revision_number` descendente
- Se recomienda implementar limpieza periódica de revisiones antiguas

### Consideraciones
- El versionado solo afecta campos principales (no incluye categorías/tags/meta)
- Las páginas hijas no tienen límite de profundidad, pero se recomienda máximo 3 niveles
- Las revisiones se eliminan en cascada si se elimina el contenido

---

## Próximos Pasos Recomendados

1. **Implementar límite de revisiones**: Configurar máximo de revisiones por contenido
2. **Diff visual**: Agregar comparación visual de diferencias entre versiones
3. **Permisos granulares**: Permisos específicos para páginas hijas
4. **Breadcrumbs automáticos**: Generación automática de breadcrumbs para páginas hijas
5. **Restauración completa**: Incluir categorías/tags en el versionado

---

## Conclusión

El sistema de gestión de contenido ahora cuenta con:

- ✅ Sistema completo de categorías y tags (ya existente)
- ✅ Jerarquía de páginas mediante `parentId`
- ✅ Historial completo de versiones con restauración
- ✅ API REST completa para todas las operaciones
- ✅ Validaciones robustas y seguridad mejorada

Todas las funcionalidades están listas para usar y se integran perfectamente con el sistema existente.
