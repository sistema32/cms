# 💬 Sistema de Comentarios con CAPTCHA - LexCMS

## ✅ Estado: IMPLEMENTADO

Sistema completo de comentarios con verificación CAPTCHA aleatoria, censura inteligente de contenido sensible, y filtros personalizables por el administrador.

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Configuración Inicial](#configuración-inicial)
3. [Endpoints de API](#endpoints-de-api)
4. [Sistema de Censura](#sistema-de-censura)
5. [Gestión de Filtros](#gestión-de-filtros)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Configuración de Producción](#configuración-de-producción)

---

## ✨ Características

### Comentarios
- ✅ **Usuarios autenticados y guests** pueden comentar
- ✅ **Threading de 1 nivel** (respuestas directas solamente)
- ✅ **CAPTCHA obligatorio** en todos los comentarios
- ✅ **Rotación aleatoria** entre 3 providers de CAPTCHA
- ✅ **Censura automática** de links, teléfonos, emails
- ✅ **Publicación automática** (auto-aprobados)
- ✅ **Soft delete** con recuperación
- ✅ **Moderación por admin** (aprobar/spam/eliminar)
- ✅ **Vista dual**: público ve censurado, admin ve original

### CAPTCHA
- ✅ **Google reCAPTCHA** v2/v3
- ✅ **hCaptcha**
- ✅ **Cloudflare Turnstile**
- ✅ **Selección aleatoria** automática
- ✅ **Forzar provider** específico (opcional)

### Seguridad
- ✅ **Sanitización HTML**: Previene XSS (Cross-Site Scripting)
  - Tags peligrosos removidos: `<script>`, `<iframe>`, `<object>`, etc.
  - Atributos peligrosos removidos: `onclick`, `onerror`, `javascript:`, etc.
  - Whitelist de tags permitidos: `<p>`, `<strong>`, `<em>`, `<a>`, etc.
  - Validación de URLs en atributos
- ✅ **Escape de campos de guest**: Nombre, email escapados con `escapeHTML()`
- ✅ **Validación de URLs**: Solo protocolos permitidos (http, https, mailto, tel)

### Censura Inteligente
- ✅ **Links**: URLs, dominios, www, .com, etc.
- ✅ **Teléfonos**: múltiples formatos
  - Números seguidos: `1234567890`
  - Con separadores: `123-456-7890`, `(123) 456-7890`
  - Con emojis: `1️⃣2️⃣3️⃣...`
  - Con espacios: `1 2 3 4 5...`
  - Escritos: `uno dos tres cuatro...`
  - Código de país: `+52 123 456 7890`
- ✅ **Emails**: formatos estándar y variaciones
  - Estándar: `user@domain.com`
  - Espaciados: `u s e r @ d o m a i n`
  - @ escrito: `user arroba domain punto com`
- ✅ **Palabras prohibidas**: customizables
- ✅ **Filtros dinámicos**: configurables desde panel admin

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Agregar a `.env`:

```bash
# Comentarios
ENABLE_COMMENTS=true

# CAPTCHA - Configurar los 3 para rotación aleatoria
# O solo los que se deseen usar

# Google reCAPTCHA
# Obtener en: https://www.google.com/recaptcha/admin
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# hCaptcha
# Obtener en: https://www.hcaptcha.com/
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key

# Cloudflare Turnstile
# Obtener en: https://dash.cloudflare.com/
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Opcional: Forzar un provider específico
# Si no se configura, usa rotación aleatoria
# CAPTCHA_PROVIDER=recaptcha
```

### 2. Habilitar Comentarios en Content Types

```bash
# Actualizar un content type para permitir comentarios
PATCH /api/content-types/:id
{
  "hasComments": true
}
```

Por defecto, los content types tienen `hasComments: false`.

---

## 📡 Endpoints de API

### Rutas Públicas

#### Crear Comentario

```bash
POST /api/comments
Content-Type: application/json

# Usuario autenticado
{
  "contentId": 1,
  "body": "¡Excelente artículo!",
  "captchaToken": "token-from-captcha-widget",
  "captchaProvider": "recaptcha", // opcional
  "parentId": null // opcional, para respuestas
}

# Guest (sin autenticación)
{
  "contentId": 1,
  "body": "Muy buen contenido",
  "authorName": "Juan Pérez",
  "authorEmail": "juan@example.com",
  "authorWebsite": "https://juan.com", // opcional
  "captchaToken": "token-from-captcha-widget"
}

Response 201:
{
  "success": true,
  "data": {
    "id": 1,
    "contentId": 1,
    "bodyCensored": "Muy buen contenido",
    "status": "approved",
    "createdAt": "2025-11-01T10:00:00.000Z"
  },
  "message": "Comentario publicado exitosamente"
}
```

**Nota**: El campo `body` (original sin censura) no se retorna al público.

#### Listar Comentarios

```bash
GET /api/comments/content/:contentId

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contentId": 1,
      "authorName": "Juan Pérez",
      "bodyCensored": "Muy buen contenido", // Público ve versión censurada
      "status": "approved",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "replies": [ // Threading 1 nivel
        {
          "id": 2,
          "parentId": 1,
          "bodyCensored": "Gracias por comentar",
          "createdAt": "2025-11-01T10:05:00.000Z"
        }
      ]
    }
  ]
}
```

### Rutas Autenticadas

#### Actualizar Propio Comentario

```bash
PATCH /api/comments/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "body": "Comentario actualizado"
}

Response 200:
{
  "success": true,
  "data": {
    "id": 1,
    "bodyCensored": "Comentario actualizado",
    "updatedAt": "2025-11-01T11:00:00.000Z"
  },
  "message": "Comentario actualizado exitosamente"
}
```

#### Eliminar Propio Comentario

```bash
DELETE /api/comments/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Comentario eliminado exitosamente"
}
```

**Nota**: Es soft delete, cambia `status` a `deleted` y marca `deletedAt`.

### Rutas Admin

#### Ver Comentario Sin Censura

```bash
GET /api/comments/:id/original
Authorization: Bearer {admin-token}

Response 200:
{
  "success": true,
  "data": {
    "id": 1,
    "body": "Llamame al 123-456-7890 o escribe a mail@example.com", // Original
    "bodyCensored": "Llamame al [teléfono oculto] o escribe a [email removido]", // Censurado
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "captchaProvider": "recaptcha"
  }
}
```

#### Moderar Comentario

```bash
POST /api/comments/:id/moderate
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "status": "spam" // approved | spam | deleted
}

Response 200:
{
  "success": true,
  "data": { ... },
  "message": "Comentario marcado como spam"
}
```

#### Estadísticas

```bash
GET /api/comments/stats/:contentId
Authorization: Bearer {admin-token}

Response 200:
{
  "success": true,
  "data": {
    "total": 25,
    "approved": 22,
    "spam": 2,
    "deleted": 1,
    "mainComments": 18,
    "replies": 7
  }
}
```

---

## 🔒 Sistema de Censura

### Proceso de Sanitización y Censura

Cada comentario pasa por 3 fases de seguridad:

**1. Sanitización HTML (Anti-XSS)**
```javascript
// Entrada peligrosa:
"Hola <script>alert('XSS')</script> mundo"

// Salida sanitizada:
"Hola  mundo"

// Más ejemplos bloqueados:
"<img src=x onerror='alert(1)'>" → "<img src=x>"
"<a href='javascript:alert(1)'>Click</a>" → "<a>Click</a>"
"<iframe src='evil.com'></iframe>" → ""
```

**Tags permitidos**: `<p>`, `<br>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<ul>`, `<ol>`, `<li>`, `<h1-h6>`, `<blockquote>`, `<code>`, `<pre>`, `<a>`, `<img>`, `<table>`, etc.

**Atributos peligrosos bloqueados**: `onclick`, `onerror`, `onload`, `javascript:`, `data:text/html`, etc.

**2. Escape de campos de guest**
```javascript
// authorName, authorEmail, authorWebsite:
"<script>alert('xss')</script>" → "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

**3. Censura de información sensible**
Aplicada al contenido ya sanitizado (ver filtros base abajo).

### Filtros Base (Hardcoded)

Aplicados automáticamente a **todos** los comentarios después de sanitizar:

#### Links

```javascript
// Detecta:
- http://example.com → [link removido]
- https://example.com → [link removido]
- www.example.com → [link removido]
- example.com → [link removido]
- example . com → [link removido]

// TLDs detectados: .com, .net, .org, .io, .co, .app, .dev, etc.
```

#### Teléfonos

```javascript
// Detecta:
- 1234567890 → [teléfono oculto]
- 123-456-7890 → [teléfono oculto]
- (123) 456-7890 → [teléfono oculto]
- +52 123 456 7890 → [teléfono oculto]
- 1 2 3 4 5 6 7 8 9 0 → [teléfono oculto]
- 1️⃣2️⃣3️⃣4️⃣... → [teléfono oculto]
- "uno dos tres cuatro..." (10+ palabras) → [teléfono oculto]
```

#### Emails

```javascript
// Detecta:
- user@domain.com → [email removido]
- user arroba domain.com → [email removido]
- user at domain.com → [email removido]
- user (at) domain punto com → [email removido]
- u s e r @ d o m a i n . com → [email removido]
```

### Filtros Dinámicos (Configurables)

El admin puede crear filtros personalizados desde el panel:

```bash
POST /api/content-filters
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "type": "phone", // word | email | link | phone
  "pattern": "\\+52\\d{10}", // Regex para teléfonos mexicanos
  "isRegex": true,
  "replacement": "[número removido]",
  "description": "Teléfonos mexicanos con código +52",
  "isActive": true
}
```

### Orden de Aplicación

1. Filtros base de links
2. Filtros custom de links (BD)
3. Filtros base de teléfonos
4. Filtros custom de teléfonos (BD)
5. Filtros base de emails
6. Filtros custom de emails (BD)
7. Filtros base de palabras
8. Filtros custom de palabras (BD)

---

## ⚙️ Gestión de Filtros

### Crear Filtro

```bash
POST /api/content-filters
Authorization: Bearer {admin-token}

{
  "type": "word",
  "pattern": "palabra-prohibida",
  "isRegex": false,
  "replacement": "***",
  "description": "Palabra ofensiva común"
}
```

### Listar Filtros

```bash
GET /api/content-filters?type=phone&isActive=true
Authorization: Bearer {admin-token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "phone",
      "pattern": "\\d{10}",
      "isRegex": true,
      "replacement": "[teléfono oculto]",
      "isActive": true
    }
  ],
  "meta": {
    "count": 1
  }
}
```

### Actualizar Filtro

```bash
PATCH /api/content-filters/:id
Authorization: Bearer {admin-token}

{
  "pattern": "nueva-palabra",
  "replacement": "[censurado]"
}
```

### Activar/Desactivar Filtro

```bash
PATCH /api/content-filters/:id/toggle
Authorization: Bearer {admin-token}

{
  "isActive": false
}
```

### Probar Filtro (Sin Guardar)

```bash
POST /api/content-filters/test
Authorization: Bearer {admin-token}

{
  "pattern": "\\d{10}",
  "isRegex": true,
  "replacement": "[FILTRADO]",
  "text": "Llámame al 1234567890 para más info"
}

Response 200:
{
  "success": true,
  "data": {
    "original": "Llámame al 1234567890 para más info",
    "filtered": "Llámame al [FILTRADO] para más info",
    "matches": 1
  }
}
```

### Estadísticas de Filtros

```bash
GET /api/content-filters/stats
Authorization: Bearer {admin-token}

Response 200:
{
  "success": true,
  "data": {
    "total": 15,
    "active": 12,
    "inactive": 3,
    "byType": {
      "word": 5,
      "email": 3,
      "link": 4,
      "phone": 3
    },
    "byTypeActive": {
      "word": 4,
      "email": 3,
      "link": 3,
      "phone": 2
    }
  }
}
```

---

## 💻 Ejemplos de Uso

### Frontend: Integrar CAPTCHA

#### reCAPTCHA v2

```html
<!-- HTML -->
<script src="https://www.google.com/recaptcha/api.js" async defer></script>

<form id="comment-form">
  <textarea name="body" required></textarea>
  <div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
  <button type="submit">Comentar</button>
</form>

<script>
// JavaScript
document.getElementById('comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const captchaToken = grecaptcha.getResponse();

  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId: 1,
      body: e.target.body.value,
      captchaToken,
      captchaProvider: 'recaptcha'
    })
  });

  const data = await response.json();
  console.log(data);
});
</script>
```

#### hCaptcha

```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>

