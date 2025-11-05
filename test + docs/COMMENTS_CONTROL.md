# Sistema de Control de Comentarios - LexCMS

El sistema de comentarios de LexCMS tiene **3 niveles de control** que funcionan en cascada. Los comentarios solo están habilitados cuando **TODOS los niveles** lo permiten.

## 📊 Niveles de Control (en orden de prioridad)

### 1️⃣ Control Global (.env)

**Variable**: `ENABLE_COMMENTS`

```env
# Habilitar/deshabilitar comentarios en toda la plataforma
ENABLE_COMMENTS=true
```

- **true**: Comentarios activados globalmente (verifica nivel 2 y 3)
- **false**: Comentarios desactivados en TODO el sistema

**Uso**:
- Desactivar comentarios temporalmente en todo el sitio
- Modo mantenimiento
- Períodos de moderación intensiva

---

### 2️⃣ Control por Tipo de Contenido (ContentType)

**Campo**: `hasComments` en tabla `content_types`

**Default**: `false` ❌

```typescript
// Ejemplo: crear ContentType con comentarios
await db.insert(contentTypes).values({
  name: "Post",
  slug: "post",
  hasComments: true, // ✅ Posts pueden tener comentarios
});

// Ejemplo: crear ContentType sin comentarios
await db.insert(contentTypes).values({
  name: "Page",
  slug: "page",
  hasComments: false, // ❌ Pages NO pueden tener comentarios
});
```

**Uso**:
- Posts de blog: `hasComments: true`
- Páginas estáticas: `hasComments: false`
- Productos: `hasComments: true`
- Eventos: `hasComments: false`

---

### 3️⃣ Control por Contenido Individual (Content)

**Campo**: `commentsEnabled` en tabla `content`

**Default**: `false` ❌

```typescript
// Ejemplo: crear contenido con comentarios habilitados
await db.insert(content).values({
  contentTypeId: 1,
  title: "Mi post",
  slug: "mi-post",
  commentsEnabled: true, // ✅ Este post acepta comentarios
  // ...
});

// Ejemplo: crear contenido con comentarios deshabilitados
await db.insert(content).values({
  contentTypeId: 1,
  title: "Post controversial",
  slug: "post-controversial",
  commentsEnabled: false, // ❌ Este post NO acepta comentarios
  // ...
});
```

**Uso**:
- Permitir/bloquear comentarios en posts específicos
- Cerrar comentarios en contenido antiguo
- Deshabilitar comentarios en posts controversiales
- Control granular por contenido

---

## 🔄 Cascada de Validación

Cuando un usuario intenta comentar, el sistema verifica en orden:

```
┌─────────────────────────────────────┐
│ 1. ¿ENABLE_COMMENTS = true?        │
│    ❌ NO  → Rechazar                │
│    ✅ SÍ  → Continuar nivel 2       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. ¿contentType.hasComments = true? │
│    ❌ NO  → Rechazar                │
│    ✅ SÍ  → Continuar nivel 3       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. ¿content.commentsEnabled = true? │
│    ❌ NO  → Rechazar                │
│    ✅ SÍ  → Permitir comentario     │
└─────────────────────────────────────┘
```

## 🧪 Casos de Prueba

### ✅ Caso 1: Comentarios Habilitados (Todos los niveles en true)

```bash
# Configuración
ENABLE_COMMENTS=true
contentType.hasComments=true
content.commentsEnabled=true

# Resultado
POST /api/comments → ✅ 201 Created
```

---

### ❌ Caso 2: ContentType no permite comentarios

```bash
# Configuración
ENABLE_COMMENTS=true
contentType.hasComments=false  # ❌
content.commentsEnabled=true

# Resultado
POST /api/comments → ❌ 400 "Este tipo de contenido no permite comentarios"
```

---

### ❌ Caso 3: Contenido individual no permite comentarios

```bash
# Configuración
ENABLE_COMMENTS=true
contentType.hasComments=true
content.commentsEnabled=false  # ❌

# Resultado
POST /api/comments → ❌ 400 "Los comentarios están deshabilitados para este contenido"
```

---

### ❌ Caso 4: Sistema global deshabilitado

```bash
# Configuración
ENABLE_COMMENTS=false  # ❌
contentType.hasComments=true
content.commentsEnabled=true

# Resultado
POST /api/comments → ❌ 400 "Sistema de comentarios deshabilitado globalmente"
# (Este check se hace en el middleware, antes de llegar al servicio)
```

