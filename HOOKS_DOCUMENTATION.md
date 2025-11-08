# 🎣 Documentación Completa de Hooks - LexCMS

Esta documentación describe todos los hooks (acciones y filtros) disponibles en el sistema de plugins de LexCMS.

## 📖 Tabla de Contenidos

- [Introducción](#introducción)
- [Tipos de Hooks](#tipos-de-hooks)
- [Hooks de Plugins](#hooks-de-plugins)
  - [Media Hooks](#media-hooks)
  - [Content Hooks](#content-hooks)
- [Hooks de Themes](#hooks-de-themes)
  - [Lifecycle Hooks](#lifecycle-hooks)
  - [Template Rendering Hooks](#template-rendering-hooks)
  - [Content Rendering Hooks](#content-rendering-hooks)
  - [Layout Hooks](#layout-hooks)
  - [Assets Hooks](#assets-hooks)
  - [SEO Hooks](#seo-hooks)
  - [Menu & Widgets Hooks](#menu--widgets-hooks)
- [Cómo Usar Hooks](#cómo-usar-hooks)
- [Prioridades](#prioridades)
- [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🎯 Introducción

LexCMS utiliza un sistema de hooks inspirado en WordPress que permite a plugins y themes extender y modificar el comportamiento del sistema sin modificar el código core.

### Conceptos Clave

- **Action (Acción)**: Ejecuta código en un punto específico sin modificar datos
- **Filter (Filtro)**: Modifica y retorna datos que pasan por él
- **Priority (Prioridad)**: Orden de ejecución (menor = primero). Default: 10
- **Plugin Name**: Identifica qué plugin registró el hook

---

## 📚 Tipos de Hooks

### Actions vs Filters

```typescript
// ACTION: Ejecuta código, no retorna nada
api.addAction('media:afterUpload', async (media) => {
  console.log('Media uploaded:', media.filename);
  // No retorna nada
}, 10);

// FILTER: Modifica y retorna datos
api.addFilter('media:getUrl', async (url, media) => {
  // Transformar URL a CDN
  return url.replace('localhost:8000', 'cdn.example.com');
}, 10);
```

---

## 🔌 Hooks de Plugins

Los hooks de plugins se usan en el sistema de plugins (`PluginAPI`) y se gestionan con `hookManager`.

### Media Hooks

#### `media:afterUpload` (Action)

**Se ejecuta:** Después de subir un archivo exitosamente

**Parámetros:**
- `media` (object): Objeto con datos del archivo subido

**Ubicación:** `src/services/mediaService.ts:258`

**Ejemplo:**
```typescript
api.addAction('media:afterUpload', async (media) => {
  console.log('New file uploaded:', media.filename);

  // Enviar notificación
  // Generar thumbnails adicionales
  // Escanear por malware
  // etc.
}, 10);
```

**Datos disponibles en `media`:**
```typescript
{
  id: number,
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  path: string,
  url: string,
  type: 'image' | 'video' | 'audio' | 'document' | 'other',
  uploadedBy: number,
  uploadedAt: Date,
  sizes?: Array<{
    name: string,
    width: number,
    height: number,
    url: string
  }>
}
```

---

#### `media:getUrl` (Filter)

**Se ejecuta:** Cuando se obtiene la URL de un archivo de media

**Parámetros:**
- `url` (string): URL original del archivo
- `media` (object): Datos completos del archivo

**Retorna:** URL modificada (string)

**Ubicación:** `src/services/mediaService.ts:315, 325`

**Casos de uso:**
- Servir archivos desde CDN
- Agregar parámetros de query string
- Generar URLs firmadas
- Proxy de imágenes

**Ejemplo - CDN:**
```typescript
api.addFilter('media:getUrl', async (url, media) => {
  // Servir desde Cloudflare CDN
  if (media.type === 'image') {
    return url.replace(
      'http://localhost:8000',
      'https://cdn.example.com'
    );
  }
  return url;
}, 10);
```

**Ejemplo - Cloudflare Image Resizing:**
```typescript
api.addFilter('media:getUrl', async (url, media) => {
  if (media.type === 'image') {
    // Usar Cloudflare Image Resizing
    return `https://example.com/cdn-cgi/image/width=800,quality=85/${url}`;
  }
  return url;
}, 10);
```

**Ejemplo - URLs firmadas (S3-style):**
```typescript
api.addFilter('media:getUrl', async (url, media) => {
  // Generar URL firmada con expiración
  const expires = Date.now() + (60 * 60 * 1000); // 1 hora
  const signature = generateSignature(url, expires);
  return `${url}?expires=${expires}&signature=${signature}`;
}, 10);
```

---

#### `media:beforeDelete` (Action)

**Se ejecuta:** Antes de eliminar un archivo de media

**Parámetros:**
- `media` (object): Datos del archivo que se va a eliminar

**Ubicación:** `src/services/mediaService.ts:384`

**Casos de uso:**
- Eliminar de CDN
- Backup antes de borrar
- Actualizar referencias externas
- Logging/auditoría

**Ejemplo:**
```typescript
api.addAction('media:beforeDelete', async (media) => {
  // Eliminar del CDN de Cloudflare
  await fetch(`https://api.cloudflare.com/purge`, {
    method: 'POST',
    body: JSON.stringify({ files: [media.url] })
  });

  // Log para auditoría
  console.log(`Deleting media: ${media.filename} (${media.id})`);
}, 10);
```

---

#### `media:afterDelete` (Action)

**Se ejecuta:** Después de eliminar un archivo de media (actualmente no implementado, pero reservado)

**Parámetros:**
- `mediaId` (number): ID del archivo eliminado
- `media` (object): Datos del archivo eliminado

**Casos de uso:**
- Limpiar cache
- Actualizar estadísticas
- Notificaciones

---

### Content Hooks

> **Nota:** Estos hooks están definidos pero actualmente no se ejecutan en el código.
> Están reservados para futuras implementaciones en `contentService.ts`

#### `content:beforeCreate` (Action)

**Se ejecuta:** Antes de crear nuevo contenido

**Parámetros:**
- `data` (object): Datos del contenido a crear

**Ejemplo (hello-world plugin):**
```typescript
api.addAction('content:beforeCreate', async (data) => {
  console.log('Creating content:', data.title);

  // Validación personalizada
  // Modificar datos antes de guardar
  // Enviar notificaciones
}, 10);
```

---

#### `content:afterCreate` (Action)

**Se ejecuta:** Después de crear contenido

**Parámetros:**
- `content` (object): Contenido creado con su ID

---

#### `content:beforeUpdate` (Action)

**Se ejecuta:** Antes de actualizar contenido

**Parámetros:**
- `id` (number): ID del contenido
- `data` (object): Datos nuevos

---

#### `content:afterUpdate` (Action)

**Se ejecuta:** Después de actualizar contenido

**Parámetros:**
- `content` (object): Contenido actualizado

---

#### `content:beforePublish` (Action)

**Se ejecuta:** Antes de publicar contenido (cambiar estado a "published")

**Parámetros:**
- `content` (object): Contenido a publicar

---

#### `content:afterPublish` (Action)

**Se ejecuta:** Después de publicar contenido

**Parámetros:**
- `content` (object): Contenido publicado

---

#### `content:beforeDelete` (Action)

**Se ejecuta:** Antes de eliminar contenido

**Parámetros:**
- `id` (number): ID del contenido
- `content` (object): Datos del contenido

---

#### `content:afterDelete` (Action)

**Se ejecuta:** Después de eliminar contenido

**Parámetros:**
- `id` (number): ID del contenido eliminado

---

## 🎨 Hooks de Themes

Los hooks de themes se usan en templates y se gestionan con `themeHooks`.

### Lifecycle Hooks

#### `theme_setup` (Action)

**Se ejecuta:** Cuando se configura el theme

**Ubicación:** Definido en `src/services/themeHooks.ts:253`

**Ejemplo:**
```typescript
registerAction('theme_setup', () => {
  // Configurar soporte de features
  // Registrar tamaños de imagen
  // Registrar menús
}, 10);
```

---

#### `theme_activated` (Action)

**Se ejecuta:** Cuando se activa el theme

**Ubicación:** `src/services/themeHooks.ts:254`

---

#### `theme_deactivated` (Action)

**Se ejecuta:** Cuando se desactiva el theme

**Ubicación:** `src/services/themeHooks.ts:255`

---

### Template Rendering Hooks

#### `before_template_render` (Action)

**Se ejecuta:** Antes de renderizar cualquier template

**Ubicación:** `src/services/themeHooks.ts:258`

**Parámetros:**
- `templateName` (string): Nombre del template
- `data` (object): Datos que se pasarán al template

---

#### `after_template_render` (Action)

**Se ejecuta:** Después de renderizar un template

**Ubicación:** `src/services/themeHooks.ts:259`

**Parámetros:**
- `templateName` (string): Nombre del template
- `html` (string): HTML generado

---

#### `template_content` (Filter)

**Se ejecuta:** Permite modificar el HTML renderizado

**Ubicación:** `src/services/themeHooks.ts:260`

**Parámetros:**
- `html` (string): HTML del template

**Retorna:** HTML modificado

**Ejemplo:**
```typescript
registerFilter('template_content', (html) => {
  // Minificar HTML
  return html.replace(/\s+/g, ' ').trim();
}, 10);
```

---

### Content Rendering Hooks

#### `before_post_content` (Action)

**Se ejecuta:** Antes del contenido de un post

**Ubicación:** `src/services/themeHooks.ts:263`

---

#### `after_post_content` (Action)

**Se ejecuta:** Después del contenido de un post

**Ubicación:** `src/services/themeHooks.ts:264`

---

#### `post_content` (Filter)

**Se ejecuta:** Modifica el contenido de un post antes de mostrarlo

**Ubicación:** `src/services/themeHooks.ts:265`

**Parámetros:**
- `content` (string): Contenido HTML/Markdown

**Retorna:** Contenido modificado

**Ejemplo:**
```typescript
registerFilter('post_content', (content) => {
  // Agregar tabla de contenidos
  // Lazy loading de imágenes
  // Syntax highlighting de código
  return processedContent;
}, 10);
```

---

#### `post_excerpt` (Filter)

**Se ejecuta:** Modifica el extracto de un post

**Ubicación:** `src/services/themeHooks.ts:266`

**Parámetros:**
- `excerpt` (string): Extracto original

**Retorna:** Extracto modificado

---

#### `post_title` (Filter)

**Se ejecuta:** Modifica el título de un post

**Ubicación:** `src/services/themeHooks.ts:267`

**Parámetros:**
- `title` (string): Título original

**Retorna:** Título modificado

---

### Layout Hooks

#### `head` (Action)

**Se ejecuta:** En el `<head>` del HTML

**Ubicación:** `src/services/themeHooks.ts:270`

**Ejemplo:**
```typescript
registerAction('head', () => {
  // Agregar meta tags
  // Cargar analytics
  // Agregar favicons
}, 10);
```

---

#### `footer` (Action)

**Se ejecuta:** Al final del `<body>`

**Ubicación:** `src/services/themeHooks.ts:271`

---

#### `before_header` (Action)

**Se ejecuta:** Antes del header del sitio

**Ubicación:** `src/services/themeHooks.ts:272`

---

#### `after_header` (Action)

**Se ejecuta:** Después del header

**Ubicación:** `src/services/themeHooks.ts:273`

---

#### `before_footer` (Action)

**Se ejecuta:** Antes del footer

**Ubicación:** `src/services/themeHooks.ts:274`

---

#### `after_footer` (Action)

**Se ejecuta:** Después del footer

**Ubicación:** `src/services/themeHooks.ts:275`

---

### Assets Hooks

#### `enqueue_styles` (Action)

**Se ejecuta:** Para registrar hojas de estilo

**Ubicación:** `src/services/themeHooks.ts:297`

---

#### `enqueue_scripts` (Action)

**Se ejecuta:** Para registrar scripts

**Ubicación:** `src/services/themeHooks.ts:298`

---

#### `custom_css` (Filter)

**Se ejecuta:** Permite agregar CSS personalizado

**Ubicación:** `src/services/themeHooks.ts:280`

**Retorna:** String con CSS

---

#### `custom_js` (Filter)

**Se ejecuta:** Permite agregar JavaScript personalizado

**Ubicación:** `src/services/themeHooks.ts:281`

**Retorna:** String con JavaScript

---

### SEO Hooks

#### `meta_tags` (Filter)

**Se ejecuta:** Modifica meta tags

**Ubicación:** `src/services/themeHooks.ts:292`

**Parámetros:**
- `tags` (object): Meta tags actuales

**Retorna:** Meta tags modificados

---

#### `page_title` (Filter)

**Se ejecuta:** Modifica el título de la página (`<title>`)

**Ubicación:** `src/services/themeHooks.ts:293`

**Parámetros:**
- `title` (string): Título actual

**Retorna:** Título modificado

---

#### `meta_description` (Filter)

**Se ejecuta:** Modifica la meta description

**Ubicación:** `src/services/themeHooks.ts:294`

**Parámetros:**
- `description` (string): Descripción actual

**Retorna:** Descripción modificada

---

### Menu & Widgets Hooks

#### `menu_items` (Filter)

**Se ejecuta:** Modifica items de menú antes de renderizar

**Ubicación:** `src/services/themeHooks.ts:284`

**Parámetros:**
- `items` (array): Array de items del menú

**Retorna:** Items modificados

---

#### `menu_item_classes` (Filter)

**Se ejecuta:** Modifica clases CSS de items de menú

**Ubicación:** `src/services/themeHooks.ts:285`

**Parámetros:**
- `classes` (array): Array de clases CSS
- `item` (object): Datos del item

**Retorna:** Array de clases modificado

---

#### `widget_areas` (Filter)

**Se ejecuta:** Define áreas de widgets

**Ubicación:** `src/services/themeHooks.ts:288`

---

#### `widget_content` (Filter)

**Se ejecuta:** Modifica contenido de un widget

**Ubicación:** `src/services/themeHooks.ts:289`

---

### Configuration Hooks

#### `theme_settings` (Filter)

**Se ejecuta:** Modifica configuración del theme

**Ubicación:** `src/services/themeHooks.ts:278`

**Parámetros:**
- `settings` (object): Configuración actual

**Retorna:** Configuración modificada

---

#### `theme_config` (Filter)

**Se ejecuta:** Modifica configuración general

**Ubicación:** `src/services/themeHooks.ts:279`

---

### Cache Hooks

#### `cache_invalidated` (Action)

**Se ejecuta:** Cuando se invalida el cache

**Ubicación:** `src/services/themeHooks.ts:301`

---

## 📝 Cómo Usar Hooks

### En Plugins

```typescript
import type { PluginAPI } from '../../src/lib/plugin-system/PluginAPI.ts';

export default class MyPlugin {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async onActivate() {
    // Registrar Action
    this.api.addAction('media:afterUpload', async (media) => {
      console.log('Uploaded:', media.filename);
    }, 10);

    // Registrar Filter
    this.api.addFilter('media:getUrl', async (url, media) => {
      return url.replace('localhost', 'cdn.example.com');
    }, 10);
  }
}
```

### En Themes

```typescript
import { registerAction, registerFilter } from './sdk/hooks.ts';

// En tu theme
registerAction('head', () => {
  console.log('Head hook ejecutado');
}, 10);

registerFilter('post_title', (title) => {
  return title.toUpperCase();
}, 10);
```

---

## 🎯 Prioridades

Las prioridades determinan el orden de ejecución:

- **Menor número = Mayor prioridad (se ejecuta primero)**
- Default: `10`
- Rango recomendado: `1-100`

### Ejemplo de Prioridades

```typescript
// Se ejecuta PRIMERO (prioridad 5)
api.addFilter('media:getUrl', (url) => {
  console.log('1. Primera transformación');
  return url + '?v=1';
}, 5);

// Se ejecuta SEGUNDO (prioridad 10)
api.addFilter('media:getUrl', (url) => {
  console.log('2. Segunda transformación');
  return url.replace('http:', 'https:');
}, 10);

// Se ejecuta TERCERO (prioridad 20)
api.addFilter('media:getUrl', (url) => {
  console.log('3. Tercera transformación');
  return url + '&cdn=1';
}, 20);
```

---

## 💡 Ejemplos Prácticos

### 1. Plugin CDN para Media

```typescript
export default class CDNPlugin {
  private api: PluginAPI;

  async onActivate() {
    const cdnUrl = this.api.getSetting('cdn_url', 'https://cdn.example.com');

    this.api.addFilter('media:getUrl', async (url, media) => {
      // Solo aplicar CDN a imágenes
      if (media.type === 'image') {
        return url.replace(
          'http://localhost:8000',
          cdnUrl
        );
      }
      return url;
    }, 10);
  }
}
```

### 2. Plugin de Analytics

```typescript
export default class AnalyticsPlugin {
  async onActivate() {
    // Registrar upload de media
    this.api.addAction('media:afterUpload', async (media) => {
      await this.trackEvent('media_upload', {
        type: media.type,
        size: media.size,
        filename: media.filename
      });
    });

    // Registrar creación de contenido
    this.api.addAction('content:afterCreate', async (content) => {
      await this.trackEvent('content_create', {
        type: content.type,
        title: content.title
      });
    });
  }

  async trackEvent(event, data) {
    await fetch('https://analytics.example.com/track', {
      method: 'POST',
      body: JSON.stringify({ event, data })
    });
  }
}
```

### 3. Plugin de Watermark

```typescript
export default class WatermarkPlugin {
  async onActivate() {
    this.api.addAction('media:afterUpload', async (media) => {
      if (media.type === 'image') {
        // Agregar watermark a la imagen
        await this.addWatermark(media.path);
      }
    });
  }

  async addWatermark(imagePath) {
    // Lógica para agregar watermark
  }
}
```

### 4. Plugin de Backup

```typescript
export default class BackupPlugin {
  async onActivate() {
    // Backup antes de eliminar
    this.api.addAction('media:beforeDelete', async (media) => {
      await this.backupToS3(media);
    });
  }

  async backupToS3(media) {
    const s3Url = this.api.getSetting('s3_bucket');
    // Upload a S3
  }
}
```

### 5. Theme: Agregar Google Analytics

```typescript
registerAction('head', () => {
  const gaId = 'UA-XXXXXXXXX-X';
  return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    </script>
  `;
}, 10);
```

### 6. Theme: Modificar Contenido

```typescript
registerFilter('post_content', (content) => {
  // Agregar lazy loading a imágenes
  return content.replace(
    /<img /g,
    '<img loading="lazy" '
  );
}, 10);
```

---

## 🔍 Debugging Hooks

### Ver Hooks Registrados (Plugins)

```typescript
// En la consola del servidor
import { hookManager } from './lib/plugin-system/HookManager.ts';

console.log('Hooks registrados:', hookManager.getAllHookNames());
console.log('Estadísticas:', hookManager.getStats());
```

### Ver Hooks Registrados (Themes)

```typescript
import { themeHooks } from './services/themeHooks.ts';

console.log('Actions y Filters:', themeHooks.listHooks());
console.log('Estadísticas:', themeHooks.getStats());
```

---

## 📊 Resumen de Hooks

### Hooks de Plugins (3 implementados)

| Hook | Tipo | Estado | Ubicación |
|------|------|--------|-----------|
| `media:afterUpload` | Action | ✅ Implementado | mediaService.ts:258 |
| `media:getUrl` | Filter | ✅ Implementado | mediaService.ts:315, 325 |
| `media:beforeDelete` | Action | ✅ Implementado | mediaService.ts:384 |
| `content:beforeCreate` | Action | ⏳ Reservado | - |
| `content:afterCreate` | Action | ⏳ Reservado | - |
| `content:beforeUpdate` | Action | ⏳ Reservado | - |
| `content:afterUpdate` | Action | ⏳ Reservado | - |
| `content:beforePublish` | Action | ⏳ Reservado | - |
| `content:afterPublish` | Action | ⏳ Reservado | - |
| `content:beforeDelete` | Action | ⏳ Reservado | - |
| `content:afterDelete` | Action | ⏳ Reservado | - |

### Hooks de Themes (27 definidos)

| Categoría | Cantidad |
|-----------|----------|
| Lifecycle | 3 |
| Template Rendering | 3 |
| Content Rendering | 5 |
| Layout | 6 |
| Assets | 4 |
| SEO | 3 |
| Menu & Widgets | 4 |
| Cache | 1 |

---

## 🚀 Próximos Pasos

Para agregar nuevos hooks al sistema:

1. **Definir el hook** en el servicio correspondiente
2. **Ejecutar el hook** con `hookManager.doAction()` o `hookManager.applyFilters()`
3. **Documentar** en este archivo
4. **Crear ejemplos** de uso

---

## 📚 Referencias

- **Plugin API**: `/src/lib/plugin-system/PluginAPI.ts`
- **Hook Manager**: `/src/lib/plugin-system/HookManager.ts`
- **Theme Hooks**: `/src/services/themeHooks.ts`
- **Media Service**: `/src/services/mediaService.ts`
- **Plugin de Ejemplo**: `/plugins/hello-world/`

---

**Última actualización:** 2025-11-08
**Versión LexCMS:** 1.0.0