<div class="h-captcha" data-sitekey="YOUR_SITE_KEY"></div>

<script>
const captchaToken = hcaptcha.getResponse();
// Usar con captchaProvider: 'hcaptcha'
</script>
```

#### Cloudflare Turnstile

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>

<script>
// Turnstile automáticamente genera el token
// Usar con captchaProvider: 'turnstile'
</script>
```

### Mostrar Comentarios (React)

```typescript
import { useEffect, useState } from 'react';

function Comments({ contentId }: { contentId: number }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch(`/api/comments/content/${contentId}`)
      .then(res => res.json())
      .then(data => setComments(data.data));
  }, [contentId]);

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <p><strong>{comment.authorName || comment.author?.name}</strong></p>
          {/* Solo bodyCensored está disponible para público */}
          <p>{comment.bodyCensored}</p>

          {/* Respuestas (1 nivel) */}
          {comment.replies?.map(reply => (
            <div key={reply.id} style={{ marginLeft: '2rem' }}>
              <p><strong>{reply.authorName}</strong></p>
              <p>{reply.bodyCensored}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Configuración de Producción

### Checklist

- [ ] Configurar las 3 keys de CAPTCHA en `.env` (o al menos una)
- [ ] Habilitar comentarios en content types: `hasComments: true`
- [ ] Crear filtros personalizados según necesidades
- [ ] Configurar permisos RBAC para comentarios:
  - `comments:create` - Público (crear comentarios)
  - `comments:read` - Público (ver comentarios)
  - `comments:update` - Usuarios (editar propios)
  - `comments:delete` - Usuarios (eliminar propios)
  - `comments:moderate` - Admin (moderar)
  - `comments:view-original` - Admin (ver sin censura)
  - `content-filters:*` - Admin (gestionar filtros)

### Obtener Keys de CAPTCHA

**Google reCAPTCHA:**
1. Ir a https://www.google.com/recaptcha/admin
2. Registrar un nuevo sitio
3. Seleccionar reCAPTCHA v2 o v3
4. Copiar **Secret Key** a `RECAPTCHA_SECRET_KEY`

**hCaptcha:**
1. Ir a https://www.hcaptcha.com/
2. Crear cuenta y sitio
3. Copiar **Secret Key** a `HCAPTCHA_SECRET_KEY`

**Cloudflare Turnstile:**
1. Ir a https://dash.cloudflare.com/
2. Seleccionar cuenta → Turnstile
3. Crear widget
4. Copiar **Secret Key** a `TURNSTILE_SECRET_KEY`

### Monitoreo

```bash
# Ver comentarios spam/eliminados
GET /api/comments/stats/:contentId
Authorization: Bearer {admin-token}