---

## 📝 Implementación Técnica

### Validación en `commentService.ts`

```typescript
export async function createComment(data: CreateCommentData) {
  // Query única con relaciones (optimización)
  const contentData = await db.query.content.findFirst({
    where: eq(content.id, data.contentId),
    with: { contentType: true },
  });

  // Nivel 1: Verificar que existe
  if (!contentData) {
    throw new Error("Contenido no encontrado");
  }

  // Nivel 2: Verificar contentType.hasComments
  if (!contentData.contentType.hasComments) {
    throw new Error("Este tipo de contenido no permite comentarios");
  }

  // Nivel 3: Verificar content.commentsEnabled
  if (!contentData.commentsEnabled) {
    throw new Error("Los comentarios están deshabilitados para este contenido");
  }

  // ✅ Todos los niveles pasaron, crear comentario
  // ...
}
```

---

## 🔧 Configuración Recomendada

### Para un Blog típico:

```typescript
// ContentType: Post
{
  name: "Post",
  slug: "post",
  hasComments: true, // ✅ Posts permiten comentarios
}

// ContentType: Page
{
  name: "Page",
  slug: "page",
  hasComments: false, // ❌ Páginas NO permiten comentarios
}

// Al crear un Post
{
  title: "Mi primer post",
  contentTypeId: 1, // Post
  commentsEnabled: true, // ✅ Habilitado por defecto en posts
}

// Al crear una Page
{
  title: "Acerca de",
  contentTypeId: 2, // Page
  commentsEnabled: false, // ❌ No aplica (contentType ya lo bloquea)
}
```

### Para una Tienda (eCommerce):

```typescript
// ContentType: Product
{
  name: "Product",
  slug: "product",
  hasComments: true, // ✅ Productos permiten reseñas/comentarios
}

// Producto normal
{
  title: "Laptop HP",
  contentTypeId: 3, // Product
  commentsEnabled: true, // ✅ Acepta reseñas
}

// Producto sin stock (deshabilitar comentarios temporalmente)
{
  title: "iPhone descontinuado",
  contentTypeId: 3, // Product
  commentsEnabled: false, // ❌ No acepta nuevas reseñas
}
```

---

## 🚨 Defaults Importantes

**TODOS los defaults son `false` para máxima seguridad:**

1. **.env**: `ENABLE_COMMENTS` debe configurarse explícitamente
2. **contentTypes.hasComments**: `false` por defecto
3. **content.commentsEnabled**: `false` por defecto

Esto garantiza que los comentarios **solo se activen intencionalmente**, no por error.

---

## 📊 Migración

Si tienes contenido existente y quieres habilitar comentarios:

```typescript
// Habilitar comentarios en posts específicos
await db.update(content)
  .set({ commentsEnabled: true })
  .where(and(
    eq(content.contentTypeId, 1), // Solo Posts
    eq(content.status, "published"), // Solo publicados
  ));
```

---

## ✅ Checklist de Activación

Para que los comentarios funcionen en un post:

- [ ] `.env`: `ENABLE_COMMENTS=true`
- [ ] ContentType: `hasComments=true`
- [ ] Content: `commentsEnabled=true`
- [ ] CAPTCHA configurado (al menos 1 provider)
- [ ] Content publicado (`status='published'`)

---

## 🔗 Endpoints Relacionados

### Crear comentario (público)
```http
POST /api/comments
Content-Type: application/json

{
  "contentId": 1,
  "body": "Comentario",
  "authorName": "Nombre",
  "authorEmail": "email@example.com",
  "captchaToken": "token"
}
```

### Listar comentarios (público)
```http
GET /api/comments/content/:contentId
```

**Respuesta si comentarios deshabilitados**:
```json
{
  "success": false,
  "error": "Los comentarios están deshabilitados para este contenido"
}
```

---

## 📚 Referencias

- `src/db/schema.ts`: Definición de tablas
- `src/services/commentService.ts`: Lógica de validación
- `src/controllers/commentController.ts`: Endpoints
- `.env`: Configuración global
- `PERFORMANCE_OPTIMIZATIONS.md`: Optimizaciones aplicadas

---

**Última actualización**: 2025-11-01
**Versión**: 2.0.0 (Sistema de control de 3 niveles)
