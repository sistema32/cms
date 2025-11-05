# 📝 Plan Completo del Sistema de Contenido (CMS)

## 🎯 Objetivo

Crear un sistema de gestión de contenido completo, flexible y robusto que soporte:
- **Posts** (artículos de blog)
- **Páginas** (páginas estáticas)
- **Contenido Custom** (tipos personalizados)
- **SEO completo**
- **Taxonomías** (categorías, tags)
- **Medios** (imágenes, archivos)
- **Versionado**
- **Permisos RBAC**

---

## 📊 Arquitectura de Base de Datos

### 1. Tabla `content_types` (Tipos de Contenido)

Define los tipos de contenido disponibles en el sistema.

```sql
content_types
├── id (INTEGER PRIMARY KEY)
├── name (TEXT UNIQUE) -- "post", "page", "product", "event", etc.
├── slug (TEXT UNIQUE) -- "post", "page", "product"
├── description (TEXT)
├── icon (TEXT) -- nombre de icono para UI
├── is_hierarchical (BOOLEAN) -- permite parent/child (como páginas)
├── supports_categories (BOOLEAN)
├── supports_tags (BOOLEAN)
├── supports_featured_image (BOOLEAN)
├── supports_excerpt (BOOLEAN)
├── supports_author (BOOLEAN)
├── supports_comments (BOOLEAN)
├── is_public (BOOLEAN) -- visible en front-end
├── is_active (BOOLEAN)
├── menu_position (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Tipos predefinidos**:
- `post` - Artículos de blog
- `page` - Páginas estáticas
- Cualquier custom type que se cree

---

### 2. Tabla `content` (Contenido Principal)

Tabla central que almacena todo el contenido.

```sql
content
├── id (INTEGER PRIMARY KEY)
├── content_type_id (FK → content_types.id)
├── author_id (FK → users.id)
├── parent_id (FK → content.id) -- para jerarquías (páginas)
├── title (TEXT NOT NULL)
├── slug (TEXT UNIQUE NOT NULL) -- URL amigable
├── excerpt (TEXT) -- resumen corto
├── content (TEXT) -- contenido completo (markdown/html)
├── featured_image_id (FK → media.id)
├── status (TEXT) -- "draft", "published", "scheduled", "trash"
├── visibility (TEXT) -- "public", "private", "password"
├── password (TEXT) -- si visibility = "password"
├── published_at (TIMESTAMP)
├── scheduled_at (TIMESTAMP) -- para publicación programada
├── order (INTEGER) -- orden manual
├── comment_status (TEXT) -- "open", "closed"
├── ping_status (TEXT) -- "open", "closed"
├── view_count (INTEGER DEFAULT 0)
├── like_count (INTEGER DEFAULT 0)
├── is_sticky (BOOLEAN) -- destacado en listados
├── template (TEXT) -- template personalizado
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── deleted_at (TIMESTAMP) -- soft delete
└── version (INTEGER DEFAULT 1)
```

**Estados (status)**:
- `draft` - Borrador
- `published` - Publicado
- `scheduled` - Programado
- `pending` - Pendiente de revisión
- `trash` - Papelera

**Visibilidad**:
- `public` - Público
- `private` - Solo para usuarios logueados con permiso
- `password` - Protegido con contraseña

---

### 3. Tabla `content_meta` (Metadatos Flexibles)

Sistema clave-valor para datos adicionales y custom fields.

```sql
content_meta
├── id (INTEGER PRIMARY KEY)
├── content_id (FK → content.id)
├── meta_key (TEXT NOT NULL)
├── meta_value (TEXT)
└── created_at (TIMESTAMP)