# Revisar comentarios sin censura para detectar abusos
GET /api/comments/:id/original
Authorization: Bearer {admin-token}

# Ajustar filtros según patrones detectados
POST /api/content-filters
```

### Rate Limiting Recomendado

```typescript
// En main.ts
app.use("/api/comments", rateLimit(5, 60000)); // 5 comentarios por minuto
```

---

## 🎯 Resumen de Características

| Característica | Estado | Descripción |
|----------------|--------|-------------|
| **CAPTCHA Aleatorio** | ✅ | Rotación entre reCAPTCHA, hCaptcha y Turnstile |
| **Usuarios y Guests** | ✅ | Ambos pueden comentar con CAPTCHA |
| **Threading 1 Nivel** | ✅ | Respuestas directas, sin nested replies |
| **Auto-aprobación** | ✅ | Comentarios publicados inmediatamente |
| **Censura Automática** | ✅ | Links, teléfonos, emails detectados |
| **Filtros Dinámicos** | ✅ | Admin puede crear filtros custom con regex |
| **Vista Dual** | ✅ | Público ve censurado, admin ve original |
| **Moderación** | ✅ | Admin cambia status: approved/spam/deleted |
| **Soft Delete** | ✅ | Comentarios eliminados son recuperables |
| **Rate Limiting** | ✅ | Protección contra spam |
| **Security Logging** | ✅ | IP y User-Agent guardados |

---

## 📚 Documentación Adicional

- [Seguridad del Sistema](./SECURITY_FEATURES.md)
- [Configuración de RBAC](./docs/rbac.md)

---

**Estado**: 🟢 **PRODUCTION-READY**

Sistema completo de comentarios con protección anti-spam, censura inteligente y gestión flexible de filtros.