-- Índice compuesto para búsquedas rápidas
INDEX (content_id, meta_key)
```

**Usos**:
- Custom fields personalizados
- Datos específicos de cada content type
- Configuraciones adicionales

---

### 4. Tabla `content_seo` (SEO)

Metadatos específicos para SEO.

```sql
content_seo
├── id (INTEGER PRIMARY KEY)
├── content_id (FK → content.id UNIQUE)
├── meta_title (TEXT) -- título SEO (si diferente del título)
├── meta_description (TEXT) -- descripción meta
├── meta_keywords (TEXT) -- keywords (opcional)
├── canonical_url (TEXT) -- URL canónica
├── og_title (TEXT) -- Open Graph title
├── og_description (TEXT)
├── og_image_id (FK → media.id)
├── og_type (TEXT) -- "article", "website", "product"
├── twitter_card (TEXT) -- "summary", "summary_large_image"
├── twitter_title (TEXT)
├── twitter_description (TEXT)
├── twitter_image_id (FK → media.id)
├── robots_index (BOOLEAN DEFAULT true) -- index/noindex
├── robots_follow (BOOLEAN DEFAULT true) -- follow/nofollow
├── schema_type (TEXT) -- Schema.org type
├── schema_data (JSON) -- Schema.org JSON-LD
├── focus_keyword (TEXT)
├── seo_score (INTEGER) -- score calculado
└── updated_at (TIMESTAMP)
```

---

### 5. Tabla `categories` (Categorías)

Taxonomía jerárquica para organizar contenido.

```sql
categories
├── id (INTEGER PRIMARY KEY)
├── parent_id (FK → categories.id)
├── name (TEXT NOT NULL)
├── slug (TEXT UNIQUE NOT NULL)
├── description (TEXT)
├── image_id (FK → media.id)
├── color (TEXT) -- color hexadecimal para UI
├── icon (TEXT) -- icono
├── order (INTEGER)
├── count (INTEGER DEFAULT 0) -- número de posts
├── is_active (BOOLEAN DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Características**:
- Jerárquicas (categorías y subcategorías)
- Slug único para URLs
- Imagen opcional
- Contador automático

---

### 6. Tabla `tags` (Etiquetas)

Taxonomía no jerárquica.

```sql
tags
├── id (INTEGER PRIMARY KEY)
├── name (TEXT NOT NULL)
├── slug (TEXT UNIQUE NOT NULL)
├── description (TEXT)
├── color (TEXT)
├── count (INTEGER DEFAULT 0)
├── is_active (BOOLEAN DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

### 7. Tabla `content_categories` (Many-to-Many)

Relación entre contenido y categorías.

```sql
content_categories
├── content_id (FK → content.id)
├── category_id (FK → categories.id)
├── is_primary (BOOLEAN DEFAULT false) -- categoría principal
└── created_at (TIMESTAMP)

PRIMARY KEY (content_id, category_id)
```

---

### 8. Tabla `content_tags` (Many-to-Many)

Relación entre contenido y tags.

```sql
content_tags
├── content_id (FK → content.id)
├── tag_id (FK → tags.id)
└── created_at (TIMESTAMP)

PRIMARY KEY (content_id, tag_id)
```

---

### 9. Tabla `media` (Medios)

Gestión de archivos multimedia.

```sql
media
├── id (INTEGER PRIMARY KEY)
├── author_id (FK → users.id)
├── filename (TEXT NOT NULL) -- nombre del archivo
├── original_filename (TEXT) -- nombre original
├── filepath (TEXT NOT NULL) -- ruta en servidor/storage
├── url (TEXT NOT NULL) -- URL pública
├── mime_type (TEXT) -- "image/jpeg", "application/pdf"
├── file_size (INTEGER) -- en bytes
├── width (INTEGER) -- para imágenes
├── height (INTEGER)
├── alt_text (TEXT) -- texto alternativo
├── caption (TEXT)
├── description (TEXT)
├── title (TEXT)
├── metadata (JSON) -- EXIF, etc.
├── storage_provider (TEXT) -- "local", "s3", "cloudinary"
├── is_public (BOOLEAN DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

### 10. Tabla `media_sizes` (Tamaños de Imagen)

Versiones redimensionadas de imágenes.

```sql
media_sizes
├── id (INTEGER PRIMARY KEY)
├── media_id (FK → media.id)
├── size_name (TEXT) -- "thumbnail", "medium", "large", "full"
├── width (INTEGER)
├── height (INTEGER)
├── filepath (TEXT)
├── url (TEXT)
├── file_size (INTEGER)
└── created_at (TIMESTAMP)

UNIQUE (media_id, size_name)
```

**Tamaños predefinidos**:
- `thumbnail` - 150x150
- `small` - 300x300
- `medium` - 768x768
- `large` - 1024x1024
- `full` - Original

---

### 11. Tabla `content_versions` (Versionado)

Historial de cambios en el contenido.

```sql
content_versions
├── id (INTEGER PRIMARY KEY)
├── content_id (FK → content.id)
├── author_id (FK → users.id)
├── version_number (INTEGER)
├── title (TEXT)
├── slug (TEXT)
├── excerpt (TEXT)
├── content (TEXT)
├── change_summary (TEXT) -- descripción de cambios
├── is_autosave (BOOLEAN DEFAULT false)
├── created_at (TIMESTAMP)
└── restored_at (TIMESTAMP)

INDEX (content_id, version_number)
```

---

### 12. Tabla `comments` (Comentarios)

Sistema de comentarios (opcional).

```sql
comments
├── id (INTEGER PRIMARY KEY)
├── content_id (FK → content.id)
├── parent_id (FK → comments.id) -- para respuestas
├── author_id (FK → users.id) -- si está logueado
├── author_name (TEXT) -- si es anónimo
├── author_email (TEXT)
├── author_url (TEXT)
├── author_ip (TEXT)
├── content (TEXT NOT NULL)
├── status (TEXT) -- "approved", "pending", "spam", "trash"
├── is_pinned (BOOLEAN DEFAULT false)
├── like_count (INTEGER DEFAULT 0)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

### 13. Tabla `content_relations` (Relaciones entre Contenidos)

Para contenido relacionado.

```sql
content_relations
├── id (INTEGER PRIMARY KEY)
├── content_id (FK → content.id)
├── related_content_id (FK → content.id)
├── relation_type (TEXT) -- "related", "series", "translation"
├── order (INTEGER)
└── created_at (TIMESTAMP)

UNIQUE (content_id, related_content_id, relation_type)
```

---

## 🔗 Diagrama de Relaciones

```
users (RBAC)
  ↓
  ├─→ content (author_id)
  ├─→ media (author_id)
  └─→ content_versions (author_id)

content_types
  ↓
content
  ├─→ content_meta (flexible data)
  ├─→ content_seo (SEO metadata)
  ├─→ content_categories ←→ categories
  ├─→ content_tags ←→ tags
  ├─→ media (featured_image_id)
  ├─→ content_versions (history)
  ├─→ comments
  └─→ content_relations (self-reference)

media
  └─→ media_sizes (thumbnails)
```

---

## 🎨 Content Types Predefinidos

### 1. **Post** (Artículo de Blog)
```json
{
  "name": "Post",
  "slug": "post",
  "is_hierarchical": false,
  "supports_categories": true,
  "supports_tags": true,
  "supports_featured_image": true,
  "supports_excerpt": true,
  "supports_author": true,
  "supports_comments": true,
  "is_public": true
}
```

### 2. **Page** (Página Estática)
```json
{
  "name": "Page",
  "slug": "page",
  "is_hierarchical": true,
  "supports_categories": false,
  "supports_tags": false,
  "supports_featured_image": true,
  "supports_excerpt": false,
  "supports_author": false,
  "supports_comments": false,
  "is_public": true
}
```

### 3. **Ejemplos de Custom Types**

**Product** (Producto)
```json
{
  "name": "Product",
  "slug": "product",
  "supports_categories": true,
  "supports_tags": true,
  "custom_fields": {
    "price": "number",
    "sku": "text",
    "stock": "number",
    "gallery": "media[]"
  }
}
```

**Event** (Evento)
```json
{
  "name": "Event",
  "slug": "event",
  "supports_categories": true,
  "custom_fields": {
    "event_date": "datetime",
    "location": "text",
    "price": "number",
    "capacity": "number"
  }
}
```

---

## 🔐 Permisos RBAC para CMS

### Módulos Nuevos

#### `content`
- `create` - Crear contenido
- `read` - Leer contenido
- `update` - Editar contenido
- `delete` - Eliminar contenido
- `publish` - Publicar contenido
- `read_private` - Leer contenido privado

#### `categories`
- `create`, `read`, `update`, `delete`

#### `tags`
- `create`, `read`, `update`, `delete`

#### `media`
- `upload` - Subir archivos
- `read` - Ver archivos
- `update` - Editar metadatos
- `delete` - Eliminar archivos

#### `comments`
- `create`, `read`, `update`, `delete`, `moderate`

### Roles Sugeridos

**Editor**
- Puede crear, editar y publicar contenido
- Puede gestionar categorías y tags
- Puede subir medios
- No puede eliminar contenido publicado

**Author**
- Puede crear y editar su propio contenido
- Puede publicar sus propios posts
- Puede subir medios
- Solo ve su propio contenido

**Contributor**
- Puede crear contenido (draft)
- No puede publicar
- Solo edita su propio contenido

---

## 📡 API Endpoints

### Content

```http
# CRUD de contenido
GET    /api/content                    # Listar (con filtros)
GET    /api/content/:id                # Ver uno
POST   /api/content                    # Crear
PUT    /api/content/:id                # Actualizar
DELETE /api/content/:id                # Eliminar
PATCH  /api/content/:id/publish        # Publicar
PATCH  /api/content/:id/status         # Cambiar estado

# Por tipo
GET    /api/posts                      # Todos los posts
GET    /api/pages                      # Todas las páginas
GET    /api/:contentType               # Custom type

# Relaciones
GET    /api/content/:id/categories     # Categorías del contenido
POST   /api/content/:id/categories     # Asignar categorías
GET    /api/content/:id/tags           # Tags del contenido
POST   /api/content/:id/tags           # Asignar tags

# Versionado
GET    /api/content/:id/versions       # Historial
POST   /api/content/:id/versions       # Crear versión
POST   /api/content/:id/restore/:vid   # Restaurar versión

# SEO
GET    /api/content/:id/seo            # Obtener SEO
PUT    /api/content/:id/seo            # Actualizar SEO
```

### Categories

```http
GET    /api/categories                 # Listar
GET    /api/categories/:id             # Ver una
POST   /api/categories                 # Crear
PUT    /api/categories/:id             # Actualizar
DELETE /api/categories/:id             # Eliminar
GET    /api/categories/:id/content     # Contenido de la categoría
```

### Tags

```http
GET    /api/tags                       # Listar
GET    /api/tags/:id                   # Ver uno
POST   /api/tags                       # Crear
PUT    /api/tags/:id                   # Actualizar
DELETE /api/tags/:id                   # Eliminar
GET    /api/tags/:id/content           # Contenido del tag
```

### Media

```http
GET    /api/media                      # Listar
GET    /api/media/:id                  # Ver uno
POST   /api/media/upload               # Subir archivo
PUT    /api/media/:id                  # Actualizar metadatos
DELETE /api/media/:id                  # Eliminar
GET    /api/media/:id/sizes            # Obtener tamaños
```

### Content Types

```http
GET    /api/content-types              # Listar tipos
GET    /api/content-types/:slug        # Ver uno
POST   /api/content-types              # Crear tipo custom
PUT    /api/content-types/:id          # Actualizar
DELETE /api/content-types/:id          # Eliminar
```

---

## 🎯 Características Principales

### 1. **Slugs Únicos y SEO-Friendly**
- Generación automática desde el título
- Validación de unicidad
- Soporte para slugs personalizados

### 2. **Publicación Programada**
- Campo `scheduled_at`
- Cron job o background task para publicar automáticamente

### 3. **Versionado Completo**
- Historial de todos los cambios
- Restauración de versiones anteriores
- Comparación entre versiones

### 4. **SEO Avanzado**
- Meta tags completos
- Open Graph
- Twitter Cards
- Schema.org JSON-LD
- Canonical URLs

### 5. **Medios Optimizados**
- Múltiples tamaños automáticos
- Texto alt para accesibilidad
- Metadatos EXIF
- Soporte para diferentes storage (local, S3, Cloudinary)

### 6. **Taxonomías Flexibles**
- Categorías jerárquicas
- Tags planos
- Colores e íconos personalizados

### 7. **Custom Fields**
- Sistema meta flexible
- Campos personalizados por content type
- Validación por tipo

### 8. **Jerarquías**
- Páginas padre/hijo
- Breadcrumbs automáticos

### 9. **Estados Múltiples**
- Draft, Published, Scheduled, Pending, Trash
- Soft deletes para recuperación

### 10. **Visibilidad Granular**
- Público
- Privado
- Protegido con contraseña

---

## 🚀 Fases de Implementación

### Fase 1: Core (Esencial)
1. ✅ Tabla `content`
2. ✅ Tabla `content_types`
3. ✅ CRUD básico de contenido
4. ✅ Slugs y URLs

### Fase 2: Taxonomías
1. ✅ Tabla `categories`
2. ✅ Tabla `tags`
3. ✅ Relaciones many-to-many
4. ✅ CRUD de taxonomías

### Fase 3: SEO
1. ✅ Tabla `content_seo`
2. ✅ Meta tags
3. ✅ Open Graph
4. ✅ Schema.org

### Fase 4: Medios
1. ✅ Tabla `media`
2. ✅ Tabla `media_sizes`
3. ✅ Upload de archivos
4. ✅ Procesamiento de imágenes

### Fase 5: Avanzado
1. ✅ Tabla `content_meta`
2. ✅ Tabla `content_versions`
3. ✅ Custom fields
4. ✅ Versionado

### Fase 6: Social
1. ⏸️ Tabla `comments`
2. ⏸️ Sistema de likes
3. ⏸️ Compartir en redes

---

## 📝 Validaciones

### Content
- `title`: Requerido, min 1, max 200
- `slug`: Único, solo alfanuméricos y guiones
- `status`: Enum válido
- `content_type_id`: Debe existir

### SEO
- `meta_description`: Max 160 caracteres (recomendado)
- `meta_title`: Max 60 caracteres (recomendado)
- `canonical_url`: URL válida

### Media
- `file_size`: Max según configuración (ej: 10MB)
- `mime_type`: Tipos permitidos según config

---

## 🎨 Frontend Suggestions

### Endpoints Públicos
```http
GET /api/public/posts                  # Posts publicados
GET /api/public/posts/:slug            # Post por slug
GET /api/public/pages/:slug            # Página por slug
GET /api/public/categories             # Categorías activas
GET /api/public/tags                   # Tags activos
```

### Filtros y Búsqueda
```http
GET /api/posts?status=published&category=tech&tag=javascript&sort=date&order=desc
GET /api/posts?search=deno&limit=10&page=1
```

---

## 🔧 Configuración Recomendada

```typescript
{
  "content": {
    "default_status": "draft",
    "auto_save_interval": 60, // segundos
    "revisions_limit": 10,
    "excerpt_length": 160
  },
  "media": {
    "max_file_size": 10485760, // 10MB
    "allowed_types": ["image/jpeg", "image/png", "image/webp"],
    "image_sizes": {
      "thumbnail": [150, 150],
      "medium": [768, 768],
      "large": [1024, 1024]
    },
    "storage": "local" // or "s3", "cloudinary"
  },
  "seo": {
    "default_og_image": "/default-og.jpg",
    "site_name": "My Site"
  }
}
```

---

Este plan está listo para ser implementado de manera incremental. ¿Quieres que comience con alguna fase específica?
